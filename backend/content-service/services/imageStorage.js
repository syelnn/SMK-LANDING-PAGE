const crypto = require('crypto');
const axios = require('axios');
const supabaseAdmin = require('./supabaseAdmin');

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'site-images';
const OUR_PREFIX = `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

function isOurStorageUrl(url) {
  return typeof url === 'string' && url.startsWith(OUR_PREFIX);
}

async function uploadBufferToStorage(buffer, mimetype, folder) {
  const ext = EXT[mimetype] || 'jpg';
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mimetype, upsert: false });

  if (error) throw new Error(`Upload storage gagal: ${error.message}`);

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Instruksi pembimbing: URL eksternal -> unduh -> upload ke storage kita
async function uploadFromExternalUrl(externalUrl, folder) {
  const response = await axios.get(externalUrl, {
    responseType: 'arraybuffer',
    timeout: 15000,
    maxContentLength: 8 * 1024 * 1024, // 8MB guard
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });

  const mimetype = response.headers['content-type'] || 'image/jpeg';
  if (!mimetype.startsWith('image/')) {
    throw new Error('URL yang diberikan bukan file gambar');
  }

  return uploadBufferToStorage(Buffer.from(response.data), mimetype, folder);
}

// Best-effort, tidak boleh membuat request utama gagal
async function deleteFromStorageByUrl(url) {
  try {
    if (!isOurStorageUrl(url)) return;
    const path = url.replace(OUR_PREFIX, '');
    await supabaseAdmin.storage.from(BUCKET).remove([path]);
  } catch (err) {
    console.warn('Gagal hapus file lama di storage (diabaikan):', err.message);
  }
}

module.exports = { uploadBufferToStorage, uploadFromExternalUrl, deleteFromStorageByUrl, isOurStorageUrl };