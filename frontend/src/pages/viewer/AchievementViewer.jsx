import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Award, Loader2, Sparkles } from 'lucide-react';
import '../../css/viewer/AchievementViewer.css';

// Helper agar teks otomatis huruf Kapital Awal Kata (Title Case) seperti Gambar 2
const toTitleCase = (str) => {
  if (!str) return '';
  return str.toLowerCase().replace(/(?:^|\s|-)\S/g, (m) => m.toUpperCase());
};

const AchievementViewer = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://localhost:5002/api/achievements';

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      if (res.data && res.data.data) {
        setAchievements(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching viewer achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  return (
    <div className="achievement-viewer-container" id="section-prestasi">
      {/* HERO SECTION */}
      <section className="achievement-hero">
        <div className="hero-content17">
          <span className="hero-badge-pill117">
            <Sparkles size={14} className="icon-sparkle" /> KARYA & PRESTASI
          </span>

          <h1 className="hero-title17">
            Karya <span className="highlight-text">& Prestasi</span> Taruna/i SMKN COMPRENG
          </h1>

          <p className="hero-subtitle17">
            Apresiasi atas kerja keras, inovasi, dan dedikasi luar biasa para siswa/i SMK Negeri Compreng dalam mengharumkan nama sekolah.
          </p>
        </div>
      </section>

      {/* GRID SECTION */}
      <section className="achievement-grid-section">
        {loading ? (
          <div className="loading-state">
            <Loader2 className="animate-spin" size={32} />
            <p>Memuat data karya & prestasi...</p>
          </div>
        ) : achievements.length === 0 ? (
          <div className="empty-state">
            <Award size={44} />
            <h3>Belum Ada Prestasi Ditemukan</h3>
            <p>Data karya & prestasi belum tersedia.</p>
          </div>
        ) : (
          <div className="achievement-grid">
            {achievements.map((item) => (
              <div className="achievement-card" key={item.id}>
                {/* Banner Image */}
                <div className="card-image-box">
                  {item.photo ? (
                    <img
                      src={item.photo}
                      alt={item.student_name}
                      className="card-img"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/400x220?text=Foto+Prestasi';
                      }}
                    />
                  ) : (
                    <div className="card-img-placeholder">
                      <Award size={36} />
                    </div>
                  )}

                  {/* Top Level Badge */}
                  <span className={`card-top-level level-${item.level?.toLowerCase() || 'nasional'}`}>
                    {item.level || 'Nasional'}
                  </span>
                </div>

                {/* Content Body */}
                <div className="card-body">
                  {/* Nama Siswa */}
                  <h3 className="student-name">{item.student_name || 'Siswa SMKN Compreng'}</h3>
                  
                  {/* Kelas */}
                  <p className="student-class">
                    {item.class_name ? item.class_name : 'SMKN Compreng'}
                  </p>

                  {/* Judul Prestasi / Lomba (Font & Style Presisi Gambar 2) */}
                  <h4 className="achievement-title" title={item.achievement}>
                    {toTitleCase(item.achievement)}
                  </h4>

                  {/* Footer Tag Tahun */}
                  <div className="card-footer-tags">
                    <span className="footer-tag year-tag">{item.year || '2026'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AchievementViewer;