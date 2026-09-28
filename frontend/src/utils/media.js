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
