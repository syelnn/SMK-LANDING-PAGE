import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Camera, Check, Loader2, Send, Trash2, X } from 'lucide-react';
import { getSession, clearSession, isStaff, verifySession, notifyProfileUpdated, AUTH_API } from '../../utils/auth';
import logoSekolah from '../../assets/logo1.png';
import '../../css/viewer/tulisTestimoni.css';

const API = 'http://localhost:5002';
const MIN_QUOTE = 20;
const MAX_QUOTE = 400;
const MAX_TESTIMONIAL_PER_USER = 2;
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 jam, harus sama dengan backend

const ROLES = [
  { key: 'siswa', label: 'Siswa', base: 'Siswa', hint: 'Contoh: Kelas XI RPL' },
  { key: 'alumni', label: 'Alumni', base: 'Alumni', hint: 'Contoh: Angkatan 2021, kuliah di UI' },
  { key: 'ortu', label: 'Orang tua siswa', base: 'Orang Tua Siswa', hint: 'Contoh: Wali murid kelas X TKJ' },
  { key: 'mitra', label: 'Mitra industri', base: 'Mitra Industri', hint: 'Contoh: HRD PT Nusantara Teknologi' },
  { key: 'lain', label: 'Lainnya', base: '', hint: 'Contoh: Warga sekitar sekolah' },
];

const STARTERS = [
  'Hal yang paling saya suka dari SMKN Compreng adalah ',
  'Guru-guru di sini ',
  'Setelah belajar di sini, saya jadi ',
];

const buildRole = (roleKey, detail) => {
  const r = ROLES.find((x) => x.key === roleKey);
  if (!r) return '';
  const d = detail.trim();
  if (!r.base) return d;
  return d ? `${r.base} - ${d}` : r.base;
};

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

// Ubah data URL (hasil crop di kanvas) jadi Blob asli, supaya bisa dikirim sebagai file
// multipart ke backend (bukan base64) dan backend yang upload ke Cloudinary.
const dataUrlToBlob = (dataUrl) => {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(base64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
};

// Foto dipotong persegi & diperkecil di browser supaya ringan disimpan (~30 KB)
const toSquareDataUrl = (file, size = 320) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      canvas
        .getContext('2d')
        .drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Gambar tidak bisa dibaca'));
    };
    img.src = url;
  });

/* Kartu contoh: tampilannya sama dengan kartu di halaman depan */
function Sample({ name, role, quote, photo }) {
  const blank = !quote.trim();
  return (
    <div className="tw-sample">
      <div className="tw-sample-mark" aria-hidden="true">&ldquo;</div>
      <div className={`tw-sample-quote ${blank ? 'is-blank' : ''}`}>
        {blank ? 'Ceritamu akan muncul di sini saat kamu mengetik.' : quote}
      </div>
      <div className="tw-sample-by">
        {photo ? (
          <img src={photo} alt="" className="tw-face" />
        ) : (
          <div className="tw-initial">{(name.trim().charAt(0) || '?').toUpperCase()}</div>
        )}
        <div>
          <div className="tw-sample-name">{name.trim() || 'Nama kamu'}</div>
          <div className="tw-sample-role">{role || 'Status kamu'}</div>
        </div>
      </div>
    </div>
  );
}

