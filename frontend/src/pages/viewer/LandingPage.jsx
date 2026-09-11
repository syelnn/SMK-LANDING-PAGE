import React from 'react';
import Navbar from '../../components/Navbar';
import '../../css/viewer/landing.css';

// 1. Import Foto dari folder Assets
import bgSekolah from '../../assets/latar.webp'; // Sesuaikan nama file & ekstensi
import heroIllustration from '../../assets/hero.png'; // Sesuaikan nama file & ekstensi

const LandingPage = () => {
  return (
    <div className="landing-wrapper">
      <Navbar />

      {/* 2. Pasang Background Foto melalui Inline Style */}
      <section 
        id="section-hero" 
        className="hero-section"
        style={{ backgroundImage: `url(${bgSekolah})` }}
      >
        <div className="hero-overlay"></div>

        <div className="hero-container">
          {/* Sisi Kiri: Teks & Tombol */}
          <div className="hero-content">
            <div className="badge-akreditasi">
              <span className="dot">•</span> Terakreditasi A • Kurikulum Merdeka
            </div>

            <h1 className="hero-title">
              Selamat Datang di <br />
              <span className="brand-highlight">SMK NEGERI COMPRENG</span>
            </h1>

            <p className="hero-subtitle">
              Membangun Generasi Cerdas, Berkarakter, dan Berprestasi menuju Masa Depan Gemilang.
            </p>

            <div className="hero-buttons">
              <a 
                href="#section-profil" 
                className="btn-hero-primary"
                style={{ backgroundColor: '#0ea5e9', background: '#0ea5e9' }}
              >
                Jelajah Sekolah  ➔
              </a>
              <a href="#section-kontak" className="btn-hero-secondary">
                <span className="btn-icon">ⓘ</span>
                <span>Hubungi Kami</span>
             </a>
            </div>
          </div>

          {/* 3. Pasang Foto Samping Kanan pada Tag <img> */}
          <div className="hero-graphic">
            <div className="graphic-frame">
              <img 
                src={heroIllustration} 
                alt="Ilustrasi SMKN Compreng" 
                className="graphic-img"
              />
            </div>
          </div>
        </div>

        <div className="scroll-down">
          <span>∨</span>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;