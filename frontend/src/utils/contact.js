// src/utils/contact.js
// Helper Kontak & Alamat — dipakai ManageSettings (admin) dan FooterViewer (publik)
// supaya keduanya membaca data yang SAMA.

export const CONTACT_KEYS = [
  'contact_phone', 'contact_email', 'contact_address', 'contact_map_embed_url',
  'social_facebook', 'social_instagram', 'social_youtube', 'social_tiktok', 'social_twitter',
];

// Data lama ada di tabel footer_setting. Dipakai sebagai nilai awal sebelum admin pertama kali menyimpan.
export const contactFromFooter = (f = {}) => ({
  contact_phone: f?.phone || '',
  contact_email: f?.email || '',
  contact_address: f?.address || '',
  contact_map_embed_url: f?.mapsEmbedUrl || f?.maps_embed_url || '',
  social_facebook: f?.facebookUrl || f?.facebook_url || '',
  social_instagram: f?.instagramUrl || f?.instagram_url || '',
  social_youtube: f?.youtubeUrl || f?.youtube_url || '',
  social_tiktok: f?.tiktokUrl || f?.tiktok_url || '',
  social_twitter: f?.twitterUrl || f?.twitter_url || '',
});

// Setelah admin menyimpan dari halaman Kontak & Maps (contact_configured = '1'),
// tabel settings jadi sumber utama. Sebelum itu, pakai data footer lama.
export const resolveContact = (settings = {}, footer = null) => {
  if (settings?.contact_configured === '1') {
    return Object.fromEntries(CONTACT_KEYS.map((k) => [k, String(settings[k] ?? '').trim()]));
  }
  return contactFromFooter(footer || {});
};

export const normalizeUrl = (v) => {
  const s = String(v || '').trim();
  if (!s) return '';
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
};

// Menerima: kode <iframe> Google Maps, link embed, link Maps biasa, atau teks alamat.
// Hasil: URL yang aman dipasang di <iframe src>. Kosong jika tidak ada bahan sama sekali.
export const toMapEmbedSrc = (input, address = '') => {
  const raw = String(input || '').trim();
  const fromIframe = raw.match(/src=["']([^"']+)["']/i)?.[1];
  const val = (fromIframe || raw).replace(/&amp;/g, '&');

  if (/^https?:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/i.test(val) || /[?&]output=embed/i.test(val)) return val;

  const q = val.match(/[?&]q=([^&]+)/)?.[1] || val.match(/\/maps\/place\/([^/@?]+)/)?.[1];
  if (q) return `https://www.google.com/maps?q=${q}&output=embed`;

  const isFreeText = raw && !fromIframe && !/^https?:\/\//i.test(raw);
  const text = isFreeText ? raw : String(address || '').trim();
  return text ? `https://www.google.com/maps?q=${encodeURIComponent(text)}&output=embed` : '';
};