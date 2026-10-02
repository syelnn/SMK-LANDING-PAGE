// src/pages/ManageSettings.jsx
import React, { useState, useContext, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { getImageUrl } from '../utils/media';
import axios from 'axios';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import {
  Check, Loader2, CheckCircle, XCircle, RotateCcw, Undo2,
  School, Award, ImageIcon, Sparkles, Palette, SlidersHorizontal, Target, Monitor,
  Sun, Moon, Pipette, Eye, Type, ChevronDown, MapPin, Phone, Mail, Share2, Database,
} from 'lucide-react';
import { FaFacebookF, FaInstagram, FaTiktok, FaXTwitter, FaYoutube } from 'react-icons/fa6';
import { SettingsContext } from '../context/SettingsContext';
import ThemePreview from '../components/ThemePreview';
import DatabaseBackupPanel from '../components/DatabaseBackupPanel';
import ImageUploader from '../components/ImageUploader';
import bgSekolah from '../assets/latar.webp';
import {
  HERO_DEFAULTS, HERO_OVERLAY_STYLES, HERO_OVERLAY_SWATCHES, buildHeroOverlay, normalizeHex,
} from '../utils/heroOverlay';
import {
  API_URL, FONT_OPTIONS, ensureFont, normalizeFont, normalizeMode,
  PRESETS, DEFAULT_CUSTOM, CUSTOM_FIELD_MAP, THEME_KEYS, resolveCustom, presetToCustom,
} from '../theme/themeEngine';
import { CONTACT_KEYS, contactFromFooter, normalizeUrl, toMapEmbedSrc } from '../utils/contact';
import '../css/managesetting.css';
import '../css/appearance.css';

/* ---------------------------------------------------------------------- */
/* DATA AWAL                                                              */
/* ---------------------------------------------------------------------- */
const DEFAULT_FORM = {
  school_name: 'SMKN Compreng',
  site_tagline: 'The School of SESCO Model',
  school_accreditation: 'Terakreditasi A',
  school_logo: '/src/assets/logo1.png',
  school_profile_image: '/src/assets/visi.jpg',
  hero_description: 'Membangun Generasi Cerdas, Berkarakter, dan Berprestasi.',
  school_history: 'Sekolah ini berdedikasi mencetak lulusan siap kerja.',
  school_vision: 'Mewujudkan peserta didik yang berkarakter...',
  school_mission: '1. Meningkatkan kualitas pendidikan\n2. Menyiapkan lulusan siap kerja',
  ...HERO_DEFAULTS, // foto hero + warna transparan
  theme_mode: 'system',
  font_family: 'default',
  ...DEFAULT_CUSTOM,
  ...Object.fromEntries(CONTACT_KEYS.map((k) => [k, ''])),
};

// Gabungkan: default < data server. Data kontak: dari settings (jika sudah pernah disimpan
// lewat halaman ini) atau dari data footer lama (supaya tidak menimpa data asli dengan placeholder).
const buildForm = (settings = {}, footer = {}) => {
  const clean = Object.fromEntries(Object.entries(settings).map(([k, v]) => [k, v ?? '']));
  const contact = clean.contact_configured === '1'
    ? Object.fromEntries(CONTACT_KEYS.map((k) => [k, clean[k] ?? '']))
    : contactFromFooter(footer);
  return {
    ...DEFAULT_FORM,
    ...clean,
    ...contact,
    theme_mode: normalizeMode(clean.theme_mode),
    font_family: normalizeFont(clean.font_family),
  };
};

const THEME_CARDS = [
  { value: 'system', label: 'System', note: 'Warna hijau-kuning sekolah', icon: Monitor },
  { value: 'light', label: 'Light', note: 'Terang dan bersih', icon: Sun },
  { value: 'dark', label: 'Dark', note: 'Gelap, nyaman di mata', icon: Moon },
  { value: 'custom', label: 'Custom', note: 'Atur warna sendiri', icon: Pipette },
];

const NAV_ITEMS = [
  { key: 'profile', to: '/admin/settings/profile', label: 'Profile', note: 'Identitas, logo, dan hero', icon: School },
  { key: 'appearance', to: '/admin/settings/appearance', label: 'Appearance', note: 'Tema, font, dan warna', icon: Palette },
  { key: 'contact', to: '/admin/settings/contact', label: 'Contact & Maps', note: 'Kontak, peta, dan sosial', icon: MapPin },
  { key: 'database', to: '/admin/settings/database', label: 'Database', note: 'Backup data website', icon: Database },
];

const SOCIAL_FIELDS = [
  ['social_facebook', 'Facebook', FaFacebookF, 'https://facebook.com/...'],
  ['social_instagram', 'Instagram', FaInstagram, 'https://instagram.com/...'],
  ['social_youtube', 'YouTube', FaYoutube, 'https://youtube.com/@...'],
  ['social_tiktok', 'TikTok', FaTiktok, 'https://tiktok.com/@...'],
  ['social_twitter', 'X (Twitter)', FaXTwitter, 'https://x.com/...'],
];

// true kalau ada nilai yang berbeda antara form sekarang dan data tersimpan
const hasChanges = (a, b) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) if (String(a[k] ?? '') !== String(b[k] ?? '')) return true;
  return false;
};