// Format sisa waktu cooldown jadi "HH:MM:SS"
const formatCountdown = (ms) => {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

export default function TulisTestimoni() {
  const navigate = useNavigate();
  const session = useMemo(() => getSession(), []);

  const [checking, setChecking] = useState(true);
  // Meta status kirim testimoni milik user ini: { items, count, maxAllowed, remaining, limitReached, cooldownActive, nextAllowedAt, canSubmit }
  const [status, setStatus] = useState(null);
  const [justSent, setJustSent] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const [roleKey, setRoleKey] = useState('');
  const [detail, setDetail] = useState('');
  const [name, setName] = useState(session?.name || '');
  const [quote, setQuote] = useState('');
  // FOTO: secara default memakai foto profil akun (kalau ada). Bisa diganti khusus untuk testimoni ini,
  // atau dihapus. photoChoice: null = otomatis (profil kalau ada), 'profile' | 'custom' | 'none'.
  const [profileAvatar, setProfileAvatar] = useState(session?.avatar || '');
  const [photoChoice, setPhotoChoice] = useState(null);
  const [customPhoto, setCustomPhoto] = useState(''); // data URL hasil crop (foto yang diunggah)
  const [saveAsProfile, setSaveAsProfile] = useState(null); // null = otomatis (true kalau belum punya foto profil)
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const quoteRef = useRef(null);
  const fileRef = useRef(null);

  const toLogin = () =>
    navigate('/login', { replace: true, state: { from: '/testimoni/tulis', reason: 'testimoni' } });

  const goHome = () => {
    // LandingPage membaca sinyal ini lalu scroll ke bagian testimoni
    sessionStorage.setItem('scrollToSection', 'section-testimoni');
    navigate('/');
  };

  // Penjaga halaman + cek status testimoni user
  useEffect(() => {
    if (!session) {
      clearSession();
      toLogin();
      return;
    }
    if (isStaff(session.role)) {
      navigate('/admin/testimoni', { replace: true });
      return;
    }

    let alive = true;
    // Ambil foto profil terbaru dari server (bisa berubah sejak login)
    verifySession().then((r) => { if (alive && r.ok) setProfileAvatar(r.user.avatar || ''); });
    axios
      .get(`${API}/api/testimonials/mine`, { headers: authHeader(session.token) })
      .then((res) => alive && setStatus(res.data?.data || null))
      .catch((err) => {
        const httpStatus = err.response?.status;
        if (httpStatus === 401 || httpStatus === 403) {
          clearSession();
          toLogin();
        }
      })
      .finally(() => alive && setChecking(false));

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Jalankan detik penghitung mundur cooldown selama masih aktif
  useEffect(() => {
    if (!status?.cooldownActive) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [status?.cooldownActive]);

  if (!session) return null;

  const latest = status?.items?.[0] || null; // testimoni terakhir dikirim, untuk kartu preview status
  const selectedRole = ROLES.find((r) => r.key === roleKey);
  const roleText = buildRole(roleKey, detail);
  const firstName = ((latest?.name || name || session.name).trim().split(' ')[0]) || 'kamu';
  const quoteLen = quote.trim().length;

  const effectivePhoto = photoChoice ?? (profileAvatar ? 'profile' : 'none');
  const photo = effectivePhoto === 'custom' ? customPhoto : effectivePhoto === 'profile' ? profileAvatar : '';
  const shouldSaveAsProfile = saveAsProfile ?? !profileAvatar;

  const msLeft = status?.nextAllowedAt ? new Date(status.nextAllowedAt).getTime() - now : 0;

  const pickStarter = (text) => {
    setQuote(text);
    requestAnimationFrame(() => {
      const el = quoteRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(text.length, text.length);
      }
    });
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('File harus berupa gambar (JPG, PNG, atau WebP).');
    try {
      setError('');
      setCustomPhoto(await toSquareDataUrl(file));
      setPhotoChoice('custom');
    } catch {
      setError('Foto tidak bisa dibaca. Coba pilih foto lain.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanName = name.trim();
    const cleanQuote = quote.trim();

    if (!roleKey) return setError('Pilih dulu kamu siapa di SMKN Compreng.');
    if (roleKey === 'lain' && !detail.trim()) return setError('Tulis kamu sebagai apa, misalnya "Warga sekitar sekolah".');
    if (!cleanName) return setError('Nama yang ditampilkan belum diisi.');
    if (cleanQuote.length < MIN_QUOTE) {
      return setError(`Ceritamu masih terlalu singkat. Tambah ${MIN_QUOTE - cleanQuote.length} karakter lagi.`);
    }

    setSending(true);
    try {
      // Foto (kalau ada) dikirim sebagai file asli via FormData -> backend upload ke
      // Cloudinary, hanya URL hasilnya yang disimpan ke database (bukan base64).
      const fd = new FormData();
      fd.append('name', cleanName);
      fd.append('role', roleText);
      fd.append('quote', cleanQuote);
      // 'custom'  -> file baru dikirim (backend upload ke Cloudinary)
      // 'profile' -> backend menyalin foto profil akun ke folder testimoni
      // 'none'    -> tanpa foto (kartu memakai huruf inisial)
      if (effectivePhoto === 'custom' && customPhoto) fd.append('photo', dataUrlToBlob(customPhoto), 'testimoni.jpg');
      else if (effectivePhoto === 'profile') fd.append('use_profile_photo', '1');

      const res = await axios.post(
        `${API}/api/testimonials`,
        fd,
        { headers: authHeader(session.token) }
      );
      const created = res.data.data;

      // Foto yang diunggah di sini boleh sekalian dijadikan foto profil akun (best-effort)
      if (effectivePhoto === 'custom' && customPhoto && shouldSaveAsProfile) {
        try {
          const pfd = new FormData();
          pfd.append('avatar', dataUrlToBlob(customPhoto), 'profil.jpg');
          const up = await axios.post(`${AUTH_API}/profile/avatar`, pfd, { headers: authHeader(session.token) });
          const newAvatar = up.data?.data?.avatar;
          if (newAvatar) {
            localStorage.setItem('avatar', newAvatar);
            setProfileAvatar(newAvatar);
            notifyProfileUpdated();
          }
        } catch { /* foto profil gagal disimpan tidak boleh menggagalkan testimoni */ }
      }
      // Susun ulang status lokal: testimoni baru + testimoni lama
      setStatus((prev) => {
        const items = [created, ...(prev?.items || [])];
        const count = items.length;
        const limitReached = count >= MAX_TESTIMONIAL_PER_USER;
        const nextAllowedAt = new Date(new Date(created.createdAt).getTime() + COOLDOWN_MS);
        return {
          items,
          count,
          maxAllowed: MAX_TESTIMONIAL_PER_USER,
          remaining: Math.max(0, MAX_TESTIMONIAL_PER_USER - count),
          limitReached,
          cooldownActive: !limitReached,
          nextAllowedAt,
          canSubmit: false
        };
      });
      setJustSent(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(goHome, 1800);
    } catch (err) {
      const httpStatus = err.response?.status;
      if (httpStatus === 401 || httpStatus === 403) {
        clearSession();
        return toLogin();
      }
      // Batas 2x tercapai atau masih dalam masa cooldown 24 jam -> tampilkan statusnya
      const payload = err.response?.data;
      if (payload?.limitReached || payload?.cooldown) {
        setStatus((prev) => ({
          ...(prev || {}),
          items: payload.data || prev?.items || [],
          count: (payload.data || prev?.items || []).length,
          maxAllowed: MAX_TESTIMONIAL_PER_USER,
          limitReached: !!payload.limitReached,
          cooldownActive: !!payload.cooldown,
          nextAllowedAt: payload.nextAllowedAt || prev?.nextAllowedAt || null,
          canSubmit: false
        }));
        return;
      }
      setError(payload?.message || 'Testimoni belum terkirim. Coba lagi sebentar lagi.');
    } finally {
      setSending(false);
    }
  };

  const shown = latest || { name, role: roleText, quote, photo };
  const isLive = Number(latest?.show) === 1;
  const limitReached = !!status?.limitReached;
  const cooldownActive = !!status?.cooldownActive && msLeft > 0;

  return (
    <div className="tw-shell">
      {/* ================= PANEL KIRI ================= */}
      <aside className="tw-aside">
        <div className="tw-aside-inner">
          <button type="button" className="tw-back" onClick={goHome}>
            <ArrowLeft size={16} /> Kembali ke beranda
          </button>

          <div className="tw-lockup">
            <img src={logoSekolah} alt="" className="tw-logo" onError={(e) => { e.target.style.display = 'none'; }} />
            <div className="tw-schoolname">SMKN Compreng</div>
          </div>

          <h1 className="tw-heading">Ceritakan pengalamanmu di SMKN Compreng</h1>
          <div className="tw-intro">
            Cukup beberapa kalimat. Ceritamu membantu calon siswa dan orang tua mengenal sekolah ini lebih dekat.
          </div>

          <div className="tw-sample-side">
            <div className="tw-caption">Begini tampilannya di halaman depan</div>
            <Sample name={shown.name || ''} role={shown.role || ''} quote={shown.quote || ''} photo={shown.photo || ''} />
          </div>
        </div>
      </aside>

      {/* ================= PANEL KANAN ================= */}
      <main className="tw-main">
        <div className="tw-column">
          {checking ? (
            <div className="tw-loading">
              <Loader2 size={20} className="tw-spin" /> Memeriksa akunmu…
            </div>
          ) : limitReached ? (
            /* ---------- BATAS 2X TERCAPAI ---------- */
            <div className="tw-done">
              <div className="tw-tick" style={{ background: '#f2b8b8' }}><X size={28} strokeWidth={3} /></div>
              <h2 className="tw-done-heading">Kamu sudah mencapai batas mengirim testimoni</h2>
              <div className="tw-done-copy">
                Setiap akun hanya bisa mengirim testimoni maksimal {MAX_TESTIMONIAL_PER_USER}x. Terima kasih sudah berbagi cerita, {firstName}.
              </div>

              {latest && (
                <div className="tw-sample-inline">
                  <div className="tw-caption">Testimoni terakhir kamu</div>
                  <Sample name={latest.name || ''} role={latest.role || ''} quote={latest.quote || ''} photo={latest.photo || ''} />
                </div>
              )}

              <button type="button" className="tw-go" onClick={goHome}>
                Kembali ke beranda
              </button>
            </div>
          ) : cooldownActive ? (
            /* ---------- SUDAH KIRIM, MASIH DALAM JEDA 24 JAM ---------- */
            <div className="tw-done">
              <div className="tw-tick"><Check size={28} strokeWidth={3} /></div>
              <h2 className="tw-done-heading">
                {justSent ? `Terima kasih, ${firstName}!` : 'Testimoni kamu sudah terkirim'}
              </h2>
              <div className="tw-done-copy">
                {isLive
                  ? 'Testimoni kamu sudah tampil di halaman depan. Terima kasih sudah berbagi cerita.'
                  : 'Tim sekolah akan meninjaunya dulu. Setelah disetujui, testimoni kamu otomatis tampil di halaman depan.'}
              </div>

              <ol className="tw-steps">
                <li className="is-done">Terkirim</li>
                <li className={isLive ? 'is-done' : 'is-now'}>Ditinjau tim sekolah</li>
                <li className={isLive ? 'is-done' : ''}>Tampil di halaman depan</li>
              </ol>

              <div className="tw-cooldown-box">
                Kamu bisa mengirim testimoni berikutnya ({status?.remaining ?? 0} kesempatan tersisa) dalam
                <div className="tw-cooldown-timer">{formatCountdown(msLeft)}</div>
              </div>

              {latest && (
                <div className="tw-sample-inline">
                  <Sample name={latest.name || ''} role={latest.role || ''} quote={latest.quote || ''} photo={latest.photo || ''} />
                </div>
              )}

              <button type="button" className="tw-go" onClick={goHome}>
                {isLive ? 'Lihat di halaman depan' : 'Kembali ke beranda'}
              </button>
            </div>
          ) : (
            /* ---------- FORM ---------- */
            <form className="tw-form" onSubmit={handleSubmit} noValidate>
              <h2 className="tw-hello">Halo, {firstName}. Ceritakan sedikit ya.</h2>
              <div className="tw-hello-copy">
                Tiga hal singkat saja. Kamu bisa melihat tampilannya sebelum mengirim.
              </div>

              {/* 1. Status */}
              <fieldset className="tw-field">
                <legend className="tw-legend">Kamu siapa di SMKN Compreng?</legend>
                <div className="tw-chips" role="radiogroup" aria-label="Status kamu">
                  {ROLES.map((r) => (
                    <label key={r.key} className={`tw-chip ${roleKey === r.key ? 'is-on' : ''}`}>
                      <input
                        type="radio"
                        name="tw-role"
                        value={r.key}
                        checked={roleKey === r.key}
                        onChange={() => setRoleKey(r.key)}
                        className="tw-sr"
                      />
                      {r.label}
                    </label>
                  ))}
                </div>

                {selectedRole && (
                  <div className="tw-detail">
                    <input
                      type="text"
                      className="tw-input"
                      value={detail}
                      maxLength={80}
                      placeholder={selectedRole.hint}
                      onChange={(e) => setDetail(e.target.value)}
                      aria-label={selectedRole.base ? 'Keterangan tambahan (opsional)' : 'Kamu sebagai apa?'}
                    />
                    <div className="tw-hint">
                      {selectedRole.base ? 'Keterangan tambahan, boleh dikosongkan.' : 'Wajib diisi untuk pilihan ini.'}
                    </div>
                  </div>
                )}
              </fieldset>

              {/* 2. Nama & cerita */}
              <div className="tw-field">
                <label className="tw-legend" htmlFor="tw-name">Nama yang ditampilkan</label>
                <input
                  id="tw-name"
                  type="text"
                  className="tw-input"
                  value={name}
                  maxLength={60}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama lengkap atau nama panggilan"
                />
              </div>

              <div className="tw-field">
                <label className="tw-legend" htmlFor="tw-quote">Ceritamu</label>
                <textarea
                  id="tw-quote"
                  ref={quoteRef}
                  className="tw-area"
                  rows={6}
                  maxLength={MAX_QUOTE}
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder="Ceritakan kesan, pengalaman, atau hal yang paling berkesan buat kamu."
                />
                <div className="tw-quote-meta">
                  {quote.length === 0 ? (
                    <div className="tw-starters">
                      <div className="tw-hint">Bingung mulai dari mana?</div>
                      {STARTERS.map((s) => (
                        <button type="button" key={s} className="tw-starter" onClick={() => pickStarter(s)}>
                          {s.trim()}…
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div />
                  )}
                  <div className={`tw-count ${quoteLen >= MIN_QUOTE ? 'is-ok' : ''}`}>
                    {quoteLen > 0 && quoteLen < MIN_QUOTE
                      ? `Tambah ${MIN_QUOTE - quoteLen} karakter lagi`
                      : `${quote.length}/${MAX_QUOTE}`}
                  </div>
                </div>
              </div>

              {/* 3. Foto */}
              <div className="tw-field">
                <div className="tw-legend">
                  Foto <span className="tw-optional">(opsional)</span>
                </div>
                <div className="tw-photo">
                  {photo ? (
                    <img src={photo} alt="" className="tw-face tw-face-lg" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="tw-initial tw-face-lg">{(name.trim().charAt(0) || '?').toUpperCase()}</div>
                  )}
                  <div className="tw-photo-actions">
                    <button type="button" className="tw-ghost" onClick={() => fileRef.current?.click()}>
                      <Camera size={16} /> {photo ? 'Ganti foto' : 'Tambah foto'}
                    </button>
                    {profileAvatar && effectivePhoto !== 'profile' && (
                      <button type="button" className="tw-ghost" onClick={() => setPhotoChoice('profile')}>
                        <Check size={16} /> Pakai foto profil
                      </button>
                    )}
                    {photo && (
                      <button type="button" className="tw-ghost tw-ghost-danger" onClick={() => setPhotoChoice('none')}>
                        <Trash2 size={16} /> Hapus
                      </button>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="tw-file" onChange={handlePhoto} tabIndex={-1} />
                </div>

                {effectivePhoto === 'custom' && (
                  <label className="tw-check">
                    <input
                      type="checkbox"
                      checked={shouldSaveAsProfile}
                      onChange={(e) => setSaveAsProfile(e.target.checked)}
                    />
                    <span>{profileAvatar ? 'Ganti juga foto profil akunku dengan foto ini' : 'Jadikan juga foto profil akunku'}</span>
                  </label>
                )}

                <div className="tw-hint">
                  {effectivePhoto === 'profile' && 'Memakai foto profil akunmu. Kamu bisa menggantinya khusus untuk testimoni ini.'}
                  {effectivePhoto === 'custom' && (shouldSaveAsProfile ? 'Foto ini dipakai di testimoni dan menjadi foto profilmu.' : 'Foto ini hanya dipakai di testimoni, foto profilmu tidak berubah.')}
                  {effectivePhoto === 'none' && 'Tanpa foto, kartumu memakai huruf pertama namamu.'}
                </div>
              </div>

              {/* Contoh untuk layar kecil (di desktop tampil di panel kiri) */}
              <div className="tw-sample-inline">
                <div className="tw-caption">Begini tampilannya di halaman depan</div>
                <Sample name={name} role={roleText} quote={quote} photo={photo} />
              </div>

              {error && <div className="tw-error" role="alert">{error}</div>}

              <button type="submit" className="tw-go" disabled={sending}>
                {sending ? <><Loader2 size={18} className="tw-spin" /> Mengirim…</> : <><Send size={18} /> Kirim testimoni</>}
              </button>
              <div className="tw-fine">
                Testimoni baru tampil di halaman depan setelah disetujui tim sekolah.
                {status && (
                  <>
                    <br />
                    Kesempatan kirim tersisa: {status.remaining ?? MAX_TESTIMONIAL_PER_USER}/{MAX_TESTIMONIAL_PER_USER}.
                    Setelah mengirim, kamu perlu menunggu 24 jam sebelum bisa mengirim lagi.
                  </>
                )}
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}