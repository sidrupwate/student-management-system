const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');
const generateAdmissionNumber = require('../utils/generateAdmissionNumber');

const ALLOWED_SORT_COLUMNS = ['name', 'admission_number', 'course', 'year', 'created_at'];
function deletePhotoFile(photoUrl) {
    if (!photoUrl) return;
    const filename = path.basename(photoUrl);
    const filePath = path.join(__dirname, '..', 'uploads', filename);

    fs.unlink(filePath, (err) => {
        if (err && err.code !== 'ENOENT') {
            console.error(`Failed to delete photo file ${filePath}:`, err.message);
        }
    });
}

async function getAllStudents(req, res, next) {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
        const offset = (page - 1) * limit;

        const search = (req.query.search || '').trim();
        const courseFilter = (req.query.course || '').trim();
        const yearFilter = req.query.year ? parseInt(req.query.year, 10) : null;
        const genderFilter = (req.query.gender || '').trim();

        const sortByRaw = req.query.sortBy || 'created_at';
        const sortBy = ALLOWED_SORT_COLUMNS.includes(sortByRaw) ? sortByRaw : 'created_at';
        const order = (req.query.order || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
        const conditions = [];
        const values = [];
        let paramIndex = 1;

        if (search) {
            conditions.push(
                `(name ILIKE $${paramIndex} OR admission_number ILIKE $${paramIndex} OR course ILIKE $${paramIndex})`
            );
            values.push(`%${search}%`);
            paramIndex++;
        }

        if (courseFilter) {
            conditions.push(`course ILIKE $${paramIndex}`);
            values.push(`%${courseFilter}%`);
            paramIndex++;
        }

        if (yearFilter) {
            conditions.push(`year = $${paramIndex}`);
            values.push(yearFilter);
            paramIndex++;
        }

        if (genderFilter) {
            conditions.push(`gender = $${paramIndex}`);
            values.push(genderFilter);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const countQuery = `SELECT COUNT(*) FROM students ${whereClause}`;
        const countResult = await pool.query(countQuery, values);
        const totalRecords = parseInt(countResult.rows[0].count, 10);
        const totalPages = Math.max(Math.ceil(totalRecords / limit), 1);
        const dataQuery = `
      SELECT id, admission_number, name, course, year, date_of_birth,
             email, mobile_number, gender, address, photo_url, created_at, updated_at
      FROM students
      ${whereClause}
      ORDER BY ${sortBy} ${order}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
        const dataValues = [...values, limit, offset];
        const dataResult = await pool.query(dataQuery, dataValues);

        res.status(200).json({
            success: true,
            data: dataResult.rows,
            pagination: {
                page,
                limit,
                totalRecords,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });
    } catch (err) {
        next(err);
    }
}
async function getStudentById(req, res, next) {
    try {
        const { id } = req.params;

        const result = await pool.query('SELECT * FROM students WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Student with id ${id} not found`,
            });
        }

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
}

async function createStudent(req, res, next) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const admissionNumber = await generateAdmissionNumber(client);

        const {
            name, course, year, date_of_birth, email,
            mobile_number, gender, address,
        } = req.body;

        const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const insertResult = await client.query(
            `INSERT INTO students
        (admission_number, name, course, year, date_of_birth, email, mobile_number, gender, address, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
            [admissionNumber, name, course, year, date_of_birth, email, mobile_number, gender, address, photoUrl]
        );

        const newStudent = insertResult.rows[0];

        await client.query(
            `INSERT INTO activity_logs (student_id, action, description)
       VALUES ($1, $2, $3)`,
            [newStudent.id, 'CREATE', `Student ${newStudent.name} (${newStudent.admission_number}) was created`]
        );

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Student created successfully',
            data: newStudent,
        });
    } catch (err) {
        await client.query('ROLLBACK');

        if (req.file) {
            deletePhotoFile(`/uploads/${req.file.filename}`);
        }

        next(err);
    } finally {
        client.release();
    }
}

async function updateStudent(req, res, next) {
    const client = await pool.connect();

    try {
        const { id } = req.params;

        await client.query('BEGIN');

        const existingResult = await client.query('SELECT * FROM students WHERE id = $1 FOR UPDATE', [id]);

        if (existingResult.rows.length === 0) {
            await client.query('ROLLBACK');
            if (req.file) deletePhotoFile(`/uploads/${req.file.filename}`);
            return res.status(404).json({ success: false, message: `Student with id ${id} not found` });
        }

        const existingStudent = existingResult.rows[0];

        const {
            name, course, year, date_of_birth, email,
            mobile_number, gender, address,
        } = req.body;

        let photoUrl = existingStudent.photo_url;
        let oldPhotoToDelete = null;

        if (req.file) {
            oldPhotoToDelete = existingStudent.photo_url;
            photoUrl = `/uploads/${req.file.filename}`;
        }

        const updateResult = await client.query(
            `UPDATE students
       SET name = $1, course = $2, year = $3, date_of_birth = $4, email = $5,
           mobile_number = $6, gender = $7, address = $8, photo_url = $9
       WHERE id = $10
       RETURNING *`,
            [name, course, year, date_of_birth, email, mobile_number, gender, address, photoUrl, id]
        );

        const updatedStudent = updateResult.rows[0];

        await client.query(
            `INSERT INTO activity_logs (student_id, action, description)
       VALUES ($1, $2, $3)`,
            [updatedStudent.id, 'UPDATE', `Student ${updatedStudent.name} (${updatedStudent.admission_number}) was updated`]
        );

        await client.query('COMMIT');

        // Only delete the old photo file after the transaction has
        // safely committed.
        if (oldPhotoToDelete) {
            deletePhotoFile(oldPhotoToDelete);
        }

        res.status(200).json({
            success: true,
            message: 'Student updated successfully',
            data: updatedStudent,
        });
    } catch (err) {
        await client.query('ROLLBACK');
        if (req.file) deletePhotoFile(`/uploads/${req.file.filename}`);
        next(err);
    } finally {
        client.release();
    }
}

async function deleteStudent(req, res, next) {
    const client = await pool.connect();

    try {
        const { id } = req.params;

        await client.query('BEGIN');

        const existingResult = await client.query('SELECT * FROM students WHERE id = $1 FOR UPDATE', [id]);

        if (existingResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: `Student with id ${id} not found` });
        }

        const student = existingResult.rows[0];

        await client.query(
            `INSERT INTO activity_logs (student_id, action, description)
       VALUES ($1, $2, $3)`,
            [student.id, 'DELETE', `Student ${student.name} (${student.admission_number}) was deleted`]
        );

        await client.query('DELETE FROM students WHERE id = $1', [id]);

        await client.query('COMMIT');

        deletePhotoFile(student.photo_url);

        res.status(200).json({
            success: true,
            message: 'Student deleted successfully',
        });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
}

module.exports = {
    getAllStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
};