import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import { saveSession, homeFor } from './utils/auth';
import logoSekolah from './assets/logo1.png';
import './App.css';
import './css/auth.css';

const AUTH_API = 'http://localhost:5001/api/auth';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('');
  const [resendMsg, setResendMsg] = useState('');
  const [loading, setLoading] = useState(false);
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
    setUnconfirmedEmail('');
    setResendMsg('');
    setLoading(true);
    try {
      const response = await axios.post(`${AUTH_API}/login`, { username, password });
      const { token, user } = response.data.data;
      saveSession({ token, user });

      // Ada halaman tujuan -> langsung ke sana. Jika tidak: admin/editor ke dashboard, viewer ke beranda.
      if (from) navigate(from, { replace: true });
      else navigate(homeFor(String(user.role || '').toLowerCase()), { replace: true });
    } catch (error) {
      const data = error.response?.data;
      if (data?.code === 'EMAIL_NOT_CONFIRMED') {
        setErrorMsg(data.message);
        setUnconfirmedEmail(data.email || '');
      } else {
        setErrorMsg(data?.message || 'Gagal terhubung ke server.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!unconfirmedEmail) return;
    setResendMsg('');
    try {
      await axios.post(`${AUTH_API}/resend-verification`, { email: unconfirmedEmail });
      setResendMsg('Email verifikasi baru sudah dikirim. Cek inbox/spam.');
    } catch (err) {
      setResendMsg(err.response?.data?.message || 'Gagal mengirim ulang email.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <img src={logoSekolah} alt="Logo" className="auth-logo" />
        <h2 className="auth-title login-title">Selamat Datang</h2>
        <p className="auth-subtitle">
          {isTestimoniFlow
            ? 'Masuk dulu, lalu kamu langsung diarahkan ke form testimoni.'
            : 'Masuk untuk memberi komentar dan menyukai konten'}
        </p>

        {/* Alert: teks merah di tengah, tanpa kotak */}
        {errorMsg && <div className="au-alert" role="alert">{errorMsg}</div>}
        {unconfirmedEmail && (
          <div className="au-resend">
            {resendMsg ? resendMsg : (
              <>
                Belum menerima email?{' '}
                <button type="button" className="au-linkbtn" onClick={handleResend}>Kirim ulang verifikasi</button>
              </>
            )}
          </div>
        )}

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="form-group">
            <div className="au-row"><label htmlFor="login-username">Username</label></div>
            <input
              id="login-username"
              type="text"
              placeholder="Username Anda"
              className="form-input"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="form-group">
            <div className="au-row">
              <label htmlFor="login-password">Password</label>
              <Link to="/lupa-password" className="auth-link forgot-password">Lupa password?</Link>
            </div>
            <div className="au-field">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Ketik Sandi Anda"
                className="form-input"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="au-end"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
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