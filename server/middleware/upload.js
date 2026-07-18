// ============================================================
// middleware/upload.js
// ------------------------------------------------------------
// Multer configuration for student photo uploads.
//
// CHANGED: previously used Multer's diskStorage to save files
// to server/uploads/ - this broke on Render's free tier, whose
// filesystem is ephemeral (wiped on every redeploy/restart), so
// uploaded photos would silently disappear.
//
// Now uses multer-storage-cloudinary, which streams the upload
// directly to Cloudinary instead of writing to local disk.
// req.file.path becomes the Cloudinary secure URL (what we store
// as photo_url), and req.file.filename becomes the Cloudinary
// public_id (what we store as photo_public_id, needed later to
// delete or replace the photo on Cloudinary).
// ============================================================

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// --------------------------------------------------------------
// Cloudinary storage engine. Every upload lands in the
// "student-management/students" folder in your Cloudinary media
// library, with a unique public_id so two students' photos never
// collide.
// --------------------------------------------------------------
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'student-management/students',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    public_id: (req, file) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      return `student-${uniqueSuffix}`;
    },
    // Resize on upload so we never store/serve unnecessarily huge
    // images - 800x800 max, preserving aspect ratio, no upscaling.
    transformation: [{ width: 800, height: 800, crop: 'limit' }],
  },
});

// --------------------------------------------------------------
// File filter: reject anything that isn't an allowed image type
// BEFORE Multer even starts streaming it to Cloudinary.
// --------------------------------------------------------------
function fileFilter(req, file, cb) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, PNG, and WEBP image files are allowed'));
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
});

// Exported as a ready-to-use middleware for a single file field
// named "photo" - used like:
//   router.post('/', uploadStudentPhoto, ...)
const uploadStudentPhoto = upload.single('photo');

module.exports = { uploadStudentPhoto };