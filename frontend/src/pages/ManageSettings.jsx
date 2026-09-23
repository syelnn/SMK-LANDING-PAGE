// src/pages/ManageSettings.jsx
import React, { useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Check, Loader2, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { SettingsContext } from '../context/SettingsContext';
import ThemePreview from '../components/ThemePreview';
import DatabaseBackupPanel from '../components/DatabaseBackupPanel';
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
  school_accreditation: 'Terakreditasi A',
  school_logo: '/src/assets/logo1.png',
  school_profile_image: '/src/assets/visi.jpg',
  hero_description: 'Membangun Generasi Cerdas, Berkarakter, dan Berprestasi.',
  school_history: 'Sekolah ini berdedikasi mencetak lulusan siap kerja.',
  school_vision: 'Mewujudkan peserta didik yang berkarakter...',
  school_mission: '1. Meningkatkan kualitas pendidikan\n2. Menyiapkan lulusan siap kerja',
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
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'custom', label: 'Custom' },
];

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
  const [logoMode, setLogoMode] = useState('url');
  const [profileMode, setProfileMode] = useState('url');
  const [pendingImageFiles, setPendingImageFiles] = useState({}); // { school_logo: File, school_profile_image: File }
  const [footerSeed, setFooterSeed] = useState(null); // data footer lama (null = belum dimuat)
  const [formData, setFormData] = useState(() => buildForm(settings, {}));
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
    setFormData(buildForm(settings, footerSeed));
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

  // File asli disimpan di pendingImageFiles (dikirim ke backend saat submit),
  // base64 cuma dipakai untuk pratinjau di browser.
  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return showToast('Ukuran file terlalu besar! Maksimal 2MB.', 'error');
    setPendingImageFiles((prev) => ({ ...prev, [fieldName]: file }));
    const reader = new FileReader();
    reader.onloadend = () => setField(fieldName, reader.result);
    reader.readAsDataURL(file);
  };

  const copyPreset = (key) => {
    touchedTheme.current = true;
    setFormData((prev) => ({ ...prev, ...presetToCustom(PRESETS[key]) }));
  };
  const resetCustom = () => {
    touchedTheme.current = true;
    setFormData((prev) => ({ ...prev, ...DEFAULT_CUSTOM }));
  };
  const discardTheme = () => {
    touchedTheme.current = false;
    clearPreview();
    setFormData(buildForm(settings, footerSeed || {}));
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

  const isAppearance = location.pathname.endsWith('/appearance');
  const isDatabase = location.pathname.endsWith('/database');
  const resolved = resolveCustom(formData);
  const mapSrc = useDebounced(toMapEmbedSrc(formData.contact_map_embed_url, formData.contact_address));

  return (
    <div className="ms-wrapper">
      <div className="ms-page-header">
        <h2 className="ms-page-title">Settings</h2>
        <p className="ms-page-subtitle">Manage your school identity, appearance, and contact preferences.</p>
      </div>

      <div className="ms-layout-flex">
        {/* SIDEBAR NAV */}
        <div className="ms-sidebar">
          <NavLink to="/admin/settings/profile" className={({ isActive }) => `ms-nav-link ${isActive ? 'active' : ''}`}>Profile</NavLink>
          <NavLink to="/admin/settings/appearance" className={({ isActive }) => `ms-nav-link ${isActive ? 'active' : ''}`}>Appearance</NavLink>
          <NavLink to="/admin/settings/contact" className={({ isActive }) => `ms-nav-link ${isActive ? 'active' : ''}`}>Contact & Maps</NavLink>
          <NavLink to="/admin/settings/database" className={({ isActive }) => `ms-nav-link ${isActive ? 'active' : ''}`}>Database</NavLink>
        </div>

        {/* CONTENT AREA ROUTING */}
        <div className={`ms-content-area ${isAppearance ? 'wide' : ''}`}>
          <form onSubmit={handleSubmit} noValidate>
            <Routes>
              <Route path="/" element={<Navigate to="profile" replace />} />

              {/* ============ TAB 1: IDENTITAS ============ */}
              <Route path="profile" element={
                <div>
                  <div className="ms-section-header">
                    <h3 className="ms-section-title">Profile</h3>
                    <p className="ms-section-desc">This is how others will see the school on the site.</p>
                  </div>

                  <div className="ms-input-group">
                    <label className="ms-label">Nama Sekolah</label>
                    <input type="text" name="school_name" value={formData.school_name} onChange={handleChange} className="ms-input" />
                    <p className="ms-helper-text">Ini adalah nama resmi sekolah yang akan muncul di navbar dan footer.</p>
                  </div>

                  <div className="ms-input-group">
                    <label className="ms-label">Akreditasi / Tagline</label>
                    <input type="text" name="school_accreditation" value={formData.school_accreditation} onChange={handleChange} className="ms-input" />
                  </div>

                  <div className="ms-grid">
                    <div className="ms-input-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="ms-label">Logo Sekolah (Icon)</label>
                        <div className="ms-toggle-row">
                          <button type="button" onClick={() => setLogoMode('url')} className={`ms-toggle-btn ${logoMode === 'url' ? 'active' : ''}`}>URL</button>
                          <button type="button" onClick={() => setLogoMode('file')} className={`ms-toggle-btn ${logoMode === 'file' ? 'active' : ''}`}>Upload</button>
                        </div>
                      </div>
                      {logoMode === 'url' ? (
                        <input type="text" name="school_logo" value={formData.school_logo} onChange={handleChange} className="ms-input" style={{ marginTop: '8px' }} />
                      ) : (
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'school_logo')} className="ms-input" style={{ padding: '7px', marginTop: '8px' }} />
                      )}
                      {formData.school_logo && <img src={formData.school_logo} alt="Preview Logo" className="ms-preview-img" />}
                    </div>

                    <div className="ms-input-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="ms-label">Foto Utama / Hero</label>
                        <div className="ms-toggle-row">
                          <button type="button" onClick={() => setProfileMode('url')} className={`ms-toggle-btn ${profileMode === 'url' ? 'active' : ''}`}>URL</button>
                          <button type="button" onClick={() => setProfileMode('file')} className={`ms-toggle-btn ${profileMode === 'file' ? 'active' : ''}`}>Upload</button>
                        </div>
                      </div>
                      {profileMode === 'url' ? (
                        <input type="text" name="school_profile_image" value={formData.school_profile_image} onChange={handleChange} className="ms-input" style={{ marginTop: '8px' }} />
                      ) : (
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'school_profile_image')} className="ms-input" style={{ padding: '7px', marginTop: '8px' }} />
                      )}
                      {formData.school_profile_image && <img src={formData.school_profile_image} alt="Preview Profil" className="ms-preview-img hero" />}
                    </div>
                  </div>

                  <div className="ms-input-group">
                    <label className="ms-label">Deskripsi Singkat (Hero Section)</label>
                    <textarea name="hero_description" value={formData.hero_description} onChange={handleChange} className="ms-textarea" />
                  </div>

                  <div className="ms-input-group">
                    <label className="ms-label">Sejarah / Deskripsi Lengkap Sekolah</label>
                    <textarea name="school_history" value={formData.school_history} onChange={handleChange} className="ms-textarea tall" />
                  </div>

                  <div className="ms-grid">
                    <div className="ms-input-group"><label className="ms-label">Visi</label><textarea name="school_vision" value={formData.school_vision} onChange={handleChange} className="ms-textarea" /></div>
                    <div className="ms-input-group"><label className="ms-label">Misi (Gunakan titik koma ; )</label><textarea name="school_mission" value={formData.school_mission} onChange={handleChange} className="ms-textarea" /></div>
                  </div>
                </div>
              } />

              {/* ============ TAB 2: TEMA & TAMPILAN ============ */}
              <Route path="appearance" element={
                <div>
                  <div className="ms-section-header">
                    <h3 className="ms-section-title">Appearance</h3>
                    <p className="ms-section-desc">Perubahan langsung terlihat di seluruh website. Klik “Simpan Pengaturan” agar permanen.</p>
                  </div>

                  {/* --- PILIH TEMA --- */}
                  <div className="ms-input-group" style={{ marginBottom: 0 }}>
                    <label className="ms-label">Theme</label>
                    <p className="ms-helper-text" style={{ marginTop: '-4px' }}>Pilih tema untuk dashboard dan website publik.</p>
                    <div className="shadcn-theme-container">
                      {THEME_CARDS.map(({ value, label }) => {
                        const on = formData.theme_mode === value;
                        const pal = value === 'custom' ? resolveCustom(formData) : PRESETS[value];
                        return (
                          <div key={value} className="ms-theme-pick" onClick={() => setField('theme_mode', value)}>
                            <div className={`ms-theme-frame ${on ? 'is-on' : ''}`}>
                              {on && <div className="ms-tick"><Check size={14} strokeWidth={3} /></div>}
                              <ThemeMock p={pal} />
                            </div>
                            <div className="ms-theme-name">{label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* --- PREVIEW LANGSUNG --- */}
                  <ThemePreview data={formData} />

                  {/* --- FONT (4 pilihan) --- */}
                  <div className="ms-input-group" style={{ marginTop: '32px' }}>
                    <label className="ms-label">Typography / Font</label>
                    <div className="ms-font-row">
                      {FONT_OPTIONS.map((f) => (
                        <div
                          key={f.value} role="radio" aria-checked={formData.font_family === f.value} tabIndex={0}
                          className={`ms-font-opt ${formData.font_family === f.value ? 'is-on' : ''}`}
                          onClick={() => setField('font_family', f.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setField('font_family', f.value); } }}
                        >
                          <div className="ms-font-aa" data-own-font style={{ fontFamily: f.stack }}>Aa</div>
                          <div className="ms-font-name" data-own-font style={{ fontFamily: f.stack }}>{f.label}</div>
                          <div className="ms-font-hint">{f.hint}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* --- EDITOR WARNA CUSTOM --- */}
                  {formData.theme_mode === 'custom' && (
                    <div className="ms-custom-zone">
                      <div className="ms-custom-head">
                        <p className="ms-custom-title" style={{ margin: 0 }}>Kustomisasi Warna Detail</p>
                        <button type="button" className="ms-mini-btn" onClick={resetCustom}>Reset ke awal</button>
                      </div>
                      <p className="ms-helper-text">
                        Berlaku untuk dashboard admin &amp; halaman publik. Kolom bertanda “otomatis” dihitung dari warna dasar —
                        isi hanya jika ingin mengatur sendiri.
                      </p>

                      <div className="ms-preset-row">
                        <span className="ms-helper-text" style={{ margin: 0 }}>Mulai dari:</span>
                        <button type="button" className="ms-mini-btn" onClick={() => copyPreset('light')}>Light</button>
                        <button type="button" className="ms-mini-btn" onClick={() => copyPreset('dark')}>Dark</button>
                        <button type="button" className="ms-mini-btn" onClick={() => copyPreset('system')}>System</button>
                      </div>

                      {CUSTOM_GROUPS.map((g) => (
                        <div key={g.title}>
                          <div className="ms-group-title">{g.title}</div>
                          <div className="ms-color-group">
                            {g.fields.map(([name, label, auto]) => (
                              <ColorField
                                key={name} name={name} label={label} auto={!!auto}
                                value={formData[name]} resolved={resolved[CUSTOM_FIELD_MAP[name]]} onChange={setField}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              } />

              {/* ============ TAB 3: KONTAK & MAPS ============ */}
              <Route path="contact" element={
                <div>
                  <div className="ms-section-header">
                    <h3 className="ms-section-title">Contact & Maps</h3>
                    <p className="ms-section-desc">Perbarui kontak dan lokasi sekolah. Setelah disimpan, footer website langsung berubah.</p>
                  </div>

                  <div className="ms-grid">
                    <div className="ms-input-group">
                      <label className="ms-label">Telepon</label>
                      <input type="text" inputMode="tel" name="contact_phone" value={formData.contact_phone} onChange={handleChange} className="ms-input" placeholder="0260 7547733" />
                    </div>
                    <div className="ms-input-group">
                      <label className="ms-label">Email</label>
                      <input type="text" inputMode="email" name="contact_email" value={formData.contact_email} onChange={handleChange} className="ms-input" placeholder="info@smkncompreng.sch.id" />
                    </div>
                  </div>

                  <div className="ms-input-group">
                    <label className="ms-label">Alamat</label>
                    <textarea name="contact_address" value={formData.contact_address} onChange={handleChange} className="ms-textarea short" placeholder="Jl. Compreng, Kec. Compreng, Kabupaten Subang, Jawa Barat 41258" />
                    <p className="ms-helper-text">Tampil di footer dan menjadi tautan ke Google Maps.</p>
                  </div>

                  <div className="ms-input-group">
                    <label className="ms-label">Peta Lokasi (Google Maps)</label>
                    <input
                      type="text" name="contact_map_embed_url" value={formData.contact_map_embed_url} onChange={handleChange}
                      className="ms-input" placeholder="Tempel kode embed / link Google Maps (boleh kosong)"
                    />
                    <p className="ms-helper-text">
                      Google Maps → Bagikan → Sematkan peta → salin HTML {'<iframe>'} lalu tempel di sini. Jika dikosongkan, peta dibuat otomatis dari alamat.
                    </p>
                    {mapSrc ? (
                      <div className="ms-map-frame">
                        <iframe title="Preview peta" src={mapSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                      </div>
                    ) : (
                      <p className="ms-helper-text">Isi alamat atau link peta untuk melihat preview.</p>
                    )}
                  </div>

                  <div className="ms-grid">
                    <div className="ms-input-group"><label className="ms-label">Facebook</label><input type="url" name="social_facebook" value={formData.social_facebook} onChange={handleChange} className="ms-input" placeholder="https://facebook.com/..." /></div>
                    <div className="ms-input-group"><label className="ms-label">Instagram</label><input type="url" name="social_instagram" value={formData.social_instagram} onChange={handleChange} className="ms-input" placeholder="https://instagram.com/..." /></div>
                    <div className="ms-input-group"><label className="ms-label">YouTube</label><input type="url" name="social_youtube" value={formData.social_youtube} onChange={handleChange} className="ms-input" placeholder="https://youtube.com/@..." /></div>
                    <div className="ms-input-group"><label className="ms-label">TikTok</label><input type="url" name="social_tiktok" value={formData.social_tiktok} onChange={handleChange} className="ms-input" placeholder="https://tiktok.com/@..." /></div>
                    <div className="ms-input-group"><label className="ms-label">X (Twitter)</label><input type="url" name="social_twitter" value={formData.social_twitter} onChange={handleChange} className="ms-input" placeholder="https://x.com/..." /></div>
                  </div>
                  <p className="ms-helper-text" style={{ marginTop: '-12px' }}>Kosongkan kolom untuk menyembunyikan ikon sosial media tersebut di footer.</p>
                </div>
              } />
              <Route path="database" element={<DatabaseBackupPanel />} />
            </Routes>

            {!isDatabase && (
            <div className="ms-submit-area">
              <button type="submit" className="btn-modern-primary" disabled={isSaving}>
                {isSaving ? (<><Loader2 className="animate-spin" size={18} />Menyimpan Perubahan...</>) : 'Simpan Pengaturan'}
              </button>
              {isAppearance && (
                <button type="button" className="ms-ghost-btn" onClick={discardTheme} disabled={isSaving}>Batalkan perubahan</button>
              )}
            </div>
            )}
          </form>
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