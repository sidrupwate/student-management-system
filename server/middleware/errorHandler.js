const multer = require('multer');

function errorHandler(err, req, res, next) {
  // --------------------------------------------------------------
  // Multer-specific errors (file too large, wrong field name, etc.)
  // These come through as instances of multer.MulterError.
  // --------------------------------------------------------------
  if (err instanceof multer.MulterError) {
    let message = 'File upload error';

    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Photo must be smaller than 5MB';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field - expected field name "photo"';
    }

    return res.status(400).json({
      success: false,
      message,
    });
  }

  // --------------------------------------------------------------
  // Our own fileFilter in upload.js throws a plain Error for
  // disallowed file types - it arrives here as a generic Error,
  // not a MulterError, so we check the message pattern.
  // --------------------------------------------------------------
  if (err.message && err.message.includes('Only JPG, JPEG, PNG')) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // --------------------------------------------------------------
  // CORS rejection - thrown by the origin callback in server.js
  // when a request's Origin header isn't in the allowed list.
  // --------------------------------------------------------------
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'This origin is not permitted to access the API',
    });
  }

  // --------------------------------------------------------------
  // PostgreSQL unique-violation error code (e.g. duplicate email
  // or duplicate admission_number slipping past app-level checks
  // under a race condition).
  // --------------------------------------------------------------
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A student with this email or admission number already exists',
    });
  }

  // --------------------------------------------------------------
  // Fallback: anything else is an unexpected server error.
  // Full error is logged server-side; only a safe message is
  // sent to the client so internal details never leak.
  // --------------------------------------------------------------
  console.error('Unhandled error:', err);

  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
}

module.exports = errorHandler;