const CUSTOM_GROUPS = [
  { title: 'Halaman & Kartu', fields: [
    ['custom_bg', 'Latar halaman'], ['custom_card', 'Latar kartu'],
    ['custom_card_soft', 'Latar lembut (hover, tabel)', true], ['custom_border', 'Garis / border'],
  ] },
  { title: 'Teks', fields: [['custom_text_main', 'Teks judul'], ['custom_text_muted', 'Teks deskripsi']] },
  { title: 'Aksen (tombol & link)', fields: [
    ['custom_accent', 'Warna aksen'], ['custom_accent_hover', 'Aksen saat hover', true], ['custom_accent_text', 'Teks di atas aksen', true],
  ] },
  { title: 'Navbar & Sidebar Admin', fields: [
    ['custom_nav_bg', 'Latar'], ['custom_nav_text', 'Teks'],
    ['custom_nav_muted', 'Teks redup (menu)', true], ['custom_nav_accent', 'Highlight (titik aktif)', true],
  ] },
  { title: 'Footer', fields: [['custom_footer_bg', 'Latar footer', true], ['custom_footer_text', 'Teks footer', true]] },
  { title: 'Badge / Label', fields: [['custom_badge_bg', 'Latar badge', true], ['custom_badge_text', 'Teks badge', true]] },
];

/* ---------------------------------------------------------------------- */
/* KOMPONEN KECIL                                                         */
/* ---------------------------------------------------------------------- */
const ThemeMock = ({ p }) => (
  <div className="mock-ui" style={{ backgroundColor: p.bg }}>
    <div className="mock-sidebar" style={{ backgroundColor: p.navBg }}>
      <div className="mock-bar" style={{ backgroundColor: p.navText }} />
      <div className="mock-bar short" style={{ backgroundColor: p.navText }} />
    </div>
    <div className="mock-content">
      <div className="mock-header" style={{ backgroundColor: p.surface, border: `1px solid ${p.border}` }}>
        <div className="mock-bar dot" style={{ backgroundColor: p.accent }} />
      </div>
      <div className="mock-tiles">
        <div className="mock-tile" style={{ backgroundColor: p.surface, border: `1px solid ${p.border}` }} />
        <div className="mock-tile" style={{ backgroundColor: p.accent }} />
      </div>
    </div>
  </div>
);

const ColorField = ({ name, label, value, resolved, auto, onChange }) => {
  const isAuto = auto && !String(value || '').trim();
  return (
    <div className="ms-color-cell">
      <label className="ms-label">
        {label}
        {auto && <em className={`ms-auto-chip ${isAuto ? 'on' : ''}`}>{isAuto ? 'otomatis' : 'manual'}</em>}
      </label>
      <div className="ms-color-field">
        <input type="color" className="ms-color-picker" value={resolved} aria-label={label} onChange={(e) => onChange(name, e.target.value)} />
        <input
          type="text" className="ms-color-input" value={value || ''} spellCheck={false}
          placeholder={auto ? resolved : '#000000'} onChange={(e) => onChange(name, e.target.value)}
        />
        {auto && !isAuto && (
          <button type="button" className="ms-reset-btn" title="Kembalikan ke otomatis" onClick={() => onChange(name, '')}>
            <RotateCcw size={13} />
          </button>
        )}
      </div>
    </div>
  );
};

/* ---- Komponen kecil untuk tab Profile ---- */
const CardHead = ({ icon: Icon, title, desc, aside }) => (
  <div className="pf-bhead">
    <span className="pf-bicon"><Icon size={18} /></span>
    <div className="pf-btitles">
      <h4>{title}</h4>
      {desc && <p>{desc}</p>}
    </div>
    {aside}
  </div>
);

const Field = ({ label, hint, children }) => (
  <div className="pf-field">
    <label className="pf-label">{label}</label>
    {children}
    {hint && <p className="pf-hint">{hint}</p>}
  </div>
);

/* ---- Intro judul tiap tab ---- */
const TabIntro = ({ icon: Icon, pill, title, desc }) => (
  <div className="pf-intro">
    <span className="pf-pill"><Icon size={13} /> {pill}</span>
    <h3>{title}</h3>
    <p>{desc}</p>
  </div>
);

