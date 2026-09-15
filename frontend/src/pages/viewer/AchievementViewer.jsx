import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Award, Trophy, Medal, Loader2 } from 'lucide-react';
import '../../css/viewer/AchievementViewer.css';

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

  // Helper untuk menentukan Ikon Lucide & class warnanya berdasarkan nilai 'medal'
  const renderMedalIcon = (medal) => {
    if (!medal) return null;
    const m = medal.toLowerCase();

    if (m === 'gold' || m === 'emas' || m === 'juara 1') {
      return <Trophy className="icon-gold" title="Juara 1 / Emas" />;
    }
    if (m === 'silver' || m === 'perak' || m === 'juara 2') {
      return <Medal className="icon-silver" title="Juara 2 / Perak" />;
    }
    if (m === 'bronze' || m === 'perunggu' || m === 'juara 3') {
      return <Award className="icon-bronze" title="Juara 3 / Perunggu" />;
    }

    return <Award className="icon-default" title={medal} />;
  };

  return (
    <div className="achievement-viewer-container" id="section-prestasi">
      {/* 1. HERO / BANNER SECTION */}
      <section className="achievement-hero">
        <div className="hero-content17">
          <span className="hero-badge-pill117">KARYA & PRESTASI</span>

          <h1 className="hero-title17">
           Karya <span className="highlight-text">& Prestasi</span> Taruna/i SMKN COMPRENG
          </h1>

          <p className="hero-subtitle17">
            Pilar utama pembentuk karakter, inovasi, dan kompetensi siswa SMK Negeri Compreng.
          </p>
        </div>
      </section>

      {/* 2. GRID CONTENT SECTION */}
      <section className="achievement-grid-section">
        {loading ? (
          <div className="loading-state">
            <Loader2 className="animate-spin" size={32} />
            <p>Memuat data karya & prestasi...</p>
          </div>
        ) : achievements.length === 0 ? (
          <div className="empty-state">
            <Award size={40} />
            <h3>Belum Ada Prestasi Ditemukan</h3>
            <p>Data karya & prestasi belum tersedia.</p>
          </div>
        ) : (
          <div className="achievement-grid">
            {achievements.map((item) => (
              <div className="achievement-card" key={item.id}>
                {/* Image Container */}
                <div className="card-image-wrapper">
                  {item.photo ? (
                    <img
                      src={item.photo}
                      alt={item.student_name}
                      className="card-img"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/400x250?text=Foto+Tidak+Tersedia';
                      }}
                    />
                  ) : (
                    <div className="card-img-placeholder">
                      <span>{item.student_name ? item.student_name.charAt(0).toUpperCase() : '?'}</span>
                    </div>
                  )}

                  {/* BADGE LEVEL (Kembali di Kanan Atas Gambar) */}
                  <span className={`level-badge level-${item.level?.toLowerCase() || 'nasional'}`}>
                    {item.level || 'Nasional'}
                  </span>
                </div>

                {/* Card Body */}
                <div className="card-body">
                  {/* Baris Meta: Kelas/Tahun (Kiri) & Medali/Piala (Kanan) */}
                  <div className="card-meta-row">
                    <span className="card-category-tag">
                      {item.class_name || item.category || 'PRESTASI SISWA'} {item.year ? `• ${item.year}` : ''}
                    </span>

                    {item.medal && (
                      <span className={`medal-pill-badge medal-pill-${item.medal.toLowerCase()}`}>
                        {renderMedalIcon(item.medal)}
                        <span>{item.medal}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="achievement-title" title={item.achievement}>
                    {item.achievement}
                  </h3>

                  <p className="achievement-desc">
                    Selamat & Sukses atas prestasi membanggakan yang diraih oleh{' '}
                    <strong>{item.student_name}</strong>
                    {item.class_name ? ` (${item.class_name})` : ''} dalam ajang ini.
                  </p>
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