const multer = require('multer');
const { uploadRawBufferToStorage } = require('../services/cloudinaryStorage');

// Beda dari imageUpload.js: ini untuk berkas Downloads (pdf/docx/xlsx/zip/dll),
// bukan gambar -> tidak dibatasi fileFilter mimetype, limit dinaikkan jadi 20MB.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

function uploadSingleSafeFile(fieldName) {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, message: `Upload gagal: ${err.message}` });
      next();
    });
  };
}

// Setelah multer jalan: kalau admin upload berkas fisik, unggah ke Cloudinary (resource_type "raw")
// dan simpan URL hasilnya ke req.body.url. Kalau admin cuma isi Link URL (termasuk Google Drive),
// dibiarkan apa adanya -> link Drive TIDAK diunduh ulang, tetap dipakai langsung.
function resolveDownloadFile(folder) {
  return async (req, res, next) => {
    try {
      if (req.file) {
        req.body.url = await uploadRawBufferToStorage(req.file.buffer, req.file.originalname, folder);

        // Auto-isi ukuran berkas kalau admin belum isi manual
        if (!req.body.fileSize && !req.body.file_size) {
          const sizeInMb = req.file.buffer.length / (1024 * 1024);
          req.body.fileSize = sizeInMb >= 1
            ? `${sizeInMb.toFixed(1)} MB`
            : `${Math.max(1, Math.round(req.file.buffer.length / 1024))} KB`;
        }
      }
      next();
    } catch (err) {
      console.error('Gagal memproses berkas download:', err.message);
      res.status(400).json({ success: false, message: `Gagal memproses berkas: ${err.message}` });
    }
  };
}

module.exports = { uploadSingleSafeFile, resolveDownloadFile };