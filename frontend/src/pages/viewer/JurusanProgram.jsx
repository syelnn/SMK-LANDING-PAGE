import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight } from 'lucide-react';
import '../../css/viewer/jurusanprogram.css';

export default function JurusanProgramViewer() {
  const [jurusanList, setJurusanList] = useState([]);
  const [programList, setProgramList] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://localhost:5002/api'; 

  const fetchData = async () => {
    try {
      const resJurusan = await axios.get(`${API_URL}/jurusan`);
      const resProgram = await axios.get(`${API_URL}/program`);
      setJurusanList(resJurusan.data.data || []);
      setProgramList(resProgram.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Gagal memuat data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="vp-full-wrapper">
        <div className="vp-container">
          <p className="vp-loading">Memuat data jurusan dan program...</p>
        </div>
      </div>
    );
  }

  return (
    /* TAMBAHAN UTAMA: Wrapper full-width untuk menimpa background gelap */
    <div className="vp-full-wrapper">
      <div className="vp-container">
        
        {/* ================= BAGIAN 1: JURUSAN ================= */}
        <div className="vp-header">
          <span className="vp-tag">Kompetensi Keahlian</span>
          <h2 className="vp-title">Pilih Jurusan Masa Depan <span className="vp-highlight">Cemerlang Anda</span></h2>
          <p className="vp-desc">Kurikulum dirancang berbasis industri untuk mencetak lulusan yang siap kerja, mandiri, dan kompeten.</p>
        </div>

        <div className="vp-jurusan-grid">
          {jurusanList.map((item) => {
            const subjectArray = item.subjects ? item.subjects.split(',') : [];
            return (
              <div className="vp-jurusan-card" key={item.id}>
                <div className="vp-card-content">
                  <img 
                    src={item.imageIcon || 'https://via.placeholder.com/60'} 
                    alt={item.title} 
                    className="vp-jurusan-icon"
                  />
                  <h3 className="vp-card-title">{item.title}</h3>
                  <p className="vp-card-text">{item.desc}</p>
                  <ul className="vp-card-list">
                    {subjectArray.map((sub, idx) => (
                      <li key={idx}>{sub.trim()}</li>
                    ))}
                  </ul>
                </div>
                <div className="vp-card-footer">
                <Link to={`/jurusan/detail-kurikulum/${item.slug}`} className="vp-link-btn">
                  DETAIL KURIKULUM <ArrowRight size={14} />
                </Link>
                </div>
              </div>
            );
          })}
        </div>

        <hr className="vp-divider" />

        {/* ================= BAGIAN 2: PROGRAM UNGGULAN ================= */}
        <div className="vp-header">
          <span className="vp-tag vp-tag-alt">Jalur Masa Depan</span>
          <h2 className="vp-title">Program Unggulan <span className="vp-highlight">SMKN Compreng</span></h2>
          <p className="vp-desc">Pilihan jalur karier komprehensif yang dirancang untuk mengantar setiap siswa menuju gerbang kesuksesan.</p>
        </div>

        <div className="vp-program-grid">
          {programList.map((prog) => (
            <div className="vp-program-card" key={prog.id}>
              <div className="vp-program-icon">
                <img src={prog.imageIcon || 'https://via.placeholder.com/40'} alt={prog.title} />
              </div>
              {prog.badge && (
                <span className="vp-program-badge">{prog.badge}</span>
              )}
              <h3 className="vp-program-title">{prog.title}</h3>
              <p className="vp-program-desc">{prog.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}