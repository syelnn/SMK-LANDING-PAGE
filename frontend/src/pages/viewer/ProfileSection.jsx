import React, { useContext } from 'react';
import { SettingsContext } from "../../context/SettingsContext";
import schoolPhoto from '../../assets/visi.jpg'; 
import '../../css/viewer/profileSection.css';

export default function ProfilSection() {
  const contextData = useContext(SettingsContext);

  // Ambil objek settings dari context (mendukung berbagai nama state)
  const settings = contextData?.settings || contextData?.siteData || contextData || {};

  // Debugging: Buka Console browser (F12) untuk melihat struktur data asli dari Admin
  console.log("Data Settings di Component:", settings);

  // Helper fleksibel untuk mengambil value dari Object maupun Array DB
  const getSettingValue = (key) => {
    if (!settings) return null;
    if (Array.isArray(settings)) {
      const found = settings.find(s => s.key === key || s.setting_key === key || s.name === key);
      return found ? (found.value !== undefined ? found.value : found.setting_value) : null;
    }
    return settings[key];
  };

 // Tambahkan 'school_profile_image' di urutan paling atas
  const rawPhoto = 
    getSettingValue('school_profile_image') || 
    getSettingValue('hero_image') || 
    getSettingValue('school_hero_photo') || 
    getSettingValue('school_photo') || 
    getSettingValue('photo');

  // 2. Format URL foto (Menangani path relatif dari server backend)
  const formatImageUrl = (path) => {
    if (!path) return schoolPhoto;
    if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    // Sesuaikan port 'http://localhost:5000' dengan port backend Anda jika berbeda
    return `http://localhost:5000${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const displayPhoto = formatImageUrl(rawPhoto);

  const schoolName = getSettingValue('school_name') || 'Sekolah';
  const schoolHistory = getSettingValue('school_history') || 'Mengenal lebih dekat dedikasi SMK Negeri Compreng dalam membentuk generasi masa depan yang tangguh di dunia digital.';
  const schoolVision = getSettingValue('school_vision') || 'Mewujudkan peserta didik SMKN COMPRENG yang berkarakter, mampu mengikuti perkembangan zaman, memiliki jiwa wirausaha dan kompeten dibidangnya pada tahun 2026.';
  
  const rawMisi = getSettingValue('school_mission') || "Menyiapkan lulusan yang beriman dan bertakwa kepada Tuhan Yang Maha Esa.;Menyiapkan lulusan yang siap bersaing di dunia usaha dan industri.;Menyiapkan lulusan yang kompeten dibidangnya.;Menyiapkan lulusan yang berjiwa wirausaha.;Menyiapkan lulusan yang cerdas membaca peluang usaha dan industri.";
  
  const listMisi = rawMisi
    .split(/\n|;/)
    .map(misi => misi.replace(/^\d+[\.\)]\s*/, '').trim())
    .filter(misi => misi.length > 0);

  return (
    <section id="section-profil" className="profil-page-wrapper">
      {/* Header Profil */}
      <div className="profil-header-section">
        <div className="profil-header">
          <h1>Profil {schoolName}</h1>
          <p>{schoolHistory}</p>
        </div>
      </div>
      
      {/* Konten Visi Misi */}
      <div className="section-container">
        <div className="section-title-wrapper">
          <span className="section-tag">Tujuan Strategis</span>
          <h2>Visi & Misi Sekolah</h2>
        </div>

        {/* Foto Sekolah Dinamis */}
        <div className="photo-hover-wrapper">
          <img 
            src={displayPhoto} 
            alt="Kegiatan Siswa SMK" 
            className="school-image-zoom" 
          />
        </div>

        {/* Card Visi */}
        <div className="visi-card">
          <div className="visi-icon-wrapper">
            <svg className="visi-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.5 10c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h3c1.1 0 2-.9 2-2v-1c0-2.2-1.8-4-4-4H7v-1c0-.6.4-1 1-1h1c.6 0 1-.4 1-1V8c0-.6-.4-1-1-1h-1c-2.2 0-4 1.8-4 4zm11 0c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h3c1.1 0 2-.9 2-2v-1c0-2.2-1.8-4-4-4h-.5v-1c0-.6.4-1 1-1h1c.6 0 1-.4 1-1V8c0-.6-.4-1-1-1h-1c-2.2 0-4 1.8-4 4z" />
            </svg>
          </div>
          <span className="badge-title">VISI</span>
          <p className="visi-text">"{schoolVision}"</p>
        </div>

        {/* Label Misi */}
        <div className="misi-section-title">
          <h3>MISI</h3>
        </div>

        {/* Grid Misi */}
        <div className="misi-grid">
          {listMisi.map((misi, index) => (
            <div className="misi-card" key={index}>
              <div className="misi-number">{index + 1}</div>
              <p>{misi}</p>
            </div>
          ))}
        </div>
      </div>
   </section>
  );
}