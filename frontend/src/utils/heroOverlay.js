// src/utils/heroOverlay.js
// Dipakai bersama oleh halaman admin (preview) dan LandingPage (tampilan asli)
// supaya hasil preview SAMA PERSIS dengan hasil di website.

export const HERO_DEFAULTS = {
  hero_bg_image: '',
  hero_overlay_color: '#0f172a',
  hero_overlay_opacity: '88', // 0 - 100
  hero_overlay_style: 'left', // left | bottom | solid
};

export const HERO_OVERLAY_STYLES = [
  { value: 'left', label: 'Kiri → Kanan' },
  { value: 'bottom', label: 'Bawah → Atas' },
  { value: 'solid', label: 'Rata' },
];

export const HERO_OVERLAY_SWATCHES = [
  { color: '#0f172a', label: 'Navy' },
  { color: '#052e1c', label: 'Hijau Tua' },
  { color: '#000000', label: 'Hitam' },
  { color: '#2e1065', label: 'Ungu' },
  { color: '#450a0a', label: 'Merah Tua' },
  { color: '#1e3a8a', label: 'Biru' },
];

export const normalizeHex = (v, fallback = HERO_DEFAULTS.hero_overlay_color) => {
  let s = String(v || '').trim();
  if (!s) return fallback;
  if (!s.startsWith('#')) s = `#${s}`;
  if (/^#[0-9a-f]{3}$/i.test(s)) s = `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
  return /^#[0-9a-f]{6}$/i.test(s) ? s.toLowerCase() : fallback;
};

const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${Math.min(1, Math.max(0, a)).toFixed(2)})`;
};

/** Hasilkan nilai CSS `background` untuk lapisan transparan di atas foto hero. */
export const buildHeroOverlay = (s = {}) => {
  const hex = normalizeHex(s.hero_overlay_color);
  const rawIn = s.hero_overlay_opacity;
  const raw = rawIn === '' || rawIn == null ? Number(HERO_DEFAULTS.hero_overlay_opacity) : Number(rawIn);
  const op = (Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) : 88) / 100;
  const style = s.hero_overlay_style || 'left';
  if (style === 'solid') return `linear-gradient(0deg, ${rgba(hex, op * 0.85)}, ${rgba(hex, op * 0.85)})`;
  if (style === 'bottom') {
    return `linear-gradient(180deg, ${rgba(hex, op * 0.6)} 0%, ${rgba(hex, op * 0.82)} 55%, ${rgba(hex, op)} 100%)`;
  }
  return `linear-gradient(90deg, ${rgba(hex, op)} 0%, ${rgba(hex, op * 0.87)} 50%, ${rgba(hex, op * 0.69)} 100%)`;
};