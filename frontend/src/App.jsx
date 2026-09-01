import { useState, useEffect } from 'react'; 
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import { 
  Users, School, Newspaper, BookOpen, Activity, 
  GraduationCap, Trophy, MessageSquare, HelpCircle, 
  Image as ImageIcon, MapPin, LogOut, LayoutDashboard, Settings,
  Menu, X, ArrowRight, Info, ChevronDown, ChevronUp
} from 'lucide-react';

import './App.css';
import ManageNews from './pages/ManageNews';
import ManageSettings from './pages/ManageSettings';
import ManageUsers from './pages/ManageUsers';
import ForgotPassword from './pages/ForgotPassword'; 
import DetailKurikulum from './pages/DetailKurikulum';
import ManageJurusanProgram from './pages/ManageJurusanProgram';
import ManagePengajar from './pages/ManagePengajar';
import ProfilSekolah from './pages/ProfilSekolah';
import Ekstrakurikuler from './pages/Ekstrakurikuler';
import TestimonialPage from './pages/TestimonialPage';
import FaqPage from "./pages/FaqPage";



// Assets
import logoSekolah from './assets/logo1.png'; 
import heroBg from './assets/latar.webp'; 
import studentImg from './assets/hero.png'; 

// 1. Tata Letak Publik
const PublicLayout = () => (
  <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
    <h1>Landing Page SMKN COMPRENG</h1>
    <p>Ini adalah halaman publik yang bisa dilihat oleh pengunjung tanpa perlu Login.</p>
    <NavLink to="/login" style={{ padding: '10px 20px', background: '#2563eb', color: 'white', textDecoration: 'none', borderRadius: '8px' }}>Masuk ke CMS</NavLink>
  </div>
);

// 2. Satpam Frontend (Pengecek Hak Akses Role)
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(userRole)) return (
    <div style={{ padding: '50px', textAlign: 'center', color: 'red', fontFamily: 'sans-serif' }}>
      <h2>Akses Ditolak!</h2>
      <p>Role "{userRole}" tidak memiliki izin untuk melihat halaman ini.</p>
      <NavLink to="/login">Kembali ke Login</NavLink>
    </div>
  );

  return children;
};

