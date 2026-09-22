import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Camera, Check, Loader2, Send, Trash2 } from 'lucide-react';
import { getSession, clearSession, isStaff } from '../../utils/auth';
import logoSekolah from '../../assets/logo1.png';
import '../../css/viewer/tulisTestimoni.css';

const API = 'http://localhost:5002';
const MIN_QUOTE = 20;
const MAX_QUOTE = 400;

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

export default function TulisTestimoni() {
  const navigate = useNavigate();
  const session = useMemo(() => getSession(), []);

  const [checking, setChecking] = useState(true);
  const [existing, setExisting] = useState(null); // testimoni milik user ini (jika sudah pernah kirim)
  const [justSent, setJustSent] = useState(false);

  const [roleKey, setRoleKey] = useState('');
  const [detail, setDetail] = useState('');
  const [name, setName] = useState(session?.name || '');
  const [quote, setQuote] = useState('');
  const [photo, setPhoto] = useState('');
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

  // Penjaga halaman + cek apakah user sudah pernah kirim
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
    axios
      .get(`${API}/api/testimonials/mine`, { headers: authHeader(session.token) })
      .then((res) => alive && setExisting(res.data?.data || null))
      .catch((err) => {
        const status = err.response?.status;
        if (status === 401 || status === 403) {
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

  if (!session) return null;

  const selectedRole = ROLES.find((r) => r.key === roleKey);
  const roleText = buildRole(roleKey, detail);
  const firstName = ((existing?.name || name || session.name).trim().split(' ')[0]) || 'kamu';
  const quoteLen = quote.trim().length;

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
      setPhoto(await toSquareDataUrl(file));
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
      const res = await axios.post(
        `${API}/api/testimonials`,
        { name: cleanName, role: roleText, quote: cleanQuote, photo },
        { headers: authHeader(session.token) }
      );
      setExisting(res.data.data);
      setJustSent(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(goHome, 1800);
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        clearSession();
        return toLogin();
      }
      // Ternyata sudah pernah kirim (mis. dari tab lain) -> tampilkan statusnya
      if (status === 400 && err.response?.data?.data) {
        setExisting(err.response.data.data);
        return;
      }
      setError(err.response?.data?.message || 'Testimoni belum terkirim. Coba lagi sebentar lagi.');
    } finally {
      setSending(false);
    }
  };

  const shown = existing || { name, role: roleText, quote, photo };
  const isLive = Number(existing?.show) === 1;

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
          ) : existing ? (
            /* ---------- SUDAH KIRIM: tampilkan status validasi ---------- */
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

              <div className="tw-sample-inline">
                <Sample name={existing.name || ''} role={existing.role || ''} quote={existing.quote || ''} photo={existing.photo || ''} />
              </div>

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
                    <img src={photo} alt="" className="tw-face tw-face-lg" />
                  ) : (
                    <div className="tw-initial tw-face-lg">{(name.trim().charAt(0) || '?').toUpperCase()}</div>
                  )}
                  <div className="tw-photo-actions">
                    <button type="button" className="tw-ghost" onClick={() => fileRef.current?.click()}>
                      <Camera size={16} /> {photo ? 'Ganti foto' : 'Tambah foto'}
                    </button>
                    {photo && (
                      <button type="button" className="tw-ghost tw-ghost-danger" onClick={() => setPhoto('')}>
                        <Trash2 size={16} /> Hapus
                      </button>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="tw-file" onChange={handlePhoto} tabIndex={-1} />
                </div>
                <div className="tw-hint">Tanpa foto, kartumu memakai huruf pertama namamu.</div>
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
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
