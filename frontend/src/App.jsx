import { useState } from 'react'; 
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import { 
  Users, School, Newspaper, BookOpen, Activity, 
  GraduationCap, Trophy, MessageSquare, HelpCircle, 
  Image as ImageIcon, MapPin, LogOut, LayoutDashboard, Settings,
  Menu, X 
} from 'lucide-react';

import './App.css';
import ManageNews from './pages/ManageNews';
import ManageSettings from './pages/ManageSettings';

// 1. Tata Letak Publik (Untuk Pengunjung)
const PublicLayout = () => (
  <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
    <h1>Landing Page SMKN COMPRENG</h1>
    <p>Ini adalah halaman publik yang bisa dilihat oleh pengunjung tanpa perlu Login.</p>
    <NavLink to="/login" style={{ padding: '10px 20px', background: '#2563eb', color: 'white', textDecoration: 'none', borderRadius: '8px' }}>Masuk ke CMS</NavLink>
  </div>
);

// 2. Satpam Frontend (Pengecek Hak Akses)
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

// 3. Tata Letak Dashboard Dinamis
const DashboardLayout = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('role');
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const menuItems = [
    { title: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/dashboard', roles: ['admin', 'editor'] },
    { title: 'Kelola Pengguna', icon: <Users size={18} />, path: '/dashboard/pengguna', roles: ['admin'] },
    { title: 'Profil Sekolah', icon: <School size={18} />, path: '/dashboard/profil', roles: ['admin'] },
    { title: 'Pengaturan Website', icon: <Settings size={18} />, path: '/dashboard/settings', roles: ['admin'] },
    
    { title: 'Berita & Artikel', icon: <Newspaper size={18} />, path: '/dashboard/berita', roles: ['admin', 'editor'] },
    { title: 'Jurusan & Program', icon: <BookOpen size={18} />, path: '/dashboard/jurusan', roles: ['admin', 'editor'] },
    { title: 'Ekstrakurikuler', icon: <Activity size={18} />, path: '/dashboard/ekskul', roles: ['admin', 'editor'] },
    
    { title: 'Tenaga Pengajar', icon: <GraduationCap size={18} />, path: '/dashboard/pengajar', roles: ['admin'] },
    
    { title: 'Karya & Prestasi', icon: <Trophy size={18} />, path: '/dashboard/prestasi', roles: ['admin', 'editor'] },
    { title: 'Testimoni', icon: <MessageSquare size={18} />, path: '/dashboard/testimoni', roles: ['admin', 'editor'] },
    
    { title: 'FAQ', icon: <HelpCircle size={18} />, path: '/dashboard/faq', roles: ['admin'] },
    
    { title: 'Galeri', icon: <ImageIcon size={18} />, path: '/dashboard/galeri', roles: ['admin', 'editor'] },
    
    { title: 'Kontak & Alamat', icon: <MapPin size={18} />, path: '/dashboard/kontak', roles: ['admin'] },
  ];

  const allowedMenus = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="dashboard-container">
      
      {/* Overlay layar saat sidebar terbuka di HP */}
      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={toggleMobileMenu}></div>
      )}

      {/* SIDEBAR: Ditambah class dynamic "open" */}
      <div className={`dashboard-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>CMS Sekolah</h2>
          <p>Login sebagai: <b>{userRole}</b></p>
        </div>
        
        <div className="sidebar-menu">
          <ul>
            {allowedMenus.map((menu, index) => (
              <li key={index}>
                <NavLink 
                  to={menu.path} 
                  className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
                  onClick={() => setIsMobileMenuOpen(false)}
                  end={menu.path === '/dashboard'}
                >
                  {menu.icon}
                  <span style={{ fontSize: '14px' }}>{menu.title}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* AREA KONTEN UTAMA */}
      <div className="dashboard-content">
        
        {/* Tombol */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
          <button className="menu-toggle-btn" onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <Routes>
          <Route path="/" element={
            <div className="content-card">
              <h2>Selamat Datang di Area Kerja {userRole === 'admin' ? 'Administrator' : 'Editor'}</h2>
              <p>Silakan pilih menu di sebelah kiri untuk mulai mengelola konten website.</p>
            </div>
          } />
          <Route path="/berita" element={<ManageNews />} />
          <Route path="/settings" element={<ManageSettings />} />
        </Routes>
      </div>
      
    </div>
  );
};

// 4. Kumpulan Routing Utama
function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Route Dashboard (Terlindungi) */}
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