// 3. Tata Letak Dashboard Admin CMS (Single Page / Landing Page Scroll Lengkap)
const DashboardLayout = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('role');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false); 
  const [activeSection, setActiveSection] = useState('section-hero');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  // Fungsi untuk Smooth Scroll ke section tertentu
  const scrollToSection = (sectionId) => {
    const contentElement = document.querySelector('.dashboard-content');
    const element = document.getElementById(sectionId);

    if (contentElement && element) {
      const topPos = element.offsetTop;
      contentElement.scrollTo({
        top: topPos - 70, 
        behavior: 'smooth'
      });
    }
  };

  // Mendeteksi posisi scroll
  useEffect(() => {
    const contentElement = document.querySelector('.dashboard-content');
    if (!contentElement) return;

    const sectionIds = [
      'section-hero', 'section-pengguna', 'section-profil', 
      'section-settings', 'section-berita', 'section-jurusan', 
      'section-ekskul', 'section-pengajar', 'section-prestasi', 
      'section-testimoni', 'section-faq', 'section-galeri', 'section-kontak'
    ];

    const handleScroll = () => {
      const scrollPosition = contentElement.scrollTop + 200; 

      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;

          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    contentElement.addEventListener('scroll', handleScroll);
    handleScroll(); 
    return () => contentElement.removeEventListener('scroll', handleScroll);
  }, []);

  // DAFTAR MENU DENGAN PEMBATASAN ROLE (ADMIN & EDITOR)
  const menuItems = [
    { title: 'Dashboard', icon: <LayoutDashboard size={18} />, target: 'section-hero', roles: ['admin', 'editor'] },
    { title: 'Kelola Pengguna', icon: <Users size={18} />, target: 'section-pengguna', roles: ['admin'] },
    { title: 'Profil Sekolah', icon: <School size={18} />, target: 'section-profil', roles: ['admin', 'editor'] },
    { title: 'Pengaturan Website', icon: <Settings size={18} />, target: 'section-settings', roles: ['admin'] },
    { title: 'Berita & Artikel', icon: <Newspaper size={18} />, target: 'section-berita', roles: ['admin', 'editor'] },
    { title: 'Jurusan & Program', icon: <BookOpen size={18} />, target: 'section-jurusan', roles: ['admin', 'editor'] },
    { title: 'Ekstrakurikuler', icon: <Activity size={18} />, target: 'section-ekskul', roles: ['admin', 'editor'] },
    { title: 'Tenaga Pengajar', icon: <GraduationCap size={18} />, target: 'section-pengajar', roles: ['admin'] },
    { title: 'Karya & Prestasi', icon: <Trophy size={18} />, target: 'section-prestasi', roles: ['admin', 'editor'] },
    { title: 'Testimoni', icon: <MessageSquare size={18} />, target: 'section-testimoni', roles: ['admin', 'editor'] },
    { title: 'FAQ', icon: <HelpCircle size={18} />, target: 'section-faq', roles: ['admin'] },
    { title: 'Galeri', icon: <ImageIcon size={18} />, target: 'section-galeri', roles: ['admin', 'editor'] },
    { title: 'Kontak & Alamat', icon: <MapPin size={18} />, target: 'section-kontak', roles: ['admin'] },
  ];

  const allowedMenus = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="dashboard-container">

      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={toggleMobileMenu}></div>
      )}

      {/* SIDEBAR NAVIGATION KIRI */}
      <div className={`dashboard-sidebar ${isMobileMenuOpen ? 'open' : ''} ${!isSidebarVisible ? 'collapsed' : ''}`}>
        <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img 
              src={logoSekolah} 
              alt="Logo SMK Negeri Compreng" 
              style={{ width: '34px', height: '34px', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }} 
            />
            <div>
              <h2 style={{ fontSize: '14px', margin: 0, fontWeight: '700', color: '#0f172a' }}>SMKN COMPRENG</h2>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Role: <b>{userRole}</b></p>
            </div>
          </div>

          <button 
            className="sidebar-toggle-btn" 
            onClick={toggleSidebar}
            title="Tutup Sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-menu">
          <ul>
            {allowedMenus.map((menu, index) => {
              const isActive = activeSection === menu.target;
              return (
                <li key={index}>
                  <button 
                    onClick={() => { scrollToSection(menu.target); setIsMobileMenuOpen(false); }}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                    style={{ 
                      background: isActive ? '#eff6ff' : 'transparent', 
                      color: isActive ? '#2563eb' : '#334155',    
                      fontWeight: isActive ? '600' : '400',
                      border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', 
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 15px', borderRadius: '8px', transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ color: isActive ? '#2563eb' : '#64748b' }}>{menu.icon}</span>
                    <span style={{ fontSize: '14px' }}>{menu.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* AREA KONTEN UTAMA */}
      <div className="dashboard-content" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', display: 'flex', flexDirection: 'column' }}>
        
        {/* TOP HEADER NAVBAR LENGKAP (STICKY DI ATAS) */}
        <header className="spmb-navbar-clean" style={{ position: 'sticky', top: 0, zIndex: 100, background: '#0f172a', flexShrink: 0 }}>
          <div className="spmb-brand">
            {!isSidebarVisible && (
              <button 
                className="topbar-toggle-btn" 
                onClick={toggleSidebar}
                title="Buka Sidebar"
              >
                <Menu size={24} />
              </button>
            )}

            <img 
              src={logoSekolah} 
              alt="Logo SMKN Compreng" 
              className="spmb-logo-img"
              onError={(e) => { e.target.style.display = 'none'; }} 
            />
            <div className="spmb-brand-text">
              <h2>SMK NEGERI COMPRENG</h2>
              <span>The School of SESCO Models</span>
            </div>
          </div>

          {/* NAVBAR ATAS */}
          <nav className="spmb-nav-links-clean" style={{ overflowX: 'auto', display: 'flex', gap: '6px', whiteSpace: 'nowrap', padding: '5px 0', scrollbarWidth: 'none' }}>
            {allowedMenus.map((menu, idx) => (
              <button 
                key={idx}
                onClick={() => scrollToSection(menu.target)} 
                className={`nav-clean-item ${activeSection === menu.target ? 'active' : ''}`}
              >
                {menu.title}
              </button>
            ))}
          </nav>
        </header>

        {/* CONTAINER ROUTES / SECTION KONTEN HALAMAN */}
        <div style={{ flex: 1 }}>
          <Routes>
            <Route index element={
              <div className="spmb-hero-wrapper">

                {/* 1. SECTION DASHBOARD / HERO */}
                <div 
                  id="section-hero"
                  className="spmb-hero-card"
                  style={{ 
                    backgroundImage: `url(${heroBg})`, 
                    minHeight: 'calc(100vh - 65px)', /* Memastikan tingginya pas selayar penuh dikurangi tinggi navbar */
                    height: 'calc(100vh - 65px)',  /* Mengunci tinggi agar tidak cingkrang */
                    margin: 0, 
                    borderRadius: 0,
                    paddingBottom: '20px',
                    boxSizing: 'border-box'
                  }}
                >
                  <div className="spmb-hero-overlay"></div>
                  <div className="spmb-hero-content">
                    <div className="spmb-left-col">
                      <div className="spmb-badge-pill">
                        <span className="dot-pulse"></span>
                        <span>Terakreditasi A · Kurikulum Merdeka</span>
                      </div>
                      <h1 className="spmb-hero-title">
                        Selamat Datang di<br />
                        <span className="highlight-text"> SMK NEGERI COMPRENG</span>
                      </h1>
                      <p className="spmb-hero-desc">
                        Membangun Generasi Cerdas, Berkarakter, dan Berprestasi menuju Masa Depan Gemilang.
                      </p>
                      
                      {/* Tombol Jelajah & Hubungi Kami yang Dikembalikan */}
                      <div className="spmb-btn-group">
                        <button onClick={() => scrollToSection(userRole === 'admin' ? 'section-profil' : 'section-profil')} className="spmb-btn-primary">
                          Jelajah Sekolah <ArrowRight size={18} />
                        </button>
                        {userRole === 'admin' ? (
                          <button onClick={() => scrollToSection('section-kontak')} className="spmb-btn-secondary">
                            <Info size={18} /> Hubungi Kami
                          </button>
                        ) : (
                          <button onClick={() => scrollToSection('section-jurusan')} className="spmb-btn-secondary">
                            <Info size={18} /> Hubungi Kami
                          </button>
                        )}
                      </div>

                    </div>
                    <div className="spmb-right-col">
                      <div className="spmb-student-wrapper">
                        <img 
                          src={studentImg} 
                          alt="Siswa SMK Negeri Compreng" 
                          className="spmb-student-img"
                          onError={(e) => { e.target.style.display = 'none'; }} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tombol Panah Bawah (ChevronDown) di bagian hero */}
                  <div className="spmb-scroll-down" onClick={() => scrollToSection(userRole === 'admin' ? 'section-pengguna' : 'section-berita')} style={{ cursor: 'pointer', bottom: '10px' }}>
                    <ChevronDown size={22} color="#94a3b8" />
                  </div>
                </div>

                {/* 2. SECTION KELOLA PENGGUNA (Hanya Admin) */}
                {userRole === 'admin' && (
                  <div id="section-pengguna" className="fullpage-section" style={{ padding: '40px', background: '#ffffff' }}>
                    <ManageUsers />
                  </div>
                )}

                {/* 3. SECTION PROFIL SEKOLAH (Admin & Editor) */}
<div id="section-profil" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
  <ProfilSekolah userRole={userRole} />
</div>

                {/* 4. SECTION PENGATURAN WEBSITE (Hanya Admin) */}
                {userRole === 'admin' && (
                  <div id="section-settings" style={{ padding: '60px 40px', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                    <ManageSettings />
                  </div>
                )}

                {/* 5. SECTION BERITA & ARTIKEL (Admin & Editor) */}
                <div id="section-berita" style={{ padding: '60px 40px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <ManageNews />
                </div>

                {/* 6. SECTION JURUSAN & PROGRAM (Admin & Editor) */}
                <div id="section-jurusan" style={{ padding: '60px 40px', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                  <ManageJurusanProgram />
                </div>
                
                {/* 7. SECTION EKSTRAKURIKULER (Admin & Editor) */}
<div id="section-ekskul" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
  <Ekstrakurikuler />
</div>

                
                {/* 8. SECTION TENAGA PENGAJAR (Hanya Admin) */}
                {userRole === 'admin' && (
                  <div id="section-pengajar" style={{ padding: '60px 40px', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                    <ManagePengajar />
                  </div>
                )}

                {/* 9. SECTION KARYA & PRESTASI (Admin & Editor) */}
                <div id="section-prestasi" style={{ padding: '60px 40px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a', marginBottom: '15px' }}>Karya & Prestasi</h2>
                  <p style={{ color: '#64748b' }}>Pencapaian dan karya siswa.</p>
                </div>

                {/* 10. SECTION TESTIMONI (Admin & Editor) */}
                <div id="section-testimoni" style={{ padding: '60px 40px', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                  <TestimonialPage />
                </div>

                {/* 11. SECTION FAQ (Hanya Admin) */}
{userRole === 'admin' && (
  <div id="section-faq" style={{ padding: '60px 40px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
    <FaqPage />
  </div>
)}

                {/* 12. SECTION GALERI (Admin & Editor) */}
                <div id="section-galeri" style={{ padding: '60px 40px', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                  <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a', marginBottom: '15px' }}>Galeri</h2>
                  <p style={{ color: '#64748b' }}>Dokumentasi foto kegiatan sekolah.</p>
                </div>

                {/* 13. SECTION KONTAK & ALAMAT (Hanya Admin) */}
                {userRole === 'admin' ? (
                  <div id="section-kontak" style={{ padding: '80px 40px 100px 40px', background: '#f8fafc', position: 'relative' }}>
                    <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a', marginBottom: '15px' }}>Kontak & Alamat</h2>
                    <p style={{ color: '#64748b', fontSize: '16px', lineHeight: '1.6' }}>
                      Hubungi kami melalui alamat resmi atau saluran komunikasi yang tersedia.
                    </p>

                    {/* Tombol Scroll ke Atas (ChevronUp) di pojok kanan bawah */}
                    <div 
                      onClick={() => scrollToSection('section-hero')} 
                      style={{
                        position: 'absolute',
                        bottom: '20px',
                        right: '40px',
                        background: '#0f172a',
                        color: '#ffffff',
                        padding: '10px 12px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                        transition: 'background 0.2s'
                      }}
                      title="Kembali ke Atas"
                    >
                      <ChevronUp size={22} />
                    </div>
                  </div>
                ) : (
                  /* Tombol Scroll ke Atas khusus Editor di section terakhir yang diakses (Galeri) */
                  <div style={{ padding: '40px', background: '#f8fafc', textAlign: 'right', position: 'relative' }}>
                    <div 
                      onClick={() => scrollToSection('section-hero')} 
                      style={{
                        display: 'inline-flex',
                        background: '#0f172a',
                        color: '#ffffff',
                        padding: '10px 12px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                      }}
                      title="Kembali ke Atas"
                    >
                      <ChevronUp size={22} />
                    </div>
                  </div>
                )}

              </div>
            } />

            <Route path="kurikulum/:slug" element={<DetailKurikulum />} />

            <Route path="*" element={
              <div style={{ padding: '30px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', margin: '40px' }}>
                <h2>Halaman Sedang Dalam Pengembangan</h2>
                <p style={{ color: '#64748b' }}>Fitur ini akan segera hadir.</p>
              </div>
            } />
          </Routes>
        </div>

      </div>
    </div>
  );
};

// 4. ROUTING UTAMA APLIKASI
function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/lupa-password" element={<ForgotPassword />} />

      <Route 
        path="/dashboard/*" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <DashboardLayout />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;