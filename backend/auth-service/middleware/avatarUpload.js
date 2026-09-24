// middleware/avatarUpload.js
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB cukup untuk foto profil
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('File harus berupa gambar (JPG/PNG/WEBP)'));
    cb(null, true);
  },
});

// Wrapper anti-crash: error multer dibalas rapi, bukan bikin server down
function uploadAvatarSafe(fieldName = 'avatar') {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, message: `Upload gagal: ${err.message}` });
      next();
    });
  };
}

module.exports = { uploadAvatarSafe };
