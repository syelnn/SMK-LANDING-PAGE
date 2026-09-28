// Urutan galeri yang tetap (tidak berubah walau data foto di-edit).
//
// Masalah sebelumnya: urutan mengikuti kembalian database. Di PostgreSQL/Supabase,
// baris yang di-UPDATE bisa muncul di paling bawah kalau query tanpa ORDER BY.
// Solusi: urutkan di sisi klien memakai kolom yang TIDAK berubah saat edit (id).

// Album yang harus selalu tampil paling awal (urut sesuai daftar ini).
export const PRIORITY_ALBUMS = ['Fasilitas Sekolah'];

const norm = (s) => String(s ?? '').trim().toLowerCase();

const toNum = (v, fallback) => {
  const n = Number(v);
  return Number.isNaN(n) ? fallback : n;
};

// Foto: sort_order dulu (kosong dianggap 1), lalu id.
export const sortPhotos = (list = []) =>
  [...list].sort((a, b) => {
    const oa = toNum(a.sort_order ?? a.sortOrder ?? 1, 1);
    const ob = toNum(b.sort_order ?? b.sortOrder ?? 1, 1);
    if (oa !== ob) return oa - ob;
    const ia = Number(a.id);
    const ib = Number(b.id);
    if (!Number.isNaN(ia) && !Number.isNaN(ib)) return ia - ib;
    return String(a.id).localeCompare(String(b.id));
  });

// Album: PRIORITY_ALBUMS dulu, sisanya berdasarkan id foto tertua (urutan dibuat).
// `grouped` = { namaAlbum: [foto, ...] }. Mengembalikan array nama album berurutan.
export const orderAlbumNames = (grouped = {}) => {
  const minId = (name) =>
    Math.min(...(grouped[name] || []).map((p) => toNum(p.id, Number.MAX_SAFE_INTEGER)));

  const priorityIndex = (name) => {
    const i = PRIORITY_ALBUMS.findIndex((p) => norm(p) === norm(name));
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };

  return Object.keys(grouped).sort((a, b) => {
    const pa = priorityIndex(a);
    const pb = priorityIndex(b);
    if (pa !== pb) return pa - pb;
    const ma = minId(a);
    const mb = minId(b);
    if (ma !== mb) return ma - mb;
    return a.localeCompare(b);
  });
};
