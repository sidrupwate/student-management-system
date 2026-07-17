const express = require('express');
const router = express.Router();

const {
    getAllStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
} = require('../controllers/studentControllers');

const { uploadStudentPhoto } = require('../middleware/upload');

const {
    createStudentValidationRules,
    updateStudentValidationRules,
    handleValidationErrors,
} = require('../middleware/validators');

// GET /api/students?search=&course=&year=&gender=&page=&limit=&sortBy=&order=
router.get('/', getAllStudents);

// GET /api/students/:id
router.get('/:id', getStudentById);

// POST /api/students  (multipart/form-data, field name "photo")
router.post(
    '/',
    uploadStudentPhoto,
    createStudentValidationRules,
    handleValidationErrors,
    createStudent
);

// PUT /api/students/:id  (multipart/form-data, field name "photo")
router.put(
    '/:id',
    uploadStudentPhoto,
    updateStudentValidationRules,
    handleValidationErrors,
    updateStudent
);

// DELETE /api/students/:id
router.delete('/:id', deleteStudent);

module.exports = router;