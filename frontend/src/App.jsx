import React, { useState, useEffect, useContext } from 'react';
import { SettingsContext, SettingsProvider } from './context/SettingsContext';
import { Routes, Route, Navigate, NavLink, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Menu, Search, Sun, Moon, Monitor, LogOut, Users as UsersIcon, Settings as SettingsIcon,
  TrendingUp, Activity, Newspaper, BookOpen, GraduationCap, Trophy, MessageSquare, 
  Image as ImageIcon, LayoutTemplate, PlusCircle, LayoutDashboard
} from 'lucide-react';

import Login from './Login';
import Register from './Register';
import DownloadPage from './pages/DownloadPage';
import Sidebar from './Sidebar'; 


// Import Halaman Admin
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
import AchievementSection from './pages/AchievementSection';

// ==========================================
// HALAMAN DASHBOARD ANALYTICS (REAL DATA)
// ==========================================
const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0, teachers: 0, news: 0, jurusan: 0, program: 0, ekskul: 0, prestasi: 0, testimoni: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const endpoints = [
        { key: 'users', url: 'http://localhost:5001/api/users' },
        { key: 'teachers', url: 'http://localhost:5002/api/teacher' },
        { key: 'news', url: 'http://localhost:5002/api/news' },
        { key: 'jurusan', url: 'http://localhost:5002/api/jurusan' },
        { key: 'program', url: 'http://localhost:5002/api/program' },
        { key: 'ekskul', url: 'http://localhost:5002/api/extracurriculars' },
        { key: 'prestasi', url: 'http://localhost:5002/api/achievements' },
        { key: 'testimoni', url: 'http://localhost:5002/api/testimonials' },
      ];

      const newStats = { ...stats };
      
      await Promise.allSettled(
        endpoints.map(async ({ key, url }) => {
          try {
            const res = await axios.get(url);
            newStats[key] = res.data.data ? res.data.data.length : 0;
          } catch (e) {
            console.warn(`Gagal mengambil data untuk ${key}`);
          }
        })
      );
      
      setStats(newStats);
      setLoading(false);
    };

    fetchStats();
  }, []);

  const cardStyle = { padding: '20px', borderRadius: '12px', border: '1px solid var(--compreng-border)', background: 'var(--compreng-surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', boxSizing: 'border-box' };
  const iconStyle = { color: 'var(--compreng-text-muted)' };
  const valueStyle = { fontSize: '28px', fontWeight: '800', color: 'var(--compreng-text)', margin: '0 0 4px 0', fontFamily: 'var(--theme-font)' };
  const titleStyle = { margin: 0, fontSize: '13px', color: 'var(--compreng-text-muted)', fontWeight: '600' };

  return (
    <div style={{ width: '100%', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--compreng-text)', margin: 0, letterSpacing: '-0.02em' }}>Dashboard Overview</h2>
        <button style={{ padding: '8px 16px', background: 'var(--compreng-text)', color: 'var(--compreng-bg)', borderRadius: '6px', fontWeight: '500', fontSize: '13px', border: 'none', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          Download Report
        </button>
      </div>

      {/* STATS CARDS (8 Kotak) */}
    
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}><p style={titleStyle}>Total Pengguna</p><UsersIcon size={18} style={iconStyle} /></div>
          <h3 style={valueStyle}>{loading ? '...' : stats.users}</h3>
          <p style={{ margin: 0, fontSize: '12px', color: '#16a34a', fontWeight: '500' }}>Terdaftar di sistem</p>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}><p style={titleStyle}>Tenaga Pengajar</p><GraduationCap size={18} style={iconStyle} /></div>
          <h3 style={valueStyle}>{loading ? '...' : stats.teachers}</h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--compreng-text-secondary)', fontWeight: '500' }}>Staf aktif sekolah</p>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}><p style={titleStyle}>Program Keahlian</p><BookOpen size={18} style={iconStyle} /></div>
          <h3 style={valueStyle}>{loading ? '...' : stats.jurusan}</h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--compreng-text-secondary)', fontWeight: '500' }}>Jurusan kompetensi</p>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}><p style={titleStyle}>Program Unggulan</p><LayoutTemplate size={18} style={iconStyle} /></div>
          <h3 style={valueStyle}>{loading ? '...' : stats.program}</h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--compreng-text-secondary)', fontWeight: '500' }}>Jalur masa depan</p>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}><p style={titleStyle}>Berita & Artikel</p><Newspaper size={18} style={iconStyle} /></div>
          <h3 style={valueStyle}>{loading ? '...' : stats.news}</h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--compreng-text-secondary)', fontWeight: '500' }}>Publikasi web</p>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}><p style={titleStyle}>Ekstrakurikuler</p><Activity size={18} style={iconStyle} /></div>
          <h3 style={valueStyle}>{loading ? '...' : stats.ekskul}</h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--compreng-text-secondary)', fontWeight: '500' }}>Kegiatan siswa</p>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}><p style={titleStyle}>Karya & Prestasi</p><Trophy size={18} style={iconStyle} /></div>
          <h3 style={valueStyle}>{loading ? '...' : stats.prestasi}</h3>
          <p style={{ margin: 0, fontSize: '12px', color: '#16a34a', fontWeight: '500' }}>Pencapaian sekolah</p>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}><p style={titleStyle}>Testimoni</p><MessageSquare size={18} style={iconStyle} /></div>
          <h3 style={valueStyle}>{loading ? '...' : stats.testimoni}</h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--compreng-text-secondary)', fontWeight: '500' }}>Ulasan publik</p>
        </div>
      </div>

      {/* BOTTOM SECTIONS (SHADCN BARS STYLE) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--compreng-border)', background: 'var(--compreng-surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--compreng-text)', margin: '0 0 4px 0' }}>Komposisi Konten</h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--compreng-text-muted)', marginBottom: '24px' }}>Distribusi publikasi pada website</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--compreng-text)', fontWeight: '500', marginBottom: '8px' }}><span>Berita & Artikel</span><span>{stats.news}</span></div>
              <div style={{ width: '100%', height: '8px', background: 'var(--compreng-surface-soft)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min((stats.news / 50) * 100, 100)}%`, height: '100%', background: 'var(--compreng-text)', borderRadius: '4px' }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--compreng-text)', fontWeight: '500', marginBottom: '8px' }}><span>Karya & Prestasi</span><span>{stats.prestasi}</span></div>
              <div style={{ width: '100%', height: '8px', background: 'var(--compreng-surface-soft)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min((stats.prestasi / 50) * 100, 100)}%`, height: '100%', background: 'var(--compreng-text)', opacity: '0.8', borderRadius: '4px' }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--compreng-text)', fontWeight: '500', marginBottom: '8px' }}><span>Testimoni Publik</span><span>{stats.testimoni}</span></div>
              <div style={{ width: '100%', height: '8px', background: 'var(--compreng-surface-soft)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min((stats.testimoni / 50) * 100, 100)}%`, height: '100%', background: 'var(--compreng-text)', opacity: '0.6', borderRadius: '4px' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--compreng-border)', background: 'var(--compreng-surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--compreng-text)', margin: '0 0 4px 0' }}>Kapasitas Akademik</h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--compreng-text-muted)', marginBottom: '24px' }}>Ringkasan data edukasi sekolah</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--compreng-text)', fontWeight: '500', marginBottom: '8px' }}><span>Tenaga Pengajar</span><span>{stats.teachers}</span></div>
              <div style={{ width: '100%', height: '8px', background: 'var(--compreng-surface-soft)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min((stats.teachers / 100) * 100, 100)}%`, height: '100%', background: 'var(--compreng-text)', borderRadius: '4px' }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--compreng-text)', fontWeight: '500', marginBottom: '8px' }}><span>Jurusan & Program</span><span>{stats.jurusan + stats.program}</span></div>
              <div style={{ width: '100%', height: '8px', background: 'var(--compreng-surface-soft)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(((stats.jurusan + stats.program) / 20) * 100, 100)}%`, height: '100%', background: 'var(--compreng-text)', opacity: '0.8', borderRadius: '4px' }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--compreng-text)', fontWeight: '500', marginBottom: '8px' }}><span>Ekstrakurikuler Aktif</span><span>{stats.ekskul}</span></div>
              <div style={{ width: '100%', height: '8px', background: 'var(--compreng-surface-soft)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min((stats.ekskul / 30) * 100, 100)}%`, height: '100%', background: 'var(--compreng-text)', opacity: '0.6', borderRadius: '4px' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const PublicLayout = () => (
  <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
    <h1>Landing Page SMKN COMPRENG</h1>
    <p>Ini adalah halaman publik yang bisa dilihat oleh pengunjung tanpa perlu Login.</p>
    <NavLink to="/login" style={{ padding: '10px 20px', background: '#2563eb', color: 'white', textDecoration: 'none', borderRadius: '8px' }}>Masuk ke CMS</NavLink>
  </div>
);

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

  const getExactUser = () => {
    const token = localStorage.getItem('token');
    
    // Fallback dari LocalStorage jika token tidak valid
    let storedUserRaw = localStorage.getItem('user');
    let parsedUser = {};
    try {
      if (storedUserRaw) parsedUser = JSON.parse(storedUserRaw);
    } catch (e) {}

    let exactName = localStorage.getItem('username') || localStorage.getItem('name') || parsedUser.name || parsedUser.username || 'User';
    let exactEmail = localStorage.getItem('email') || localStorage.getItem('userEmail') || parsedUser.email || '-';
    let exactRole = localStorage.getItem('role') || parsedUser.role || 'VIEWER';

    // Coba decode payload JWT
    if (token && token.split('.').length === 3) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        const decoded = JSON.parse(jsonPayload);

        exactName = decoded.name || decoded.nama_lengkap || decoded.full_name || decoded.username || exactName;
        // Pengecekan multi-key untuk email
        exactEmail = decoded.email || decoded.userEmail || decoded.mail || (decoded.username && decoded.username.includes('@') ? decoded.username : exactEmail);
        exactRole = decoded.role || exactRole;
      } catch (e) {
        console.error("Token JWT tidak valid atau rusak", e);
      }
    }

    return {
      name: exactName,
      email: exactEmail !== '-' ? exactEmail : (exactName.includes('@') ? exactName : `${exactName.toLowerCase().replace(/\s+/g, '')}@gmail.com`),
      role: (exactRole || 'VIEWER').toUpperCase(),
      initial: exactName ? exactName.charAt(0).toUpperCase() : 'U'
    };
  };
  
  const userData = getExactUser();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true); 
  
  // STATE NAVBAR ATAS
  const [isTopUserMenuOpen, setIsTopUserMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  // STATE COMMAND PALETTE (Universal Search)
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [cmdSearch, setCmdSearch] = useState('');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  // ==============================================
  // LOGIKA COMMAND PALETTE (CTRL + K)
  // ==============================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isCommandOpen) {
        setIsCommandOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandOpen]);

  // Daftar Navigasi dan Aksi Cepat untuk Command Palette
  const COMMAND_ITEMS = [
    { title: 'Dashboard Overview', type: 'halaman', url: '/admin/dashboard', icon: <LayoutDashboard size={16}/> },
    { title: 'Kelola Pengguna', type: 'halaman', url: '/admin/users', icon: <UsersIcon size={16}/> },
    { title: 'Berita & Artikel', type: 'halaman', url: '/admin/berita', icon: <Newspaper size={16}/> },
    { title: 'Jurusan & Program', type: 'halaman', url: '/admin/jurusan', icon: <BookOpen size={16}/> },
    { title: 'Ekstrakurikuler', type: 'halaman', url: '/admin/ekstrakurikuler', icon: <Activity size={16}/> },
    { title: 'Tenaga Pengajar', type: 'halaman', url: '/admin/pengajar', icon: <GraduationCap size={16}/> },
    { title: 'Karya & Prestasi', type: 'halaman', url: '/admin/prestasi', icon: <Trophy size={16}/> },
    { title: 'Testimoni', type: 'halaman', url: '/admin/testimoni', icon: <MessageSquare size={16}/> },
    { title: 'Galeri Sekolah', type: 'halaman', url: '/admin/galeri', icon: <ImageIcon size={16}/> },
    { title: 'Pengaturan Profile & Identitas', type: 'pengaturan', url: '/admin/settings/profile', icon: <SettingsIcon size={16}/> },
    { title: 'Pengaturan Tema Web', type: 'pengaturan', url: '/admin/settings/appearance', icon: <SettingsIcon size={16}/> },
    { title: 'Tambah Berita Baru', type: 'aksi', url: '/admin/berita', icon: <PlusCircle size={16}/> },
    { title: 'Tambah Pengguna', type: 'aksi', url: '/admin/users', icon: <PlusCircle size={16}/> },
  ];

  const filteredCommands = COMMAND_ITEMS.filter(cmd => 
    cmd.title.toLowerCase().includes(cmdSearch.toLowerCase()) || 
    cmd.type.toLowerCase().includes(cmdSearch.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      {isMobileMenuOpen && <div className="sidebar-overlay" onClick={toggleMobileMenu}></div>}

      <Sidebar 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isSidebarVisible={isSidebarVisible}
        setIsSidebarVisible={setIsSidebarVisible}
        userData={userData}
      />

      {/* Konten Utama - Mengatur background dan tinggi layar */}
      <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, height: '100vh', backgroundColor: 'var(--compreng-bg)', overflow: 'hidden' }}>

        {/* ==============================================
            TOP NAVBAR SHADCN STYLE
            ============================================== */}
        <header style={{ 
  height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
  padding: '0 24px', borderBottom: '1px solid var(--compreng-border)', 
  background: 'var(--compreng-surface)', zIndex: 40, flexShrink: 0, boxSizing: 'border-box', width: '100%'
}}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
            {!isSidebarVisible && (
              <button onClick={() => setIsSidebarVisible(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--compreng-text-secondary)', display: 'flex', alignItems: 'center' }}>
                <Menu size={20} />
              </button>
            )}
            
            {/* Global Search Bar (Trigger Command Palette) */}
            <div 
              onClick={() => setIsCommandOpen(true)}
              style={{ position: 'relative', width: '320px', maxWidth: '100%', cursor: 'pointer' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--compreng-text-muted)', pointerEvents: 'none' }} />
              <div style={{ 
                  width: '100%', padding: '8px 12px 8px 36px', borderRadius: '6px', 
                  border: '1px solid var(--compreng-border)', background: 'var(--compreng-bg)', 
                  color: 'var(--compreng-text-muted)', fontSize: '13px', boxSizing: 'border-box',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                <span>Pencarian Cepat...</span>
                <span style={{ fontSize: '10px', color: 'var(--compreng-text-muted)', background: 'var(--compreng-surface)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--compreng-border)' }}>Ctrl K</span>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            
            {/* Theme Toggle Dropdown */}
            <div style={{ position: 'relative' }}>
              <button 
  onClick={() => setIsTopUserMenuOpen(!isTopUserMenuOpen)} 
  style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: '10px', 
    background: 'transparent', 
    border: 'none', 
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '8px',
    transition: 'background 0.2s',
    maxWidth: '220px'
  }}
  onMouseOver={(e) => e.currentTarget.style.background = 'var(--compreng-surface-soft)'}
  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
>
  {/* Teks Nama & Email */}
  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
    <span style={{ 
      fontSize: '13px', 
      fontWeight: '600', 
      color: 'var(--compreng-text)', 
      lineHeight: '1.2',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }}>
      {userData.name}
    </span>
    <span style={{ 
      fontSize: '11px', 
      color: 'var(--compreng-text-muted)', 
      lineHeight: '1.2',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }}>
      {userData.email}
    </span>
  </div>

  {/* Inisial Profil Lingkaran */}
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    width: '36px', 
    height: '36px', 
    borderRadius: '50%', 
    background: 'var(--compreng-text)', 
    color: 'var(--compreng-bg)', 
    fontWeight: '600', 
    fontSize: '14px',
    flexShrink: 0
  }}>
    {userData.initial}
  </div>
