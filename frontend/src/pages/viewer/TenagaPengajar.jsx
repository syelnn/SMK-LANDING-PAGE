import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../css/viewer/tenagapengajar.css';

export default function TenagaPengajarViewer() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://localhost:5002/api';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_URL}/teacher`);
        
        const activeTeachers = (res.data.data || []).filter(
          t => t.show === 1 || t.show === true || t.show === undefined
        );
        
        activeTeachers.sort((a, b) => (a.sort_order || a.sortOrder || 0) - (b.sort_order || b.sortOrder || 0));
        
        setTeachers(activeTeachers);
        setLoading(false);
      } catch (error) {
        console.error('Gagal memuat data pengajar:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const principal = teachers.find(t => t.role && t.role.toLowerCase().includes('kepala'));
  const staff = teachers.filter(t => !t.role || !t.role.toLowerCase().includes('kepala'));

  if (loading) return <div className="tp-wrapper-light"><div className="section-container"><p style={{textAlign: 'center', color: 'var(--compreng-text-secondary, #475569)'}}>Memuat data pengajar...</p></div></div>;

  return (
    // INI KUNCI UTAMANYA: tp-wrapper-light akan memaksakan background putih
    <div className="tp-wrapper-light">
      <div className="section-container">
        
        <div className="section-header">
          <span className="section-tag">TENAGA PENGAJAR</span>
          <h2 className="section-title">Guru <span>profesional dan berpengalaman</span> di bidangnya</h2>
          <p className="section-desc">Pilar utama pembentuk karakter dan kompetensi siswa SMK Negeri Compreng.</p>
        </div>

        {/* KARTU KEPALA SEKOLAH */}
        {principal && (
          <div className="principal-wrapper">
            <div className="teacher-card-light principal-card">
              <div className="teacher-photo-light">
                <img src={principal.photo || 'https://via.placeholder.com/150'} alt={principal.name} />
              </div>
              <h3 className="teacher-name-light">{principal.name}</h3>
              <span className="teacher-role-light highlight-role">{principal.role}</span>
            </div>
          </div>
        )}

        {/* STAF PENGAJAR - HORIZONTAL SCROLL TANPA SCROLLBAR BAWAH */}
        {staff.length > 0 && (
          <div className="staff-scroll-container">
            {staff.map((teacher) => (
              <div className="teacher-card-light" key={teacher.id}>
                <div className="teacher-photo-light">
                  <img src={teacher.photo || 'https://via.placeholder.com/150'} alt={teacher.name} />
                </div>
                <h3 className="teacher-name-light">{teacher.name}</h3>
                <span className="teacher-role-light">{teacher.role}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}