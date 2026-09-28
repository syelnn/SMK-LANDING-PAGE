const multer = require('multer');
const {
  uploadDownloadBuffer,
  uploadDownloadFromUrl,
  isOurStorageUrl,
  toRelativePath,
} = require('../services/cloudinaryStorage');

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

// Link Google Drive versi "view" diubah jadi link direct-download, supaya Cloudinary
// (dan tombol "Unduh" di frontend) mendapat berkasnya langsung, bukan halaman preview Drive.
function normalizeDriveUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?(?:export=[a-z]+&)?id=([a-zA-Z0-9_-]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m && m[1]) {
      return `https://drive.google.com/uc?export=download&id=${m[1]}`;
    }
  }
  return url;
}

// Setelah multer jalan, tentukan sumber berkas final SEBELUM masuk controller.
// Hasilnya ditaruh di req.downloadFile = { url, publicId, resourceType, fileSize }
// (secure_url + public_id + resource_type dari Cloudinary). Kalau tidak ada upload baru,
// req.downloadFile = null.
//
//  Kasus 1 - "Choose File"     : berkas fisik (req.file) -> diunggah ke Cloudinary.
//  Kasus 2 - "Input Link/URL"  : URL eksternal baru -> Cloudinary mengambil & menyimpannya
//                                (resource_type "auto"), lalu url/public_id hasilnya disimpan.
//  Kasus 3 - URL tidak berubah : saat edit, frontend mengirim ulang URL lama apa adanya.
//                                Itu BUKAN berkas baru -> jangan diunggah ulang (kalau tidak,
//                                edit judul saja akan membuat berkas dobel di Cloudinary).
//
// options.getCurrent(req): opsional, dipakai route PUT untuk mengambil data lama dari database
// (perlu untuk mendeteksi Kasus 3).
function resolveDownloadFile(folder, { getCurrent } = {}) {
  return async (req, res, next) => {
    req.downloadFile = null;
    try {
      if (req.file) {
        req.downloadFile = await uploadDownloadBuffer(req.file.buffer, req.file.originalname, folder);
        return next();
      }

      const submittedUrl = normalizeDriveUrl(typeof req.body.url === 'string' ? req.body.url.trim() : '');
      req.body.url = submittedUrl;
      if (!submittedUrl) return next(); // kosong: biar controller yang membalas validasinya

      // Bukan link http(s) (mis. path relatif data lama), atau sudah berkas Cloudinary milik kita
      // -> tidak perlu diunggah lagi.
      if (!/^https?:\/\//i.test(submittedUrl) || isOurStorageUrl(submittedUrl)) return next();

      // URL sama dengan yang sudah tersimpan -> berkas lama tidak diganti.
      if (getCurrent) {
        const current = await getCurrent(req);
        if (current?.url && toRelativePath(normalizeDriveUrl(current.url)) === toRelativePath(submittedUrl)) {
          return next();
        }
      }

      req.downloadFile = await uploadDownloadFromUrl(submittedUrl, folder);
      next();
    } catch (err) {
      console.error('Gagal memproses berkas download:', err.message);
      res.status(400).json({ success: false, message: `Gagal memproses berkas: ${err.message}` });
    }
  };
}

module.exports = { uploadSingleSafeFile, resolveDownloadFile, normalizeDriveUrl };
