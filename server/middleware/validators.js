
const { body, validationResult } = require('express-validator');

const ALLOWED_GENDERS = ['Male', 'Female', 'Other'];

const nameRule = body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s.'-]+$/).withMessage('Name can only contain letters, spaces, and . \' -');

const courseRule = body('course')
    .trim()
    .notEmpty().withMessage('Course is required')
    .isLength({ min: 2, max: 100 }).withMessage('Course must be between 2 and 100 characters');

const yearRule = body('year')
    .notEmpty().withMessage('Year is required')
    .isInt({ min: 1, max: 6 }).withMessage('Year must be a number between 1 and 6');

const dobRule = body('date_of_birth')
    .notEmpty().withMessage('Date of birth is required')
    .isISO8601().withMessage('Date of birth must be a valid date (YYYY-MM-DD)')
    .custom((value) => {
        const dob = new Date(value);
        const today = new Date();
        const minAge = 10; // sanity floor - a "student" should be at least this old
        const maxAgeDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
        const minAgeDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());

        if (dob > today) {
            throw new Error('Date of birth cannot be in the future');
        }
        if (dob < maxAgeDate) {
            throw new Error('Date of birth is not valid (too far in the past)');
        }
        if (dob > minAgeDate) {
            throw new Error(`Student must be at least ${minAge} years old`);
        }
        return true;
    });

const emailRule = body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Email must be a valid email address')
    .normalizeEmail();

const mobileRule = body('mobile_number')
    .trim()
    .notEmpty().withMessage('Mobile number is required')
    .matches(/^[0-9]{10}$/).withMessage('Mobile number must be exactly 10 digits');

const genderRule = body('gender')
    .trim()
    .notEmpty().withMessage('Gender is required')
    .isIn(ALLOWED_GENDERS).withMessage(`Gender must be one of: ${ALLOWED_GENDERS.join(', ')}`);

const addressRule = body('address')
    .trim()
    .notEmpty().withMessage('Address is required')
    .isLength({ min: 5, max: 500 }).withMessage('Address must be between 5 and 500 characters');

const createStudentValidationRules = [
    nameRule,
    courseRule,
    yearRule,
    dobRule,
    emailRule,
    mobileRule,
    genderRule,
    addressRule,
];

const updateStudentValidationRules = [
    nameRule,
    courseRule,
    yearRule,
    dobRule,
    emailRule,
    mobileRule,
    genderRule,
    addressRule,
];


function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map((e) => ({
                field: e.path,
                message: e.msg,
            })),
        });
    }

    next();
}

module.exports = {
    createStudentValidationRules,
    updateStudentValidationRules,
    handleValidationErrors,
};