</button>
  
  {isTopUserMenuOpen && (
    <>
      <div onClick={() => setIsTopUserMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }}></div>
      <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 15px)', width: '220px', background: 'var(--compreng-surface)', border: '1px solid var(--compreng-border)', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '6px', zIndex: 50 }}>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--compreng-border)', marginBottom: '6px' }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--compreng-text)' }}>{userData.name}</p>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--compreng-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userData.email}</p>
        </div>
        
        <button onClick={() => { setIsTopUserMenuOpen(false); navigate('/admin/users'); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'transparent', border: 'none', color: 'var(--compreng-text)', fontSize: '13px', cursor: 'pointer', borderRadius: '4px', transition: 'background 0.2s' }} onMouseOver={(e)=>e.currentTarget.style.background='var(--compreng-surface-soft)'} onMouseOut={(e)=>e.currentTarget.style.background='transparent'}>
          <UsersIcon size={16} /> Kelola Pengguna
        </button>
        
        <button onClick={() => { setIsTopUserMenuOpen(false); navigate('/admin/settings'); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'transparent', border: 'none', color: 'var(--compreng-text)', fontSize: '13px', cursor: 'pointer', borderRadius: '4px', transition: 'background 0.2s' }} onMouseOver={(e)=>e.currentTarget.style.background='var(--compreng-surface-soft)'} onMouseOut={(e)=>e.currentTarget.style.background='transparent'}>
          <SettingsIcon size={16} /> Pengaturan
        </button>

        <div style={{ margin: '4px 0', borderTop: '1px solid var(--compreng-border)' }}></div>

        <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'transparent', border: 'none', color: '#dc2626', fontSize: '13px', cursor: 'pointer', borderRadius: '4px', fontWeight: '500', transition: 'background 0.2s' }} onMouseOver={(e)=>e.currentTarget.style.background='#fef2f2'} onMouseOut={(e)=>e.currentTarget.style.background='transparent'}>
          <LogOut size={16} /> Log out
        </button>
      </div>
    </>
  )}
