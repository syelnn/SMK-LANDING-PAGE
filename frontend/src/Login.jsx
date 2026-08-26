import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import './App.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

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
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('role', response.data.data.user.role);
      navigate('/dashboard');
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Gagal terhubung ke server.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <img src="https://yt3.googleusercontent.com/ytc/AIdro_kgxgSlJ__b2JUfQ_stLFyVrcgM8-5y1n27pRHQUodzkA=s900-c-k-c0x00ffffff-no-rj" alt="Logo" className="auth-logo" />
        <h2 className="auth-title login-title">Selamat Datang</h2>
        <p className="auth-subtitle">Masuk untuk memberi komentar dan menyukai konten</p>

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
          Belum punya akun? <Link to="/register" className="auth-link">Daftar sekarang</Link>
        </p>
        <p className="back-home">
          <Link to="/">← KEMBALI KE BERANDA</Link>
        </p>
      </div>
    </div>
  );
}