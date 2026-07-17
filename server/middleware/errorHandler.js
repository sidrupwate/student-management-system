const multer = require('multer');

function errorHandler(err, req, res, next) {
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

  if (err.message && err.message.includes('Only JPG, JPEG, PNG')) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'This origin is not permitted to access the API',
    });
  }

  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A student with this email or admission number already exists',
    });
  }

  console.error('Unhandled error:', err);

  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
}

module.exports = errorHandler;