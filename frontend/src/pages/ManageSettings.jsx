import React, { useState, useContext, useEffect } from 'react';
import { SettingsContext } from '../context/SettingsContext';
import { THEME_GROUPS } from '../theme/themePalettes';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { LayoutTemplate, MapPin, Palette, Check, ChevronDown, Moon, Sun, Star, Layout } from 'lucide-react';

export default function ManageSettings() {
  const { settings, fetchSettings, setIsMaintenance, applyPreview } = useContext(SettingsContext);
  const [isSaving, setIsSaving] = useState(false);
  const location = useLocation();

  const [logoMode, setLogoMode] = useState('url');
  const [profileMode, setProfileMode] = useState('url');

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

  // Update CSS variable --theme-font secara realtime
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
      setIsSaving(false); alert("Pengaturan berhasil disimpan!");
    } catch (error) { setIsSaving(false); alert("Gagal menyimpan!"); }
  };

  // --- STYLING SHADCN UI ---
  const styles = {
    wrapper: { maxWidth: '1100px', margin: '0 auto', padding: '40px 30px', paddingBottom: '80px', fontFamily: 'var(--theme-font)' },
    pageHeader: { marginBottom: '32px', borderBottom: '1px solid var(--compreng-border)', paddingBottom: '24px' },
    pageTitle: { fontSize: '24px', fontWeight: '700', color: 'var(--compreng-text)', margin: '0 0 8px 0', letterSpacing: '-0.02em' },
    pageSubtitle: { fontSize: '14px', color: 'var(--compreng-text-muted)', margin: 0 },
    
    layoutFlex: { display: 'flex', gap: '48px', alignItems: 'flex-start', flexWrap: 'wrap' },
    
    // Sidebar Style Shadcn
    sidebar: { width: '220px', display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 },
    navLink: { padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: '500', transition: 'all 0.2s ease', color: 'var(--compreng-text-secondary)', background: 'transparent' },
    navLinkActive: { backgroundColor: 'var(--compreng-surface-soft)', color: 'var(--compreng-text)', fontWeight: '600' },
    
    // Content Style Shadcn
    contentArea: { flex: 1, minWidth: '300px', maxWidth: '700px' },
    sectionHeader: { marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--compreng-border)' },
    sectionTitle: { fontSize: '18px', fontWeight: '600', color: 'var(--compreng-text)', margin: '0 0 6px 0', letterSpacing: '-0.01em' },
    sectionDesc: { fontSize: '13px', color: 'var(--compreng-text-muted)', margin: 0, lineHeight: 1.5 },
    
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' },
    label: { fontSize: '13px', fontWeight: '500', color: 'var(--compreng-text)' },
    helperText: { fontSize: '12.5px', color: 'var(--compreng-text-muted)', marginTop: '4px', lineHeight: 1.4 },
    input: { padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--compreng-border)', width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--compreng-bg)', color: 'var(--compreng-text)', fontSize: '13px', outline: 'none', transition: 'border 0.2s' },
    
    toggleRow: { display: 'flex', gap: '6px' },
    toggleBtn: (active) => ({ fontSize: '11px', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '500', background: active ? 'var(--compreng-text)' : 'var(--compreng-surface-soft)', color: active ? 'var(--compreng-bg)' : 'var(--compreng-text-muted)', transition: 'all 0.2s' }),
    previewImg: { width: '60px', height: '60px', objectFit: 'contain', borderRadius: '6px', border: '1px solid var(--compreng-border)', marginTop: '10px', backgroundColor: 'var(--compreng-bg)', padding: '4px' },
    textarea: { padding: '12px 14px', borderRadius: '6px', border: '1px solid var(--compreng-border)', width: '100%', minHeight: '100px', resize: 'vertical', boxSizing: 'border-box', backgroundColor: 'var(--compreng-bg)', color: 'var(--compreng-text)', fontSize: '13px', outline: 'none', transition: 'border 0.2s' },
    
    submitArea: { marginTop: '20px', paddingTop: '10px', display: 'flex', justifyContent: 'flex-start' },
    button: { padding: '10px 20px', backgroundColor: 'var(--compreng-text)', color: 'var(--compreng-bg)', borderRadius: '6px', border: 'none', fontWeight: '500', cursor: 'pointer', fontSize: '13px', transition: 'opacity 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
    colorBox: { display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: 'var(--compreng-bg)', border: '1px solid var(--compreng-border)', borderRadius: '6px', padding: '6px 10px' }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>Settings</h2>
        <p style={styles.pageSubtitle}>Manage your school identity, appearance, and contact preferences.</p>
      </div>

      <div style={styles.layoutFlex}>
        {/* SHADCN-ADMIN STYLE SIDEBAR NAV (Tanpa Icon, Bersih) */}
        <div style={styles.sidebar}>
          <NavLink to="/admin/settings/profile" style={({ isActive }) => isActive ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink}>
            Profile
          </NavLink>
          <NavLink to="/admin/settings/appearance" style={({ isActive }) => isActive ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink}>
            Appearance
          </NavLink>
          <NavLink to="/admin/settings/contact" style={({ isActive }) => isActive ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink}>
            Contact & Maps
          </NavLink>
        </div>

        {/* CONTENT AREA ROUTING */}
        <div style={styles.contentArea}>
          <form onSubmit={handleSubmit}>
            <Routes>
              <Route path="/" element={<Navigate to="profile" replace />} />

              {/* TAB 1: IDENTITAS */}
              <Route path="profile" element={
                <div className="tab-content">
                  <div style={styles.sectionHeader}>
                    <h3 style={styles.sectionTitle}>Profile</h3>
                    <p style={styles.sectionDesc}>This is how others will see the school on the site.</p>
                  </div>
                  
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Nama Sekolah</label>
                    <input type="text" name="school_name" value={formData.school_name} onChange={handleChange} style={styles.input} />
                    <p style={styles.helperText}>Ini adalah nama resmi sekolah yang akan muncul di navbar dan footer.</p>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Akreditasi / Tagline</label>
                    <input type="text" name="school_accreditation" value={formData.school_accreditation} onChange={handleChange} style={styles.input} />
                    <p style={styles.helperText}>Bisa diisi akreditasi (contoh: "Terakreditasi A") atau motto sekolah.</p>
                  </div>
                  
                  <div style={styles.grid}>
                    <div style={styles.inputGroup}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={styles.label}>Logo Sekolah (Icon)</label>
                        <div style={styles.toggleRow}>
                          <button type="button" onClick={() => setLogoMode('url')} style={styles.toggleBtn(logoMode === 'url')}>URL</button>
                          <button type="button" onClick={() => setLogoMode('file')} style={styles.toggleBtn(logoMode === 'file')}>Upload</button>
                        </div>
                      </div>
                      {logoMode === 'url' ? <input type="text" name="school_logo" value={formData.school_logo} onChange={handleChange} style={{...styles.input, marginTop: '8px'}} placeholder="https://..." /> : <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'school_logo')} style={{...styles.input, padding: '7px', marginTop: '8px'}} />}
                      {formData.school_logo && <img src={formData.school_logo} alt="Preview Logo" style={styles.previewImg} />}
                    </div>

                    <div style={styles.inputGroup}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={styles.label}>Foto Utama / Hero</label>
                        <div style={styles.toggleRow}>
                          <button type="button" onClick={() => setProfileMode('url')} style={styles.toggleBtn(profileMode === 'url')}>URL</button>
                          <button type="button" onClick={() => setProfileMode('file')} style={styles.toggleBtn(profileMode === 'file')}>Upload</button>
                        </div>
                      </div>
                      {profileMode === 'url' ? <input type="text" name="school_profile_image" value={formData.school_profile_image} onChange={handleChange} style={{...styles.input, marginTop: '8px'}} placeholder="https://..." /> : <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'school_profile_image')} style={{...styles.input, padding: '7px', marginTop: '8px'}} />}
                      {formData.school_profile_image && <img src={formData.school_profile_image} alt="Preview Profil" style={{...styles.previewImg, width: '100px', objectFit: 'cover'}} />}
                    </div>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Deskripsi Singkat (Hero Section)</label>
                    <textarea name="hero_description" value={formData.hero_description} onChange={handleChange} style={styles.textarea} />
                    <p style={styles.helperText}>Satu atau dua kalimat penyambut di halaman utama.</p>
                  </div>
                  
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Sejarah / Deskripsi Lengkap Sekolah</label>
                    <textarea name="school_history" value={formData.school_history} onChange={handleChange} style={{...styles.textarea, minHeight: '120px'}} />
                  </div>
                  
                  <div style={styles.grid}>
                    <div style={styles.inputGroup}><label style={styles.label}>Visi</label><textarea name="school_vision" value={formData.school_vision} onChange={handleChange} style={styles.textarea} /></div>
                    <div style={styles.inputGroup}><label style={styles.label}>Misi (Gunakan titik koma ; )</label><textarea name="school_mission" value={formData.school_mission} onChange={handleChange} style={styles.textarea} /></div>
                  </div>
                </div>
              } />

              {/* TAB 2: TEMA & TAMPILAN */}
              <Route path="appearance" element={
                <div className="tab-content">
                  <div style={styles.sectionHeader}>
                    <h3 style={styles.sectionTitle}>Appearance</h3>
                    <p style={styles.sectionDesc}>Customize the appearance of the app. Automatically switch between modern, dark, or standard themes.</p>
                  </div>
                  
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Theme Preference</label>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '400px', marginTop: '4px' }}>
                      <div onClick={() => document.getElementById('theme-menu').classList.toggle('show')} style={{ ...styles.input, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '500' }}>{THEME_GROUPS.flatMap(g => g.options).find(o => o.value === formData.theme_mode)?.label || 'Pilih Tema...'}</span>
                        </div>
                        <ChevronDown size={16} color="var(--compreng-text-muted)" />
                      </div>
                      <div id="theme-menu" style={{ display: 'none', position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'var(--compreng-surface)', border: '1px solid var(--compreng-border)', borderRadius: '6px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', maxHeight: '300px', overflowY: 'auto', marginTop: '5px' }}>
                        <style>{`#theme-menu.show { display: block !important; }`}</style>
                        {THEME_GROUPS.map((group, gIdx) => (
                          <div key={gIdx}>
                            <div style={{ padding: '8px 12px', background: 'var(--compreng-bg)', fontSize: '11px', fontWeight: '600', color: 'var(--compreng-text-muted)', textTransform: 'uppercase' }}>{group.label}</div>
                            {group.options.map((opt) => (
                              <div key={opt.value} onClick={() => { handleChange({ target: { name: 'theme_mode', value: opt.value } }); document.getElementById('theme-menu').classList.remove('show'); }} style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: '1px solid var(--compreng-border)', background: formData.theme_mode === opt.value ? 'var(--compreng-bg)' : 'transparent' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--compreng-bg)'} onMouseOut={(e) => e.currentTarget.style.background = formData.theme_mode === opt.value ? 'var(--compreng-bg)' : 'transparent'}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  {group.label === 'Gelap & Modern' ? <Moon size={14} color="var(--compreng-text-secondary)"/> : group.label.includes('Spesial') ? <Star size={14} color="#d97706"/> : opt.value === 'custom' ? <Layout size={14} color="#2563eb"/> : <Sun size={14} color="var(--compreng-text-secondary)"/>}
                                  <span style={{ fontSize: '13px', color: 'var(--compreng-text)' }}>{opt.label}</span>
                                </div>
                                {formData.theme_mode === opt.value && <Check size={14} color="var(--compreng-text)" />}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Perbaikan Tag Style yang Duplicate */}
                    <p style={{...styles.helperText, marginTop: '8px'}}>Pilih palet warna yang akan digunakan di seluruh halaman publik dan dashboard.</p>
                  </div>

                  <div style={{...styles.inputGroup, maxWidth: '400px'}}>
                    <label style={styles.label}>Gaya Font Tipografi</label>
                    <select name="font_family" value={formData.font_family} onChange={handleChange} style={styles.input}>
                      <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                      <option value="Inter">Inter</option>
                      <option value="Poppins">Poppins</option>
                    </select>
                    <p style={styles.helperText}>Font yang digunakan di seluruh antarmuka situs.</p>
                  </div>

                  {formData.theme_mode === 'custom' && (
                    <div style={{ marginTop: '30px', backgroundColor: 'var(--compreng-bg)', padding: '24px', borderRadius: '8px', border: '1px solid var(--compreng-border)' }}>
                      <p style={{fontSize: '14px', marginBottom: '20px', fontWeight: '600', color: 'var(--compreng-text)'}}>Kustomisasi Warna Penuh</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        <div style={styles.inputGroup}><label style={styles.label}>Latar Web (BG)</label><div style={styles.colorBox}><input type="color" name="custom_bg" value={formData.custom_bg} onChange={handleChange} style={{border:'none', width:'30px', background:'none', padding: 0}} /><input type="text" name="custom_bg" value={formData.custom_bg} onChange={handleChange} style={{border:'none', outline:'none', background:'none', width:'100%', color:'var(--compreng-text)'}} /></div></div>
                        <div style={styles.inputGroup}><label style={styles.label}>Latar Kotak (Card)</label><div style={styles.colorBox}><input type="color" name="custom_card" value={formData.custom_card} onChange={handleChange} style={{border:'none', width:'30px', background:'none', padding: 0}} /><input type="text" name="custom_card" value={formData.custom_card} onChange={handleChange} style={{border:'none', outline:'none', background:'none', width:'100%', color:'var(--compreng-text)'}} /></div></div>
                        <div style={styles.inputGroup}><label style={styles.label}>Teks Judul Utama</label><div style={styles.colorBox}><input type="color" name="custom_text_main" value={formData.custom_text_main} onChange={handleChange} style={{border:'none', width:'30px', background:'none', padding: 0}} /><input type="text" name="custom_text_main" value={formData.custom_text_main} onChange={handleChange} style={{border:'none', outline:'none', background:'none', width:'100%', color:'var(--compreng-text)'}} /></div></div>
                        <div style={styles.inputGroup}><label style={styles.label}>Teks Paragraf / Deskripsi</label><div style={styles.colorBox}><input type="color" name="custom_text_muted" value={formData.custom_text_muted} onChange={handleChange} style={{border:'none', width:'30px', background:'none', padding: 0}} /><input type="text" name="custom_text_muted" value={formData.custom_text_muted} onChange={handleChange} style={{border:'none', outline:'none', background:'none', width:'100%', color:'var(--compreng-text)'}} /></div></div>
                        <div style={styles.inputGroup}><label style={styles.label}>Aksen (Tombol & Lencana)</label><div style={styles.colorBox}><input type="color" name="custom_accent" value={formData.custom_accent} onChange={handleChange} style={{border:'none', width:'30px', background:'none', padding: 0}} /><input type="text" name="custom_accent" value={formData.custom_accent} onChange={handleChange} style={{border:'none', outline:'none', background:'none', width:'100%', color:'var(--compreng-text)'}} /></div></div>
                        <div style={styles.inputGroup}><label style={styles.label}>Teks di Dalam Tombol</label><div style={styles.colorBox}><input type="color" name="custom_accent_text" value={formData.custom_accent_text} onChange={handleChange} style={{border:'none', width:'30px', background:'none', padding: 0}} /><input type="text" name="custom_accent_text" value={formData.custom_accent_text} onChange={handleChange} style={{border:'none', outline:'none', background:'none', width:'100%', color:'var(--compreng-text)'}} /></div></div>
                        <div style={styles.inputGroup}><label style={styles.label}>Latar Navbar & Footer</label><div style={styles.colorBox}><input type="color" name="custom_nav_bg" value={formData.custom_nav_bg} onChange={handleChange} style={{border:'none', width:'30px', background:'none', padding: 0}} /><input type="text" name="custom_nav_bg" value={formData.custom_nav_bg} onChange={handleChange} style={{border:'none', outline:'none', background:'none', width:'100%', color:'var(--compreng-text)'}} /></div></div>
                        <div style={styles.inputGroup}><label style={styles.label}>Teks Navbar & Footer</label><div style={styles.colorBox}><input type="color" name="custom_nav_text" value={formData.custom_nav_text} onChange={handleChange} style={{border:'none', width:'30px', background:'none', padding: 0}} /><input type="text" name="custom_nav_text" value={formData.custom_nav_text} onChange={handleChange} style={{border:'none', outline:'none', background:'none', width:'100%', color:'var(--compreng-text)'}} /></div></div>
                        <div style={styles.inputGroup}><label style={styles.label}>Garis Tepi (Border)</label><div style={styles.colorBox}><input type="color" name="custom_border" value={formData.custom_border} onChange={handleChange} style={{border:'none', width:'30px', background:'none', padding: 0}} /><input type="text" name="custom_border" value={formData.custom_border} onChange={handleChange} style={{border:'none', outline:'none', background:'none', width:'100%', color:'var(--compreng-text)'}} /></div></div>
                      </div>
                    </div>
                  )}
                </div>
              } />

              {/* TAB 3: KONTAK */}
              <Route path="contact" element={
                <div className="tab-content">
                  <div style={styles.sectionHeader}>
                    <h3 style={styles.sectionTitle}>Contact & Maps</h3>
                    <p style={styles.sectionDesc}>Perbarui nomor telepon, email, media sosial, dan lokasi Google Maps sekolah.</p>
                  </div>
                  <div style={styles.grid}>
                    <div style={styles.inputGroup}><label style={styles.label}>Telepon</label><input type="text" name="contact_phone" value={formData.contact_phone} onChange={handleChange} style={styles.input} /></div>
                    <div style={styles.inputGroup}><label style={styles.label}>Email</label><input type="text" name="contact_email" value={formData.contact_email} onChange={handleChange} style={styles.input} /></div>
                    <div style={styles.inputGroup}><label style={styles.label}>Facebook URL</label><input type="url" name="social_facebook" value={formData.social_facebook} onChange={handleChange} style={styles.input} /></div>
                    <div style={styles.inputGroup}><label style={styles.label}>Instagram URL</label><input type="url" name="social_instagram" value={formData.social_instagram} onChange={handleChange} style={styles.input} /></div>
                    <div style={styles.inputGroup}><label style={styles.label}>YouTube URL</label><input type="url" name="social_youtube" value={formData.social_youtube} onChange={handleChange} style={styles.input} /></div>
                    <div style={styles.inputGroup}><label style={styles.label}>TikTok URL</label><input type="url" name="social_tiktok" value={formData.social_tiktok} onChange={handleChange} style={styles.input} /></div>
                    <div style={styles.inputGroup}><label style={styles.label}>Twitter / X URL</label><input type="url" name="social_twitter" value={formData.social_twitter} onChange={handleChange} style={styles.input} /></div>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Embed Google Maps</label>
                      <input type="text" name="contact_map_embed_url" value={formData.contact_map_embed_url} onChange={handleChange} style={styles.input} placeholder="https://www.google.com/maps/embed?pb=..." />
                      <p style={styles.helperText}>Masukkan link URL embed iframe dari Google Maps.</p>
                    </div>
                  </div>
                  <div style={{...styles.inputGroup, maxWidth: '100%'}}>
                    <label style={styles.label}>Alamat Lengkap</label>
                    <textarea name="contact_address" value={formData.contact_address} onChange={handleChange} style={{...styles.input, minHeight:'80px', resize: 'vertical'}} />
                  </div>
                </div>
              } />
            </Routes>

            <div style={styles.submitArea}>
              <button type="submit" style={styles.button} onMouseOver={(e)=>e.currentTarget.style.opacity='0.9'} onMouseOut={(e)=>e.currentTarget.style.opacity='1'}>
                {isSaving ? 'Menyimpan Data...' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}