import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Code, Sprout, Wrench, Check, ArrowLeft } from 'lucide-react';
import Navbar from '../../components/Navbar'; 
import '../../css/viewer/detailkurikulum.css'; 
import '../../App.css'; 

export default function DetailKurikulumViewer() {
  const { slug } = useParams();

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

  const handleSaveScrollSinyal = () => {
    sessionStorage.setItem('scrollToSection', 'section-program');
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
          
          <Link 
            to="/" 
            onClick={handleSaveScrollSinyal} 
            className="dk-back-link"
          >
            <ArrowLeft size={16} /> Kembali ke Jurusan
          </Link>

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