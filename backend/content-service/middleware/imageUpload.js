const multer = require('multer');
const { uploadBufferToStorage, uploadFromExternalUrl, isOurStorageUrl } = require('../services/cloudinaryStorage'); // <== FASE 2 (Cloudinary): sebelumnya '../services/firebaseStorage'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('File harus berupa gambar'));
    cb(null, true);
  },
});

// Wrapper anti-gagal: error multer tidak bikin server crash, dibalas rapi ke frontend
function uploadSingleSafe(fieldName) {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, message: `Upload gagal: ${err.message}` });
      next();
    });
  };
}

// Setelah multer jalan, tentukan URL final gambar sebelum masuk controller
function resolveImage(fieldName, folder) {
  return async (req, res, next) => {
    try {
      req._oldImageValue = null; // dipakai controller kalau mau hapus file lama saat edit

      if (req.file) {
        // Kasus 1: admin upload file fisik
        req.body[fieldName] = await uploadBufferToStorage(req.file.buffer, req.file.mimetype, folder);
        return next();
      }

      const val = req.body[fieldName];
      if (val && typeof val === 'string' && /^https?:\/\//i.test(val) && !isOurStorageUrl(val)) {
        // Kasus 2: admin input URL eksternal -> unduh & upload ulang ke storage kita (Cloudinary)
        req.body[fieldName] = await uploadFromExternalUrl(val, folder);
      }
      // Kasus 3: sudah URL Cloudinary kita sendiri (edit tanpa ganti gambar) -> biarkan apa adanya
      next();
    } catch (err) {
      console.error(`Gagal memproses gambar (${fieldName}):`, err.message);
      res.status(400).json({ success: false, message: `Gagal memproses gambar: ${err.message}` });
    }
  };
}

module.exports = { uploadSingleSafe, resolveImage };