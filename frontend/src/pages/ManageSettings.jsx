import React, { useState, useContext, useEffect } from 'react';
import { SettingsContext } from '../context/SettingsContext';
import { THEME_GROUPS } from '../theme/themePalettes';
import { Save, LayoutTemplate, MapPin, Share2, Palette, Upload, Link as LinkIcon, Check, ChevronDown, Monitor, Moon, Sun, Star, BookOpen, Flag, Layout } from 'lucide-react';

export default function ManageSettings() {
  const { settings, fetchSettings, setIsMaintenance, applyPreview, cancelPreview } = useContext(SettingsContext);
  const [isSaving, setIsSaving] = useState(false);

  // State untuk memilih mode input: 'file' atau 'url' untuk masing-masing gambar
  const [logoMode, setLogoMode] = useState('url');
  const [profileMode, setProfileMode] = useState('url');

  const defaultData = {
    school_name: 'SMKN Compreng',
    school_accreditation: 'Terakreditasi A',
    school_logo: '/src/assets/logo1.png',
    school_profile_image: '/src/assets/visi.jpg',
    hero_description: 'Membangun Generasi Cerdas, Berkarakter, dan Berprestasi.',
    school_history: 'Sekolah ini berdedikasi mencetak lulusan siap kerja.',
    school_vision: 'Mewujudkan peserta didik yang berkarakter...',
    school_mission: '1. Meningkatkan kualitas pendidikan\n2. Menyiapkan lulusan siap kerja',
    
    theme_mode: 'compreng_default',
    font_family: 'Plus Jakarta Sans',
    custom_bg: '#f8fafc',
    custom_card: '#ffffff',
    custom_text_main: '#0f172a',
    custom_text_muted: '#64748b',
    custom_accent: '#2563eb',
    custom_accent_text: '#ffffff',
    custom_nav_bg: '#0b132b',
    custom_nav_text: '#ffffff',
    custom_border: '#e2e8f0',
    
    contact_phone: '08123456789',
    contact_email: 'info@smkncompreng.sch.id',
    contact_address: 'Jl. Raya Compreng No. 123',
    contact_map_embed_url: '',
    social_facebook: 'https://facebook.com/',
    social_instagram: 'https://instagram.com/',
    social_youtube: 'https://youtube.com/',
    social_tiktok: 'https://tiktok.com/',
    social_twitter: 'https://x.com/'
  };

  const [formData, setFormData] = useState(defaultData);

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setFormData({
        school_name: settings.school_name || defaultData.school_name,
        school_accreditation: settings.school_accreditation || defaultData.school_accreditation,
        school_logo: settings.school_logo || defaultData.school_logo,
        school_profile_image: settings.school_profile_image || defaultData.school_profile_image,
        hero_description: settings.hero_description || defaultData.hero_description,
        school_history: settings.school_history || defaultData.school_history,
        school_vision: settings.school_vision || defaultData.school_vision,
        school_mission: settings.school_mission || defaultData.school_mission,
        
        theme_mode: settings.theme_mode || defaultData.theme_mode,
        font_family: settings.font_family || defaultData.font_family,
        custom_bg: settings.custom_bg || defaultData.custom_bg,
        custom_card: settings.custom_card || defaultData.custom_card,
        custom_text_main: settings.custom_text_main || defaultData.custom_text_main,
        custom_text_muted: settings.custom_text_muted || defaultData.custom_text_muted,
        custom_accent: settings.custom_accent || defaultData.custom_accent,
        custom_accent_text: settings.custom_accent_text || defaultData.custom_accent_text,
        custom_nav_bg: settings.custom_nav_bg || defaultData.custom_nav_bg,
        custom_nav_text: settings.custom_nav_text || defaultData.custom_nav_text,
        custom_border: settings.custom_border || defaultData.custom_border,
        
        contact_phone: settings.contact_phone || defaultData.contact_phone,
        contact_email: settings.contact_email || defaultData.contact_email,
        contact_address: settings.contact_address || defaultData.contact_address,
        contact_map_embed_url: settings.contact_map_embed_url || defaultData.contact_map_embed_url,
        social_facebook: settings.social_facebook || '',
        social_instagram: settings.social_instagram || '',
        social_youtube: settings.social_youtube || '',
        social_tiktok: settings.social_tiktok || '',
        social_twitter: settings.social_twitter || ''
      });
    }
  }, [settings]);
