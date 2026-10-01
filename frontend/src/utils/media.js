// src/utils/media.js
//
// Database HANYA menyimpan path relatif Cloudinary (mis. "teachers/1699999999-uuid.jpg"),
// bukan URL lengkap. Semua tempat yang menampilkan gambar dari data API (item.photo,
// item.image, item.imageIcon, item.logo_url, user.avatar, dst) WAJIB melewati getImageUrl()
// di bawah ini dulu sebelum dipakai sebagai src={...} pada <img>.
//
// Base URL diambil dari .env (lihat .env.example), supaya kalau nanti pindah akun/cloud
// Cloudinary atau ganti provider penyimpanan, cukup ubah .env tanpa sentuh kode.

const IMAGE_BASE_URL = (import.meta.env.VITE_CLOUDINARY_IMAGE_BASE_URL || '').replace(/\/+$/, '');
const RAW_BASE_URL = (import.meta.env.VITE_CLOUDINARY_RAW_BASE_URL || '').replace(/\/+$/, '');

/**
 * Gabungkan Base URL Cloudinary + path relatif dari database, untuk gambar
 * (foto guru, logo jurusan, cover galeri, foto berita, avatar, dll).
 *
 * @param {string} path - nilai field dari API, mis. item.photo / item.image / user.avatar
 * @param {string} [fallback] - dipakai kalau path kosong (opsional)
 */
export function getImageUrl(path, fallback = '') {
  if (!path) return fallback;
  // Kompatibilitas data lama (URL lengkap yang belum sempat diedit ulang) dan pratinjau lokal
  // (blob:/data: dari ImageUploader sebelum file disimpan) -> dibiarkan apa adanya.
  if (/^(https?:|data:|blob:|\/)/i.test(path)) return path; // '/' = aset lokal (mis. /src/assets/logo1.png)
  if (!path.includes('/')) return path; // bukan path Cloudinary (mis. nama ikon 'shield')
  if (!IMAGE_BASE_URL) {
    console.warn('VITE_CLOUDINARY_IMAGE_BASE_URL belum diatur di .env');
    return fallback;
  }
  return `${IMAGE_BASE_URL}/${path}`;
}

/**
 * Sama seperti getImageUrl, tapi untuk berkas Downloads (pdf/docx/xlsx/zip, resource_type "raw").
 * Link Google Drive (bukan hasil upload kita) tetap lolos apa adanya karena sudah URL penuh.
 */
export function getRawFileUrl(path, fallback = '') {
  if (!path) return fallback;
  if (/^https?:\/\//i.test(path)) return path;
  if (!RAW_BASE_URL) {
    console.warn('VITE_CLOUDINARY_RAW_BASE_URL belum diatur di .env');
    return fallback;
  }
  return `${RAW_BASE_URL}/${path}`;
}

/**
 * Susun alamat lengkap berkas Downloads dari data API.
 * Database hanya menyimpan PATH (mis. "downloads/xxx.pdf") + resourceType; alamat lengkapnya
 * dibentuk di sini dari Base URL di .env. resourceType menentukan bagian "image/raw/video" pada alamat:
 * PDF & gambar -> "image", DOCX/ZIP/dll -> "raw" (ditentukan otomatis oleh Cloudinary saat upload).
 * Link penuh (data lama, mis. Google Drive) tetap dipakai apa adanya.
 *
 * @param {object} item - satu baris data dari /api/downloads (butuh item.url & item.resourceType)
 */
export function getDownloadFileUrl(item, fallback = '') {
  const path = item?.url;
  if (!path) return fallback;
  if (/^https?:\/\//i.test(path)) return path;

  const type = item.resourceType || item.resource_type || 'raw';
  let base = RAW_BASE_URL;
  if (type === 'image' && IMAGE_BASE_URL) base = IMAGE_BASE_URL;
  else if (type !== 'raw' && RAW_BASE_URL) base = RAW_BASE_URL.replace(/\/raw\/upload$/, `/${type}/upload`);

  if (!base) {
    console.warn('VITE_CLOUDINARY_RAW_BASE_URL / VITE_CLOUDINARY_IMAGE_BASE_URL belum diatur di .env');
    return fallback;
  }
  return `${base}/${path.replace(/^\/+/, '')}`;
}

// =====================================================================
// UNDUH LANGSUNG (tanpa pindah halaman / tanpa tab baru)
// =====================================================================
// Atribut <a download> diabaikan browser untuk link lintas-domain (Cloudinary), sehingga link
// biasa hanya membuka berkas di tab baru. Solusinya: berkas diambil lewat fetch sebagai blob,
// lalu diunduh dari memori dengan nama yang benar. Kalau fetch gagal (mis. link eksternal tanpa
// izin CORS), dipakai cadangan: link Cloudinary diberi flag fl_attachment (browser memaksa unduh).

const MIME_EXT = {
  'application/pdf': 'pdf',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

// Sisipkan fl_attachment ke URL Cloudinary -> server membalas dengan "Content-Disposition: attachment"
export function getAttachmentUrl(url) {
  const m = String(url || '').match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/(?:image|raw|video)\/upload\/)(.*)$/);
  if (!m || m[2].startsWith('fl_attachment')) return url;
  return `${m[1]}fl_attachment/${m[2]}`;
}

function buildFileName(title, url, mime) {
  const base = String(title || 'berkas').replace(/[\\/:*?"<>|]+/g, '').trim().slice(0, 100) || 'berkas';
  let ext = '';
  try { ext = new URL(url).pathname.match(/\.([a-z0-9]{2,5})$/i)?.[1] || ''; } catch { /* abaikan */ }
  if (!ext && mime) ext = MIME_EXT[String(mime).split(';')[0].trim()] || '';
  return ext && !base.toLowerCase().endsWith(`.${ext.toLowerCase()}`) ? `${base}.${ext}` : base;
}

function clickAnchor(href, fileName) {
  const a = document.createElement('a');
  a.href = href;
  if (fileName) a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Unduh berkas langsung saat tombol diklik.
 * @param {string} url   - item.url dari API (URL utuh atau path relatif data lama)
 * @param {string} title - judul berkas, dipakai sebagai nama file hasil unduhan
 * @returns {Promise<boolean>} true kalau berhasil lewat fetch, false kalau memakai cadangan
 */
export async function downloadFileDirect(url, title) {
  const fullUrl = getRawFileUrl(url);
  if (!fullUrl) return false;

  try {
    const res = await fetch(fullUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    clickAnchor(blobUrl, buildFileName(title, fullUrl, blob.type));
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    return true;
  } catch (err) {
    console.warn('Unduh via fetch gagal, memakai cadangan:', err.message);
    clickAnchor(getAttachmentUrl(fullUrl), buildFileName(title, fullUrl));
    return false;
  }
}