/* ---- Navigasi tab: segmented control (HP) / rail vertikal (lebar), indikator meluncur ---- */
const SettingsNav = ({ pathname }) => {
  const navRef = useRef(null);
  const firstMeasure = useRef(true);
  const [ind, setInd] = useState(null);
  const activeKey = (NAV_ITEMS.find((i) => pathname.endsWith(`/${i.key}`)) || NAV_ITEMS[0]).key;

  const measure = useCallback(() => {
    const el = navRef.current?.querySelector('[data-active="true"]');
    if (!el) return;
    setInd({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight, anim: !firstMeasure.current });
    firstMeasure.current = false;
  }, []);

  useLayoutEffect(() => { measure(); }, [activeKey, measure]);

  // Tab aktif selalu terlihat di tengah saat daftar tab bisa digeser (HP)
  useEffect(() => {
    const nav = navRef.current;
    const el = nav?.querySelector('[data-active="true"]');
    if (!nav || !el || nav.scrollWidth <= nav.clientWidth + 1) return;
    nav.scrollTo({ left: el.offsetLeft - (nav.clientWidth - el.offsetWidth) / 2, behavior: 'smooth' });
  }, [activeKey]);

  // Ukur ulang saat lebar berubah, font selesai dimuat, atau ukuran font HP diubah
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return undefined;
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ro) { ro.observe(nav); nav.querySelectorAll('.st-tab').forEach((t) => ro.observe(t)); }
    window.addEventListener('resize', measure);
    document.fonts?.ready?.then(measure);
    return () => { ro?.disconnect(); window.removeEventListener('resize', measure); };
  }, [measure]);

  return (
    <div className="st-rail">
      <nav className="st-nav" ref={navRef} aria-label="Menu pengaturan website">
        {ind && (
          <i
            className={`st-tab-ind ${ind.anim ? 'is-anim' : ''}`} aria-hidden="true"
            style={{ '--ix': `${ind.x}px`, '--iy': `${ind.y}px`, '--iw': `${ind.w}px`, '--ih': `${ind.h}px` }}
          />
        )}
        {NAV_ITEMS.map(({ key, to, label, note, icon: Icon }) => (
          <NavLink key={key} to={to} data-active={key === activeKey} className={`st-tab ${key === activeKey ? 'is-on' : ''}`}>
            <Icon size={16} className="st-tab-ico" aria-hidden="true" />
            <b className="st-tab-label">{label}</b>
            <em className="st-tab-note">{note}</em>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

/* ---------- Live preview: tampilan mini hero beranda ---------- */
const HeroLivePreview = ({ data }) => {
  const bg = getImageUrl(data.hero_bg_image, bgSekolah);
  const name = (data.school_name || 'SMK Negeri Compreng').toUpperCase();
  return (
    <div className="pf-live">
      <div className="pf-live-bar">
        <span className="pf-dots"><i /><i /><i /></span>
        <span className="pf-live-url"><Monitor size={11} /> Preview beranda · langsung berubah saat diedit</span>
      </div>
      <div className="pf-live-screen" style={{ backgroundImage: `url(${bg})` }}>
        <div className="pf-live-overlay" style={{ background: buildHeroOverlay(data) }} />
        <div className="pf-live-nav">
          {data.school_logo ? <img src={getImageUrl(data.school_logo)} alt="" /> : <span className="pf-live-logo-ph" />}
          <b>{data.school_name || 'SMKN Compreng'}</b>
          <span className="pf-live-links"><i /><i /><i /></span>
        </div>
        <div className="pf-live-body">
          <span className="pf-live-badge"><em />{data.school_accreditation || 'Terakreditasi A'}</span>
          <div className="pf-live-title">Selamat Datang di<strong>{name}</strong></div>
          <p className="pf-live-copy">{data.hero_description || 'Deskripsi singkat sekolah tampil di sini.'}</p>
          <div className="pf-live-btns"><span className="p1">Jelajahi Sekolah ➔</span><span className="p2">Hubungi Kami</span></div>
        </div>
      </div>
    </div>
  );
};

const useDebounced = (value, ms = 600) => {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
};

/* ---------------------------------------------------------------------- */
/* HALAMAN                                                                */
/* ---------------------------------------------------------------------- */
export default function ManageSettings() {
  const { settings, saveSettings, applyPreview, clearPreview } = useContext(SettingsContext);
  const location = useLocation();

  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [pendingImageFiles, setPendingImageFiles] = useState({}); // { school_logo: File, school_profile_image: File }
  const [footerSeed, setFooterSeed] = useState(null); // data footer lama (null = belum dimuat)
  const [formData, setFormData] = useState(() => buildForm(settings, {}));
  const [baseline, setBaseline] = useState(() => buildForm(settings, {})); // data tersimpan, pembanding "belum disimpan"
  const touchedTheme = useRef(false); // true = admin sedang mengubah tema (belum disimpan)

  // Ambil data footer lama sekali (nilai awal kontak)
  useEffect(() => {
    let alive = true;
    axios.get(`${API_URL}/api/footer`)
      .then((r) => alive && setFooterSeed(r.data?.data || {}))
      .catch(() => alive && setFooterSeed({}));
    return () => { alive = false; };
  }, []);

  // Isi form dari data tersimpan
  useEffect(() => {
    if (footerSeed === null) return;
    const next = buildForm(settings, footerSeed);
    setFormData(next);
    setBaseline(next);
  }, [settings, footerSeed]);

  // Muat semua font sekali supaya kotak pilihan font tampil benar
  useEffect(() => { FONT_OPTIONS.forEach((f) => ensureFont(f.value)); }, []);

  // Setiap tema/font/warna berubah -> tampilkan langsung ke SELURUH website (preview, belum disimpan)
  const themeSig = THEME_KEYS.map((k) => formData[k] ?? '').join('|');
  useEffect(() => {
    if (touchedTheme.current) applyPreview(formData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeSig]);

  // Keluar dari halaman tanpa menyimpan -> preview dibatalkan
  useEffect(() => () => clearPreview(), [clearPreview]);

  const showToast = (message, type) => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const setField = (name, value) => {
    if (name === 'theme_mode' || name === 'font_family' || name.startsWith('custom_')) touchedTheme.current = true;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleChange = (e) => setField(e.target.name, e.target.value);

  // Callback dari <ImageUploader>: file asli/hasil edit disimpan di pendingImageFiles
  // (dikirim ke backend saat submit), URL-nya dipakai untuk pratinjau.
  const handleImageChange = (fieldName, { file, url }) => {
    setPendingImageFiles((prev) => {
      const next = { ...prev };
      if (file) next[fieldName] = file;
      else delete next[fieldName];
      return next;
    });
    setField(fieldName, url);
  };

  const copyPreset = (key) => {
    touchedTheme.current = true;
    setFormData((prev) => ({ ...prev, ...presetToCustom(PRESETS[key]) }));
  };
  const resetCustom = () => {
    touchedTheme.current = true;
    setFormData((prev) => ({ ...prev, ...DEFAULT_CUSTOM }));
  };
  // Batalkan SEMUA perubahan yang belum disimpan (teks, gambar, tema)
  const discardChanges = () => {
    touchedTheme.current = false;
    clearPreview();
    setPendingImageFiles({});
    setFormData(baseline);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const f = { ...formData };

      // Upload gambar (logo/hero) yang dipilih ke Cloudinary dulu lewat endpoint khusus
      // -> yang tersimpan di tabel settings cuma URL hasilnya (bukan base64).
      for (const [key, file] of Object.entries(pendingImageFiles)) {
        const imgFd = new FormData();
        imgFd.append('image', file);
        const res = await axios.post(`${API_URL}/api/settings/upload-image/${key}`, imgFd);
        f[key] = res.data?.data?.value || f[key];
      }

      // Opsi "Link URL" diperlakukan sama seperti upload file: backend mengunduh gambarnya, mengunggahnya
      // ke Cloudinary, lalu hanya path relatifnya yang disimpan (link Cloudinary milik sendiri cukup dikonversi).
      for (const key of ['school_logo', 'school_profile_image', 'hero_bg_image']) {
        if (pendingImageFiles[key]) continue;
        const v = String(f[key] || '');
        if (!/^https?:\/\//i.test(v)) continue;
        const linkFd = new FormData();
        linkFd.append('image', v);
        const res = await axios.post(`${API_URL}/api/settings/upload-image/${key}`, linkFd);
        f[key] = res.data?.data?.value || f[key];
      }

      const payload = {
        ...f,
        contact_phone: f.contact_phone.trim(),
        contact_email: f.contact_email.trim(),
        contact_address: f.contact_address.trim(),
        contact_map_embed_url: f.contact_map_embed_url.trim() ? toMapEmbedSrc(f.contact_map_embed_url, f.contact_address) : '',
        social_facebook: normalizeUrl(f.social_facebook),
        social_instagram: normalizeUrl(f.social_instagram),
        social_youtube: normalizeUrl(f.social_youtube),
        social_tiktok: normalizeUrl(f.social_tiktok),
        social_twitter: normalizeUrl(f.social_twitter),
        contact_configured: '1',
      };
      await saveSettings(payload); // langsung berlaku di seluruh website
      setFormData(payload);
      setBaseline(payload);
      setPendingImageFiles({});
      touchedTheme.current = false;
      showToast('Pengaturan tersimpan dan langsung tampil di website.', 'success');
    } catch (error) {
      // Preview tetap tampil supaya admin bisa memperbaiki & mencoba lagi
      showToast(`Gagal menyimpan: ${error.response?.data?.message || error.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const isDatabase = location.pathname.endsWith('/database');
  const isDirty = useMemo(
    () => Object.keys(pendingImageFiles).length > 0 || hasChanges(formData, baseline),
    [formData, baseline, pendingImageFiles],
  );
  const resolved = resolveCustom(formData);
  const mapSrc = useDebounced(toMapEmbedSrc(formData.contact_map_embed_url, formData.contact_address));

  // ---- Hero beranda: nilai turunan untuk kontrol warna transparan ----
  const heroOpacity = formData.hero_overlay_opacity === '' || formData.hero_overlay_opacity == null
    ? Number(HERO_DEFAULTS.hero_overlay_opacity)
    : Number(formData.hero_overlay_opacity);
  const heroColor = normalizeHex(formData.hero_overlay_color);
  const overlayChanged =
    heroColor !== HERO_DEFAULTS.hero_overlay_color ||
    String(heroOpacity) !== HERO_DEFAULTS.hero_overlay_opacity ||
    (formData.hero_overlay_style || 'left') !== HERO_DEFAULTS.hero_overlay_style;

  const resetHeroOverlay = () => {
    setField('hero_overlay_color', HERO_DEFAULTS.hero_overlay_color);
    setField('hero_overlay_opacity', HERO_DEFAULTS.hero_overlay_opacity);
    setField('hero_overlay_style', HERO_DEFAULTS.hero_overlay_style);
  };

  return (
    <div className="st-root">
      <header className="st-head">
        <h2 className="st-title">Settings</h2>
        <p className="st-sub">Manage your school identity, appearance, and contact preferences.</p>
      </header>

      <div className="st-frame">
        <div className="st-layout">
          <SettingsNav pathname={location.pathname} />

          <div className="st-main">
            <form onSubmit={handleSubmit} noValidate>
              <div className="st-pane" key={location.pathname}>
                <Routes>
                  <Route path="/" element={<Navigate to="profile" replace />} />

                  {/* ============ TAB 1: IDENTITAS + HERO ============ */}
                  <Route path="profile" element={
                    <div className="pf">
                      <TabIntro
                        icon={Sparkles} pill="Identitas & Tampilan" title="Profile Sekolah"
                        desc="Atur bagaimana sekolah tampil di website — dari nama, logo, sampai foto sampul beranda."
                      />

                      {/* ============ IDENTITAS ============ */}
                      <section className="pf-block">
                        <CardHead icon={School} title="Identitas Sekolah" desc="Nama resmi, tagline navbar/sidebar, dan badge akreditasi hero — masing-masing terpisah supaya tidak tertukar." />
                        <div className="pf-grid">
                          <Field label="Nama Sekolah" hint="Muncul di navbar, sidebar admin, footer, dan judul hero.">
                            <input type="text" name="school_name" value={formData.school_name} onChange={handleChange} className="pf-input" />
                          </Field>
                          <Field label="Tagline Navbar & Sidebar" hint="Teks kecil di bawah nama sekolah pada navbar (website) dan sidebar (dashboard admin).">
                            <div className="pf-input-icon">
                              <Monitor size={15} />
                              <input type="text" name="site_tagline" value={formData.site_tagline} onChange={handleChange} className="pf-input" />
                            </div>
                          </Field>
                          <Field label="Badge Akreditasi (Hero)" hint="Hanya tampil sebagai badge kecil di atas judul hero beranda, tidak memengaruhi navbar/sidebar.">
                            <div className="pf-input-icon">
                              <Award size={15} />
                              <input type="text" name="school_accreditation" value={formData.school_accreditation} onChange={handleChange} className="pf-input" />
                            </div>
                          </Field>
                        </div>
                      </section>

                      {/* ============ LOGO & FOTO UTAMA ============ */}
                      <section className="pf-block">
                        <CardHead icon={ImageIcon} title="Logo & Foto Profil" desc="Logo dipakai di navbar. Foto utama dipakai di bagian Profil Sekolah." />
                        <div className="pf-grid">
                          <Field label="Logo Sekolah (Icon)">
                            <ImageUploader
                              value={formData.school_logo}
                              onChange={(r) => handleImageChange('school_logo', r)}
                              aspect={1}
                              maxSizeMB={2}
                              previewLabel="Logo"
                              urlPlaceholder="/src/assets/logo1.png atau https://..."
                              editorTitle="Edit Logo Sekolah"
                              previewMaxWidth={220}
                            />
                          </Field>
                          <Field label="Foto Utama / Profil">
                            <ImageUploader
                              value={formData.school_profile_image}
                              onChange={(r) => handleImageChange('school_profile_image', r)}
                              aspect={4 / 3}
                              maxSizeMB={2}
                              previewLabel="Foto profil"
                              urlPlaceholder="/src/assets/visi.jpg atau https://..."
                              editorTitle="Edit Foto Utama / Profil"
                              previewMaxWidth={320}
                            />
                          </Field>
                        </div>
                      </section>

                      {/* ============ HERO BERANDA ============ */}
                      <section className="pf-block pf-block-cover">
                        <CardHead
                          icon={Sparkles}
                          title="Hero Beranda"
                          desc="Ganti foto latar hero dan atur warna transparan di atasnya. Lihat hasilnya langsung di preview."
                          aside={<span className="pf-live-chip"><i /> Live</span>}
                        />

                        <HeroLivePreview data={formData} />

                        <div className="pf-media-grid">
                          {/* --- Foto latar (CRUD) --- */}
                          <div className="pf-well">
                            <div className="pf-well-title"><ImageIcon size={15} /> Foto Latar Hero</div>
                            <ImageUploader
                              value={formData.hero_bg_image}
                              onChange={(r) => handleImageChange('hero_bg_image', r)}
                              aspect={16 / 9}
                              aspectOptions={['free', '16:9', '4:3', 'full']}
                              maxSizeMB={3}
                              outputMaxWidth={1920}
                              fit="cover"
                              previewLabel="Foto hero"
                              previewMaxWidth={420}
                              urlPlaceholder="https://... (kosong = foto bawaan)"
                              editorTitle="Edit Foto Latar Hero"
                              uploadText="Pilih atau tarik foto hero ke sini"
                            />
                            {!formData.hero_bg_image && (
                              <p className="pf-hint">Belum ada foto khusus — beranda memakai foto bawaan sekolah. Disarankan foto landscape minimal 1600px.</p>
                            )}
                          </div>

                          {/* --- Warna transparan (overlay) --- */}
                          <div className="pf-well">
                            <div className="pf-well-title">
                              <Palette size={15} /> Warna Transparan
                              {overlayChanged && (
                                <button type="button" className="pf-reset" onClick={resetHeroOverlay}><RotateCcw size={12} /> Reset</button>
                              )}
                            </div>

                            <div className="pf-sub">Warna</div>
                            <div className="pf-swatches">
                              {HERO_OVERLAY_SWATCHES.map((s) => (
                                <button
                                  key={s.color} type="button" title={s.label} aria-label={s.label}
                                  className={`pf-swatch ${heroColor === s.color ? 'on' : ''}`}
                                  style={{ background: s.color }}
                                  onClick={() => setField('hero_overlay_color', s.color)}
                                />
                              ))}
                              <label className="pf-swatch pf-swatch-custom" title="Warna sendiri">
                                <input type="color" value={heroColor} onChange={(e) => setField('hero_overlay_color', e.target.value)} />
                              </label>
                            </div>
                            <input
                              type="text" className="pf-input pf-mono" value={formData.hero_overlay_color || ''} spellCheck={false}
                              placeholder="#0f172a" maxLength={7}
                              onChange={(e) => setField('hero_overlay_color', e.target.value)}
                              onBlur={(e) => setField('hero_overlay_color', normalizeHex(e.target.value))}
                            />

                            <div className="pf-sub pf-sub-row">
                              <span><SlidersHorizontal size={13} /> Kekuatan warna</span>
                              <b>{heroOpacity}%</b>
                            </div>
                            <input
                              type="range" min="0" max="100" step="1" value={heroOpacity} className="pf-range"
                              style={{ '--pf-fill': `${heroOpacity}%` }}
                              onChange={(e) => setField('hero_overlay_opacity', e.target.value)}
                              aria-label="Kekuatan warna transparan"
                            />
                            <div className="pf-range-legend"><span>Foto jelas</span><span>Foto gelap</span></div>

                            <div className="pf-sub">Arah gradasi</div>
                            <div className="pf-seg" role="radiogroup">
                              {HERO_OVERLAY_STYLES.map((o) => (
                                <button
                                  key={o.value} type="button" role="radio" aria-checked={(formData.hero_overlay_style || 'left') === o.value}
                                  className={(formData.hero_overlay_style || 'left') === o.value ? 'on' : ''}
                                  onClick={() => setField('hero_overlay_style', o.value)}
                                >{o.label}</button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <Field label="Deskripsi Singkat (Hero)" hint="Kalimat di bawah judul beranda.">
                          <textarea name="hero_description" value={formData.hero_description} onChange={handleChange} className="pf-input pf-textarea" rows={3} />
                        </Field>
                      </section>

                      {/* ============ VISI MISI ============ */}
                      <section className="pf-block">
                        <CardHead icon={Target} title="Visi & Misi" desc="Arah dan tujuan sekolah." />
                        <div className="pf-grid">
                          <Field label="Visi">
                            <textarea name="school_vision" value={formData.school_vision} onChange={handleChange} className="pf-input pf-textarea tall" rows={5} />
                          </Field>
                          <Field label="Misi (gunakan titik koma ; atau baris baru)">
                            <textarea name="school_mission" value={formData.school_mission} onChange={handleChange} className="pf-input pf-textarea tall" rows={5} />
                          </Field>
                        </div>
                      </section>
                    </div>
                  } />

                  {/* ============ TAB 2: TEMA & TAMPILAN ============ */}
                  <Route path="appearance" element={
                    <div className="pf">
                      <TabIntro
                        icon={Palette} pill="Tema & Font" title="Appearance"
                        desc="Perubahan langsung terlihat di seluruh website. Klik “Simpan Pengaturan” agar permanen."
                      />

                      {/* --- PILIH TEMA --- */}
                      <section className="pf-block">
                        <CardHead icon={Palette} title="Tema" desc="Pilih tema untuk dashboard dan website publik." />
                        <div className="st-themes" role="radiogroup" aria-label="Pilih tema">
                          {THEME_CARDS.map(({ value, label, note, icon: Icon }) => {
                            const on = formData.theme_mode === value;
                            const pal = value === 'custom' ? resolveCustom(formData) : PRESETS[value];
                            return (
                              <button
                                key={value} type="button" role="radio" aria-checked={on}
                                className={`st-theme ${on ? 'is-on' : ''}`}
                                onClick={() => setField('theme_mode', value)}
                              >
                                <span className="st-theme-frame">
                                  <ThemeMock p={pal} />
                                  {on && <i className="st-tick"><Check size={12} strokeWidth={3} /></i>}
                                </span>
                                <span className="st-theme-meta"><Icon size={14} /><b>{label}</b></span>
                                <em className="st-theme-note">{note}</em>
                              </button>
                            );
                          })}
                        </div>
                      </section>

                      {/* --- PREVIEW LANGSUNG --- */}
                      <section className="pf-block">
                        <CardHead
                          icon={Eye} title="Preview Langsung" desc="Pratinjau memakai pilihan tema, font, dan warna di sini."
                          aside={<span className="pf-live-chip"><i /> Live</span>}
                        />
                        <ThemePreview data={formData} />
                      </section>

                      {/* --- FONT (4 pilihan) --- */}
                      <section className="pf-block">
                        <CardHead icon={Type} title="Tipografi" desc="Font untuk dashboard dan website publik." />
                        <div className="st-fonts" role="radiogroup" aria-label="Pilih font">
                          {FONT_OPTIONS.map((f) => {
                            const on = formData.font_family === f.value;
                            return (
                              <button
                                key={f.value} type="button" role="radio" aria-checked={on}
                                className={`st-font ${on ? 'is-on' : ''}`}
                                onClick={() => setField('font_family', f.value)}
                              >
                                <b className="st-font-aa" data-own-font style={{ fontFamily: f.stack }}>Aa</b>
                                <b className="st-font-name" data-own-font style={{ fontFamily: f.stack }}>{f.label}</b>
                                <em className="st-font-hint">{f.hint}</em>
                              </button>
                            );
                          })}
                        </div>
                      </section>

                      {/* --- EDITOR WARNA CUSTOM --- */}
                      {formData.theme_mode === 'custom' && (
                        <section className="pf-block">
                          <CardHead
                            icon={Pipette} title="Kustomisasi Warna"
                            desc="Berlaku untuk dashboard admin dan halaman publik. Kolom “otomatis” dihitung dari warna dasar — isi hanya jika ingin mengatur sendiri."
                            aside={<button type="button" className="ms-mini-btn" onClick={resetCustom}><RotateCcw size={12} /> Reset</button>}
                          />
                          <div className="ms-preset-row">
                            <span className="pf-hint">Mulai dari:</span>
                            <button type="button" className="ms-mini-btn" onClick={() => copyPreset('light')}>Light</button>
                            <button type="button" className="ms-mini-btn" onClick={() => copyPreset('dark')}>Dark</button>
                            <button type="button" className="ms-mini-btn" onClick={() => copyPreset('system')}>System</button>
                          </div>
                          <div className="st-folds">
                            {CUSTOM_GROUPS.map((g, i) => (
                              <details className="st-fold" key={g.title} open={i === 0}>
                                <summary><b>{g.title}</b><ChevronDown size={16} /></summary>
                                <div className="ms-color-group">
                                  {g.fields.map(([name, label, auto]) => (
                                    <ColorField
                                      key={name} name={name} label={label} auto={!!auto}
                                      value={formData[name]} resolved={resolved[CUSTOM_FIELD_MAP[name]]} onChange={setField}
                                    />
                                  ))}
                                </div>
                              </details>
                            ))}
                          </div>
                        </section>
                      )}
                    </div>
                  } />

                  {/* ============ TAB 3: KONTAK & MAPS ============ */}
                  <Route path="contact" element={
                    <div className="pf">
                      <TabIntro
                        icon={MapPin} pill="Kontak & Lokasi" title="Contact & Maps"
                        desc="Perbarui kontak dan lokasi sekolah. Setelah disimpan, footer website langsung berubah."
                      />

                      <section className="pf-block">
                        <CardHead icon={Phone} title="Kontak Sekolah" desc="Telepon, email, dan alamat yang tampil di footer." />
                        <div className="pf-grid">
                          <Field label="Telepon">
                            <div className="pf-input-icon">
                              <Phone size={15} />
                              <input type="text" inputMode="tel" name="contact_phone" value={formData.contact_phone} onChange={handleChange} className="pf-input" placeholder="0260 7547733" />
                            </div>
                          </Field>
                          <Field label="Email">
                            <div className="pf-input-icon">
                              <Mail size={15} />
                              <input type="text" inputMode="email" name="contact_email" value={formData.contact_email} onChange={handleChange} className="pf-input" placeholder="info@smkncompreng.sch.id" />
                            </div>
                          </Field>
                        </div>
                        <Field label="Alamat" hint="Tampil di footer dan menjadi tautan ke Google Maps.">
                          <textarea name="contact_address" value={formData.contact_address} onChange={handleChange} className="pf-input pf-textarea" rows={3} placeholder="Jl. Compreng, Kec. Compreng, Kabupaten Subang, Jawa Barat 41258" />
                        </Field>
                      </section>

                      <section className="pf-block">
                        <CardHead icon={MapPin} title="Peta Lokasi" desc="Peta Google Maps yang tampil di footer." />
                        <Field
                          label="Kode embed / link Google Maps"
                          hint="Google Maps → Bagikan → Sematkan peta → salin HTML <iframe> lalu tempel di sini. Jika dikosongkan, peta dibuat otomatis dari alamat."
                        >
                          <input
                            type="text" name="contact_map_embed_url" value={formData.contact_map_embed_url} onChange={handleChange}
                            className="pf-input" placeholder="Tempel kode embed / link Google Maps (boleh kosong)"
                          />
                        </Field>
                        {mapSrc ? (
                          <div className="ms-map-frame">
                            <iframe title="Preview peta" src={mapSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                          </div>
                        ) : (
                          <p className="pf-hint">Isi alamat atau link peta untuk melihat preview.</p>
                        )}
                      </section>

                      <section className="pf-block">
                        <CardHead icon={Share2} title="Media Sosial" desc="Kosongkan kolom untuk menyembunyikan ikon sosial media tersebut di footer." />
                        <div className="pf-grid">
                          {SOCIAL_FIELDS.map(([name, label, Icon, placeholder]) => (
                            <Field key={name} label={label}>
                              <div className="pf-input-icon">
                                <Icon size={15} />
                                <input type="url" name={name} value={formData[name]} onChange={handleChange} className="pf-input" placeholder={placeholder} />
                              </div>
                            </Field>
                          ))}
                        </div>
                      </section>
                    </div>
                  } />
                  <Route path="database" element={<DatabaseBackupPanel />} />
                </Routes>
              </div>

              {!isDatabase && (
                <div className={`st-bar ${isDirty ? 'is-dirty' : ''}`} role="region" aria-label="Simpan pengaturan">
                  <div className="st-bar-info" aria-live="polite">
                    <i className="st-dot" aria-hidden="true" />
                    <b>{isDirty ? 'Belum disimpan' : 'Tersimpan'}</b>
                    <em className="st-msg">{isDirty ? 'Ada perubahan yang belum disimpan.' : 'Semua perubahan sudah tersimpan.'}</em>
                  </div>
                  <div className="st-bar-actions">
                    {isDirty && (
                      <button type="button" className="st-ghost" onClick={discardChanges} disabled={isSaving} aria-label="Batalkan perubahan">
                        <Undo2 size={15} /><em className="st-ghost-label">Batalkan</em>
                      </button>
                    )}
                    <button type="submit" className="st-save" disabled={isSaving}>
                      {isSaving ? (
                        <><Loader2 className="animate-spin" size={16} /><b>Menyimpan...</b></>
                      ) : (
                        <><b className="st-long">Simpan Pengaturan</b><b className="st-short">Simpan</b></>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className={`modern-toast-card ${toastMessage.type}`}>
          {toastMessage.type === 'success' ? <CheckCircle size={22} color="#16a34a" /> : <XCircle size={22} color="#dc2626" />}
          <div className="modern-toast-content">
            <h4>{toastMessage.type === 'success' ? 'Berhasil!' : 'Gagal!'}</h4>
            <p>{toastMessage.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}