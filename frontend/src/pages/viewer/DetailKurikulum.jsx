import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Code, Sprout, Wrench, Check, ArrowLeft, ChevronRight } from 'lucide-react';
import Navbar from '../../components/Navbar'; 
import '../../css/viewer/detailkurikulum.css'; 
import '../../App.css'; 

export default function DetailKurikulumViewer() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const dataKurikulum = {
    rpl: {
      title: 'Kurikulum PPLG / RPL',
      subtitle: 'Pengembangan Perangkat Lunak dan Gim',
      desc: 'Pengembangan Perangkat Lunak dan Gim (PPLG) atau RPL adalah cabang ilmu IT yang mempelajari konsep logika, bahasa pemrograman, dan perancangan UI/UX dengan memanfaatkan teknologi terbaru untuk menciptakan aplikasi web, mobile, maupun gim yang inovatif.',
      icon: <Code size={36} />,
      badgeColor: '#16a34a',
      subjects: ['Frontend Web Development', 'Backend & API Engineering', 'Mobile App Development', 'UI/UX Design', 'Database Management', 'Game Engine Basics'],
      career: ['Software Engineer', 'Fullstack Developer', 'Mobile Developer', 'UI/UX Designer', 'IT Consultant', 'Game Developer']
    },
    atph: {
      title: 'Kurikulum ATPH',
      subtitle: 'Agribisnis Tanaman Pangan & Hortikultura',
      desc: 'Agribisnis Tanaman Pangan dan Hortikultura (ATPH) adalah jurusan yang mempelajari teknik pertanian presisi, pengelolaan lahan organik/anorganik, pemanfaatan alat pertanian modern, hingga agribisnis digital untuk menciptakan ketahanan pangan yang berkelanjutan.',
      icon: <Sprout size={36} />,
      badgeColor: '#d97706',
      subjects: ['Agronomi Tanaman Pangan', 'Teknik Hidroponik & Vertikultur', 'Pemberantasan Hama Terpadu', 'Digital Marketing Produk Tani', 'Kultur Jaringan', 'Manajemen Agribisnis'],
      career: ['Agricultural Entrepreneur', 'Agronomist Modern', 'Konsultan Pertanian', 'Manajer Produksi Perkebunan', 'Penyuluh Pertanian']
    },
    tbsm: {
      title: 'Kurikulum TBSM',
      subtitle: 'Teknik dan Bisnis Sepeda Motor',
      desc: 'Teknik dan Bisnis Sepeda Motor (TBSM) fokus pada penguasaan teknologi otomotif roda dua, mulai dari pembongkaran mesin, diagnosa kerusakan sistem injeksi menggunakan alat Scanner, kelistrikan kendaraan, hingga manajemen wirausaha bengkel profesional.',
      icon: <Wrench size={36} />,
      badgeColor: '#2563eb',
      subjects: ['Overhaul Mesin Sepeda Motor', 'Sistem Bahan Bakar Injeksi (Fi)', 'Kelistrikan & Chasis', 'Kewirausahaan Bengkel Mandiri', 'Diagnosa Kerusakan (Scanner)', 'Manajemen Sparepart'],
      career: ['Mechanic Expert Authorized', 'Service Advisor', 'Entrepreneur Bengkel Mandiri', 'Modifikator Profesional', 'Quality Control Pabrik Otomotif']
    }
  };

  const current = dataKurikulum[slug] || dataKurikulum['rpl'];
// =========================================================================
  // FUNGSI KEMBALI (Meniru NewsDetail, Tanpa Sentuh Landing Page)
  // =========================================================================
  const handleGoToProgramSection = (e) => {
    e.preventDefault();
    
    // 1. Ubah URL langsung ke /program
    navigate('/program'); 

    // 2. Fungsi untuk men-scroll ke section program
    const scrollToProgram = () => {
      const element = document.getElementById('section-program');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    };

    // 3. Tembak scroll 3 kali dari sini!
    // Kenapa 3 kali? Untuk mengejar target section-program yang terdorong ke bawah 
    // akibat gambar-gambar berita yang baru selesai loading beberapa milidetik kemudian.
    setTimeout(scrollToProgram, 100);  // Tarikan awal
    setTimeout(scrollToProgram, 600);  // Tarikan koreksi setelah kerangka berita muncul
    setTimeout(scrollToProgram, 1300); // Tarikan final agar pas di posisi program
  };

  return (
    <>
      <Navbar /> 
      
      <div 
        className="dk-wrapper" 
        style={{ 
          '--badge-color': current.badgeColor, 
          '--badge-bg': `${current.badgeColor}15` 
        }}
      >
        <div className="dk-container">
          
          {/* Breadcrumb Navigasi */}
          <nav className="dk-breadcrumb" aria-label="Breadcrumb" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600' }}>
            <Link to="/" style={{ color: 'var(--compreng-text-secondary, #475569)', textDecoration: 'none' }}>BERANDA</Link>
            <ChevronRight size={14} style={{ color: 'var(--compreng-text-secondary, #475569)' }} />
            <a href="/program" onClick={handleGoToProgramSection} style={{ color: 'var(--compreng-text-secondary, #475569)', textDecoration: 'none' }}>JURUSAN & PROGRAM</a>
            <ChevronRight size={14} style={{ color: 'var(--compreng-text-secondary, #475569)' }} />
            <span style={{ color: 'var(--compreng-text, #0f172a)' }}>{current.title}</span>
          </nav>

          <div className="dk-header">
            <div className="dk-icon-box">{current.icon}</div>
            <span className="dk-tagline">Program Keahlian</span>
            <h1 className="dk-title">{current.title}</h1>
            <p className="dk-subtitle">"{current.subtitle}"</p>
          </div>

          <div className="dk-body-row">
            <div className="dk-col-left">
              <h3 className="dk-section-title">Gambaran Umum</h3>
              <p className="dk-desc-text">{current.desc}</p>
              <h3 className="dk-section-title" style={{ marginBottom: '20px' }}>Mata Pelajaran Unggulan</h3>
              <div className="dk-subjects-grid">
                {current.subjects.map((item, idx) => (
                  <div key={idx} className="dk-subject-card">
                    <div className="dk-subject-dot"></div> 
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="dk-col-right">
              <div className="dk-career-card">
                <div className="dk-career-ornament"></div>
                <h3 className="dk-career-title">Prospek Karir</h3>
                <div className="dk-career-list">
                  {current.career.map((car, idx) => (
                    <div key={idx} className="dk-career-item">
                      <Check size={16} color={current.badgeColor} style={{ flexShrink: 0 }} /> 
                      {car}
                    </div>
                  ))}
                </div>
                <p className="dk-career-footer">Siap kerja, siap kuliah, siap berwirausaha!</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}