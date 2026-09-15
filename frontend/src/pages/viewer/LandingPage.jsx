import React, { useEffect } from 'react'; 
import { useNavigate, useLocation } from 'react-router-dom'; // <-- Tambahkan useLocation
import Navbar from '../../components/Navbar';
import '../../css/viewer/landing.css';

// Import Foto dari folder Assets
import bgSekolah from '../../assets/latar.webp'; 
import heroIllustration from '../../assets/hero.png'; 

// Import Komponen Section
import ProfileSection from './ProfileSection';
import NewsPage from './NewsPage';
import JurusanProgramViewer from './JurusanProgram'; 
import EkstrakurikulerViewer from './EkstrakurikulerViewer';

const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation(); // <-- Inisialisasi useLocation

// =========================================================================
  // PENJEMPUT SINYAL & SCROLL BERTAHAP (FIX FINAL)
  // =========================================================================
  useEffect(() => {
    const scrollToTarget = (sectionId) => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    };

    // 1. PRIORITAS UTAMA: Cek sinyal dari tombol kembali (sessionStorage)
    const targetSection = sessionStorage.getItem('scrollToSection');
    
    if (targetSection) {
      // Bersihkan sinyal
      sessionStorage.removeItem('scrollToSection');
      
      // PAKSA scroll tanpa peduli path URL-nya apa
      setTimeout(() => scrollToTarget(targetSection), 100);
      setTimeout(() => scrollToTarget(targetSection), 600);
      setTimeout(() => scrollToTarget(targetSection), 1200);
      
      return; // Berhenti di sini agar logika bawahnya tidak ikut dieksekusi
    }

    // 2. PRIORITAS KEDUA: Cek jika user ketik URL manual / refresh (misal: /program)
    const pathToSectionMap = {
      '/profil': 'section-profil',
      '/berita': 'section-berita',
      '/program': 'section-program',
      '/jurusan': 'section-program',
      '/ekstrakurikuler': 'section-ekskul', 
      '/ekskul': 'section-ekskul',
      '/kontak': 'section-kontak',
    };
    
    const currentPath = location.pathname;
    const mappedSection = pathToSectionMap[currentPath];

    if (mappedSection && currentPath !== '/') {
      setTimeout(() => scrollToTarget(mappedSection), 100);
      setTimeout(() => scrollToTarget(mappedSection), 600);
      setTimeout(() => scrollToTarget(mappedSection), 1200);
    }
  }, [location.pathname]);

  const handleNavigateToProfile = (e) => {
    e.preventDefault();
    const section = document.getElementById('section-profil');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/profil');
    }
  };

  return (
    <div className="landing-wrapper">
      <Navbar />

      {/* Hero Section */}
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
              <span className="green-dot"></span> 
              <span>Terakreditasi A • Kurikulum Merdeka</span>
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
                onClick={handleNavigateToProfile}
                className="btn-hero-primary" >
                <span>Jelajah Sekolah</span>
                <span className="btn-arrow">➔</span>
              </a>
              <a href="#section-kontak" className="btn-hero-secondary">
                <span className="btn-icon">ⓘ</span>
                <span>Hubungi Kami</span>
              </a>
            </div>
          </div>

          {/* Sisi Kanan: Grafik / Ilustrasi */}
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

        {/* Indicator Scroll Down */}
        <a 
          href="#section-profil" 
          onClick={handleNavigateToProfile}
          className="scroll-down" 
          aria-label="Ke Profil Sekolah"
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </a>
      </section>

      {/* Profile Section */}
      <div id="section-profil">
        <ProfileSection />
      </div>

      {/* News Section (Berita) */}
      <div id="section-berita">
        <NewsPage />
      </div>

      {/* Jurusan & Program */}
      <div id="section-program">
        <JurusanProgramViewer />
      </div>

      {/* 3. EKSTRAKURIKULER SECTION */}
      <div id="section-ekskul">
        <EkstrakurikulerViewer />
      </div>

    </div>
  );
};

export default LandingPage;