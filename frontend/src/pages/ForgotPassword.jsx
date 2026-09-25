import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { KeyRound, ArrowLeft, Eye, EyeOff, Check, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import '../App.css';
import '../css/auth.css';

const AUTH_API = 'http://localhost:5001/api/auth';

const RULES = [
  { key: 'lower', label: 'Huruf kecil', test: (p) => /[a-z]/.test(p) },
  { key: 'upper', label: 'Huruf besar', test: (p) => /[A-Z]/.test(p) },
  { key: 'number', label: 'Angka', test: (p) => /\d/.test(p) },
  { key: 'symbol', label: 'Simbol (!@#$%)', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
  { key: 'length', label: 'Min. 8 karakter', test: (p) => p.length >= 8 },
];
const isPasswordStrong = (p) => RULES.every((r) => r.test(p));
const strengthOf = (p) => RULES.filter((r) => r.test(p)).length; // 0..5
const strengthLevel = (n) => (n <= 2 ? { cls: '', label: 'Lemah' } : n <= 4 ? { cls: 'is-mid', label: 'Sedang' } : { cls: 'is-strong', label: 'Kuat' });

// PENTING: Panjang kode OTP harus SAMA dengan yang dikonfigurasi di
// Supabase Dashboard > Authentication > Sign In / Providers > Email > "Email OTP Length".
const OTP_LENGTH = 6;

// Alur 3 langkah, semuanya lewat Supabase Auth: (1) minta kode OTP ke email,
// (2) verifikasi kode -> dapat sesi sementara, (3) pakai sesi itu untuk set password baru.
//
// SYARAT DI SUPABASE DASHBOARD:
//   Authentication > Email Templates > "Reset Password" HARUS menampilkan
//   {{ .Token }} sebagai TEKS/KODE biasa, BUKAN sebagai href link.
export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: password baru
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const mapError = (msg = '') => {
    const m = msg.toLowerCase();
    if (m.includes('token') && m.includes('expired')) return 'Kode OTP sudah kedaluwarsa. Minta kode baru.';
    if (m.includes('token') || m.includes('otp') || m.includes('invalid')) return 'Kode OTP salah atau sudah tidak berlaku.';
    if (m.includes('rate limit') || m.includes('too many')) return 'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.';
    if (m.includes('user not found')) return 'Email tidak terdaftar.';
    return msg || 'Terjadi kesalahan. Coba lagi.';
  };

  // ===== STEP 1: kirim kode OTP ke email =====
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg(''); setMessage('');
    if (cooldown > 0) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
      if (error) { setErrorMsg(mapError(error.message)); setLoading(false); return; }

      setMessage(`Kode verifikasi ${OTP_LENGTH} digit sudah dikirim ke ${email}. Cek inbox/folder spam.`);
      setStep(2);
      setCooldown(30);
    } catch {
      setErrorMsg('Gagal menghubungi server. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setErrorMsg(''); setMessage('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
      if (error) { setErrorMsg(mapError(error.message)); return; }
      setMessage('Kode OTP baru sudah dikirim.');
      setCooldown(30);
    } catch {
      setErrorMsg('Gagal mengirim ulang kode.');
    }
  };

  // ===== STEP 2: verifikasi kode OTP =====
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (otp.trim().length < OTP_LENGTH) return setErrorMsg(`Masukkan ${OTP_LENGTH} digit kode OTP.`);

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otp.trim(),
        type: 'recovery',
      });
      if (error) { setErrorMsg(mapError(error.message)); setLoading(false); return; }

      setMessage('');
      setStep(3);
    } catch {
      setErrorMsg('Gagal memverifikasi kode. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // ===== STEP 3: set password baru =====
  const handleSetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isPasswordStrong(newPassword)) return setErrorMsg('Password tidak memenuhi syarat keamanan!');
    if (newPassword !== confirmPassword) return setErrorMsg('Konfirmasi password tidak cocok!');

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) { setErrorMsg(mapError(error.message)); setLoading(false); return; }

      await supabase.auth.signOut();
      let username = '';
      try {
        const sync = await axios.post(`${AUTH_API}/sync-after-reset`, { email: email.trim().toLowerCase() });
        username = sync.data?.data?.username || '';
      } catch { /* non-fatal */ }

      setMessage('Password berhasil diubah! Mengarahkan ke halaman login...');
      setTimeout(() => navigate('/login', { state: { username } }), 1800);
    } catch {
      setErrorMsg('Gagal menyimpan password baru.');
    } finally {
      setLoading(false);
    }
  };

  const strength = strengthOf(newPassword);
  const level = strengthLevel(strength);
  const confirmTouched = confirmPassword.length > 0;
  const isMatch = newPassword === confirmPassword;

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Ikon kunci: latar tint aksen + ikon warna aksen, terlihat di semua tema */}
        <div className="au-mark-row">
          <span className="au-mark"><KeyRound strokeWidth={1.75} /></span>
        </div>
        <h2 className="auth-title">Reset Password</h2>
        <p className="auth-subtitle">
          {step === 1 && 'Masukkan email akun kamu, kami akan kirim kode verifikasi.'}
          {step === 2 && `Masukkan kode ${OTP_LENGTH} digit yang dikirim ke email kamu.`}
          {step === 3 && 'Buat password baru yang aman untuk akunmu.'}
        </p>

        <div className="step-indicator">
          <span className={`step-dot ${step === 1 ? 'active' : ''}`} />
          <span className={`step-dot ${step === 2 ? 'active' : ''}`} />
          <span className={`step-dot ${step === 3 ? 'active' : ''}`} />
        </div>

        {message && <div className="au-notice" role="status">{message}</div>}
        {errorMsg && <div className="au-alert" role="alert">{errorMsg}</div>}

        {step === 1 && (
          <form className="auth-form" onSubmit={handleSendOtp}>
            <div className="form-group">
              <div className="au-row"><label htmlFor="fp-email">Email Akun</label></div>
              <input
                id="fp-email"
                type="email" placeholder="Email yang didaftarkan" className="form-input" autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)} required
              />
            </div>
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Mengirim...' : 'Kirim Kode OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <div className="au-row"><label htmlFor="fp-otp">Kode OTP</label></div>
              <input
                id="fp-otp"
                type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={OTP_LENGTH} placeholder={'•'.repeat(OTP_LENGTH)}
                className="form-input otp-input"
                value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} required
              />
            </div>
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Memverifikasi...' : 'Verifikasi Kode'}
            </button>
            <div className="au-resend" style={{ marginTop: 14, marginBottom: 0 }}>
              Tidak menerima kode?{' '}
              <button type="button" className="au-linkbtn" disabled={cooldown > 0} onClick={handleResendOtp}>
                {cooldown > 0 ? `Kirim ulang (${cooldown}s)` : 'Kirim ulang kode'}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form className="auth-form" onSubmit={handleSetPassword}>
            <div className="form-group">
              <div className="au-row"><label htmlFor="fp-new">Password Baru</label></div>
              <div className="au-field">
                <input
                  id="fp-new"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Buat password baru"
                  className="form-input"
                  autoComplete="new-password"
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required
                />
                <button type="button" className="au-end" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'} aria-pressed={showPassword}>
                  {showPassword ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
                </button>
              </div>

              {newPassword.length > 0 && (
                <>
                  <div className="au-meter">
                    <div className="au-meter-track">
                      <div className={`au-meter-fill ${level.cls}`} style={{ width: `${(strength / RULES.length) * 100}%` }} />
                    </div>
                    <span className={`au-meter-text ${level.cls}`}>{level.label}</span>
                  </div>
                  <div className="au-rules">
                    {RULES.map((r) => {
                      const valid = r.test(newPassword);
                      return (
                        <div key={r.key} className={`au-rule ${valid ? 'is-ok' : ''}`}>
                          <span className="au-dot">{valid && <Check size={10} strokeWidth={3.5} />}</span>
                          {r.label}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="form-group">
              <div className="au-row"><label htmlFor="fp-confirm">Konfirmasi Password</label></div>
              <div className="au-field">
                <input
                  id="fp-confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Ulangi password baru"
                  className={`form-input ${confirmTouched ? (isMatch ? 'is-ok' : 'is-bad') : ''}`}
                  autoComplete="new-password"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                />
                <button type="button" className="au-end" onClick={() => setShowConfirmPassword((v) => !v)} aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'} aria-pressed={showConfirmPassword}>
                  {showConfirmPassword ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
                </button>
              </div>
              {confirmTouched && (
                <div className={`au-msg ${isMatch ? 'is-ok' : 'is-bad'}`} aria-live="polite">
                  {isMatch ? <><CheckCircle2 size={14} /> Password cocok</> : <><XCircle size={14} /> Konfirmasi password tidak cocok</>}
                </div>
              )}
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
            </button>
          </form>
        )}

        <p className="back-home">
          <Link to="/login" className="back-link-flex">
            <ArrowLeft size={14} /> Kembali ke Login
          </Link>
        </p>
      </div>
    </div>
  );
}