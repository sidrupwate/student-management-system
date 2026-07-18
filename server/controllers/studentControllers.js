// ============================================================
// controllers/studentController.js
// ------------------------------------------------------------
// All business logic for the /api/students endpoints.
//
// CHANGED (Cloudinary swap):
// - photo_url now stores a full Cloudinary secure URL
//   (e.g. https://res.cloudinary.com/.../student-123.jpg)
//   instead of a relative "/uploads/..." path.
// - A new photo_public_id column stores Cloudinary's public_id,
//   which is required to delete or replace a photo on Cloudinary
//   (you can't delete a Cloudinary asset by URL alone).
// - deletePhotoFile (fs.unlink) is replaced by
//   deleteCloudinaryPhoto (cloudinary.uploader.destroy).
//
// Design notes (unchanged from before):
// - Every WRITE (create/update/delete) runs inside an explicit
//   pg transaction (BEGIN/COMMIT/ROLLBACK) so that the student
//   row and its activity_logs entry either both succeed or both
//   fail together.
// - Reads (getAll/getById) use the shared pool directly - no
//   transaction needed, since a single SELECT is already atomic.
// ============================================================

const { pool } = require('../config/db');
const cloudinary = require('../config/cloudinary');
const generateAdmissionNumber = require('../utils/generateAdmissionNumber');

const ALLOWED_SORT_COLUMNS = ['name', 'admission_number', 'course', 'year', 'created_at'];

// --------------------------------------------------------------
// Helper: delete a photo from Cloudinary by its public_id. Used
// when a student is deleted, or when a student's photo is
// replaced on update. Failures are logged but never thrown - a
// failed cleanup should never block the actual DB operation.
// --------------------------------------------------------------
async function deleteCloudinaryPhoto(publicId) {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error(`Failed to delete Cloudinary photo ${publicId}:`, err.message);
  }
}

// ================================================================
// GET /api/students
// Supports: search (name/admission_number/course), filter (course,
// year, gender), pagination (page, limit), sorting (sortBy, order).
// ================================================================
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

// ================================================================
// GET /api/students/:id
// ================================================================
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

// ================================================================
// POST /api/students
// ================================================================
async function createStudent(req, res, next) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const admissionNumber = await generateAdmissionNumber(client);

    const {
      name, course, year, date_of_birth, email,
      mobile_number, gender, address,
    } = req.body;

    // req.file is populated by Multer + CloudinaryStorage (upload.js)
    // when a photo was sent. req.file.path is the Cloudinary secure
    // URL; req.file.filename is the Cloudinary public_id (needed to
    // delete/replace the photo later). Both optional - a student
    // can be created without a photo.
    const photoUrl = req.file ? req.file.path : null;
    const photoPublicId = req.file ? req.file.filename : null;

    const insertResult = await client.query(
      `INSERT INTO students
        (admission_number, name, course, year, date_of_birth, email, mobile_number, gender, address, photo_url, photo_public_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [admissionNumber, name, course, year, date_of_birth, email, mobile_number, gender, address, photoUrl, photoPublicId]
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

    // If a photo was uploaded to Cloudinary but the transaction
    // failed, remove it so your Cloudinary account doesn't
    // accumulate orphaned images with no matching student.
    if (req.file) {
      deleteCloudinaryPhoto(req.file.filename);
    }

    next(err);
  } finally {
    client.release();
  }
}

// ================================================================
// PUT /api/students/:id
// ================================================================
async function updateStudent(req, res, next) {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query('BEGIN');

    const existingResult = await client.query('SELECT * FROM students WHERE id = $1 FOR UPDATE', [id]);

    if (existingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      if (req.file) deleteCloudinaryPhoto(req.file.filename);
      return res.status(404).json({ success: false, message: `Student with id ${id} not found` });
    }

    const existingStudent = existingResult.rows[0];

    const {
      name, course, year, date_of_birth, email,
      mobile_number, gender, address,
    } = req.body;

    // If a new photo was uploaded, use it and mark the old
    // Cloudinary asset for deletion. Otherwise keep the existing
    // photo_url / photo_public_id unchanged.
    let photoUrl = existingStudent.photo_url;
    let photoPublicId = existingStudent.photo_public_id;
    let oldPublicIdToDelete = null;

    if (req.file) {
      oldPublicIdToDelete = existingStudent.photo_public_id;
      photoUrl = req.file.path;
      photoPublicId = req.file.filename;
    }

    const updateResult = await client.query(
      `UPDATE students
       SET name = $1, course = $2, year = $3, date_of_birth = $4, email = $5,
           mobile_number = $6, gender = $7, address = $8, photo_url = $9, photo_public_id = $10
       WHERE id = $11
       RETURNING *`,
      [name, course, year, date_of_birth, email, mobile_number, gender, address, photoUrl, photoPublicId, id]
    );

    const updatedStudent = updateResult.rows[0];

    await client.query(
      `INSERT INTO activity_logs (student_id, action, description)
       VALUES ($1, $2, $3)`,
      [updatedStudent.id, 'UPDATE', `Student ${updatedStudent.name} (${updatedStudent.admission_number}) was updated`]
    );

    await client.query('COMMIT');

    // Only delete the old Cloudinary photo after the transaction
    // has safely committed.
    if (oldPublicIdToDelete) {
      deleteCloudinaryPhoto(oldPublicIdToDelete);
    }

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    if (req.file) deleteCloudinaryPhoto(req.file.filename);
    next(err);
  } finally {
    client.release();
  }
}

// ================================================================
// DELETE /api/students/:id
// ================================================================
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

    deleteCloudinaryPhoto(student.photo_public_id);

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