// services/cloudinaryStorage.js
// Pengganti services/firebaseStorage.js (Firebase) / services/imageStorage.js (Supabase)
// versi Cloudinary. Nama & signature fungsi (uploadBufferToStorage, uploadFromExternalUrl,
// deleteFromStorageByUrl, isOurStorageUrl) sengaja dipertahankan sama persis, supaya
// middleware/imageUpload.js dan index.js tidak perlu berubah struktur sama sekali.
const crypto = require('crypto');
const axios = require('axios');
const { v2: cloudinary } = require('cloudinary');

// Fail fast: kalau .env belum lengkap, server langsung error saat start —
// bukan baru ketahuan saat admin pertama kali upload gambar.
const REQUIRED_ENV = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length) {
  throw new Error(`Konfigurasi Cloudinary belum lengkap di .env, kurang: ${missingEnv.join(', ')}`);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Prefix URL Cloudinary milik akun kita sendiri.
// Dipakai isOurStorageUrl() (deteksi "URL ini sudah hasil upload kita, jangan diunduh ulang")
// dan deleteFromStorageByUrl() (pastikan yang dihapus memang file kita, bukan URL asing).
// Ada 2 jenis resource_type yang kita pakai: "image" (foto/logo/icon) dan "raw" (berkas
// dokumen untuk fitur Downloads: pdf, docx, xlsx, zip, dll).
const OUR_IMAGE_PREFIX = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/`;
const OUR_RAW_PREFIX = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/`;
const OUR_PREFIX = OUR_IMAGE_PREFIX; // dipertahankan untuk kompatibilitas kode lama

function isOurStorageUrl(url) {
  return typeof url === 'string' && (url.startsWith(OUR_IMAGE_PREFIX) || url.startsWith(OUR_RAW_PREFIX));
}

// ===== Konversi URL Cloudinary lengkap <-> path relatif =====
// Path relatif = bagian setelah ".../image/upload/" atau ".../raw/upload/" (tanpa versi "vNNNN/"),
// contoh: "teachers/1699999999-uuid.jpg". Inilah yang disimpan ke database, BUKAN URL utuhnya.

// URL Cloudinary kita -> path relatif (dipakai saat admin submit ulang URL lama tanpa mengganti gambar,
// karena frontend menampilkannya sebagai URL utuh hasil gabungan Base URL + path).
function toRelativePath(urlOrPath) {
  if (typeof urlOrPath !== 'string') return urlOrPath;
  if (urlOrPath.startsWith(OUR_IMAGE_PREFIX)) {
    return urlOrPath.slice(OUR_IMAGE_PREFIX.length).replace(/^v\d+\//, '');
  }
  if (urlOrPath.startsWith(OUR_RAW_PREFIX)) {
    return urlOrPath.slice(OUR_RAW_PREFIX.length).replace(/^v\d+\//, '');
  }
  return urlOrPath; // bukan URL kita (path relatif baru, atau link eksternal asli) -> biarkan apa adanya
}

// path relatif (dari database) -> URL Cloudinary lengkap. Dipakai backend saat PERLU mengunduh ulang
// gambar yang sudah tersimpan di Cloudinary kita (mis. menyalin foto profil user ke foto testimoni).
// Frontend TIDAK memakai fungsi ini — frontend menggabungkan sendiri lewat Base URL di .env-nya.
function toAbsoluteImageUrl(pathOrUrl) {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return pathOrUrl;
  return /^https?:\/\//i.test(pathOrUrl) ? pathOrUrl : `${OUR_IMAGE_PREFIX}${pathOrUrl}`;
}

async function uploadBufferToStorage(buffer, mimetype, folder) {
  if (!mimetype || !mimetype.startsWith('image/')) {
    throw new Error('File harus berupa gambar');
  }

  const publicId = `${Date.now()}-${crypto.randomUUID()}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder, // folder di Cloudinary: jurusan/, programs/, teachers/, galleries/, news/, achievements/, settings/, testimonials/
        public_id: publicId,
        resource_type: 'image',
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(new Error(`Upload ke Cloudinary gagal: ${error.message}`));
        // Simpan PATH RELATIF saja ke database (bukan result.secure_url yang lengkap).
        // result.public_id sudah termasuk folder, tinggal tambahkan ekstensi dari result.format.
        // Contoh hasil: "teachers/1699999999-uuid.jpg"
        resolve(`${result.public_id}.${result.format}`);
      }
    );
    // Buffer (dari multer memory storage) dialirkan langsung ke stream upload Cloudinary,
    // tidak perlu ditulis ke disk dulu.
    uploadStream.end(buffer);
  });
}

// Instruksi pembimbing: URL eksternal -> unduh ke buffer via axios -> upload buffer itu ke Cloudinary
async function uploadFromExternalUrl(externalUrl, folder) {
  const response = await axios.get(externalUrl, {
    responseType: 'arraybuffer',
    timeout: 15000,
    maxContentLength: 8 * 1024 * 1024, // guard 8MB, cegah admin tanpa sadar unduh file raksasa
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });

  const mimetype = response.headers['content-type'] || 'image/jpeg';
  if (!mimetype.startsWith('image/')) {
    throw new Error('URL yang diberikan bukan file gambar');
  }

  return uploadBufferToStorage(Buffer.from(response.data), mimetype, folder);
}

// Instruksi khusus fitur Downloads: unggah BERKAS APA SAJA (pdf/docx/xlsx/zip/dll,
// bukan cuma gambar) sebagai resource_type "raw" ke Cloudinary. Nama file asli (beserta
// ekstensinya) dipertahankan di public_id, supaya link hasil upload tetap bisa diunduh
// dengan nama & format yang benar oleh browser.
async function uploadRawBufferToStorage(buffer, originalName, folder) {
  const safeName = (originalName || 'berkas').replace(/[^a-zA-Z0-9._-]/g, '_');
  const publicId = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder, // folder di Cloudinary: downloads/
        public_id: publicId,
        resource_type: 'raw',
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(new Error(`Upload berkas ke Cloudinary gagal: ${error.message}`));
        // Untuk resource_type "raw", public_id yang kita kirim SUDAH menyertakan ekstensi
        // (lihat safeName di atas), jadi public_id apa adanya sudah pas jadi path relatif.
        // Contoh hasil: "downloads/1699999999-uuid-Laporan.pdf"
        resolve(result.public_id);
      }
    );
    uploadStream.end(buffer);
  });
}

// Ambil public_id dari secure_url Cloudinary, dibutuhkan cloudinary.uploader.destroy().
// Untuk resource_type "image": ekstensi ada di luar public_id -> harus dibuang.
//   Contoh: https://res.cloudinary.com/<cloud>/image/upload/v1699999999/teachers/xxxx.jpg
//   -> public_id yang benar: "teachers/xxxx"
// Untuk resource_type "raw": ekstensi memang bagian dari public_id -> tetap dipertahankan.
//   Contoh: https://res.cloudinary.com/<cloud>/raw/upload/v1699999999/downloads/xxxx-berkas.pdf
//   -> public_id yang benar: "downloads/xxxx-berkas.pdf"
function extractPublicIdFromUrl(url, prefix, stripExtension) {
  const afterUpload = url.slice(prefix.length); // "v1699999999/teachers/xxxx.jpg"
  const withoutVersion = afterUpload.replace(/^v\d+\//, ''); // "teachers/xxxx.jpg"
  if (!stripExtension) return withoutVersion;
  const lastDot = withoutVersion.lastIndexOf('.');
  return lastDot === -1 ? withoutVersion : withoutVersion.slice(0, lastDot);
}

// Best-effort, tidak boleh membuat request utama (update/delete data) ikut gagal.
// Kalau value bukan hasil upload kita sendiri (mis. link Google Drive), fungsi ini
// dibiarkan tidak melakukan apa-apa -> file/link asing tidak pernah ikut terhapus.
//
// Menerima 2 kemungkinan bentuk `value` dari database:
//  1) Path relatif (format BARU, sejak perubahan ini)      -> "teachers/xxxx.jpg" / "downloads/xxxx-berkas.pdf"
//  2) URL Cloudinary lengkap (data LAMA, sebelum migrasi)  -> "https://res.cloudinary.com/<cloud>/image/upload/v.../xxxx.jpg"
// supaya baris data lama yang belum sempat diedit ulang tetap bisa dibersihkan dengan benar.
async function deleteFromStorageByUrl(value) {
  try {
    if (typeof value !== 'string' || !value) return;

    // --- Bentuk lama: URL Cloudinary lengkap ---
    if (value.startsWith(OUR_IMAGE_PREFIX)) {
      const publicId = extractPublicIdFromUrl(value, OUR_IMAGE_PREFIX, true);
      if (publicId) await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
      return;
    }
    if (value.startsWith(OUR_RAW_PREFIX)) {
      const publicId = extractPublicIdFromUrl(value, OUR_RAW_PREFIX, false);
      if (publicId) await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
      return;
    }
    if (/^https?:\/\//i.test(value)) return; // link eksternal asing (Google Drive dll) -> bukan milik kita

    // --- Bentuk baru: path relatif ---
    // Field gambar (imageIcon/photo/logo_url/image) -> public_id = path tanpa ekstensi, resource_type "image".
    // Field Downloads ("url") -> public_id = path apa adanya (ekstensi memang bagian public_id), resource_type "raw".
    // Karena field yang sama dipakai untuk keduanya, coba "image" dulu; kalau tidak ketemu, coba "raw".
    const lastDot = value.lastIndexOf('.');
    const asImagePublicId = lastDot === -1 ? value : value.slice(0, lastDot);
    const imageResult = await cloudinary.uploader.destroy(asImagePublicId, { resource_type: 'image' }).catch(() => null);
    if (imageResult?.result === 'ok') return;

    await cloudinary.uploader.destroy(value, { resource_type: 'raw' });
  } catch (err) {
    console.warn('Gagal hapus file lama di Cloudinary (diabaikan):', err.message);
  }
}

// Deteksi ukuran berkas dari URL manapun (termasuk link Google Drive yang sudah dinormalisasi)
// tanpa mengunduh seluruh isi filenya -> cukup baca header Content-Length lalu stream dihentikan.
async function detectRemoteFileSize(url) {
  if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url)) return '';
  try {
    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 10000,
      maxRedirects: 5,
      headers: { 'User-Agent': 'Mozilla/5.0' },
      validateStatus: (status) => status >= 200 && status < 400,
    });

    const contentLength = Number(response.headers['content-length']);
    response.data.destroy(); // sudah dapat header, hentikan stream biar tidak unduh full body

    if (!contentLength) return '';
    const sizeInMb = contentLength / (1024 * 1024);
    return sizeInMb >= 1
      ? `${sizeInMb.toFixed(1)} MB`
      : `${Math.max(1, Math.round(contentLength / 1024))} KB`;
  } catch (err) {
    // Best-effort: kalau gagal (mis. Google Drive minta konfirmasi virus-scan untuk file besar),
    // biarkan kosong -> admin bisa isi manual, tidak boleh membuat request utama ikut gagal.
    return '';
  }
}

module.exports = {
  uploadBufferToStorage,
  uploadFromExternalUrl,
  uploadRawBufferToStorage,
  deleteFromStorageByUrl,
  detectRemoteFileSize,
  isOurStorageUrl,
  toRelativePath,
  toAbsoluteImageUrl,
};