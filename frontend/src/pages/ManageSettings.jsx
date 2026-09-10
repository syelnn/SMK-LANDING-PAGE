import React, { useState, useContext, useEffect } from 'react';
import { SettingsContext } from '../context/SettingsContext';
import { THEME_GROUPS } from '../theme/themePalettes';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { MapPin, Palette, Check, ChevronDown, Moon, Sun, Star, Layout } from 'lucide-react';
import '../css/managesetting.css'; // Murni memanggil CSS file eksternal

export default function ManageSettings() {
  const { settings, fetchSettings, applyPreview } = useContext(SettingsContext);
  const [isSaving, setIsSaving] = useState(false);
  const location = useLocation();

  const [logoMode, setLogoMode] = useState('url');
  const [profileMode, setProfileMode] = useState('url');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false); // React State untuk Dropdown

  const defaultData = {
    school_name: 'SMKN Compreng', school_accreditation: 'Terakreditasi A', school_logo: '/src/assets/logo1.png', school_profile_image: '/src/assets/visi.jpg',
    hero_description: 'Membangun Generasi Cerdas, Berkarakter, dan Berprestasi.', school_history: 'Sekolah ini berdedikasi mencetak lulusan siap kerja.', school_vision: 'Mewujudkan peserta didik yang berkarakter...', school_mission: '1. Meningkatkan kualitas pendidikan\n2. Menyiapkan lulusan siap kerja',
    theme_mode: 'compreng_default', font_family: 'Plus Jakarta Sans', custom_bg: '#f8fafc', custom_card: '#ffffff', custom_text_main: '#0f172a', custom_text_muted: '#64748b', custom_accent: '#2563eb', custom_accent_text: '#ffffff', custom_nav_bg: '#0b132b', custom_nav_text: '#ffffff', custom_border: '#e2e8f0',
    contact_phone: '08123456789', contact_email: 'info@smkncompreng.sch.id', contact_address: 'Jl. Raya Compreng No. 123', contact_map_embed_url: '', social_facebook: 'https://facebook.com/', social_instagram: 'https://instagram.com/', social_youtube: 'https://youtube.com/', social_tiktok: 'https://tiktok.com/', social_twitter: 'https://x.com/'
  };

  const [formData, setFormData] = useState(defaultData);

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setFormData(prev => ({ ...prev, ...settings }));
      if (settings.font_family) {
        loadGoogleFont(settings.font_family);
        document.documentElement.style.setProperty('--theme-font', `'${settings.font_family}', sans-serif`);
        document.body.style.fontFamily = `'${settings.font_family}', sans-serif`;
      }
    }
  }, [settings]);

  const loadGoogleFont = (fontName) => {
    if (!fontName) return;
    const linkId = 'dynamic-google-font';
    let link = document.getElementById(linkId);
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    const formattedFont = fontName.replace(/ /g, '+');
    link.href = `https://fonts.googleapis.com/css2?family=${formattedFont}:wght@300;400;500;600;700&display=swap`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);

    if (name === 'font_family') {
      document.documentElement.style.setProperty('--theme-font', `'${value}', sans-serif`);
    }

    if (name === 'theme_mode' || name === 'font_family' || name.startsWith('custom_')) {
      applyPreview(updated);
    }
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("Ukuran file terlalu besar! Maksimal 2MB.");
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, [fieldName]: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!window.confirm("Simpan perubahan pengaturan?")) return;
    applyPreview(formData);
    setIsSaving(true);
    try {
      await fetch('http://localhost:5002/api/settings/bulk-update', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      await fetchSettings(); 
      setIsSaving(false); 
      alert("Pengaturan berhasil disimpan!");
    } catch (error) { 
      setIsSaving(false); 
      alert("Gagal menyimpan!"); 
    }
  };

  return (
    <div className="ms-wrapper">
      <div className="ms-page-header">
        <h2 className="ms-page-title">Settings</h2>
        <p className="ms-page-subtitle">Manage your school identity, appearance, and contact preferences.</p>
      </div>

      <div className="ms-layout-flex">
        {/* SIDEBAR NAV */}
        <div className="ms-sidebar">
          <NavLink to="/admin/settings/profile" className={({ isActive }) => `ms-nav-link ${isActive ? 'active' : ''}`}>
            Profile
          </NavLink>
          <NavLink to="/admin/settings/appearance" className={({ isActive }) => `ms-nav-link ${isActive ? 'active' : ''}`}>
            Appearance
          </NavLink>
          <NavLink to="/admin/settings/contact" className={({ isActive }) => `ms-nav-link ${isActive ? 'active' : ''}`}>
            Contact & Maps
          </NavLink>
        </div>

        {/* CONTENT AREA ROUTING */}
        <div className="ms-content-area">
          <form onSubmit={handleSubmit}>
            <Routes>
              <Route path="/" element={<Navigate to="profile" replace />} />

              {/* TAB 1: IDENTITAS */}
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
                    <p className="ms-helper-text">Bisa diisi akreditasi (contoh: "Terakreditasi A") atau motto sekolah.</p>
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
                        <input type="text" name="school_logo" value={formData.school_logo} onChange={handleChange} className="ms-input" style={{marginTop: '8px'}} placeholder="https://..." />
                      ) : (
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'school_logo')} className="ms-input" style={{padding: '7px', marginTop: '8px'}} />
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
                        <input type="text" name="school_profile_image" value={formData.school_profile_image} onChange={handleChange} className="ms-input" style={{marginTop: '8px'}} placeholder="https://..." />
                      ) : (
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'school_profile_image')} className="ms-input" style={{padding: '7px', marginTop: '8px'}} />
                      )}
                      {formData.school_profile_image && <img src={formData.school_profile_image} alt="Preview Profil" className="ms-preview-img hero" />}
                    </div>
                  </div>

                  <div className="ms-input-group">
                    <label className="ms-label">Deskripsi Singkat (Hero Section)</label>
                    <textarea name="hero_description" value={formData.hero_description} onChange={handleChange} className="ms-textarea" />
                    <p className="ms-helper-text">Satu atau dua kalimat penyambut di halaman utama.</p>
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

              {/* TAB 2: TEMA & TAMPILAN */}
              <Route path="appearance" element={
                <div>
                  <div className="ms-section-header">
                    <h3 className="ms-section-title">Appearance</h3>
                    <p className="ms-section-desc">Customize the appearance of the app. Automatically switch between modern, dark, or standard themes.</p>
                  </div>
                  
                  <div className="ms-input-group">
                    <label className="ms-label">Theme Preference</label>
                    <div className="ms-theme-wrapper">
                      {/* Toggling State Using React (Bukan getElementById lagi) */}
                      <div onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)} className="ms-input ms-theme-trigger">
                        <div className="ms-theme-trigger-content">
                          <span style={{ fontWeight: '500' }}>{THEME_GROUPS.flatMap(g => g.options).find(o => o.value === formData.theme_mode)?.label || 'Pilih Tema...'}</span>
                        </div>
                        <ChevronDown size={16} color="var(--compreng-text-muted)" />
                      </div>

                      {isThemeMenuOpen && (
                        <>
                          <div onClick={() => setIsThemeMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }}></div>
                          <div className="ms-theme-menu" style={{ display: 'block' }}>
                            {THEME_GROUPS.map((group, gIdx) => (
                              <div key={gIdx}>
                                <div className="ms-theme-group-label">{group.label}</div>
                                {group.options.map((opt) => (
                                  <div 
                                    key={opt.value} 
                                    onClick={() => { handleChange({ target: { name: 'theme_mode', value: opt.value } }); setIsThemeMenuOpen(false); }} 
                                    className={`ms-theme-item ${formData.theme_mode === opt.value ? 'active' : ''}`}
                                  >
                                    <div className="ms-theme-item-label">
                                      {group.label === 'Gelap & Modern' ? <Moon size={14} color="var(--compreng-text-secondary)"/> : group.label.includes('Spesial') ? <Star size={14} color="#d97706"/> : opt.value === 'custom' ? <Layout size={14} color="#2563eb"/> : <Sun size={14} color="var(--compreng-text-secondary)"/>}
                                      <span className="ms-theme-item-text">{opt.label}</span>
                                    </div>
                                    {formData.theme_mode === opt.value && <Check size={14} color="var(--compreng-text)" />}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    <p className="ms-helper-text" style={{marginTop: '8px'}}>Pilih palet warna yang akan digunakan di seluruh halaman publik dan dashboard.</p>
                  </div>

                  <div className="ms-input-group medium">
                    <label className="ms-label">Gaya Font Tipografi</label>
                    <select name="font_family" value={formData.font_family} onChange={handleChange} className="ms-input">
                      <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                      <option value="Inter">Inter</option>
                      <option value="Poppins">Poppins</option>
                    </select>
                    <p className="ms-helper-text">Font yang digunakan di seluruh antarmuka situs.</p>
                  </div>

                  {formData.theme_mode === 'custom' && (
                    <div className="ms-custom-panel">
                      <p className="ms-custom-title">Kustomisasi Warna Penuh</p>
                      <div className="ms-color-grid">
                        <div className="ms-input-group"><label className="ms-label">Latar Web (BG)</label><div className="ms-color-box"><input type="color" name="custom_bg" value={formData.custom_bg} onChange={handleChange} className="ms-color-picker" /><input type="text" name="custom_bg" value={formData.custom_bg} onChange={handleChange} className="ms-color-input" /></div></div>
                        <div className="ms-input-group"><label className="ms-label">Latar Kotak (Card)</label><div className="ms-color-box"><input type="color" name="custom_card" value={formData.custom_card} onChange={handleChange} className="ms-color-picker" /><input type="text" name="custom_card" value={formData.custom_card} onChange={handleChange} className="ms-color-input" /></div></div>
                        <div className="ms-input-group"><label className="ms-label">Teks Judul Utama</label><div className="ms-color-box"><input type="color" name="custom_text_main" value={formData.custom_text_main} onChange={handleChange} className="ms-color-picker" /><input type="text" name="custom_text_main" value={formData.custom_text_main} onChange={handleChange} className="ms-color-input" /></div></div>
                        <div className="ms-input-group"><label className="ms-label">Teks Paragraf / Deskripsi</label><div className="ms-color-box"><input type="color" name="custom_text_muted" value={formData.custom_text_muted} onChange={handleChange} className="ms-color-picker" /><input type="text" name="custom_text_muted" value={formData.custom_text_muted} onChange={handleChange} className="ms-color-input" /></div></div>
                        <div className="ms-input-group"><label className="ms-label">Aksen (Tombol & Lencana)</label><div className="ms-color-box"><input type="color" name="custom_accent" value={formData.custom_accent} onChange={handleChange} className="ms-color-picker" /><input type="text" name="custom_accent" value={formData.custom_accent} onChange={handleChange} className="ms-color-input" /></div></div>
                        <div className="ms-input-group"><label className="ms-label">Teks di Dalam Tombol</label><div className="ms-color-box"><input type="color" name="custom_accent_text" value={formData.custom_accent_text} onChange={handleChange} className="ms-color-picker" /><input type="text" name="custom_accent_text" value={formData.custom_accent_text} onChange={handleChange} className="ms-color-input" /></div></div>
                        <div className="ms-input-group"><label className="ms-label">Latar Navbar & Footer</label><div className="ms-color-box"><input type="color" name="custom_nav_bg" value={formData.custom_nav_bg} onChange={handleChange} className="ms-color-picker" /><input type="text" name="custom_nav_bg" value={formData.custom_nav_bg} onChange={handleChange} className="ms-color-input" /></div></div>
                        <div className="ms-input-group"><label className="ms-label">Teks Navbar & Footer</label><div className="ms-color-box"><input type="color" name="custom_nav_text" value={formData.custom_nav_text} onChange={handleChange} className="ms-color-picker" /><input type="text" name="custom_nav_text" value={formData.custom_nav_text} onChange={handleChange} className="ms-color-input" /></div></div>
                        <div className="ms-input-group"><label className="ms-label">Garis Tepi (Border)</label><div className="ms-color-box"><input type="color" name="custom_border" value={formData.custom_border} onChange={handleChange} className="ms-color-picker" /><input type="text" name="custom_border" value={formData.custom_border} onChange={handleChange} className="ms-color-input" /></div></div>
                      </div>
                    </div>
                  )}
                </div>
              } />

              {/* TAB 3: KONTAK */}
              <Route path="contact" element={
                <div>
                  <div className="ms-section-header">
                    <h3 className="ms-section-title">Contact & Maps</h3>
                    <p className="ms-section-desc">Perbarui nomor telepon, email, media sosial, dan lokasi Google Maps sekolah.</p>
                  </div>
                  <div className="ms-grid">
                    <div className="ms-input-group"><label className="ms-label">Telepon</label><input type="text" name="contact_phone" value={formData.contact_phone} onChange={handleChange} className="ms-input" /></div>
                    <div className="ms-input-group"><label className="ms-label">Email</label><input type="text" name="contact_email" value={formData.contact_email} onChange={handleChange} className="ms-input" /></div>
                    <div className="ms-input-group"><label className="ms-label">Facebook URL</label><input type="url" name="social_facebook" value={formData.social_facebook} onChange={handleChange} className="ms-input" /></div>
                    <div className="ms-input-group"><label className="ms-label">Instagram URL</label><input type="url" name="social_instagram" value={formData.social_instagram} onChange={handleChange} className="ms-input" /></div>
                    <div className="ms-input-group"><label className="ms-label">YouTube URL</label><input type="url" name="social_youtube" value={formData.social_youtube} onChange={handleChange} className="ms-input" /></div>
                    <div className="ms-input-group"><label className="ms-label">TikTok URL</label><input type="url" name="social_tiktok" value={formData.social_tiktok} onChange={handleChange} className="ms-input" /></div>
                    <div className="ms-input-group"><label className="ms-label">Twitter / X URL</label><input type="url" name="social_twitter" value={formData.social_twitter} onChange={handleChange} className="ms-input" /></div>
                    <div className="ms-input-group">
                      <label className="ms-label">Embed Google Maps</label>
                      <input type="text" name="contact_map_embed_url" value={formData.contact_map_embed_url} onChange={handleChange} className="ms-input" placeholder="https://www.google.com/maps/embed?pb=..." />
                      <p className="ms-helper-text">Masukkan link URL embed iframe dari Google Maps.</p>
                    </div>
                  </div>
                  <div className="ms-input-group">
                    <label className="ms-label">Alamat Lengkap</label>
                    <textarea name="contact_address" value={formData.contact_address} onChange={handleChange} className="ms-textarea short" />
                  </div>
                </div>
              } />
            </Routes>

            <div className="ms-submit-area">
              {/* Tombol Simpan Menggunakan Kelas Standar Shadcn */}
              <button type="submit" className="btn-modern-primary" disabled={isSaving}>
                {isSaving ? 'Menyimpan Data...' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}