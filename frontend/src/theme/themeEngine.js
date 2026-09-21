// src/theme/themeEngine.js
// Satu-satunya tempat yang mengatur tema (warna + font) untuk SELURUH website.
// Dipakai oleh SettingsContext (menerapkan ke DOM) dan ManageSettings/ThemePreview (preview).

export const API_URL = 'http://localhost:5002';

/* ========================================================================
   FONT — 4 pilihan: Default (bawaan situs) + Plus Jakarta Sans, Poppins, Inter
   ======================================================================== */
export const DEFAULT_FONT_STACK = "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif";

export const FONT_OPTIONS = [
  { value: 'default', label: 'Default', hint: 'Bawaan situs (yang dipakai sekarang)', stack: DEFAULT_FONT_STACK, google: 'Plus+Jakarta+Sans:wght@400;500;600;700;800' },
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans', hint: 'Dipaksa di semua halaman', stack: DEFAULT_FONT_STACK, google: 'Plus+Jakarta+Sans:wght@400;500;600;700;800' },
  { value: 'Poppins', label: 'Poppins', hint: 'Bulat & tegas', stack: "'Poppins', system-ui, -apple-system, 'Segoe UI', sans-serif", google: 'Poppins:wght@400;500;600;700;800' },
  { value: 'Inter', label: 'Inter', hint: 'Netral & bersih', stack: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif", google: 'Inter:wght@400;500;600;700;800' },
];

export const normalizeFont = (v) => (FONT_OPTIONS.some((f) => f.value === v) ? v : 'default');
export const getFontStack = (v) => (FONT_OPTIONS.find((f) => f.value === normalizeFont(v)) || FONT_OPTIONS[0]).stack;

// Memuat font dari Google Fonts sekali saja (di semua halaman, bukan cuma halaman admin)
export const ensureFont = (value) => {
  if (typeof document === 'undefined') return;
  const f = FONT_OPTIONS.find((o) => o.value === value);
  if (!f || !f.google) return;
  const id = `gf-${f.google.split(':')[0].toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${f.google}&display=swap`;
  document.head.appendChild(link);
};

/* ========================================================================
   UTIL WARNA
   ======================================================================== */
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
export const isHex = (v) => HEX.test(String(v || '').trim());

export const normHex = (v, fallback) => {
  if (!isHex(v)) return fallback;
  let h = String(v).trim().toLowerCase();
  if (h.length === 4) h = '#' + [...h.slice(1)].map((c) => c + c).join('');
  return h;
};

const toRgb = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (rgb) =>
  '#' + rgb.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');

export const mix = (a, b, t) => {
  const A = toRgb(a);
  const B = toRgb(b);
  return toHex(A.map((x, i) => x * (1 - t) + B[i] * t));
};
export const rgba = (h, a) => {
  const [r, g, b] = toRgb(h);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};
const lum = (h) => {
  const [r, g, b] = toRgb(h).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
export const isDarkColor = (h) => lum(h) < 0.35;

/* ========================================================================
   TEMA
   ======================================================================== */
export const VALID_MODES = ['system', 'light', 'dark', 'custom'];
export const normalizeMode = (m) => (VALID_MODES.includes(m) ? m : 'system');

// key di database -> nama token di palette
export const CUSTOM_FIELD_MAP = {
  custom_bg: 'bg',
  custom_card: 'surface',
  custom_card_soft: 'surfaceSoft',
  custom_border: 'border',
  custom_text_main: 'text',
  custom_text_muted: 'muted',
  custom_accent: 'accent',
  custom_accent_hover: 'accentHover',
  custom_accent_text: 'accentText',
  custom_nav_bg: 'navBg',
  custom_nav_text: 'navText',
  custom_nav_muted: 'navMuted',
  custom_nav_accent: 'navAccent',
  custom_footer_bg: 'footerBg',
  custom_footer_text: 'footerText',
  custom_badge_bg: 'badgeBg',
  custom_badge_text: 'badgeText',
};
export const CUSTOM_KEYS = Object.keys(CUSTOM_FIELD_MAP);
export const THEME_KEYS = ['theme_mode', 'font_family', ...CUSTOM_KEYS];

// Field yang kosong = dihitung otomatis dari warna dasar
export const DEFAULT_CUSTOM = {
  custom_bg: '#f8fafc',
  custom_card: '#ffffff',
  custom_card_soft: '',
  custom_border: '#e2e8f0',
  custom_text_main: '#0f172a',
  custom_text_muted: '#64748b',
  custom_accent: '#2563eb',
  custom_accent_hover: '',
  custom_accent_text: '',
  custom_nav_bg: '#0b132b',
  custom_nav_text: '#ffffff',
  custom_nav_muted: '',
  custom_nav_accent: '',
  custom_footer_bg: '',
  custom_footer_text: '',
  custom_badge_bg: '',
  custom_badge_text: '',
};

// Mengubah input admin -> palette lengkap (yang kosong dihitung otomatis)
export const resolveCustom = (d = {}) => {
  const g = (k, fb) => normHex(d[k], fb);
  const bg = g('custom_bg', DEFAULT_CUSTOM.custom_bg);
  const surface = g('custom_card', DEFAULT_CUSTOM.custom_card);
  const text = g('custom_text_main', DEFAULT_CUSTOM.custom_text_main);
  const muted = g('custom_text_muted', DEFAULT_CUSTOM.custom_text_muted);
  const border = g('custom_border', DEFAULT_CUSTOM.custom_border);
  const accent = g('custom_accent', DEFAULT_CUSTOM.custom_accent);
  const navBg = g('custom_nav_bg', DEFAULT_CUSTOM.custom_nav_bg);
  const navText = g('custom_nav_text', DEFAULT_CUSTOM.custom_nav_text);

  const surfaceSoft = g('custom_card_soft', mix(surface, text, 0.05));
  const accentHover = g('custom_accent_hover', mix(accent, '#000000', 0.15));
  const accentText = g('custom_accent_text', contrast(accent, '#ffffff') >= contrast(accent, '#0f172a') ? '#ffffff' : '#0f172a');
  const navMuted = g('custom_nav_muted', mix(navText, navBg, 0.35));
  const navAccent = g('custom_nav_accent', contrast(accent, navBg) >= 3 ? accent : navText);
  const footerBg = g('custom_footer_bg', navBg);
  const footerText = g('custom_footer_text', navText);

  return {
    bg, surface, surfaceSoft, border, text, muted,
    accent, accentHover, accentText,
    navBg, navText, navMuted, navAccent, navBorder: mix(navBg, navText, 0.14),
    footerBg, footerText, footerMuted: mix(footerText, footerBg, 0.35),
    badgeBg: g('custom_badge_bg', surfaceSoft),
    badgeText: g('custom_badge_text', muted),
    badgeBorder: border,
    shadow: rgba(text, 0.12),
  };
};

// Cerminan theme.css (dipakai untuk preview & tombol "Salin dari ...")
export const PRESETS = {
  light: {
    bg: '#f8fafc', surface: '#ffffff', surfaceSoft: '#f1f5f9', border: '#e2e8f0', text: '#0f172a', muted: '#475569',
    accent: '#2563eb', accentHover: '#1d4ed8', accentText: '#ffffff',
    navBg: '#0f172a', navText: '#f8fafc', navMuted: '#94a3b8', navAccent: '#38bdf8', navBorder: '#1e293b',
    footerBg: '#0f172a', footerText: '#f8fafc', footerMuted: '#94a3b8',
    badgeBg: '#f1f5f9', badgeText: '#475569', badgeBorder: '#e2e8f0',
  },
  dark: {
    bg: '#09090b', surface: '#09090b', surfaceSoft: '#27272a', border: '#27272a', text: '#fafafa', muted: '#d4d4d8',
    accent: '#38bdf8', accentHover: '#0ea5e9', accentText: '#09090b',
    navBg: '#000000', navText: '#fafafa', navMuted: '#a1a1aa', navAccent: '#38bdf8', navBorder: '#27272a',
    footerBg: '#000000', footerText: '#fafafa', footerMuted: '#a1a1aa',
    badgeBg: '#27272a', badgeText: '#e4e4e7', badgeBorder: '#3f3f46',
  },
  system: {
    bg: '#fffdee', surface: '#ffffff', surfaceSoft: '#e2fbce', border: '#e2e8f0', text: '#06231d', muted: '#076653',
    accent: '#076653', accentHover: '#0c342c', accentText: '#ffffff',
    navBg: '#06231d', navText: '#fffdee', navMuted: '#e2fbce', navAccent: '#e3ef26', navBorder: '#0c342c',
    footerBg: '#06231d', footerText: '#fffdee', footerMuted: '#e2fbce',
    badgeBg: '#e2fbce', badgeText: '#06231d', badgeBorder: '#c7eaae',
  },
};

export const presetToCustom = (p) => {
  const out = {};
  Object.entries(CUSTOM_FIELD_MAP).forEach(([key, token]) => { out[key] = p[token]; });
  return out;
};

// Palette yang sedang aktif (untuk preview)
export const resolvePalette = (data = {}) => {
  const mode = normalizeMode(data.theme_mode);
  return mode === 'custom' ? resolveCustom(data) : PRESETS[mode] || PRESETS.system;
};

/* ========================================================================
   MENERAPKAN KE DOM
   ======================================================================== */
const CSS_VARS = {
  '--compreng-bg': 'bg',
  '--compreng-surface': 'surface',
  '--compreng-surface-soft': 'surfaceSoft',
  '--compreng-border': 'border',
  '--compreng-text': 'text',
  '--compreng-text-secondary': 'muted',
  '--compreng-text-muted': 'muted',
  '--compreng-accent': 'accent',
  '--compreng-accent-hover': 'accentHover',
  '--compreng-accent-text': 'accentText',
  '--compreng-nav-bg': 'navBg',
  '--compreng-nav-text': 'navText',
  '--compreng-nav-text-muted': 'navMuted',
  '--compreng-nav-accent': 'navAccent',
  '--compreng-nav-border': 'navBorder',
  '--compreng-footer-bg': 'footerBg',
  '--compreng-footer-text': 'footerText',
  '--compreng-footer-muted': 'footerMuted',
  '--compreng-badge-bg': 'badgeBg',
  '--compreng-badge-text': 'badgeText',
  '--compreng-badge-border': 'badgeBorder',
  '--compreng-shadow': 'shadow',
};

export const applyThemeToDOM = (data = {}) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const mode = normalizeMode(data.theme_mode);

  // PENTING: data-theme HANYA di <html>. Sebelumnya juga dipasang di <body>, sehingga
  // blok [data-theme='custom'] di theme.css menimpa warna custom (variabel di body
  // mengalahkan variabel inline di html) -> warna custom tidak pernah berubah.
  root.setAttribute('data-theme', mode);
  document.body?.removeAttribute('data-theme');

  // ---- WARNA ----
  if (mode === 'custom') {
    const p = resolveCustom(data);
    Object.entries(CSS_VARS).forEach(([prop, token]) => root.style.setProperty(prop, p[token], 'important'));
    root.style.setProperty('color-scheme', isDarkColor(p.bg) ? 'dark' : 'light');
  } else {
    Object.keys(CSS_VARS).forEach((prop) => root.style.removeProperty(prop));
    root.style.removeProperty('color-scheme');
  }

  // ---- FONT ----
  const font = normalizeFont(data.font_family);
  root.style.setProperty('--theme-font', getFontStack(font));
  document.body?.style.removeProperty('font-family');
  if (font === 'default') {
    root.removeAttribute('data-font'); // biarkan font bawaan tiap halaman
  } else {
    ensureFont(font);
    root.setAttribute('data-font', 'custom'); // dipaksa lewat appearance.css
  }
};

/* ========================================================================
   CACHE (mencegah "kedip" tema lama saat halaman baru dibuka)
   ======================================================================== */
const CACHE_KEY = 'compreng_theme_cache';

export const readThemeCache = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
  } catch {
    return {};
  }
};
export const writeThemeCache = (settings = {}) => {
  try {
    const out = {};
    THEME_KEYS.forEach((k) => { if (settings[k] !== undefined) out[k] = settings[k]; });
    localStorage.setItem(CACHE_KEY, JSON.stringify(out));
  } catch { /* abaikan */ }
};