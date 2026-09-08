import React, { useState, useEffect, useContext } from 'react';
import { SettingsContext, SettingsProvider } from './context/SettingsContext';
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import DownloadPage from './pages/DownloadPage';

import { 
  Users, School, Newspaper, BookOpen, Activity, 
  GraduationCap, Trophy, MessageSquare, HelpCircle, 
  Image as ImageIcon, MapPin, LogOut, LayoutDashboard, Settings,
  Menu, X, ArrowRight, Info, ChevronDown, ChevronUp, Download 
} from 'lucide-react';

import './App.css';
import ManageNews from './pages/ManageNews';
import DetailManageNews from './pages/DetailManageNews';
import ManageSettings from './pages/ManageSettings';
import ManageUsers from './pages/ManageUsers';
import ForgotPassword from './pages/ForgotPassword'; 
import DetailKurikulum from './pages/DetailKurikulum';
import ManageJurusanProgram from './pages/ManageJurusanProgram';
import ManagePengajar from './pages/ManagePengajar';
import ProfilSekolah from './pages/ProfilSekolah';
import Ekstrakurikuler from './pages/Ekstrakurikuler';
import TestimonialPage from './pages/TestimonialPage';
import Galeri from './pages/Galeri';
import FaqPage from "./pages/FaqPage";
import Footer from './pages/Footer';
import AchievementSection from './pages/AchievementSection';

import logoSekolah from './assets/logo1.png'; 
import heroBg from './assets/latar.webp'; 
import studentImg from './assets/hero.png';

const ICON_MAP = {
  dashboard: <LayoutDashboard size={18} />,
  users: <Users size={18} />,
  school: <School size={18} />,
  building: <School size={18} />,
  settings: <Settings size={18} />,
  news: <Newspaper size={18} />,
  newspaper: <Newspaper size={18} />,
  jurusan: <BookOpen size={18} />,
  'book-open': <BookOpen size={18} />,
  ekskul: <Activity size={18} />,
  activity: <Activity size={18} />,
  pengajar: <GraduationCap size={18} />,
  prestasi: <Trophy size={18} />,
  award: <Trophy size={18} />,
  testimoni: <MessageSquare size={18} />,
  'message-square': <MessageSquare size={18} />,
  faq: <HelpCircle size={18} />,
  'help-circle': <HelpCircle size={18} />,
  galeri: <ImageIcon size={18} />,
  image: <ImageIcon size={18} />,
  kontak: <MapPin size={18} />,
  'map-pin': <MapPin size={18} />,
  download: <Download size={18} />
};