</div>
          </div>
        </header>

        {/* ==============================================
            MODAL COMMAND PALETTE (Universal Search)
            ============================================== */}
        {isCommandOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '12vh' }} onClick={() => setIsCommandOpen(false)}>
            <div style={{ background: 'var(--compreng-surface)', width: '100%', maxWidth: '540px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', overflow: 'hidden', border: '1px solid var(--compreng-border)' }} onClick={e => e.stopPropagation()}>
              
              <div style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--compreng-border)' }}>
                <Search size={18} color="var(--compreng-text-muted)" style={{ marginRight: '12px' }} />
                <input 
                  autoFocus
                  value={cmdSearch}
                  onChange={e => setCmdSearch(e.target.value)}
                  placeholder="Ketik perintah, cari halaman, atau aksi..." 
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '15px', color: 'var(--compreng-text)' }} 
                />
                <span style={{ fontSize: '10px', background: 'var(--compreng-bg)', padding: '4px 6px', borderRadius: '4px', color: 'var(--compreng-text-muted)', border: '1px solid var(--compreng-border)', fontWeight: 'bold' }}>ESC</span>
              </div>
              
              <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '12px' }}>
                {filteredCommands.length > 0 ? (
                  filteredCommands.map((cmd, idx) => (
                    <button 
                      key={idx}
                      onClick={() => { navigate(cmd.url); setIsCommandOpen(false); setCmdSearch(''); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'var(--compreng-text)', fontSize: '14px', textAlign: 'left', transition: 'background 0.2s', marginBottom: '2px' }}
                      onMouseOver={e => e.currentTarget.style.background = 'var(--compreng-surface-soft)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ color: 'var(--compreng-text-muted)' }}>{cmd.icon}</span>
                      <span style={{ flex: 1 }}>{cmd.title}</span>
                      <span style={{ fontSize: '11px', color: 'var(--compreng-text-muted)', textTransform: 'capitalize' }}>{cmd.type}</span>
                    </button>
                  ))
                ) : (
                  <p style={{ textAlign: 'center', padding: '40px', fontSize: '14px', color: 'var(--compreng-text-muted)', margin: 0 }}>Halaman atau perintah tidak ditemukan.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==============================================
            WADAH KONTEN UTAMA DENGAN PADDING GLOBAL (FIX ZOOM)
            ============================================== */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 30px', boxSizing: 'border-box' }}>
          <div style={{ maxWidth: '100%', margin: '0 auto', width: '100%' }}>
            
            <Routes>
              <Route index element={<Navigate to="dashboard" replace />} />
              
              {/* ROUTE LENGKAP HALAMAN ADMIN */}
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="profil" element={<ProfilSekolah />} />
              <Route path="berita" element={<ManageNews />} />
              <Route path="berita/:slug" element={<DetailManageNews />} />
              <Route path="jurusan" element={<ManageJurusanProgram />} />
              <Route path="ekstrakurikuler" element={<Ekstrakurikuler />} />
              <Route path="pengajar" element={<ManagePengajar />} />
              <Route path="prestasi" element={<AchievementSection />} />
              <Route path="testimoni" element={<TestimonialPage />} />
              <Route path="galeri" element={<Galeri />} />
              <Route path="faq" element={<FaqPage />} />
              <Route path="kurikulum/:slug" element={<DetailKurikulum />} />
              <Route path="downloads" element={<DownloadPage />} />

              {userData.role === 'ADMIN' && (
                <Route path="users" element={<ManageUsers />} />
              )}

              {userData.role === 'ADMIN' && (
                <Route path="settings/*" element={<ManageSettings />} />
              )}

              <Route path="*" element={
                <div style={{ padding: '40px', background: 'var(--compreng-surface)', border: '1px solid var(--compreng-border)', borderRadius: '12px' }}>
                  <h2 style={{ color: 'var(--compreng-text)', marginTop: 0 }}>Halaman Tidak Ditemukan</h2>
                  <p style={{ color: 'var(--compreng-text-muted)' }}>Fitur ini mungkin sedang dalam pengembangan atau URL tidak valid.</p>
                </div>
              } />
            </Routes>

          </div>
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
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--compreng-bg)' }}>
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
      <Route path="/dashboard/*" element={<Navigate to="/admin" replace />} />
      <Route path="/admin/*" element={
        <ProtectedRoute allowedRoles={['ADMIN', 'EDITOR']}>
          <DashboardLayout />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
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