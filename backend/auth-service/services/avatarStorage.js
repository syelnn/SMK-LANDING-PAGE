// services/avatarStorage.js
// Versi ringkas dari content-service/services/cloudinaryStorage.js, khusus
// untuk foto profil (avatar) user. Sengaja dipisah dari content-service supaya
// auth-service tidak perlu memanggil service lain untuk fitur upload avatar.
const crypto = require('crypto');
const http = require('http');
const https = require('https');
const net = require('net');
const dns = require('dns');
const { v2: cloudinary } = require('cloudinary');

const REQUIRED_ENV = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length) {
  throw new Error(`Konfigurasi Cloudinary belum lengkap di .env auth-service, kurang: ${missingEnv.join(', ')}`);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const OUR_IMAGE_PREFIX = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/`;
const isOurStorageUrl = (url) => typeof url === 'string' && url.startsWith(OUR_IMAGE_PREFIX);

function uploadAvatarBuffer(buffer, mimetype) {
  if (!mimetype || !mimetype.startsWith('image/')) {
    throw new Error('File harus berupa gambar');
  }
  const publicId = `${Date.now()}-${crypto.randomUUID()}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'avatars',
        public_id: publicId,
        resource_type: 'image',
        overwrite: false,
        // Avatar tidak perlu resolusi raksasa; dibatasi + di-crop wajah kalau ada.
        transformation: [{ width: 512, height: 512, crop: 'fill', gravity: 'face' }],
      },
      (error, result) => {
        if (error) return reject(new Error(`Upload avatar ke Cloudinary gagal: ${error.message}`));
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
}

async function deleteAvatarByUrl(url) {
  try {
    if (typeof url !== 'string' || !url.startsWith(OUR_IMAGE_PREFIX)) return;
    const afterUpload = url.slice(OUR_IMAGE_PREFIX.length);
    const withoutVersion = afterUpload.replace(/^v\d+\//, '');
    const lastDot = withoutVersion.lastIndexOf('.');
    const publicId = lastDot === -1 ? withoutVersion : withoutVersion.slice(0, lastDot);
    if (publicId) await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (err) {
    console.warn('Gagal hapus avatar lama di Cloudinary (diabaikan):', err.message);
  }
}

// ===== Unduh gambar dari link (opsi "Link URL") =====
// Diunduh oleh BACKEND lalu diunggah ke Cloudinary, jadi database hanya menyimpan URL Cloudinary
// milik kita (bukan link pihak ketiga yang bisa mati/berubah).
// Dilindungi dari SSRF: alamat IP privat/loopback/link-local ditolak, termasuk saat redirect
// dan hasil DNS (dicek langsung di fungsi lookup sehingga tidak bisa ditipu DNS rebinding).
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = /^image\/(jpeg|png|webp|gif)$/;

const isPrivateIp = (ip) => {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v = String(ip).toLowerCase();
  return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') ||
    v.startsWith('fe80') || v.startsWith('::ffff:');
};

const safeLookup = (hostname, options, cb) => {
  dns.lookup(hostname, { all: true }, (err, addrs) => {
    if (err) return cb(err);
    if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) return cb(new Error('Alamat link tidak diizinkan'));
    if (options && options.all) return cb(null, addrs);
    return cb(null, addrs[0].address, addrs[0].family);
  });
};

function downloadImage(urlStr, redirectsLeft = 3) {
  return new Promise((resolve, reject) => {
    let u;
    try { u = new URL(urlStr); } catch { return reject(new Error('Link foto tidak valid')); }
    if (!['http:', 'https:'].includes(u.protocol)) return reject(new Error('Link foto harus http:// atau https://'));
    const host = u.hostname.replace(/^\[|\]$/g, '');
    if (net.isIP(host) && isPrivateIp(host)) return reject(new Error('Alamat link tidak diizinkan'));

    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.get(u, {
      lookup: safeLookup,
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0 (SMK-Avatar-Fetcher)', Accept: 'image/*' },
    }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        if (redirectsLeft <= 0) return reject(new Error('Terlalu banyak pengalihan link'));
        return resolve(downloadImage(new URL(res.headers.location, u).toString(), redirectsLeft - 1));
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(`Gagal mengunduh gambar (HTTP ${res.statusCode})`)); }

      const type = String(res.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
      if (!ALLOWED_TYPES.test(type)) { res.resume(); return reject(new Error('Link bukan gambar (JPG/PNG/WEBP)')); }
      if (Number(res.headers['content-length'] || 0) > MAX_AVATAR_BYTES) { res.resume(); return reject(new Error('Ukuran gambar dari link maksimal 2MB')); }

      const chunks = [];
      let size = 0;
      res.on('data', (chunk) => {
        size += chunk.length;
        if (size > MAX_AVATAR_BYTES) { req.destroy(); return reject(new Error('Ukuran gambar dari link maksimal 2MB')); }
        chunks.push(chunk);
      });
      res.on('end', () => resolve({ buffer: Buffer.concat(chunks), mimetype: type }));
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error('Waktu mengunduh gambar habis')));
    req.on('error', reject);
  });
}

// Unduh gambar dari link -> unggah ke Cloudinary -> kembalikan URL Cloudinary
async function uploadAvatarFromUrl(url) {
  const { buffer, mimetype } = await downloadImage(url);
  return uploadAvatarBuffer(buffer, mimetype);
}

module.exports = { uploadAvatarBuffer, uploadAvatarFromUrl, deleteAvatarByUrl, isOurStorageUrl };