const findTargetElement = (targetStr, urlStr) => {
  if (!targetStr && !urlStr) return null;
  const clean = (str) => {
    if (!str) return '';
    return str.replace(/.*#/, '').replace(/^section-/, '').trim();
  };

  const cTarget = clean(targetStr);
  const cUrl = clean(urlStr);

  const aliases = {
    'beranda': 'section-hero', 
    'hero': 'section-hero',
    'pengaturan': 'section-settings',
    'settings': 'section-settings',
    'admin/settings': 'section-settings',
    'program': 'section-jurusan',
    'jurusan': 'section-jurusan',
    'ekstrakurikuler': 'section-ekskul',
    'ekskul': 'section-ekskul',
    'profil': 'section-profil',
    'profile': 'section-profil',
    'profil-sekolah': 'section-profil',
    'profil_sekolah': 'section-profil',
  };

  return (
    document.getElementById(`section-${cTarget}`) ||
    document.getElementById(cTarget) ||
    document.getElementById(aliases[cTarget]) ||
    document.getElementById(`section-${cUrl}`) ||
    document.getElementById(cUrl) ||
    document.getElementById(aliases[cUrl])
  );
};

const PublicLayout = () => (
  <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
    <h1>Landing Page SMKN COMPRENG</h1>
    <p>Ini adalah halaman publik yang bisa dilihat oleh pengunjung tanpa perlu Login.</p>
    <NavLink to="/login" style={{ padding: '10px 20px', background: '#2563eb', color: 'white', textDecoration: 'none', borderRadius: '8px' }}>Masuk ke CMS</NavLink>
  </div>
);

// Murni sinkronasi dari token JWT untuk Protected Route
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  let userRole = (localStorage.getItem('role') || '').toUpperCase();
  
  if (token && token.split('.').length === 3) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      const payload = JSON.parse(jsonPayload);
      if (payload.role) userRole = payload.role.toUpperCase();
    } catch (e) {
      console.error("Gagal membaca token di ProtectedRoute", e);
    }
  }

  if (!token) return <Navigate to="/login" replace />;
  
  const safeAllowedRoles = allowedRoles ? allowedRoles.map(r => r.toUpperCase()) : null;

  if (safeAllowedRoles && !safeAllowedRoles.includes(userRole)) return (
    <div style={{ padding: '50px', textAlign: 'center', color: 'red', fontFamily: 'sans-serif' }}>
      <h2>Akses Ditolak!</h2>
      <p>Role "{userRole}" tidak memiliki izin untuk melihat halaman ini.</p>
      <NavLink to="/login">Kembali ke Login</NavLink>
    </div>
  );
  return children;
};

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { settings } = useContext(SettingsContext); 

  // ==========================================
  // SINKRONISASI MUTLAK DARI JSON WEB TOKEN
  // ==========================================
  const getExactUser = () => {
    const token = localStorage.getItem('token');
    
    let exactName = localStorage.getItem('username') || localStorage.getItem('name') || 'Unknown User';
    let exactEmail = localStorage.getItem('email') || '-';
    let exactRole = localStorage.getItem('role') || 'VIEWER';

    if (token && token.split('.').length === 3) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        const decoded = JSON.parse(jsonPayload);

        exactName = decoded.name || decoded.nama_lengkap || decoded.full_name || decoded.username || exactName;
        exactEmail = decoded.email || exactEmail;
        exactRole = decoded.role || exactRole;
      } catch (e) {
        console.error("Token JWT tidak valid atau rusak", e);
      }
    }

    return {
      name: exactName,
      email: exactEmail,
      role: (exactRole || 'VIEWER').toUpperCase(),
      initial: exactName ? exactName.charAt(0).toUpperCase() : 'U'
    };
  };
  
  const userData = getExactUser();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false); 
  const [activeSection, setActiveSection] = useState('section-hero');
  
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const toggleSidebar = () => setIsSidebarVisible(!isSidebarVisible);

  const scrollToSection = (targetStr) => {
    const targetEl = findTargetElement(targetStr, targetStr);
    const contentElement = document.querySelector('.dashboard-content');
    if (targetEl && contentElement) {
      contentElement.scrollTo({
        top: targetEl.offsetTop - 70,
        behavior: 'smooth'
      });
    }
  };

  const handleMenuClick = (menu) => {
    setIsMobileMenuOpen(false);

    // 1. UTAMAKAN CEK LINK: Jika menu adalah link ke halaman beda (seperti /dashboard/downloads)
    if (menu.type === 'link' || (menu.url && menu.url.startsWith('/') && !menu.url.includes('#'))) {
      navigate(menu.url);
      return;
    }

    // 2. CEK HALAMAN: Jika sedang di luar halaman utama (/dashboard/downloads) lalu klik menu scroll biasa
    if (window.location.pathname !== '/dashboard') {
      const cleanSection = menu.target ? menu.target.replace(/^section-/, '') : '';
      navigate(`/dashboard#${cleanSection}`);
      return;
    }

    // 3. JIKA DI HALAMAN UTAMA: Lakukan Scroll ke Section
    const targetEl = findTargetElement(menu.target, menu.url);
    const contentElement = document.querySelector('.dashboard-content');

    if (targetEl && contentElement) {
      contentElement.scrollTo({
        top: targetEl.offsetTop - 70, 
        behavior: 'smooth'
      });
      const cleanId = targetEl.id.replace(/^section-/, '');
      window.history.pushState(null, '', `/dashboard#${cleanId}`);
      setActiveSection(targetEl.id);
    }
  };
  
  useEffect(() => {
  const contentElement = document.querySelector('.dashboard-content');
  if (!contentElement) return;

  const sectionIds = [
    'section-hero', 'section-pengguna', 'section-profil', 
    'section-settings', 'section-berita', 'section-jurusan', 
    'section-ekskul', 'section-pengajar', 'section-prestasi', 
    'section-testimoni', 'section-galeri', 'section-faq', 'section-kontak'
  ];

  const handleScroll = () => {
    // Jalankan kalkulasi scroll HANYA jika berada di halaman utama /dashboard
    if (window.location.pathname !== '/dashboard' && window.location.pathname !== '/dashboard/') {
      return;
    }

    const isAtBottom = contentElement.scrollTop + contentElement.clientHeight >= contentElement.scrollHeight - 50;
    if (isAtBottom) {
      setActiveSection('section-kontak');
      return;
    }

    const scrollPosition = contentElement.scrollTop + 120; 
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

  const defaultMenuItems = [
    { title: 'Dashboard', iconKey: 'dashboard', target: 'section-hero', roles: ['ADMIN', 'EDITOR'] },
    { title: 'Kelola Pengguna', iconKey: 'users', target: 'section-pengguna', roles: ['ADMIN'] },
    { title: 'Profil Sekolah', iconKey: 'school', target: 'section-profil', roles: ['ADMIN', 'EDITOR'] },
    { title: 'Pengaturan Website', iconKey: 'settings', target: 'section-settings', roles: ['ADMIN'] },
    { title: 'Berita & Artikel', iconKey: 'news', target: 'section-berita', roles: ['ADMIN', 'EDITOR'] },
    { title: 'Jurusan & Program', iconKey: 'jurusan', target: 'section-jurusan', roles: ['ADMIN', 'EDITOR'] },
    { title: 'Ekstrakurikuler', iconKey: 'ekskul', target: 'section-ekskul', roles: ['ADMIN', 'EDITOR'] },
    { title: 'Tenaga Pengajar', iconKey: 'pengajar', target: 'section-pengajar', roles: ['ADMIN'] },
    { title: 'Karya & Prestasi', iconKey: 'prestasi', target: 'section-prestasi', roles: ['ADMIN', 'EDITOR'] },
    { title: 'Testimoni', iconKey: 'testimoni', target: 'section-testimoni', roles: ['ADMIN', 'EDITOR'] },
    { title: 'Galeri', iconKey: 'galeri', target: 'section-galeri', roles: ['ADMIN', 'EDITOR'] },
    { title: 'FAQ', iconKey: 'faq', target: 'section-faq', roles: ['ADMIN'] },
    { title: 'Kontak & Alamat', iconKey: 'kontak', target: 'section-kontak', roles: ['ADMIN'] },
    { title: 'Download', iconKey: 'download', type: 'link', url: '/dashboard/downloads', roles: ['ADMIN', 'EDITOR'] },
  ];

  const [dynamicNavs, setDynamicNavs] = useState([]);
useEffect(() => {
  fetch('http://localhost:5002/api/menu-items')
    .then((res) => res.json())
    .then((resData) => {
      if (resData.success && resData.data && resData.data.length > 0) {
        const mapped = resData.data.map(m => {
          const rawTarget = m.path || m.url || m.sectionKey || m.target || 'section-hero';
          const cleanTarget = rawTarget.replace(/.*#/, '').replace(/^section-/, '').trim();
          
          // Memastikan URL bertipe 'link' selalu diawali dengan /dashboard
          let formattedUrl = m.url || '';
          if (m.type === 'link' || formattedUrl.startsWith('/downloads')) {
            if (!formattedUrl.startsWith('/dashboard')) {
              formattedUrl = `/dashboard${formattedUrl.startsWith('/') ? formattedUrl : '/' + formattedUrl}`;
            }
          }

          return {
            title: m.title,
            iconKey: m.icon || 'dashboard',
            type: m.type, 
            url: formattedUrl,
            target: cleanTarget ? `section-${cleanTarget}` : 'section-hero',
            roles: ['ADMIN', 'EDITOR']
          };
        });
        setDynamicNavs(mapped);
      }
    })
    .catch(() => setDynamicNavs([]));
}, []);

useEffect(() => {
  const hash = window.location.hash;
  if (hash) {
    const cleanHash = hash.replace('#', '');
    setTimeout(() => {
      const targetEl = findTargetElement(cleanHash, cleanHash);
      const contentElement = document.querySelector('.dashboard-content');
      if (targetEl && contentElement) {
        contentElement.scrollTo({ top: targetEl.offsetTop - 70, behavior: 'smooth' });
      }
    }, 300);
  }
}, [dynamicNavs]);

const activeMenuList = dynamicNavs.length > 0 ? dynamicNavs : defaultMenuItems;

const allowedMenus = activeMenuList.filter(item => 
  item.roles ? item.roles.map(r => r.toUpperCase()).includes(userData.role) : true
);

  return (
    <div className="dashboard-container">

      {isMobileMenuOpen && <div className="sidebar-overlay" onClick={toggleMobileMenu}></div>}

      <div className={`dashboard-sidebar ${isMobileMenuOpen ? 'open' : ''} ${!isSidebarVisible ? 'collapsed' : ''}`}>
        
        <div className="sidebar-header" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img 
                src={settings.school_logo || logoSekolah} 
                alt="Logo" 
                style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                onError={(e) => { e.target.style.display = 'none'; }} 
              />
              <h2 style={{ fontSize: '15px', margin: 0, fontWeight: '800', color: 'var(--compreng-text)' }}>
                {settings.school_name || 'SMKN COMPRENG'}
              </h2>
            </div>
            <button className="sidebar-toggle-btn" onClick={toggleSidebar} title="Tutup Sidebar" style={{ color: 'var(--compreng-text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ 
            background: 'var(--compreng-surface-soft)', 
            border: '1px solid var(--compreng-border)',
            borderRadius: '12px', 
            padding: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px' 
          }}>
            <div style={{ 
              width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
              background: 'var(--compreng-green)', color: '#ffffff', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: '18px', fontWeight: '800'
            }}>
              {userData.initial}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--compreng-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userData.name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--compreng-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '6px' }}>
                {userData.email}
              </div>
              <span style={{ 
                fontSize: '9px', fontWeight: '800', 
                background: '#e0e7ff', color: '#4338ca', 
                padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px'
              }}>
                {userData.role}
              </span>
            </div>
          </div>

        </div>

       <div className="sidebar-menu" style={{ background: 'var(--compreng-surface)' }}>
  <ul>
    {allowedMenus.map((menu, index) => {
      // 1. Cek apakah menu bertipe link halaman terpisah
      const isPageLink = menu.type === 'link' || (menu.url && menu.url.startsWith('/') && !menu.url.includes('#'));

      // 2. Tentukan status active secara presisi
      const isActive = isPageLink 
        ? window.location.pathname === menu.url 
        : (window.location.pathname === '/dashboard' && activeSection === menu.target);

      return (
        <li key={index}>
          <button 
            onClick={() => handleMenuClick(menu)}
            className={`sidebar-link ${isActive ? 'active' : ''}`}
            style={{ 
              border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', 
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 15px', borderRadius: '8px', transition: 'all 0.2s',
              background: isActive ? 'var(--compreng-green-light)' : 'transparent',
              color: isActive ? 'var(--compreng-green)' : 'var(--compreng-text-secondary)',
              fontWeight: isActive ? '700' : '500'
            }}
          >
            <span style={{ color: isActive ? 'var(--compreng-green)' : 'var(--compreng-text-secondary)' }}>
              {ICON_MAP[menu.iconKey] || <LayoutDashboard size={18} />}
            </span>
            <span style={{ fontSize: '14px' }}>{menu.title}</span>
          </button>
        </li>
      );
    })}
  </ul>
</div>

        <div className="sidebar-footer" style={{ background: 'var(--compreng-surface)', borderTop: '1px solid var(--compreng-border)' }}>
          <button onClick={handleLogout} className="logout-btn"><LogOut size={18} /> Logout</button>
        </div>
      </div>

      <div className="dashboard-content" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', display: 'flex', flexDirection: 'column' }}>
        
        <header className="spmb-navbar-clean" style={{ position: 'sticky', top: 0, zIndex: 100, flexShrink: 0, borderBottom: 'none' }}>
          <div className="spmb-brand">
            {!isSidebarVisible && (
              <button className="topbar-toggle-btn" onClick={toggleSidebar} title="Buka Sidebar" style={{ color: '#ffffff', background: 'rgba(255,255,255,0.1)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', marginRight: '10px' }}>
                <Menu size={20} />
              </button>
            )}
            <img 
              src={settings.school_logo || logoSekolah} 
              alt="Logo" 
              className="spmb-logo-img"
              onError={(e) => { e.target.style.display = 'none'; }} 
            />
            <div className="spmb-brand-text">
              <h2 style={{ color: '#ffffff', margin: 0, fontSize: '15px' }}>{settings.school_name || 'SMK NEGERI COMPRENG'}</h2>
              <span style={{ color: '#94a3b8', fontSize: '10px' }}>{settings.school_tagline || 'The School of SESCO Models'}</span>
            </div>
          </div>

          <nav className="spmb-nav-links-clean" style={{ overflowX: 'auto', display: 'flex', gap: '6px', whiteSpace: 'nowrap', padding: '5px 0', scrollbarWidth: 'none' }}>
            {allowedMenus.map((menu, idx) => {
  const isPageLink = menu.type === 'link' || (menu.url && menu.url.startsWith('/') && !menu.url.includes('#'));
  const isActive = isPageLink 
    ? window.location.pathname === menu.url 
    : (window.location.pathname === '/dashboard' && activeSection === menu.target);

  return (
    <button 
      key={idx}
      onClick={() => handleMenuClick(menu)} 
      className={`nav-clean-item ${isActive ? 'active' : ''}`}
      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 12px', fontWeight: '500' }}
    >
      {menu.title}
    </button>
  );
})}
          </nav>
        </header>

        <div style={{ flex: 1 }}>
          <Routes>
            <Route index element={
              <div className="spmb-hero-wrapper">
                <div 
                  id="section-hero" 
                  className="spmb-hero-card" 
                  style={{ 
                    backgroundImage: `url(${heroBg})`, 
                    minHeight: 'calc(100vh - 65px)', 
                    height: 'calc(100vh - 65px)', 
                    margin: 0, borderRadius: 0, paddingBottom: '20px', boxSizing: 'border-box' 
                  }}
                >
                  <div className="spmb-hero-overlay"></div>
                  
                  <div className="spmb-hero-content">
                    <div className="spmb-left-col">
                      <div className="spmb-badge-pill">
                        <span className="dot-pulse"></span>
                        <span>{settings.school_accreditation || 'Terakreditasi A · Kurikulum Merdeka'}</span>
                      </div>
                      <h1 className="spmb-hero-title" style={{ color: '#ffffff' }}>
                        Selamat Datang di<br />
                        <span className="highlight-text"> {settings.school_name || 'SMK NEGERI COMPRENG'}</span>
                      </h1>
                      <p className="spmb-hero-desc">
                        {settings.hero_description || 'Membangun Generasi Cerdas, Berkarakter, dan Berprestasi menuju Masa Depan Gemilang.'}
                      </p>
                      <div className="spmb-btn-group">
                        <button onClick={() => scrollToSection('section-profil')} className="spmb-btn-primary">
                          Jelajah Sekolah <ArrowRight size={18} />
                        </button>
                        <button onClick={() => scrollToSection(userData.role === 'ADMIN' ? 'section-kontak' : 'section-jurusan')} className="spmb-btn-secondary">
                          <Info size={18} /> Hubungi Kami
                        </button>
                      </div>
                    </div>
                    <div className="spmb-right-col">
                      <div className="spmb-student-wrapper">
                        <img 
                          src={studentImg} 
                          alt="Siswa" 
                          className="spmb-student-img" 
                          onError={(e) => { e.target.style.display = 'none'; }} 
                        />
                      </div>
                    </div>
                  </div>
                  <div className="spmb-scroll-down" onClick={() => scrollToSection(userData.role === 'ADMIN' ? 'section-pengguna' : 'section-berita')} style={{ cursor: 'pointer', bottom: '10px' }}>
                    <ChevronDown size={22} color="#94a3b8" />
                  </div>
                </div>

                {userData.role === 'ADMIN' && <div id="section-pengguna" className="fullpage-section" style={{ padding: '40px' }}><ManageUsers /></div>}
                
                <div id="section-profil" style={{ borderBottom: '1px solid var(--theme-border)' }}><ProfilSekolah userRole={userData.role} /></div>
                
                {userData.role === 'ADMIN' && <div id="section-settings" style={{ padding: '60px 40px', borderBottom: '1px solid var(--theme-border)' }}><ManageSettings /></div>}
                
                <div id="section-berita" style={{ padding: '60px 20px', borderBottom: '1px solid var(--theme-border)' }}><div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}><ManageNews/></div></div>
                
                <div id="section-jurusan" style={{ padding: '60px 40px', borderBottom: '1px solid var(--theme-border)' }}><ManageJurusanProgram /></div>
                
                <div id="section-ekskul" style={{ borderBottom: '1px solid var(--theme-border)' }}><Ekstrakurikuler /></div>
                
                {userData.role === 'ADMIN' && (
                  <div id="section-pengajar" style={{ padding: '60px 40px', borderBottom: '1px solid var(--theme-border)' }}>
                    <ManagePengajar />
                  </div>
                )}

                <div id="section-prestasi" style={{ borderBottom: '1px solid var(--theme-border)' }}>
                  <AchievementSection />
                </div>

                <div id="section-testimoni" style={{ padding: '60px 40px', borderBottom: '1px solid var(--theme-border)' }}>
                  <TestimonialPage />
                </div>

                {userData.role === 'ADMIN' && (
                  <div id="section-faq" style={{ padding: '60px 40px', borderBottom: '1px solid var(--theme-border)' }}>
                    <FaqPage />
                  </div>
                )}

                <div id="section-galeri" style={{ padding: '20px 0', borderBottom: '1px solid var(--theme-border)' }}>
                  <Galeri />
                </div>

                {userData.role === 'ADMIN' ? (
                  <div id="section-kontak" style={{ position: 'relative' }}>
                    <Footer />
                    <div 
                      onClick={() => scrollToSection('section-hero')} 
                      style={{
                        position: 'absolute',
                        bottom: '20px',
                        right: '40px',
                        background: 'var(--theme-accent)',
                        color: 'var(--theme-accent-text)',
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
                  <div style={{ padding: '40px', textAlign: 'right', position: 'relative' }}>
                    <div onClick={() => scrollToSection('section-hero')} style={{ display: 'inline-flex', background: 'var(--theme-accent)', color: 'var(--theme-accent-text)', padding: '10px 12px', borderRadius: '50%', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>
                      <ChevronUp size={22} />
                    </div>
                  </div>
                )}
              </div>
            } />
            <Route path="kurikulum/:slug" element={<DetailKurikulum />} />
            <Route path="berita/:slug" element={<DetailManageNews />} />

            <Route path="downloads" element={<DownloadPage />} />

            <Route path="*" element={
              <div style={{ padding: '30px', background: 'var(--theme-card)', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', margin: '40px' }}>
                <h2>Halaman Sedang Dalam Pengembangan</h2>
                <p style={{ color: 'var(--theme-text-muted)' }}>Fitur ini akan segera hadir.</p>
              </div>
            } />
          </Routes>
        </div>
      </div>
    </div>
  );
};

const MainApp = () => {
  const { isMaintenance, isLoading } = useContext(SettingsContext);

  if (isLoading) return <div style={{ padding: '50px', textAlign: 'center' }}>Memuat Sistem...</div>;

  if (isMaintenance) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--theme-bg)' }}>
        <h1 style={{ fontSize: '32px' }}>⚙️ Memperbarui Sistem</h1>
        <p>Website sedang dalam proses sinkronisasi pengaturan baru. Mohon tunggu beberapa saat...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<PublicLayout />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/lupa-password" element={<ForgotPassword />} />
      <Route path="/dashboard/*" element={
        <ProtectedRoute allowedRoles={['ADMIN', 'EDITOR']}>
          <DashboardLayout />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default function App() {
  return (
    <SettingsProvider>
      <MainApp />
    </SettingsProvider>
  );
}