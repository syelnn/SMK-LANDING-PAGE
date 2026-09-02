import React, { useState, useContext, useEffect } from 'react';
import { SettingsContext } from '../context/SettingsContext';
import { Save, LayoutTemplate, MapPin, Share2, Palette } from 'lucide-react';

export default function ManageSettings() {
  const { settings, fetchSettings, setIsMaintenance } = useContext(SettingsContext);
  const [isSaving, setIsSaving] = useState(false);

  const defaultData = {
    school_name: 'SMKN Compreng',
    school_accreditation: 'Terakreditasi A',
    hero_description: 'Membangun Generasi Cerdas, Berkarakter, dan Berprestasi.',
    school_history: 'Sekolah ini berdedikasi mencetak lulusan siap kerja.',
    school_vision: 'Mewujudkan peserta didik yang berkarakter...',
    school_mission: '1. Meningkatkan kualitas pendidikan\n2. Menyiapkan lulusan siap kerja',
    
    theme_mode: 'emerald_gold', // Default ke tema resmi hijau
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

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!window.confirm("Simpan perubahan tema?")) return;
    setIsSaving(true); setIsMaintenance(true);
    try {
      await fetch('http://localhost:5002/api/settings/bulk-update', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      setTimeout(async () => { await fetchSettings(); setIsMaintenance(false); setIsSaving(false); }, 2500);
    } catch (error) {
      console.error(error); setIsMaintenance(false); setIsSaving(false); alert("Gagal menyimpan!");
    }
  };

  // GANTI VARIABEL STYLES INI DI MANAGESETTINGS.JSX
  const styles = {
    container: { maxWidth: '900px', margin: '0 auto', padding: '20px 0', paddingBottom: '80px' },
    section: { backgroundColor: 'var(--theme-card)', borderRadius: '16px', padding: '30px', marginBottom: '24px', border: '1px solid var(--theme-border)' },
    sectionTitle: { fontSize: '18px', fontWeight: '700', color: 'var(--theme-text-main)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px dashed var(--theme-border)', paddingBottom: '12px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' },
    label: { fontSize: '12px', fontWeight: '700', color: 'var(--theme-text-muted)', textTransform: 'uppercase' },
    input: { padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--theme-border)', width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text-main)' },
    colorBox: { display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: 'var(--theme-bg)', border: '1px solid var(--theme-border)', borderRadius: '8px', padding: '4px 10px' },
    textarea: { padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--theme-border)', width: '100%', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box', backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text-main)' },
    button: { width: '100%', padding: '16px', backgroundColor: 'var(--theme-accent)', color: 'var(--theme-accent-text)', borderRadius: '12px', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '16px' }
  };
  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit}>
        
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}><LayoutTemplate size={20} color="var(--theme-accent)" /> Identitas & Teks</h3>
          <div style={styles.grid}>
            <div style={styles.inputGroup}><label style={styles.label}>Nama Sekolah</label><input type="text" name="school_name" value={formData.school_name} onChange={handleChange} style={styles.input} /></div>
            <div style={styles.inputGroup}><label style={styles.label}>Akreditasi / Tagline</label><input type="text" name="school_accreditation" value={formData.school_accreditation} onChange={handleChange} style={styles.input} /></div>
          </div>
          <div style={styles.inputGroup}><label style={styles.label}>Deskripsi Dashboard (Hero Atas)</label><textarea name="hero_description" value={formData.hero_description} onChange={handleChange} style={styles.textarea} /></div>
          <div style={styles.inputGroup}><label style={styles.label}>Deskripsi Footer & Profil Sekolah</label><textarea name="school_history" value={formData.school_history} onChange={handleChange} style={styles.textarea} /></div>
          <div style={styles.grid}>
            <div style={styles.inputGroup}><label style={styles.label}>Visi</label><textarea name="school_vision" value={formData.school_vision} onChange={handleChange} style={styles.textarea} /></div>
            <div style={styles.inputGroup}><label style={styles.label}>Misi (Pisahkan dengan ; )</label><textarea name="school_mission" value={formData.school_mission} onChange={handleChange} style={styles.textarea} /></div>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}><Palette size={20} color="var(--theme-accent)" /> Tema & Palet Warna</h3>
          <div style={styles.grid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Pilih Tema Warna Web</label>
              <select name="theme_mode" value={formData.theme_mode} onChange={handleChange} style={styles.input}>
                <option value="emerald_gold">Emerald Gold (Hijau Resmi)</option>
                <option value="golden_nature">Golden Nature (Aksen Kuning)</option>
                <option value="fresh_compreng">Fresh Compreng (Cerah)</option>
                <option value="compreng_default">Navy Default (Klasik)</option>
                <option value="dark_olive">Dark Mode (Gelap)</option>
                <option value="custom">Kustomisasi Bebas</option>
              </select>
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
          
          {formData.theme_mode === 'custom' && (
            <div style={{ marginTop: '10px', backgroundColor: 'var(--theme-bg)', padding: '20px', borderRadius: '12px', border: '1px dashed var(--theme-border)' }}>
              <p style={{fontSize: '14px', marginBottom: '20px', fontWeight: 'bold', color: 'var(--theme-text-main)'}}>Kustomisasi Warna Penuh</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div style={styles.inputGroup}><label style={styles.label}>Latar Web (BG)</label><div style={styles.colorBox}><input type="color" name="custom_bg" value={formData.custom_bg} onChange={handleChange} style={{border:'none', width:'30px', background:'none'}} /><input type="text" name="custom_bg" value={formData.custom_bg} onChange={handleChange} style={{border:'none', outline:'none', background:'none', width:'100%', color:'var(--theme-text-main)'}} /></div></div>
                <div style={styles.inputGroup}><label style={styles.label}>Latar Kotak (Card)</label><div style={styles.colorBox}><input type="color" name="custom_card" value={formData.custom_card} onChange={handleChange} style={{border:'none', width:'30px', background:'none'}} /><input type="text" name="custom_card" value={formData.custom_card} onChange={handleChange} style={{border:'none', outline:'none', background:'none', width:'100%', color:'var(--theme-text-main)'}} /></div></div>
                <div style={styles.inputGroup}><label style={styles.label}>Teks Judul Utama</label><div style={styles.colorBox}><input type="color" name="custom_text_main" value={formData.custom_text_main} onChange={handleChange} style={{border:'none', width:'30px', background:'none'}} /><input type="text" name="custom_text_main" value={formData.custom_text_main} onChange={handleChange} style={{border:'none', outline:'none', background:'none', width:'100%', color:'var(--theme-text-main)'}} /></div></div>
                <div style={styles.inputGroup}><label style={styles.label}>Teks Paragraf / Deskripsi</label><div style={styles.colorBox}><input type="color" name="custom_text_muted" value={formData.custom_text_muted} onChange={handleChange} style={{border:'none', width:'30px', background:'none'}} /><input type="text" name="custom_text_muted" value={formData.custom_text_muted} onChange={handleChange} style={{border:'none', outline:'none', background:'none', width:'100%', color:'var(--theme-text-main)'}} /></div></div>
                <div style={styles.inputGroup}><label style={styles.label}>Aksen (Tombol & Lencana)</label><div style={styles.colorBox}><input type="color" name="custom_accent" value={formData.custom_accent} onChange={handleChange} style={{border:'none', width:'30px', background:'none'}} /><input type="text" name="custom_accent" value={formData.custom_accent} onChange={handleChange} style={{border:'none', outline:'none', background:'none', width:'100%', color:'var(--theme-text-main)'}} /></div></div>
                <div style={styles.inputGroup}><label style={styles.label}>Teks di Dalam Tombol</label><div style={styles.colorBox}><input type="color" name="custom_accent_text" value={formData.custom_accent_text} onChange={handleChange} style={{border:'none', width:'30px', background:'none'}} /><input type="text" name="custom_accent_text" value={formData.custom_accent_text} onChange={handleChange} style={{border:'none', outline:'none', background:'none', width:'100%', color:'var(--theme-text-main)'}} /></div></div>
                <div style={styles.inputGroup}><label style={styles.label}>Latar Navbar & Footer</label><div style={styles.colorBox}><input type="color" name="custom_nav_bg" value={formData.custom_nav_bg} onChange={handleChange} style={{border:'none', width:'30px', background:'none'}} /><input type="text" name="custom_nav_bg" value={formData.custom_nav_bg} onChange={handleChange} style={{border:'none', outline:'none', background:'none', width:'100%', color:'var(--theme-text-main)'}} /></div></div>
                <div style={styles.inputGroup}><label style={styles.label}>Teks Navbar & Footer</label><div style={styles.colorBox}><input type="color" name="custom_nav_text" value={formData.custom_nav_text} onChange={handleChange} style={{border:'none', width:'30px', background:'none'}} /><input type="text" name="custom_nav_text" value={formData.custom_nav_text} onChange={handleChange} style={{border:'none', outline:'none', background:'none', width:'100%', color:'var(--theme-text-main)'}} /></div></div>
                <div style={styles.inputGroup}><label style={styles.label}>Garis Tepi (Border)</label><div style={styles.colorBox}><input type="color" name="custom_border" value={formData.custom_border} onChange={handleChange} style={{border:'none', width:'30px', background:'none'}} /><input type="text" name="custom_border" value={formData.custom_border} onChange={handleChange} style={{border:'none', outline:'none', background:'none', width:'100%', color:'var(--theme-text-main)'}} /></div></div>
              </div>
            </div>
          )}
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
          <div style={styles.inputGroup}><label style={styles.label}>Alamat Lengkap</label><textarea name="contact_address" value={formData.contact_address} onChange={handleChange} style={{...styles.textarea, minHeight:'60px'}} /></div>
        </div>

        <button type="submit" style={styles.button}>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan & Restart UI'}</button>
      </form>
    </div>
  );
}