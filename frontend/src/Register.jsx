import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, MailCheck, Check, CheckCircle2, XCircle, Loader2, Info } from 'lucide-react';
import { supabase } from './supabaseClient';
import AvatarPicker, { EMPTY_AVATAR, isValidImageUrl } from './components/AvatarPicker';
import './App.css';
import './css/auth.css';

const AUTH_API = 'http://localhost:5001/api/auth';
const USERNAME_RULE = /^[a-zA-Z0-9_.-]{3,50}$/; // sama dengan backend

// Aturan password wajib: huruf besar, huruf kecil, angka, simbol, minimal 8 karakter.
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

// Pesan status username (ditampilkan di bawah kolom)
const USERNAME_MSG = {
  short: { tone: '', text: 'Minimal 3 karakter.' },
  invalid: { tone: 'is-bad', text: 'Hanya huruf, angka, titik, garis bawah, dan strip (3–50 karakter).' },
  checking: { tone: '', text: 'Memeriksa ketersediaan username…' },
  available: { tone: 'is-ok', text: 'Username tersedia.' },
  taken: { tone: 'is-bad', text: 'Username sudah dipakai, coba yang lain.' },
};

export default function Register() {
  const [formData, setFormData] = useState({ fullName: '', username: '', email: '', password: '', confirmPassword: '' });
  const [avatar, setAvatar] = useState(EMPTY_AVATAR);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null); // null | short | invalid | checking | available | taken

  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [avatarWarning, setAvatarWarning] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMsg, setResendMsg] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from;
  const nextPath = from || '/login';

  const passwordTouched = formData.password.length > 0;
  const strength = strengthOf(formData.password);
  const level = strengthLevel(strength);
  const confirmTouched = formData.confirmPassword.length > 0;
  const isConfirmMatch = formData.password === formData.confirmPassword;

  // Cek username realtime: format dicek di browser dulu, ketersediaan dicek ke server (debounce 500ms)
  useEffect(() => {
    const username = formData.username.trim();
    if (!username) { setUsernameStatus(null); return undefined; }
    if (username.length < 3) { setUsernameStatus('short'); return undefined; }
    if (!USERNAME_RULE.test(username)) { setUsernameStatus('invalid'); return undefined; }

    setUsernameStatus('checking');
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`${AUTH_API}/check-username/${encodeURIComponent(username)}`);
        if (!cancelled) setUsernameStatus(res.data.available ? 'available' : 'taken');
      } catch {
        if (!cancelled) setUsernameStatus(null);
      }
    }, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [formData.username]);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const mapSupabaseError = (message = '') => {
    const m = message.toLowerCase();
    if (m.includes('already registered') || m.includes('already exists') || m.includes('user already'))
      return 'Email ini sudah terdaftar. Silakan login atau gunakan "Lupa Password".';
    if (m.includes('password')) return 'Password terlalu lemah. Ikuti syarat keamanan di bawah kolom password.';
    if (m.includes('rate limit') || m.includes('too many')) return 'Terlalu banyak percobaan. Coba lagi dalam beberapa menit.';
    if (m.includes('invalid') && m.includes('email')) return 'Format email tidak valid!';
    return message || 'Gagal mendaftar. Coba lagi.';
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const fullName = formData.fullName.trim();
    const username = formData.username.trim();
    const email = formData.email.trim().toLowerCase();
    const linkValue = avatar.mode === 'link' ? avatar.url.trim() : '';

    if (!fullName || !username || !email) return setErrorMsg('Semua data wajib diisi!');
    if (!USERNAME_RULE.test(username)) return setErrorMsg('Username 3–50 karakter (huruf, angka, _ . -).');
    if (usernameStatus === 'taken') return setErrorMsg('Username sudah dipakai, silakan pilih username lain.');
    if (!isPasswordStrong(formData.password)) return setErrorMsg('Password tidak memenuhi syarat keamanan!');
    if (formData.password !== formData.confirmPassword) return setErrorMsg('Konfirmasi password tidak cocok!');
    // Foto divalidasi SEBELUM akun dibuat di Supabase, supaya tidak ada akun "setengah jadi"
    if (linkValue && !isValidImageUrl(linkValue)) return setErrorMsg('Link foto harus diawali http:// atau https://');

    setLoading(true);
    try {
      // 1) Daftar ke Supabase Auth -> Supabase otomatis kirim email verifikasi
      //    (syarat: toggle "Confirm email" di Supabase Auth Providers sudah ON).
      const { data, error } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          data: { username, full_name: fullName },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) { setErrorMsg(mapSupabaseError(error.message)); setLoading(false); return; }

      // Supabase membalas "sukses" walau email SUDAH terdaftar, tapi identities[] kosong.
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setErrorMsg('Email ini sudah terdaftar. Silakan login atau gunakan "Lupa Password".');
        setLoading(false);
        return;
      }

      // 2) Simpan profil lokal + foto (dikirim multipart; backend yang mengunggah ke Cloudinary)
      const fd = new FormData();
      fd.append('full_name', fullName);
      fd.append('username', username);
      fd.append('email', email);
      fd.append('supabase_id', data.user.id);
      if (avatar.mode === 'upload' && avatar.file) fd.append('avatar', avatar.file);
      if (linkValue) fd.append('avatar_url', linkValue);

      const res = await axios.post(`${AUTH_API}/register`, fd);
      setAvatarWarning(res.data?.avatarWarning || '');

      setRegisteredEmail(email);
      setIsSuccess(true);
      setResendCooldown(30);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Gagal menyimpan data pendaftaran. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendMsg('');
    try {
      await axios.post(`${AUTH_API}/resend-verification`, { email: registeredEmail });
      setResendMsg('Email verifikasi baru sudah dikirim!');
      setResendCooldown(30);
    } catch (err) {
      setResendMsg(err.response?.data?.message || 'Gagal mengirim ulang email.');
    }
  };

  if (isSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="au-mark-row">
            <span className="au-mark"><MailCheck strokeWidth={1.75} /></span>
          </div>
          <h2 className="auth-title">Cek Email Kamu!</h2>
          <p className="auth-subtitle">
            Kami sudah mengirim link verifikasi ke <strong>{registeredEmail}</strong>.
            Buka email tersebut dan klik link verifikasi sebelum login.
          </p>

          {avatarWarning && (
            <div className="au-msg" style={{ justifyContent: 'center', marginBottom: 14 }}>
              <Info size={14} /> <span>Foto profil belum tersimpan ({avatarWarning}). Kamu bisa menggantinya nanti.</span>
            </div>
          )}

          <button className="auth-button" onClick={() => navigate(nextPath, { replace: true })}>
            Ke Halaman Login
          </button>

          <div className="au-resend" style={{ marginTop: 14, marginBottom: 0 }}>
            {resendMsg && <p style={{ marginBottom: 6 }}>{resendMsg}</p>}
            Tidak menerima email?{' '}
            <button type="button" className="au-linkbtn" disabled={resendCooldown > 0} onClick={handleResend}>
              {resendCooldown > 0 ? `Kirim ulang (${resendCooldown}s)` : 'Kirim ulang email verifikasi'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const uMsg = usernameStatus ? USERNAME_MSG[usernameStatus] : null;
  const usernameTone = usernameStatus === 'available' ? 'is-ok' : (usernameStatus === 'taken' || usernameStatus === 'invalid') ? 'is-bad' : '';

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Buat Akun Baru</h2>
        <p className="auth-subtitle">Silakan isi data diri kamu untuk mulai bergabung.</p>

        {errorMsg && <div className="au-alert" role="alert">{errorMsg}</div>}

        <form className="auth-form" onSubmit={handleRegister}>
          {/* Foto profil (opsional): upload file atau link, disimpan ke Cloudinary */}
          <div className="form-group">
            <div className="au-row"><label>Foto Profil <span className="au-opt">(opsional)</span></label></div>
            <AvatarPicker value={avatar} onChange={setAvatar} name={formData.fullName} disabled={loading} />
          </div>

          <div className="form-group">
            <div className="au-row"><label htmlFor="reg-fullname">Nama Lengkap</label></div>
            <input id="reg-fullname" type="text" name="fullName" placeholder="Nama Lengkap" className="form-input" autoComplete="name" required value={formData.fullName} onChange={handleChange} />
          </div>

          <div className="form-group">
            <div className="au-row"><label htmlFor="reg-username">Username</label></div>
            <div className="au-field">
              <input
                id="reg-username"
                type="text"
                name="username"
                placeholder="Buat Username"
                className={`form-input ${usernameTone}`}
                autoComplete="username"
                required
                value={formData.username}
                onChange={handleChange}
              />
              {usernameStatus === 'checking' && <span className="au-end"><Loader2 size={18} className="au-spin" /></span>}
              {usernameStatus === 'available' && <span className="au-end is-ok"><CheckCircle2 size={18} /></span>}
              {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <span className="au-end is-bad"><XCircle size={18} /></span>}
            </div>
            {uMsg && <div className={`au-msg ${uMsg.tone}`} aria-live="polite">{uMsg.text}</div>}
          </div>

          <div className="form-group">
            <div className="au-row"><label htmlFor="reg-email">Alamat Email</label></div>
            <input id="reg-email" type="email" name="email" placeholder="name@example.com" className="form-input" autoComplete="email" required value={formData.email} onChange={handleChange} />
          </div>

          <div className="form-group">
            <div className="au-row"><label htmlFor="reg-password">Password</label></div>
            <div className="au-field">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Buat Sandi"
                className="form-input"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
              />
              <button type="button" className="au-end" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'} aria-pressed={showPassword}>
                {showPassword ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
              </button>
            </div>

            {passwordTouched && (
              <>
                <div className="au-meter">
                  <div className="au-meter-track">
                    <div className={`au-meter-fill ${level.cls}`} style={{ width: `${(strength / RULES.length) * 100}%` }} />
                  </div>
                  <span className={`au-meter-text ${level.cls}`}>{level.label}</span>
                </div>
                <div className="au-rules">
                  {RULES.map((r) => {
                    const valid = r.test(formData.password);
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
            <div className="au-row"><label htmlFor="reg-confirm">Konfirmasi Password</label></div>
            <div className="au-field">
              <input
                id="reg-confirm"
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Ulangi sandi Anda"
                className={`form-input ${confirmTouched ? (isConfirmMatch ? 'is-ok' : 'is-bad') : ''}`}
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <button type="button" className="au-end" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'} aria-pressed={showConfirm}>
                {showConfirm ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
              </button>
            </div>
            {confirmTouched && (
              <div className={`au-msg ${isConfirmMatch ? 'is-ok' : 'is-bad'}`} aria-live="polite">
                {isConfirmMatch ? <><CheckCircle2 size={14} /> Password cocok</> : <><XCircle size={14} /> Konfirmasi password tidak cocok</>}
              </div>
            )}
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Memproses...' : 'Daftar Sekarang'}
          </button>
        </form>

        <p className="footer-text">
          Sudah punya akun? <Link to="/login" state={location.state} className="auth-link">Login di sini</Link>
        </p>
        <p className="back-home">
          <Link to="/">← KEMBALI KE BERANDA</Link>
        </p>
      </div>
    </div>
  );
}