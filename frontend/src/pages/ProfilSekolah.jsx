import React, { useContext } from 'react';
import { SettingsContext } from '../context/SettingsContext';
import schoolPhoto from '../assets/visi.jpg'; 

export default function ProfilSekolah() {
  const { settings } = useContext(SettingsContext);

  // Menggunakan key 'school_mission' sesuai dengan Supabase
  const rawMisi = settings.school_mission || "Menyiapkan lulusan yang beriman dan bertakwa kepada Tuhan Yang Maha Esa.;Menyiapkan lulusan yang siap bersaing di dunia usaha dan industri.;Menyiapkan lulusan yang kompeten dibidangnya.;Menyiapkan lulusan yang berjiwa wirausaha.;Menyiapkan lulusan yang cerdas membaca peluang usaha dan industri.";
  
  // Logika pintar: Memisahkan teks berdasarkan Enter (\n) atau titik koma (;).
  // Fungsi .replace() otomatis membuang angka manual (cth: "1. ", "2. ") agar tidak dobel.
  const listMisi = rawMisi
    .split(/\n|;/)
    .map(misi => misi.replace(/^\d+[\.\)]\s*/, '').trim())
    .filter(misi => misi.length > 0);

  return (
    <div className="profil-container">
      {/* Bagian Header Profil */}
      <div className="profil-header">
        <h1>Profil {settings.school_name || 'Sekolah'}</h1>
        <p>{settings.school_history || 'SMK Negeri Compreng berkomitmen mencetak lulusan yang unggul, profesional, berkarakter, serta siap bersaing di dunia industri maupun berwirausaha.'}</p>
      </div>
      
      {/* Bagian Foto Sekolah dengan Efek Hover */}
      <div className="section-container">
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginBottom: '30px' }}>
          <span className="section-tag">Tujuan Strategis</span>
          <h2 style={{ textAlign: 'center', width: '100%', marginTop: '10px' }}>Visi & Misi Sekolah</h2>
        </div>

        <div className="photo-hover-wrapper">
          <img 
            src={schoolPhoto} 
            alt="Kegiatan Siswa SMK" 
            className="school-image-zoom" 
          />
        </div>

        {/* Bagian Visi */}
        <div className="visi-card">
          <div className="visi-icon-wrapper">
            <svg className="visi-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.5 10c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h3c1.1 0 2-.9 2-2v-1c0-2.2-1.8-4-4-4H7v-1c0-.6.4-1 1-1h1c.6 0 1-.4 1-1V8c0-.6-.4-1-1-1h-1c-2.2 0-4 1.8-4 4zm11 0c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h3c1.1 0 2-.9 2-2v-1c0-2.2-1.8-4-4-4h-.5v-1c0-.6.4-1 1-1h1c.6 0 1-.4 1-1V8c0-.6-.4-1-1-1h-1c-2.2 0-4 1.8-4 4z" />
            </svg>
          </div>
          <span className="badge-title">VISI</span>
          <p className="visi-text">
            "{settings.school_vision || 'Mewujudkan peserta didik SMKN COMPRENG yang berkarakter, mampu mengikuti perkembangan zaman, memiliki jiwa wirausaha dan kompeten dibidangnya pada tahun 2026.'}"
          </p>
        </div>

        {/* Bagian Misi */}
        <div className="misi-section-title">
          <h3>MISI</h3>
        </div>

        <div className="misi-grid">
          {listMisi.map((misi, index) => (
            <div className="misi-card" key={index}>
              <div className="misi-number">{index + 1}</div>
              <p>{misi}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}