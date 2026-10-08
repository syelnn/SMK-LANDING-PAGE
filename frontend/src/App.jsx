import React, { useState, useEffect, useContext, useCallback } from 'react';
import { SettingsContext, SettingsProvider } from './context/SettingsContext';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import LandingPage from './pages/viewer/LandingPage'; 
import DetailKurikulumViewer from './pages/viewer/DetailKurikulum';
import NewsDetail from './pages/viewer/NewsDetail';
import DownloadViewer from './pages/viewer/DownloadViewer';
import TulisTestimoni from './pages/viewer/TulisTestimoni';
import TracerStudy from './pages/viewer/TracerStudy';
import IsiTracerStudy from './pages/viewer/IsiTracerStudy';
import GaleriAlbumViewer from './pages/viewer/GaleriAlbumViewer';

import Login from './Login';
import Register from './Register';
import ForgotPassword from './pages/ForgotPassword'; 
import { verifySession, clearSession, getSession, homeFor } from './utils/auth';

// Halaman Dashboard Admin (dipisah dari App.jsx)
import DashboardLayoutAdmin from './pages/DashboardLayoutAdmin';

import './css/dashboard.css'; // MENGIMPOR CSS DASHBOARD 
import './css/theme.css';
import './css/admin-responsive.css'; // RESPONSIVE ADMIN/EDITOR (harus paling akhir agar menang atas CSS lain)

// URL section landing page (hasil scroll-spy) — kalau di-refresh tetap membuka landing & scroll ke section
const LANDING_SECTION_PATHS = [
  '/profil', '/program', '/ekstrakurikuler', '/ekskul', '/tenagapengajar', '/guru', '/pengajar',
  '/karya', '/prestasi', '/achievement', '/galeri', '/testimoni', '/faq', '/kontak',
  '/berita', '/jurusan', '/mitra-industri', '/mitraindustri',
];

const PublicLayout = () => (
  <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
    <h1>Landing Page SMKN COMPRENG</h1>
    <p>Ini adalah halaman publik yang bisa dilihat oleh pengunjung tanpa perlu Login.</p>
    <NavLink to="/login" style={{ padding: '10px 20px', background: 'var(--compreng-accent, #2563eb)', color: 'var(--compreng-accent-text, #ffffff)', textDecoration: 'none', borderRadius: '8px' }}>Masuk ke CMS</NavLink>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  // status: checking | ok | invalid | network
  const [auth, setAuth] = useState({ status: 'checking', role: '', reason: '' });

  // Token SELALU dicek ke server (bukan cuma dibaca dari localStorage)
  const check = useCallback(async () => {
    const result = await verifySession();
    if (result.ok) {
      setAuth({ status: 'ok', role: result.user.role, reason: '' });
    } else if (result.reason === 'NETWORK') {
      // server mati/sibuk: jangan tendang user yang sudah terverifikasi, tapi jangan loloskan yang belum
      setAuth((prev) => (prev.status === 'ok' ? prev : { status: 'network', role: '', reason: '' }));
    } else {
      clearSession();
      setAuth({ status: 'invalid', role: '', reason: result.reason });
    }
  }, []);

  // Verifikasi ulang setiap pindah halaman admin, saat tab difokuskan, dan tiap 60 detik
  useEffect(() => { check(); }, [check, location.pathname]);
  useEffect(() => {
    const id = setInterval(check, 60000);
    window.addEventListener('focus', check);
    return () => { clearInterval(id); window.removeEventListener('focus', check); };
  }, [check]);

  if (auth.status === 'checking') {
    return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>Memverifikasi sesi...</div>;
  }

  if (auth.status === 'invalid') {
    return <Navigate to="/login" replace state={{ from: location.pathname, reason: auth.reason === 'INVALID' ? 'expired' : undefined }} />;
  }

  if (auth.status === 'network') {
    return (
      <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h2>Tidak dapat terhubung ke server</h2>
        <p>Pastikan auth-service (port 5001) berjalan.</p>
        <button onClick={check} style={{ padding: '8px 16px', cursor: 'pointer' }}>Coba lagi</button>
      </div>
    );
  }

  const safeAllowedRoles = allowedRoles ? allowedRoles.map((r) => r.toLowerCase()) : null;
  if (safeAllowedRoles && !safeAllowedRoles.includes(auth.role)) return (
    <div style={{ padding: '50px', textAlign: 'center', color: 'red', fontFamily: 'sans-serif' }}>
      <h2>Akses Ditolak!</h2>
      <p>Role "{auth.role.toUpperCase()}" tidak memiliki izin untuk melihat halaman ini.</p>
      <NavLink to="/login">Kembali ke Login</NavLink>
    </div>
  );
  return children;
};

// GUEST GUARD: mencegah user yang SUDAH LOGIN membuka /login (dan halaman guest lain).
// Cek dilakukan lokal lewat getSession() (baca+decode token dari localStorage, sudah
// termasuk cek kedaluwarsa) — cepat, tanpa perlu roundtrip ke server dulu.
// Kalau ternyata token sudah tidak valid di server (mis. akun dinonaktifkan),
// ProtectedRoute di /admin yang akan menendang balik ke /login (lihat verifySession).
const GuestRoute = ({ children }) => {
  const session = getSession();
  if (session) {
    // Arahkan sesuai role: staff (admin/editor) -> /admin, selain itu -> beranda "/"
    return <Navigate to={homeFor(session.role)} replace />;
  }
  return children;
};


const MainApp = () => {
  const { isMaintenance, isLoading } = useContext(SettingsContext);
  // Catatan: penerapan data-theme, font, dan variabel warna SEKARANG
  // sepenuhnya ditangani terpusat oleh SettingsProvider (lihat SettingsContext.jsx),
  // supaya tema TERSIMPAN dan tema PREVIEW selalu memakai jalur yang sama persis
  // dan tidak pernah ada dua logic yang saling menimpa / balapan.

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
    
      <Route path="/" element={<LandingPage />} />
      <Route path="/jurusan/detail-kurikulum/:slug" element={<DetailKurikulumViewer />} />
        <Route path="/berita/:slug" element={<NewsDetail />} />
       <Route path="/download" element={<DownloadViewer />} />
      <Route path="/galeri/:slug" element={<GaleriAlbumViewer />} />
      {LANDING_SECTION_PATHS.map((p) => <Route key={p} path={p} element={<LandingPage />} />)}
      <Route path="/testimoni/tulis" element={<TulisTestimoni />} />
      <Route path="/tracer-study" element={<TracerStudy />} />
      <Route path="/tracer-study/isi" element={<IsiTracerStudy />} />

    
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<Register />} />
      <Route path="/lupa-password" element={<ForgotPassword />} />
      <Route path="/dashboard/*" element={<Navigate to="/admin" replace />} />
      <Route path="/admin/*" element={
        <ProtectedRoute allowedRoles={['ADMIN', 'EDITOR']}>
          <DashboardLayoutAdmin />
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