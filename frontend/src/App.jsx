import React, { useState, useEffect, useContext } from 'react';
import { SettingsContext, SettingsProvider } from './context/SettingsContext';
import { Routes, Route, Navigate, NavLink, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  PanelLeft, Search, Sun, Moon, Monitor, LogOut, Users as UsersIcon, Settings as SettingsIcon,
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

import './css/dashboard.css'; // MENGIMPOR CSS DASHBOARD BARU

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

  return (
    <div className="dash-wrapper">
      <div className="dash-header">
        <h2 className="dash-title">Dashboard Overview</h2>
        <button className="dash-btn-download" onClick={() => window.print()}>
          Download Report
        </button>
      </div>

      {/* STATS CARDS (8 Kotak) */}
      <div className="dash-stats-grid">
        <div className="dash-stat-card">
          <div className="dash-stat-header">
            <p className="dash-stat-title">Total Pengguna</p>
            <UsersIcon size={18} className="dash-stat-icon" />
          </div>
          <h3 className="dash-stat-value">{loading ? '...' : stats.users}</h3>
          <p className="dash-stat-desc muted">Terdaftar di sistem</p>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-header">
            <p className="dash-stat-title">Tenaga Pengajar</p>
            <GraduationCap size={18} className="dash-stat-icon" />
          </div>
          <h3 className="dash-stat-value">{loading ? '...' : stats.teachers}</h3>
          <p className="dash-stat-desc muted">Staf aktif sekolah</p>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-header">
            <p className="dash-stat-title">Program Keahlian</p>
            <BookOpen size={18} className="dash-stat-icon" />
          </div>
          <h3 className="dash-stat-value">{loading ? '...' : stats.jurusan}</h3>
          <p className="dash-stat-desc muted">Jurusan kompetensi</p>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-header">
            <p className="dash-stat-title">Program Unggulan</p>
            <LayoutTemplate size={18} className="dash-stat-icon" />
          </div>
          <h3 className="dash-stat-value">{loading ? '...' : stats.program}</h3>
          <p className="dash-stat-desc muted">Jalur masa depan</p>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-header">
            <p className="dash-stat-title">Berita & Artikel</p>
            <Newspaper size={18} className="dash-stat-icon" />
          </div>
          <h3 className="dash-stat-value">{loading ? '...' : stats.news}</h3>
          <p className="dash-stat-desc muted">Publikasi web</p>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-header">
            <p className="dash-stat-title">Ekstrakurikuler</p>
            <Activity size={18} className="dash-stat-icon" />
          </div>
          <h3 className="dash-stat-value">{loading ? '...' : stats.ekskul}</h3>
          <p className="dash-stat-desc muted">Kegiatan siswa</p>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-header">
            <p className="dash-stat-title">Karya & Prestasi</p>
            <Trophy size={18} className="dash-stat-icon" />
          </div>
          <h3 className="dash-stat-value">{loading ? '...' : stats.prestasi}</h3>
          <p className="dash-stat-desc muted">Pencapaian sekolah</p>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-header">
            <p className="dash-stat-title">Testimoni</p>
            <MessageSquare size={18} className="dash-stat-icon" />
          </div>
          <h3 className="dash-stat-value">{loading ? '...' : stats.testimoni}</h3>
          <p className="dash-stat-desc muted">Ulasan publik</p>
        </div>
      </div>

      {/* BOTTOM SECTIONS (SHADCN BARS STYLE) */}
      <div className="dash-bottom-grid">
        <div className="dash-chart-card">
          <h3 className="dash-chart-title">Komposisi Konten</h3>
          <p className="dash-chart-subtitle">Distribusi publikasi pada website</p>
          
          <div className="dash-progress-container">
            <div>
              <div className="dash-progress-label"><span>Berita & Artikel</span><span>{stats.news}</span></div>
              <div className="dash-progress-track">
                <div className="dash-progress-fill" style={{ width: `${Math.min((stats.news / 50) * 100, 100)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="dash-progress-label"><span>Karya & Prestasi</span><span>{stats.prestasi}</span></div>
              <div className="dash-progress-track">
                <div className="dash-progress-fill opacity-80" style={{ width: `${Math.min((stats.prestasi / 50) * 100, 100)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="dash-progress-label"><span>Testimoni Publik</span><span>{stats.testimoni}</span></div>
              <div className="dash-progress-track">
                <div className="dash-progress-fill opacity-60" style={{ width: `${Math.min((stats.testimoni / 50) * 100, 100)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="dash-chart-card">
          <h3 className="dash-chart-title">Kapasitas Akademik</h3>
          <p className="dash-chart-subtitle">Ringkasan data edukasi sekolah</p>
          
          <div className="dash-progress-container">
            <div>
              <div className="dash-progress-label"><span>Tenaga Pengajar</span><span>{stats.teachers}</span></div>
              <div className="dash-progress-track">
                <div className="dash-progress-fill" style={{ width: `${Math.min((stats.teachers / 100) * 100, 100)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="dash-progress-label"><span>Jurusan & Program</span><span>{stats.jurusan + stats.program}</span></div>
              <div className="dash-progress-track">
                <div className="dash-progress-fill opacity-80" style={{ width: `${Math.min(((stats.jurusan + stats.program) / 20) * 100, 100)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="dash-progress-label"><span>Ekstrakurikuler Aktif</span><span>{stats.ekskul}</span></div>
              <div className="dash-progress-track">
                <div className="dash-progress-fill opacity-60" style={{ width: `${Math.min((stats.ekskul / 30) * 100, 100)}%` }}></div>
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

      {/* Konten Utama (Wrapper) */}
      <div className="layout-content-wrapper">

        {/* ==============================================
            TOP NAVBAR SHADCN STYLE
            ============================================== */}
        <header className="topbar">
          <div className="topbar-left">
            {/* Tombol selalu tampil dan berfungsi sebagai Toggle (Buka/Tutup) */}
            <button onClick={() => setIsSidebarVisible(!isSidebarVisible)} className="btn-sidebar-toggle">
              <PanelLeft size={20} />
            </button>
            
            {/* Global Search Bar (Trigger Command Palette) */}
            <div onClick={() => setIsCommandOpen(true)} className="topbar-search-trigger">
              <Search size={16} className="topbar-search-icon" />
              <div className="topbar-search-box">
                <span>Pencarian Cepat...</span>
                <span className="topbar-search-shortcut">Ctrl K</span>
              </div>
            </div>
          </div>
          
          <div className="topbar-right">
            {/* Profile Dropdown */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setIsTopUserMenuOpen(!isTopUserMenuOpen)} className="topbar-user-btn">
                <div className="topbar-user-info">
                  <span className="topbar-user-name">{userData.name}</span>
                  <span className="topbar-user-email">{userData.email}</span>
                </div>
                <div className="topbar-user-initial">{userData.initial}</div>
              </button>
  
              {isTopUserMenuOpen && (
                <>
                  <div onClick={() => setIsTopUserMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }}></div>
                  <div className="topbar-dropdown">
                    <div className="topbar-dropdown-header">
                      <p className="topbar-dropdown-name">{userData.name}</p>
                      <p className="topbar-dropdown-email">{userData.email}</p>
                    </div>
                    
                    <button onClick={() => { setIsTopUserMenuOpen(false); navigate('/admin/users'); }} className="topbar-dropdown-item">
                      <UsersIcon size={16} /> Kelola Pengguna
                    </button>
                    
                    <button onClick={() => { setIsTopUserMenuOpen(false); navigate('/admin/settings'); }} className="topbar-dropdown-item">
                      <SettingsIcon size={16} /> Pengaturan
                    </button>

                    <div style={{ margin: '4px 0', borderTop: '1px solid var(--compreng-border)' }}></div>

                    <button onClick={handleLogout} className="topbar-dropdown-item danger">
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
          <div className="cmd-overlay" onClick={() => setIsCommandOpen(false)}>
            <div className="cmd-modal" onClick={e => e.stopPropagation()}>
              
              <div className="cmd-header">
                <Search size={18} color="var(--compreng-text-muted)" style={{ marginRight: '12px' }} />
                <input 
                  autoFocus
                  value={cmdSearch}
                  onChange={e => setCmdSearch(e.target.value)}
                  placeholder="Ketik perintah, cari halaman, atau aksi..." 
                  className="cmd-input"
                />
                <span className="cmd-esc">ESC</span>
              </div>
              
              <div className="cmd-body">
                {filteredCommands.length > 0 ? (
                  filteredCommands.map((cmd, idx) => (
                    <button 
                      key={idx}
                      onClick={() => { navigate(cmd.url); setIsCommandOpen(false); setCmdSearch(''); }}
                      className="cmd-item"
                    >
                      <span className="cmd-item-icon">{cmd.icon}</span>
                      <span style={{ flex: 1 }}>{cmd.title}</span>
                      <span className="cmd-item-type">{cmd.type}</span>
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
        <div className="main-content-area">
          <div className="main-content-inner">
            
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