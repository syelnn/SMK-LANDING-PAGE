import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { KeyRound, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import '../App.css';

export default function ForgotPassword() {
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const validatePassword = (pass) => {
    const minLength = pass.length >= 8;
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasNumber = /\d/.test(pass);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    return minLength && hasUpperCase && hasNumber && hasSymbol;
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setNewPassword(val);
    
    if (val.length > 0 && !validatePassword(val)) {
      setErrorMsg('Minimal 8 karakter, wajib ada huruf besar, angka & simbol!');
    } else {
      setErrorMsg('');
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!validatePassword(newPassword)) {
      setErrorMsg('Minimal 8 karakter, wajib ada huruf besar, angka & simbol!');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok!');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5001/api/auth/forgot-password', {
        username,
        newPassword
      });

      setMessage(response.data.message);
      setTimeout(() => {
        navigate('/login', { state: { username } });
      }, 2000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Gagal mereset password.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="forgot-icon-container">
          <KeyRound size={48} className="forgot-icon-svg" />
        </div>
        <h2 className="auth-title">Reset Password</h2>
        <p className="auth-subtitle">Masukkan username akunmu dan sandi baru yang aman.</p>

        {message && <div className="success-banner">{message}</div>}
        
        <form onSubmit={handleReset}>
          <div className="form-group">
            <label className="form-label">USERNAME AKUN</label>
            <input 
              type="text" 
              placeholder="Masukkan username kamu" 
              className="form-input" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">PASSWORD BARU</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="Minimal 8 karakter, huruf besar, angka & simbol" 
                className="form-input password-input-field" 
                value={newPassword} 
                onChange={handlePasswordChange} 
                required 
              />
              <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>
            
            {newPassword.length > 0 && (
              <div className="password-checklist">
                <span className={newPassword.length >= 8 ? 'check-valid' : 'check-invalid'}>
                  {newPassword.length >= 8 ? '✓' : '✕'} Minimal 8 Karakter
                </span>
                <span className={/[A-Z]/.test(newPassword) ? 'check-valid' : 'check-invalid'}>
                  {/[A-Z]/.test(newPassword) ? '✓' : '✕'} Ada Huruf Besar (Uppercase)
                </span>
                <span className={/\d/.test(newPassword) ? 'check-valid' : 'check-invalid'}>
                  {/\d/.test(newPassword) ? '✓' : '✕'} Ada Angka
                </span>
                <span className={/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'check-valid' : 'check-invalid'}>
                  {/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? '✓' : '✕'} Ada Simbol Khusus
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">KONFIRMASI PASSWORD</label>
            <div className="password-input-wrapper">
              <input 
                type={showConfirmPassword ? 'text' : 'password'} 
                placeholder="Ulangi password baru" 
                className="form-input password-input-field" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
              />
              <span className="password-toggle-icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>
            {confirmPassword.length > 0 && (
              <span className={`password-match-status ${newPassword === confirmPassword ? 'match-ok' : 'match-no'}`}>
                {newPassword === confirmPassword ? '✓ Password cocok' : '✕ Konfirmasi password tidak cocok'}
              </span>
            )}
          </div>

          {errorMsg && <div className="error-message-text">{errorMsg}</div>}

          <button type="submit" className="auth-button forgot-submit-btn">
            Simpan Password Baru
          </button>
        </form>

        <p className="back-home forgot-back-link">
          <Link to="/login" className="back-link-flex">
            <ArrowLeft size={14} /> Kembali ke Login
          </Link>
        </p>
      </div>
    </div>
  );
}