const handleChange = (e) => {
  const { name, value } = e.target;
  const updated = { ...formData, [name]: value };
  setFormData(updated);

  // Preview instan begitu admin ganti tema di dropdown, sebelum tombol Simpan ditekan
  if (name === 'theme_mode' || name.startsWith('custom_')) {
    applyPreview(updated);
  }
};

  // Fungsi khusus untuk mengubah file yang di-upload menjadi format Base64
  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran file terlalu besar! Maksimal 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, [fieldName]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!window.confirm("Simpan perubahan pengaturan?")) return;

  applyPreview(formData); // pastikan warna sudah sesuai yang terlihat sebelum submit
  setIsSaving(true);
  try {
    await fetch('http://localhost:5002/api/settings/bulk-update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    await fetchSettings(); // sinkronkan ulang dari server sebagai sumber kebenaran
    setIsSaving(false);
    alert("Pengaturan berhasil disimpan!");
  } catch (error) {
    console.error(error);
    setIsSaving(false);
    alert("Gagal menyimpan!");
  }
};

  const styles = {
    container: { maxWidth: '900px', margin: '0 auto', padding: '20px 0', paddingBottom: '80px' },
    section: { backgroundColor: 'var(--theme-card)', borderRadius: '16px', padding: '30px', marginBottom: '24px', border: '1px solid var(--theme-border)' },
    sectionTitle: { fontSize: '18px', fontWeight: '700', color: 'var(--theme-text-main)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px dashed var(--theme-border)', paddingBottom: '12px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' },
    label: { fontSize: '12px', fontWeight: '700', color: 'var(--theme-text-muted)', textTransform: 'uppercase' },
    input: { padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--theme-border)', width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text-main)' },
    toggleRow: { display: 'flex', gap: '10px', marginBottom: '6px' },
    toggleBtn: (active) => ({ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: active ? 'var(--theme-accent)' : '#e2e8f0', color: active ? 'var(--theme-accent-text)' : '#475569' }),
    previewImg: { width: '45px', height: '45px', objectFit: 'contain', borderRadius: '6px', border: '1px solid var(--theme-border)', marginTop: '5px', backgroundColor: '#fff' },
    textarea: { padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--theme-border)', width: '100%', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box', backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text-main)' },
    button: { width: '100%', padding: '16px', backgroundColor: 'var(--theme-accent)', color: 'var(--theme-accent-text)', borderRadius: '12px', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '16px' }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit}>
        
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}><LayoutTemplate size={20} color="var(--theme-accent)" /> Identitas, Logo & Gambar</h3>
          <div style={styles.grid}>
            <div style={styles.inputGroup}><label style={styles.label}>Nama Sekolah</label><input type="text" name="school_name" value={formData.school_name} onChange={handleChange} style={styles.input} /></div>
            <div style={styles.inputGroup}><label style={styles.label}>Akreditasi / Tagline</label><input type="text" name="school_accreditation" value={formData.school_accreditation} onChange={handleChange} style={styles.input} /></div>
            
            {/* Input Logo Sekolah (Bisa Upload atau URL) */}
            <div style={styles.inputGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={styles.label}>Logo Sekolah (Icon)</label>
                <div style={styles.toggleRow}>
                  <button type="button" onClick={() => setLogoMode('url')} style={styles.toggleBtn(logoMode === 'url')}>URL</button>
                  <button type="button" onClick={() => setLogoMode('file')} style={styles.toggleBtn(logoMode === 'file')}>Upload File</button>
                </div>
              </div>
              {logoMode === 'url' ? (
                <input type="text" name="school_logo" value={formData.school_logo} onChange={handleChange} style={styles.input} placeholder="https://..." />
              ) : (
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'school_logo')} style={styles.input} />
              )}
              {formData.school_logo && <img src={formData.school_logo} alt="Preview Logo" style={styles.previewImg} />}
            </div>

            {/* Input Foto Profil Sekolah (Bisa Upload atau URL) */}
            <div style={styles.inputGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={styles.label}>Foto Profil / Visi Sekolah</label>
                <div style={styles.toggleRow}>
                  <button type="button" onClick={() => setProfileMode('url')} style={styles.toggleBtn(profileMode === 'url')}>URL</button>
                  <button type="button" onClick={() => setProfileMode('file')} style={styles.toggleBtn(profileMode === 'file')}>Upload File</button>
                </div>
              </div>
              {profileMode === 'url' ? (
                <input type="text" name="school_profile_image" value={formData.school_profile_image} onChange={handleChange} style={styles.input} placeholder="https://..." />
              ) : (
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'school_profile_image')} style={styles.input} />
              )}
              {formData.school_profile_image && <img src={formData.school_profile_image} alt="Preview Profil" style={{...styles.previewImg, width: '80px', height: '50px'}} />}
            </div>
          </div>

          <div style={styles.inputGroup}><label style={styles.label}>Deskripsi Dashboard (Hero Atas)</label><textarea name="hero_description" value={formData.hero_description} onChange={handleChange} style={styles.textarea} /></div>
          <div style={styles.inputGroup}><label style={styles.label}>Deskripsi Footer & Profil Sekolah</label><textarea name="school_history" value={formData.school_history} onChange={handleChange} style={styles.textarea} /></div>
          <div style={styles.grid}>
            <div style={styles.inputGroup}><label style={styles.label}>Visi</label><textarea name="school_vision" value={formData.school_vision} onChange={handleChange} style={styles.textarea} /></div>
            <div style={styles.inputGroup}><label style={styles.label}>Misi (Pisahkan dengan ; )</label><textarea name="school_mission" value={formData.school_mission} onChange={handleChange} style={styles.textarea} /></div>
          </div>
        </div>

        {/* Bagian Tema & Kontak tetap sama seperti sebelumnya */}
        <div style={styles.section}>
          
          <div style={styles.grid}>
            <div style={styles.inputGroup}>
  {/* --- CUSTOM DROPDOWN TEMA BER-ICON --- */}
