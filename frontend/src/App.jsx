import React, { useState, useContext } from 'react';
import { SettingsContext, SettingsProvider } from './context/SettingsContext';
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import DownloadPage from './pages/DownloadPage';

import Sidebar from './Sidebar'; 

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


import AchievementSection from './pages/AchievementSection';



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
  const [isSidebarVisible, setIsSidebarVisible] = useState(true); 

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);



  return (
    <div className="dashboard-container">


      {isMobileMenuOpen && <div className="sidebar-overlay" onClick={toggleMobileMenu}></div>}

      {/* Komponen Sidebar yang telah dipisah */}
      <Sidebar 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isSidebarVisible={isSidebarVisible}
        setIsSidebarVisible={setIsSidebarVisible}
        userData={userData}
        handleLogout={handleLogout}
      />

      <div className="dashboard-content" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', display: 'flex', flexDirection: 'column' }}>


        <div style={{ flex: 1 }}>
          <Routes>
            <Route index element={<Navigate to="users" replace />} />
            
            {/* ROUTE LENGKAP HALAMAN ADMIN */}
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
              <Route path="users" element={
                <div style={{ padding: '40px', background: 'var(--theme-bg)', minHeight: '100vh' }}>
                  <ManageUsers />
                </div>
              } />
            )}

            {userData.role === 'ADMIN' && (
              <Route path="settings/*" element={<ManageSettings />} />
            )}

            <Route path="*" element={
              <div style={{ padding: '30px', background: 'var(--theme-card)', borderRadius: '12px', margin: '40px' }}>
                <h2>Halaman Tidak Ditemukan</h2>
                <p>Fitur ini mungkin sedang dalam pengembangan atau URL tidak valid.</p>
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