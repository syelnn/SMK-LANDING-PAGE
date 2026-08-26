import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, CheckCircle, User, Calendar, Key } from 'lucide-react';
import './App.css'; 

export default function Register() {
  const [formData, setFormData] = useState({ fullName: '', username: '', email: '', password: '', confirmPassword: '' });
  const [errorMsg, setErrorMsg] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [registerTime, setRegisterTime] = useState('');

  const navigate = useNavigate();

  const isPasswordValid = formData.password === '' || (
    formData.password.length >= 8 &&
    /[A-Z]/.test(formData.password) &&
    /\d/.test(formData.password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
  );
  
  const isConfirmMatch = formData.confirmPassword === '' || formData.password === formData.confirmPassword;

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isPasswordValid) return setErrorMsg('Password tidak memenuhi syarat keamanan!');
    if (!isConfirmMatch) return setErrorMsg('Konfirmasi password tidak cocok!');

    try {
      const response = await axios.post('http://localhost:5001/api/auth/register', {
        full_name: formData.fullName,
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('role', response.data.data.user.role);
      
      const now = new Date();
      setRegisterTime(now.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
      
      setIsSuccess(true);
      
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Gagal registrasi.');
    }
  };

  useEffect(() => {
    let interval;
    if (isSuccess && countdown > 0) {
      interval = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    } else if (isSuccess && countdown === 0) {
      navigate('/dashboard');
    }
    return () => clearInterval(interval);
  }, [isSuccess, countdown, navigate]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  if (isSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            {/* PERBAIKAN: Warna stroke ikon diubah menjadi biru (#2563eb) */}
            <CheckCircle size={68} color="#2563eb" strokeWidth={1.5} />
          </div>
          
          <h2 className="auth-title">Registrasi Berhasil!</h2>
          <p className="auth-subtitle">Akun kamu telah selesai dibuat.</p>

          <div className="success-box">
            <div className="success-row">
              <div className="success-icon-box">
                <User size={20} color="#9ca3af" strokeWidth={1.5} />
              </div>
              <div>
                <p className="success-label">Nama Lengkap</p>
                <p className="success-value">{formData.fullName}</p>
              </div>
            </div>
            <div className="success-row">
              <div className="success-icon-box">
                <Calendar size={20} color="#9ca3af" strokeWidth={1.5} />
              </div>
              <div>
                <p className="success-label">Waktu Daftar</p>
                <p className="success-value">{registerTime}</p>
              </div>
            </div>
            <div className="success-row last">
              <div className="success-icon-box">
                <Key size={20} color="#9ca3af" strokeWidth={1.5} />
              </div>
              <div>
                <p className="success-label">Password</p>
                <p className="success-value">{formData.password[0] + '********'}</p>
              </div>
            </div>
          </div>

          <button className="auth-button success-btn" disabled>
            Mulai login dengan akun ini ({countdown})
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Buat Akun Baru</h2>
        <p className="auth-subtitle">Silakan isi data diri kamu untuk mulai bergabung.</p>

        {errorMsg && <p className="error-message">{errorMsg}</p>}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">Nama Lengkap</label>
            <input type="text" name="fullName" placeholder="Nama Lengkap" className="form-input" required onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input type="text" name="username" placeholder="Buat Username" className="form-input" required onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Alamat Email</label>
            <input type="email" name="email" placeholder="name@example.com" className="form-input" required onChange={handleChange} />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                placeholder="Buat Sandi" 
                className={`form-input ${!isPasswordValid ? 'error' : ''}`}
                required 
                onChange={handleChange} 
              />
              <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
              </span>
            </div>
            {!isPasswordValid && <div className="field-error-text">Minimal 8 karakter, wajib ada huruf besar, angka & simbol!</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Konfirmasi Password</label>
            <div className="input-wrapper">
              <input 
                type={showConfirm ? "text" : "password"} 
                name="confirmPassword" 
                placeholder="Konfirmasi Sandi Anda" 
                className={`form-input ${!isConfirmMatch ? 'error' : ''}`}
                required 
                onChange={handleChange} 
              />
              <span className="eye-icon" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
              </span>
            </div>
            {!isConfirmMatch && <div className="field-error-text">Konfirmasi password tidak cocok!</div>}
          </div>

          <button type="submit" className="auth-button">Daftar Sekarang</button>
        </form>

        <p className="footer-text">
          Sudah punya akun? <Link to="/login" className="auth-link">Login di sini</Link>
        </p>
        <p className="back-home">
          <Link to="/">← KEMBALI KE BERANDA</Link>
        </p>
      </div>
    </div>
  );
}