<div style={{ position: 'relative', width: '100%' }}>
  <label style={styles.label}>Pilih Tema Warna Web</label>
  
  <div 
    onClick={() => document.getElementById('theme-menu').classList.toggle('show')}
    style={{ ...styles.input, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Palette size={16} color="var(--theme-accent)"/>
      <span style={{ fontWeight: 'bold' }}>
        {THEME_GROUPS.flatMap(g => g.options).find(o => o.value === formData.theme_mode)?.label || 'Pilih Tema...'}
      </span>
    </div>
    <ChevronDown size={16} color="var(--theme-text-muted)" />
  </div>

  <div id="theme-menu" style={{ 
    display: 'none', position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, 
    background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '8px', 
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)', maxHeight: '300px', overflowY: 'auto', marginTop: '5px' 
  }}>
    {/* Gaya CSS kilat untuk toggle class .show */}
    <style>{`#theme-menu.show { display: block !important; }`}</style>
    
    {THEME_GROUPS.map((group, gIdx) => (
      <div key={gIdx}>
        <div style={{ padding: '10px 15px', background: 'var(--theme-bg)', fontSize: '11px', fontWeight: 'bold', color: 'var(--theme-text-muted)', textTransform: 'uppercase' }}>
          {group.label}
        </div>
        {group.options.map((opt) => (
          <div 
            key={opt.value} 
            onClick={() => {
              handleChange({ target: { name: 'theme_mode', value: opt.value } });
              document.getElementById('theme-menu').classList.remove('show');
            }}
            style={{ 
              padding: '12px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
              cursor: 'pointer', borderBottom: '1px solid var(--theme-border)', transition: 'background 0.2s',
              background: formData.theme_mode === opt.value ? 'var(--theme-bg)' : 'transparent'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--theme-bg)'}
            onMouseOut={(e) => e.currentTarget.style.background = formData.theme_mode === opt.value ? 'var(--theme-bg)' : 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {group.label === 'Gelap & Modern' ? <Moon size={16} color="#64748b"/> : 
               group.label.includes('Spesial') ? <Star size={16} color="#d97706"/> : 
               opt.value === 'custom' ? <Layout size={16} color="#2563eb"/> : <Sun size={16} color="#16a34a"/>}
              <span style={{ fontSize: '13px', color: 'var(--theme-text-main)' }}>{opt.label}</span>
            </div>
            {formData.theme_mode === opt.value && <Check size={16} color="var(--theme-accent)" />}
          </div>
        ))}
      </div>
    ))}
  </div>
</div>
</div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Gaya Font</label>
              <select name="font_family" value={formData.font_family} onChange={handleChange} style={styles.input}>
                <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                <option value="Inter">Inter</option>
                <option value="Poppins">Poppins</option>
              </select>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}><MapPin size={20} color="var(--theme-accent)" /> Kontak & Maps</h3>
          <div style={styles.grid}>
            <div style={styles.inputGroup}><label style={styles.label}>Telepon</label><input type="text" name="contact_phone" value={formData.contact_phone} onChange={handleChange} style={styles.input} /></div>
            <div style={styles.inputGroup}><label style={styles.label}>Email</label><input type="text" name="contact_email" value={formData.contact_email} onChange={handleChange} style={styles.input} /></div>
            <div style={styles.inputGroup}><label style={styles.label}>Facebook URL</label><input type="url" name="social_facebook" value={formData.social_facebook} onChange={handleChange} style={styles.input} /></div>
            <div style={styles.inputGroup}><label style={styles.label}>Instagram URL</label><input type="url" name="social_instagram" value={formData.social_instagram} onChange={handleChange} style={styles.input} /></div>
            <div style={styles.inputGroup}><label style={styles.label}>YouTube URL</label><input type="url" name="social_youtube" value={formData.social_youtube} onChange={handleChange} style={styles.input} /></div>
            <div style={styles.inputGroup}><label style={styles.label}>TikTok URL</label><input type="url" name="social_tiktok" value={formData.social_tiktok} onChange={handleChange} style={styles.input} /></div>
            <div style={styles.inputGroup}><label style={styles.label}>Twitter / X URL</label><input type="url" name="social_twitter" value={formData.social_twitter} onChange={handleChange} style={styles.input} /></div>
            <div style={styles.inputGroup}><label style={styles.label}>Embed Google Maps</label><input type="text" name="contact_map_embed_url" value={formData.contact_map_embed_url} onChange={handleChange} style={styles.input} placeholder="https://www.google.com/maps/embed?pb=..." /></div>
          </div>
          <div stylestyles={styles.inputGroup}><label style={styles.label}>Alamat Lengkap</label><textarea name="contact_address" value={formData.contact_address} onChange={handleChange} style={{...styles.textarea, minHeight:'60px'}} /></div>
        </div>

        <button type="submit" style={styles.button}>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan & Restart UI'}</button>
      </form>
    </div>
  );
}