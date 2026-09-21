import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { saveSession, homeFor } from './utils/auth';
import './App.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Halaman asal (mis. "/testimoni/tulis") — diisi saat viewer diarahkan ke login dari tombol CTA
  const from = location.state?.from;
  const sessionExpired = location.state?.reason === 'expired' || new URLSearchParams(location.search).get('expired') === '1';
  const isTestimoniFlow = location.state?.reason === 'testimoni';

  useEffect(() => {
    if (sessionExpired) setErrorMsg('Sesi Anda tidak valid atau sudah berakhir. Silakan login kembali.');
  }, [sessionExpired]);

  // Menangkap username jika dikirim dari halaman lupa password
  useEffect(() => {
    if (location.state?.username) {
      setUsername(location.state.username);
    }
  }, [location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', { username, password });
      const { token, user } = response.data.data;
      saveSession({ token, user });

      // Ada halaman tujuan -> langsung ke sana. Jika tidak: admin/editor ke dashboard, viewer ke beranda.
      if (from) navigate(from, { replace: true });
      else navigate(homeFor(String(user.role || '').toLowerCase()), { replace: true });
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Gagal terhubung ke server.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <img src="https://yt3.googleusercontent.com/ytc/AIdro_kgxgSlJ__b2JUfQ_stLFyVrcgM8-5y1n27pRHQUodzkA=s900-c-k-c0x00ffffff-no-rj" alt="Logo" className="auth-logo" />
        <h2 className="auth-title login-title">Selamat Datang</h2>
        <p className="auth-subtitle">
          {isTestimoniFlow
            ? 'Masuk dulu, lalu kamu langsung diarahkan ke form testimoni.'
            : 'Masuk untuk memberi komentar dan menyukai konten'}
        </p>

        {errorMsg && <p className="error-message login-error">{errorMsg}</p>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <div className="form-label"><label>Username</label></div>
            <input type="text" placeholder="Username Anda" className="form-input" required value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>

          <div className="form-group">
            <div className="form-label">
              <label>Password</label>
              <Link to="/lupa-password" className="auth-link forgot-password">LUPA PASSWORD?</Link>
            </div>
            <input type="password" placeholder="Ketik Sandi Anda" className="form-input" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button type="submit" className="auth-button">Masuk</button>
        </form>

        <p className="footer-text">
          Belum punya akun? <Link to="/register" state={location.state} className="auth-link">Daftar sekarang</Link>
        </p>
        <p className="back-home">
          <Link to="/">← KEMBALI KE BERANDA</Link>
        </p>
      </div>
    </div>
  );
}