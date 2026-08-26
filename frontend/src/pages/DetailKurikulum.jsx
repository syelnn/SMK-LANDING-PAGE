import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Code, Sprout, Wrench, Check, ArrowLeft, MousePointerClick } from 'lucide-react';
import '../App.css';

export default function DetailKurikulum() {
  const { slug } = useParams();

  // Data detail berdasarkan slug jurusan
  const dataKurikulum = {
    rpl: {
      title: 'Kurikulum PPLG / RPL',
      subtitle: 'Pengembangan Perangkat Lunak dan Gim',
      desc: 'Pengembangan Perangkat Lunak dan Gim (PPLG) atau RPL adalah cabang ilmu IT yang mempelajari konsep logika, bahasa pemrograman, dan perancangan UI/UX dengan memanfaatkan teknologi terbaru untuk menciptakan aplikasi web, mobile, maupun gim yang inovatif.',
      icon: <Code size={36} />,
      badgeColor: '#16a34a', // Hijau
      subjects: ['Frontend Web Development', 'Backend & API Engineering', 'Mobile App Development', 'UI/UX Design', 'Database Management', 'Game Engine Basics'],
      career: ['Software Engineer', 'Fullstack Developer', 'Mobile Developer', 'UI/UX Designer', 'IT Consultant', 'Game Developer']
    },
    atph: {
      title: 'Kurikulum ATPH',
      subtitle: 'Agribisnis Tanaman Pangan & Hortikultura',
      desc: 'Agribisnis Tanaman Pangan dan Hortikultura (ATPH) adalah jurusan yang mempelajari teknik pertanian presisi, pengelolaan lahan organik/anorganik, pemanfaatan alat pertanian modern, hingga agribisnis digital untuk menciptakan ketahanan pangan yang berkelanjutan.',
      icon: <Sprout size={36} />,
      badgeColor: '#d97706', // Oranye/Emas
      subjects: ['Agronomi Tanaman Pangan', 'Teknik Hidroponik & Vertikultur', 'Pemberantasan Hama Terpadu', 'Digital Marketing Produk Tani', 'Kultur Jaringan', 'Manajemen Agribisnis'],
      career: ['Agricultural Entrepreneur', 'Agronomist Modern', 'Konsultan Pertanian', 'Manajer Produksi Perkebunan', 'Penyuluh Pertanian']
    },
    tbsm: {
      title: 'Kurikulum TBSM',
      subtitle: 'Teknik dan Bisnis Sepeda Motor',
      desc: 'Teknik dan Bisnis Sepeda Motor (TBSM) fokus pada penguasaan teknologi otomotif roda dua, mulai dari pembongkaran mesin, diagnosa kerusakan sistem injeksi menggunakan alat Scanner, kelistrikan kendaraan, hingga manajemen wirausaha bengkel profesional.',
      icon: <Wrench size={36} />,
      badgeColor: '#2563eb', // Biru
      subjects: ['Overhaul Mesin Sepeda Motor', 'Sistem Bahan Bakar Injeksi (Fi)', 'Kelistrikan & Chasis', 'Kewirausahaan Bengkel Mandiri', 'Diagnosa Kerusakan (Scanner)', 'Manajemen Sparepart'],
      career: ['Mechanic Expert Authorized', 'Service Advisor', 'Entrepreneur Bengkel Mandiri', 'Modifikator Profesional', 'Quality Control Pabrik Otomotif']
    }
  };

  const current = dataKurikulum[slug] || dataKurikulum['rpl'];

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', padding: '40px 20px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Tombol Kembali */}
        <Link to="/dashboard/jurusan" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#64748b', textDecoration: 'none', transition: '0.2s', marginBottom: '40px' }}>
          <ArrowLeft size={18} /> Kembali ke Daftar Jurusan
        </Link>

        {/* HEADER SECTION (CENTERED) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '60px' }}>
          
          {/* Ikon Box */}
          <div style={{ width: '80px', height: '80px', backgroundColor: `${current.badgeColor}15`, color: current.badgeColor, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '25px', transform: 'rotate(-5deg)' }}>
            {current.icon}
          </div>
          
          {/* Tagline */}
          <span style={{ fontSize: '12px', fontWeight: '800', color: current.badgeColor, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '15px' }}>
            Program Keahlian
          </span>
          
          {/* Judul Besar */}
          <h1 style={{ fontSize: '46px', fontWeight: '900', color: '#0f172a', margin: '0 0 15px 0', letterSpacing: '-1px' }}>
            {current.title}
          </h1>
          
          {/* Subtitle Italic */}
          <p style={{ fontSize: '18px', color: '#64748b', fontStyle: 'italic', margin: 0 }}>
            "{current.subtitle}"
          </p>
        </div>

        {/* BODY SECTION (2 KOLOM) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '50px', alignItems: 'flex-start' }}>
          
          {/* KOLOM KIRI (Gambaran Umum & Mata Pelajaran) */}
          <div style={{ flex: '1 1 60%', minWidth: '300px' }}>
            
            {/* Gambaran Umum */}
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '15px' }}>Gambaran Umum</h3>
            <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.8', marginBottom: '50px' }}>
              {current.desc}
            </p>

            {/* Mata Pelajaran Unggulan (Grid 2 Kolom) */}
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '20px' }}>Mata Pelajaran Unggulan</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              {current.subjects.map((item, idx) => (
                <div key={idx} style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: '700', color: '#1e293b', transition: '0.2s', cursor: 'default' }} onMouseOver={(e) => e.currentTarget.style.borderColor = current.badgeColor} onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}>
                  {/* Titik Warna Custom */}
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: current.badgeColor, flexShrink: 0 }}></div> 
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* KOLOM KANAN (Prospek Karir & CTA) */}
          <div style={{ flex: '1 1 35%', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
            
            {/* Card Prospek Karir (Gelap) */}
            <div style={{ backgroundColor: '#0f172a', borderRadius: '24px', padding: '40px 30px', color: 'white', position: 'relative', overflow: 'hidden' }}>
              {/* Ornamen Abstrak di Pojok Kanan Atas */}
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', backgroundColor: '#1e293b', borderRadius: '50%', opacity: '0.5' }}></div>
              
              <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '25px', position: 'relative', zIndex: 1 }}>Prospek Karir</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 1 }}>
                {current.career.map((car, idx) => (
                  <div key={idx} style={{ fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '12px', color: '#cbd5e1' }}>
                    <Check size={16} color={current.badgeColor} style={{ flexShrink: 0 }} /> 
                    {car}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', marginTop: '30px', borderTop: '1px solid #334155', paddingTop: '20px', position: 'relative', zIndex: 1 }}>
                Siap kerja, siap kuliah, siap berwirausaha!
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}