import React, { useState, useEffect } from 'react';
import '../../css/viewer/testimoni.css';

export default function Testimoni() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicTestimonials = async () => {
      try {
        const response = await fetch('http://localhost:5002/api/testimonials/public');
        const result = await response.json();
        if (result.success || result.data) {
          const list = Array.isArray(result) ? result : (result.data || []);
          // Filter hanya yang show === 1
          setTestimonials(list.filter(t => t.show === 1 || t.show === true));
        }
        setLoading(false);
      } catch (error) {
        console.error('Gagal memuat testimoni:', error);
        setLoading(false);
      }
    };
    fetchPublicTestimonials();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '80px', color: '#64748b' }}>Memuat Testimoni...</div>;
  }

  return (
    <div id="section-testimoni" className="tampilan-testimoni-wrapper">
      <div className="tt-container">
        
        {/* HEADER */}
        <div className="tt-header">
          <span className="tt-badge">Testimoni</span>
          <h2 className="tt-title">
            Apa Kata Mereka <span style={{ color: '#16a34a' }}>Tentang Kami</span>
          </h2>
          <p className="tt-subtitle">
            Pengalaman nyata dan kesan dari siswa, alumni, serta orang tua murid SMK Negeri Compreng.
          </p>
        </div>

        {/* GRID TESTIMONI */}
        {testimonials.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Belum ada testimoni yang ditampilkan.</div>
        ) : (
          <div className="tt-grid">
            {testimonials.map((t, index) => (
              <div key={t.id || index} className="tt-card">
                <div>
                  <div className="tt-quote-icon">&ldquo;</div>
                  <p className="tt-quote-text">{t.quote}</p>
                </div>

                <div className="tt-profile">
                  {t.photo ? (
                    <img src={t.photo} alt={t.name} className="tt-avatar" />
                  ) : (
                    <div className="tt-avatar-initial">
                      {t.name ? t.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="tt-info">
                    <h4>{t.name}</h4>
                    <p>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}