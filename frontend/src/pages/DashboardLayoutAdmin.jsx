import { useState, useEffect } from 'react';
import axios from 'axios';
import { Routes, Route, Navigate, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  PanelLeft, Search, LogOut, Users as UsersIcon, Settings as SettingsIcon,
  Activity, Newspaper, BookOpen, GraduationCap, Trophy, MessageSquare, 
  Image as ImageIcon, LayoutTemplate, PlusCircle, LayoutDashboard, ExternalLink, ChevronRight, Download
} from 'lucide-react';
import { getImageUrl } from '../utils/media';
import DownloadPage from './DownloadPage';
import Sidebar from '../Sidebar';
import CommandPalette from '../components/CommandPalette';

// Import Halaman Admin
import ManageNews from './ManageNews';
import DetailNews from './DetailNews';
import ManageSettings from './ManageSettings';
import ManageUsers from './ManageUsers';
import ManageJurusanProgram from './ManageJurusanProgram';
import ManagePengajar from './ManagePengajar';
import ProfilSekolah from './ProfilSekolah';
import Ekstrakurikuler from './Ekstrakurikuler';
import TestimonialPage from './TestimonialPage';
import Galeri from './Galeri';
import FaqPage from './FaqPage';
import AchievementSection from './AchievementSection';
import ManageIndustryPartners from './ManageIndustryPartners';


  // HALAMAN DASHBOARD ANALYTICS (REAL DATA)
 
  const AdminDashboard = ({ isAdmin = false }) => {
    const [stats, setStats] = useState({
      users: 0, teachers: 0, news: 0, jurusan: 0, program: 0, ekskul: 0, prestasi: 0, testimoni: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchStats = async () => {
        const endpoints = [
          { key: 'users', url: 'https://smkn-compreng-api-pi.vercel.app/api/users' },
          { key: 'teachers', url: 'https://smkn-compreng-api-pi.vercel.app/api/teacher' },
          { key: 'news', url: 'https://smkn-compreng-api-pi.vercel.app/api/news' },
          { key: 'jurusan', url: 'https://smkn-compreng-api-pi.vercel.app/api/jurusan' },
          { key: 'program', url: 'https://smkn-compreng-api-pi.vercel.app/api/program' },
          { key: 'ekskul', url: 'https://smkn-compreng-api-pi.vercel.app/api/extracurriculars' },
          { key: 'prestasi', url: 'https://smkn-compreng-api-pi.vercel.app/api/achievements' },
          { key: 'testimoni', url: 'https://smkn-compreng-api-pi.vercel.app/api/testimonials' },
        ];

        //  Ganti Promise.allSettled dengan 'for...of' loop
        // API akan dipanggil secara mengantre (satu selesai, baru lanjut yang lain)
        // Ini menyelamatkan database dari serangan koneksi mendadak!
        const token = localStorage.getItem('token');
        for (const { key, url } of endpoints) {
          // Editor tidak punya akses data pengguna -> lewati request-nya
          if (key === 'users' && !isAdmin) continue;
          try {
            const res = await axios.get(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
            const count = res.data.data ? res.data.data.length : 0;
            
            // Update angka secara real-time satu per satu (efeknya keren lho!)
            setStats(prevStats => ({ ...prevStats, [key]: count }));
          } catch (e) {
            console.warn(`Gagal mengambil data untuk ${key}`);
          }
        }
        
        setLoading(false);
      };

      fetchStats();
    }, []);

  return (
    <div className="dash-wrapper">
      <div className="dash-header">
        <h2 className="dash-title">Dashboard Overview</h2>
        <button type="button" className="dash-btn-download" onClick={() => window.print()}>
          <Download size={16} aria-hidden="true" />
          <span>Download Report</span>
        </button>
      </div>

      {/* STATS CARDS (8 Kotak) */}
      <div className="dash-stats-grid">
        {/* Total Pengguna hanya untuk ADMIN (disembunyikan untuk editor) */}
        {isAdmin && (
          <div className="dash-stat-card">
            <div className="dash-stat-header">
              <p className="dash-stat-title">Total Pengguna</p>
              <UsersIcon size={18} className="dash-stat-icon" />
            </div>
            <h3 className="dash-stat-value">{loading ? '...' : stats.users}</h3>
            <p className="dash-stat-desc muted">Terdaftar di sistem</p>
          </div>
        )}

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


// Batas layar HP/tablet untuk mode drawer (sinkron dengan css/admin-responsive.css)
const ADMIN_MOBILE_QUERY = '(max-width: 1024px)';

const DashboardLayoutAdmin = () => {
  const navigate = useNavigate();

  const getExactUser = () => {
    const token = localStorage.getItem('token');

    // Data ASLI hasil login/register (disimpan oleh saveSession di utils/auth.js).
    // Username & email di sini SELALU nilai asli dari database lewat backend,
    // tidak pernah direka-reka (mis. "namadepan@gmail.com").
    let exactUsername = localStorage.getItem('username') || 'user';
    let exactEmail = localStorage.getItem('email') || '';
    let exactRole = localStorage.getItem('role') || 'viewer';

    // JWT hanya berisi { id, username, role } (lihat auth-service), jadi hanya dipakai
    // sebagai fallback role/username kalau localStorage kosong -> BUKAN sumber email.
    if (token && token.split('.').length === 3) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        const decoded = JSON.parse(jsonPayload);

        if (!localStorage.getItem('username') && decoded.username) exactUsername = decoded.username;
        exactRole = localStorage.getItem('role') || decoded.role || exactRole;
      } catch (e) {
        console.error("Token JWT tidak valid atau rusak", e);
      }
    }

    return {
      name: exactUsername,
      email: exactEmail || 'Email tidak tersedia',
      avatar: localStorage.getItem('avatar') || '',
      role: (exactRole || 'VIEWER').toUpperCase(),
      initial: exactUsername ? exactUsername.charAt(0).toUpperCase() : 'U'
    };
  };
  
  // Render ulang otomatis saat foto/nama profil berubah (edit user, verifikasi sesi, antar-tab)
  const [, setProfileTick] = useState(0);
  useEffect(() => {
    const bump = () => setProfileTick((n) => n + 1);
    window.addEventListener('auth:profile-updated', bump);
    window.addEventListener('storage', bump);
    return () => {
      window.removeEventListener('auth:profile-updated', bump);
      window.removeEventListener('storage', bump);
    };
  }, []);

  const userData = getExactUser();
  const isAdmin = userData.role === 'ADMIN'; // hanya ADMIN yang boleh Kelola Pengguna & Pengaturan di navbar admin

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true); 
  const location = useLocation();

  // ==============================================
  // RESPONSIVE: di layar <= 1024px sidebar berubah jadi drawer (geser dari kiri).
  // Tombol di topbar membuka/menutup drawer (isMobileMenuOpen), sedangkan di desktop
  // tombol yang sama tetap mengecilkan/melebarkan sidebar (isSidebarVisible).

  // ==============================================
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(ADMIN_MOBILE_QUERY).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(ADMIN_MOBILE_QUERY);
    const onChange = (e) => {
      setIsMobile(e.matches);
      if (!e.matches) setIsMobileMenuOpen(false); // kembali ke desktop -> tutup drawer
    };
    setIsMobile(mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange); // Safari lama
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  // Drawer otomatis menutup setelah pindah halaman
  useEffect(() => { setIsMobileMenuOpen(false); }, [location.pathname]);

  // Saat drawer terbuka: kunci scroll halaman di belakangnya & Escape untuk menutup
  useEffect(() => {
    if (!(isMobile && isMobileMenuOpen)) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setIsMobileMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [isMobile, isMobileMenuOpen]);

  const handleToggleSidebar = () => {
    if (isMobile) setIsMobileMenuOpen((open) => !open);
    else setIsSidebarVisible((visible) => !visible);
  };
  
  // STATE NAVBAR ATAS
  const [isTopUserMenuOpen, setIsTopUserMenuOpen] = useState(false);
  
  // STATE COMMAND PALETTE (Universal Search)
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent || '');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  // Label breadcrumb di topbar (Admin > Nama Halaman) mengikuti URL aktif
  const BREADCRUMB_LABELS = {
    dashboard: 'Dashboard',
    profil: 'Profil Sekolah',
    berita: 'Berita & Artikel',
    jurusan: 'Jurusan & Program',
    ekstrakurikuler: 'Ekstrakurikuler',
    pengajar: 'Tenaga Pengajar',
    prestasi: 'Karya & Prestasi',
    'mitra-industri': 'Mitra Industri',
    testimoni: 'Testimoni',
    galeri: 'Galeri Sekolah',
    faq: 'FAQ',
    downloads: 'Unduhan',
    users: 'Kelola Pengguna',
    settings: 'Pengaturan',
  };
  const currentSegment = location.pathname.replace(/^\/admin\/?/, '').split('/')[0] || 'dashboard';
  const currentPageLabel = BREADCRUMB_LABELS[currentSegment]
    || currentSegment.charAt(0).toUpperCase() + currentSegment.slice(1).replace(/-/g, ' ');

  // ==============================================
  // LOGIKA COMMAND PALETTE (CTRL + K)
  // ==============================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key || '').toLowerCase() === 'k') {
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
    { title: 'Kelola Pengguna', type: 'halaman', url: '/admin/users', icon: <UsersIcon size={16}/>, adminOnly: true },
    { title: 'Berita & Artikel', type: 'halaman', url: '/admin/berita', icon: <Newspaper size={16}/> },
    { title: 'Jurusan & Program', type: 'halaman', url: '/admin/jurusan', icon: <BookOpen size={16}/> },
    { title: 'Ekstrakurikuler', type: 'halaman', url: '/admin/ekstrakurikuler', icon: <Activity size={16}/> },
    { title: 'Tenaga Pengajar', type: 'halaman', url: '/admin/pengajar', icon: <GraduationCap size={16}/>, adminOnly: true },
    { title: 'Karya & Prestasi', type: 'halaman', url: '/admin/prestasi', icon: <Trophy size={16}/> },
    { title: 'Testimoni', type: 'halaman', url: '/admin/testimoni', icon: <MessageSquare size={16}/> },
    { title: 'Galeri Sekolah', type: 'halaman', url: '/admin/galeri', icon: <ImageIcon size={16}/> },
    { title: 'Pengaturan Profile & Identitas', type: 'pengaturan', url: '/admin/settings/profile', icon: <SettingsIcon size={16}/>, adminOnly: true },
    { title: 'Pengaturan Tema Web', type: 'pengaturan', url: '/admin/settings/appearance', icon: <SettingsIcon size={16}/>, adminOnly: true },
    { title: 'Tambah Berita Baru', type: 'aksi', url: '/admin/berita', icon: <PlusCircle size={16}/> },
    { title: 'Tambah Pengguna', type: 'aksi', url: '/admin/users', icon: <PlusCircle size={16}/>, adminOnly: true },
  ];

  // Editor tidak melihat item yang hanya boleh diakses ADMIN
  const visibleCommandItems = COMMAND_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  const handleCommandSelect = (cmd) => {
    setIsCommandOpen(false);
    navigate(cmd.url);
  };

  return (
    <div className="dashboard-container">
      {isMobileMenuOpen && <div className="sidebar-overlay" onClick={toggleMobileMenu}></div>}

      <Sidebar 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isSidebarVisible={isMobile ? true : isSidebarVisible}
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
            <button
              type="button"
              onClick={handleToggleSidebar}
              className="btn-sidebar-toggle"
              aria-label={isMobile ? 'Buka menu navigasi' : 'Ciutkan / lebarkan sidebar'}
              aria-expanded={isMobile ? isMobileMenuOpen : isSidebarVisible}
            >
              <PanelLeft size={20} />
            </button>

            {/* Breadcrumb: Admin/Editor (sesuai role login) > Halaman aktif (disembunyikan di layar kecil) */}
            <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
              <NavLink to="/admin/dashboard" className="topbar-crumb-root">{isAdmin ? 'Admin' : 'Editor'}</NavLink>
              <ChevronRight size={14} className="topbar-crumb-sep" aria-hidden="true" />
              <span className="topbar-crumb-current" aria-current="page">{currentPageLabel}</span>
            </nav>
          </div>
          
          <div className="topbar-right">
            {/* Global Search Bar (Trigger Command Palette) */}
            <button
              type="button"
              onClick={() => setIsCommandOpen(true)}
              className="qs-trigger"
              aria-label="Buka pencarian cepat"
              aria-keyshortcuts="Control+K Meta+K"
            >
              <Search size={16} className="qs-trigger-glyph" aria-hidden="true" />
              <span className="qs-trigger-label">Pencarian Cepat…</span>
              <span className="qs-trigger-keys" aria-hidden="true">
                <kbd>{isMac ? '⌘' : 'Ctrl'}</kbd>
                <kbd>K</kbd>
              </span>
            </button>

            {/* Lihat Website: buka halaman publik di tab baru */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="topbar-site-link"
              aria-label="Lihat Website (buka di tab baru)"
              title="Lihat Website"
            >
              <ExternalLink size={16} aria-hidden="true" />
              <span className="topbar-site-link-text">Lihat Website</span>
            </a>

            {/* Profile Dropdown */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setIsTopUserMenuOpen(!isTopUserMenuOpen)} className="topbar-user-btn">
                <div className="topbar-user-info">
                  <span className="topbar-user-name">{userData.name}</span>
                  <span className="topbar-user-email">{userData.email}</span>
                </div>
                <div className="topbar-user-initial">
                  {userData.initial}
                  {userData.avatar && (
                    <img
                      src={getImageUrl(userData.avatar)}
                      alt={userData.name}
                      className="topbar-user-photo"
                      referrerPolicy="no-referrer"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                </div>
              </button>
  
              {isTopUserMenuOpen && (
                <>
                  <div onClick={() => setIsTopUserMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }}></div>
                  <div className="topbar-dropdown">
                    <div className="topbar-dropdown-header">
                      <div className="topbar-user-initial topbar-dropdown-pic">
                        {userData.initial}
                        {userData.avatar && (
                          <img
                            src={getImageUrl(userData.avatar)}
                            alt={userData.name}
                            className="topbar-user-photo"
                            referrerPolicy="no-referrer"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                      </div>
                      <div className="topbar-dropdown-info">
                        <p className="topbar-dropdown-name">{userData.name}</p>
                        <p className="topbar-dropdown-email">{userData.email}</p>
                      </div>
                    </div>
                    
                    {/* Kelola Pengguna & Pengaturan hanya untuk ADMIN (editor langsung ke Log out) */}
                    {isAdmin && (
                      <>
                        <button onClick={() => { setIsTopUserMenuOpen(false); navigate('/admin/users'); }} className="topbar-dropdown-item">
                          <UsersIcon size={16} /> Kelola Pengguna
                        </button>
                        
                        <button onClick={() => { setIsTopUserMenuOpen(false); navigate('/admin/settings'); }} className="topbar-dropdown-item">
                          <SettingsIcon size={16} /> Pengaturan
                        </button>

                        <div style={{ margin: '4px 0', borderTop: '1px solid var(--compreng-border)' }}></div>
                      </>
                    )}

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
        <CommandPalette
          open={isCommandOpen}
          items={visibleCommandItems}
          onSelect={handleCommandSelect}
          onClose={() => setIsCommandOpen(false)}
        />

        {/* ==============================================
            WADAH KONTEN UTAMA DENGAN PADDING GLOBAL (FIX ZOOM)
            ============================================== */}
        <div className="main-content-area">
          <div className="main-content-inner">
            
            <Routes>
              <Route index element={<Navigate to="dashboard" replace />} />
              
              {/* ROUTE LENGKAP HALAMAN ADMIN */}
              <Route path="dashboard" element={<AdminDashboard isAdmin={isAdmin} />} />
              <Route path="profil" element={<ProfilSekolah />} />
              <Route path="berita" element={<ManageNews />} />
              <Route path="berita/:slug" element={<DetailNews />} />
              <Route path="jurusan" element={<ManageJurusanProgram />} />
              <Route path="ekstrakurikuler" element={<Ekstrakurikuler />} />
              <Route path="pengajar" element={<ManagePengajar />} />
              <Route path="prestasi" element={<AchievementSection />} />
              <Route path="mitra-industri" element={<ManageIndustryPartners />} />
              <Route path="testimoni" element={<TestimonialPage />} />
              <Route path="galeri" element={<Galeri />} />
              <Route path="faq" element={<FaqPage />} />
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

export default DashboardLayoutAdmin;
