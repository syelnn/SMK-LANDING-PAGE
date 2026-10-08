import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Check, Loader2, Send, AlertTriangle } from 'lucide-react';
import { getSession, clearSession, isStaff } from '../../utils/auth';
import logoSekolah from '../../assets/logo1.png';
import '../../css/viewer/tulisTestimoni.css'; // layout split-panel yang sama dengan form testimoni
import '../../css/viewer/isiTracerStudy.css';

const API = 'https://smkn-compreng-api-pi.vercel.app';
const authHeader = (token) => ({ Authorization: `Bearer ${token}` });
const todayISO = () => new Date().toISOString().slice(0, 10);

// Pilihan status kegiatan. detail = label isian "detail tempat" (null => tidak ada isian).
const KINDS = [
  { key: 'Bekerja', color: '#3b82f6', detail: 'Nama perusahaan / instansi', hint: 'Contoh: PT Astra Honda Motor' },
  { key: 'Wirausaha', color: '#f59e0b', detail: 'Nama usaha', hint: 'Contoh: Bengkel Compreng Motor' },
  { key: 'Kuliah', color: '#8b5cf6', detail: 'Nama kampus', hint: 'Contoh: Universitas Singaperbangsa Karawang' },
  { key: 'Freelance', color: '#14b8a6', detail: null },
  { key: 'Pencari Kerja Aktif', color: '#f43f5e', detail: null },
];
const KIND_MAP = Object.fromEntries(KINDS.map((k) => [k.key, k]));

// Dipakai bila daftar jurusan dari server gagal dimuat
const FALLBACK_JURUSAN = [
  'Agribisnis Tanaman Pangan dan Hortikultura',
  'Teknik dan Bisnis Sepeda Motor',
];

const normalizePhone = (v) => {
  let p = String(v || '').replace(/[\s\-().]/g, '');
  if (p.startsWith('+62')) p = '0' + p.slice(3);
  else if (p.startsWith('62')) p = '0' + p.slice(2);
  return p;
};

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '-';

export default function IsiTracerStudy() {
  const navigate = useNavigate();
  const session = useMemo(() => getSession(), []);

  const [checking, setChecking] = useState(true);
  const [entry, setEntry] = useState(null); // data milik user ini (kalau sudah pernah isi)
  const [current, setCurrent] = useState(10);
  const [jurusanList, setJurusanList] = useState(FALLBACK_JURUSAN);
  const [justSent, setJustSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    fullName: session?.name || '',
    angkatan: '',
    jurusan: '',
    workStatus: '',
    detailTempat: '',
    nisn: '',
    nik: '',
    birthDate: '',
    domicile: '',
    phone: '',
  });
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setDigits = (key, max) => (e) => set(key, e.target.value.replace(/\D/g, '').slice(0, max));

  const toLogin = () =>
    navigate('/login', { replace: true, state: { from: '/tracer-study/isi', reason: 'tracer' } });
  const goBack = () => navigate('/tracer-study');

  // Isi ulang form dari data lama (dipakai saat data ditolak & alumni memperbaiki)
  const prefill = (e) =>
    setForm({
      fullName: e.fullName || '',
      angkatan: e.angkatan ? String(e.angkatan) : '',
      jurusan: e.jurusan || '',
      workStatus: e.workStatus || '',
      detailTempat: e.detailTempat || '',
      nisn: e.nisn || '',
      nik: e.nik || '',
      birthDate: e.birthDate ? String(e.birthDate).slice(0, 10) : '',
      domicile: e.domicile || '',
      phone: e.phone || '',
    });

  // Penjaga halaman: wajib login (viewer/alumni). Admin/editor diarahkan ke dashboard.
  useEffect(() => {
    if (!session) {
      clearSession();
      toLogin();
      return;
    }
    if (isStaff(session.role)) {
      navigate('/admin/tracer-study', { replace: true });
      return;
    }

    let alive = true;

    axios
      .get(`${API}/api/jurusan`)
      .then((res) => {
        const titles = (res.data?.data || []).map((j) => String(j.title || '').trim()).filter(Boolean);
        if (alive && titles.length) setJurusanList(titles);
      })
      .catch(() => {});

    axios
      .get(`${API}/api/tracer-study/mine`, { headers: authHeader(session.token) })
      .then((res) => {
        if (!alive) return;
        const e = res.data?.data?.entry || null;
        setEntry(e);
        if (e?.approvalStatus === 'rejected') prefill(e);
        if (res.data?.data?.currentAngkatan) setCurrent(res.data.data.currentAngkatan);
      })
      .catch((err) => {
        const code = err.response?.status;
        if (code === 401 || code === 403) {
          clearSession();
          toLogin();
        }
      })
      .finally(() => alive && setChecking(false));

    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!session) return null;

  const firstName = (form.fullName.trim().split(' ')[0]) || session.name || 'kamu';
  const angkatanOptions = Array.from({ length: current }, (_, i) => current - i);
  const kind = KIND_MAP[form.workStatus];
  const needsDetail = !!kind?.detail;
  // Jurusan lama yang sudah tidak ada di daftar tetap muncul agar tidak hilang saat memperbaiki data
  const jurusanOptions = form.jurusan && !jurusanList.includes(form.jurusan)
    ? [form.jurusan, ...jurusanList]
    : jurusanList;

  const pickKind = (key) => {
    setForm((f) => ({ ...f, workStatus: key, detailTempat: KIND_MAP[key]?.detail ? f.detailTempat : '' }));
  };

  const validate = () => {
    if (form.fullName.trim().length < 3) return 'Nama lengkap belum diisi.';
    if (!form.angkatan) return 'Pilih angkatanmu.';
    if (!form.jurusan) return 'Pilih jurusan (program keahlian) kamu.';
    if (!form.workStatus) return 'Pilih status kamu saat ini.';
    if (needsDetail && form.detailTempat.trim().length < 2) return `${kind.detail} belum diisi.`;
    if (!/^\d{10}$/.test(form.nisn)) return 'NISN harus 10 digit angka.';
    if (form.nik && !/^\d{16}$/.test(form.nik)) return 'NIK harus 16 digit. Kosongkan jika belum punya KTP.';
    if (!form.birthDate) return 'Tanggal lahir belum diisi.';
    if (form.domicile.trim().length < 3) return 'Kecamatan domisili belum diisi.';
    if (!/^08\d{8,12}$/.test(normalizePhone(form.phone))) return 'Nomor HP tidak valid. Contoh: 081234567890.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const problem = validate();
    if (problem) return setError(problem);

    setSending(true);
    try {
      const res = await axios.post(
        `${API}/api/tracer-study`,
        {
          fullName: form.fullName.trim(),
          angkatan: Number(form.angkatan),
          jurusan: form.jurusan,
          workStatus: form.workStatus,
          detailTempat: needsDetail ? form.detailTempat.trim() : '',
          nisn: form.nisn,
          nik: form.nik,
          birthDate: form.birthDate,
          domicile: form.domicile.trim(),
          phone: normalizePhone(form.phone),
        },
        { headers: authHeader(session.token) }
      );
      setEntry(res.data.data);
      setJustSent(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const code = err.response?.status;
      if (code === 401 || code === 403) {
        clearSession();
        return toLogin();
      }
      const payload = err.response?.data;
      if (payload?.alreadySubmitted && payload.data) {
        setEntry(payload.data);
        return;
      }
      setError(payload?.message || 'Data belum terkirim. Coba lagi sebentar lagi.');
    } finally {
      setSending(false);
    }
  };

  const approval = entry?.approvalStatus; // pending | approved | rejected
  const approved = approval === 'approved';
  const rejected = approval === 'rejected';
  const showForm = !entry || rejected;
  const sentKind = KIND_MAP[entry?.workStatus];

  return (
    <div className="tw-shell">
      {/* ================= PANEL KIRI ================= */}
      <aside className="tw-aside">
        <div className="tw-aside-inner">
          <button type="button" className="tw-back" onClick={goBack}>
            <ArrowLeft size={16} /> Kembali ke Tracer Study
          </button>

          <div className="tw-lockup">
            <img src={logoSekolah} alt="" className="tw-logo" onError={(e) => { e.target.style.display = 'none'; }} />
            <div className="tw-schoolname">SMKN Compreng</div>
          </div>

          <h1 className="tw-heading">Lengkapi data Tracer Study-mu</h1>
          <div className="tw-intro">
            Data alumni membantu sekolah menjaga hubungan dengan lulusannya dan menyusun program yang lebih tepat.
          </div>

          <div className="tw-sample-side">
            <div className="tw-caption">Alurnya singkat</div>
            <div className="tf-flow">
              <div className="tf-flow-row"><div className="tf-flow-n">1</div><div className="tf-flow-txt">Isi formulir dan kirim.</div></div>
              <div className="tf-flow-row"><div className="tf-flow-n">2</div><div className="tf-flow-txt">Admin sekolah memverifikasi datamu.</div></div>
              <div className="tf-flow-row"><div className="tf-flow-n">3</div><div className="tf-flow-txt">Jika disetujui, datamu masuk ke statistik dan tabel alumni. Jika ditolak, kamu bisa memperbaiki lalu mengirim ulang.</div></div>
            </div>
            <div className="tf-note">
              NISN, NIK, tanggal lahir, dan nomor HP tidak pernah ditampilkan ke publik.
            </div>
          </div>
        </div>
      </aside>

      {/* ================= PANEL KANAN ================= */}
      <main className="tw-main">
        <div className="tw-column">
          {checking ? (
            <div className="tw-loading"><Loader2 size={20} className="tw-spin" /> Memeriksa akunmu…</div>
          ) : !showForm ? (
            /* ---------- SUDAH MENGIRIM (pending / approved) ---------- */
            <div className="tw-done">
              <div className="tw-tick"><Check size={28} strokeWidth={3} /></div>
              <h2 className="tw-done-heading">
                {justSent ? `Terima kasih, ${firstName}!` : approved ? 'Datamu sudah terverifikasi' : 'Datamu sedang diverifikasi'}
              </h2>
              <div className="tw-done-copy">
                {approved
                  ? 'Datamu sudah masuk ke statistik dan tabel alumni Tracer Study.'
                  : 'Admin sekolah akan memeriksa datamu. Setelah disetujui, datamu otomatis tampil di tabel alumni.'}
              </div>

              <ol className="tw-steps">
                <li className="is-done">Terkirim</li>
                <li className={approved ? 'is-done' : 'is-now'}>Diverifikasi admin</li>
                <li className={approved ? 'is-done' : ''}>Tampil di tabel</li>
              </ol>

              <div className="tf-recap">
                <div className="tf-recap-row"><div>Nama</div><div>{entry.fullName}</div></div>
                <div className="tf-recap-row"><div>Angkatan</div><div>{entry.angkatan}</div></div>
                <div className="tf-recap-row"><div>Jurusan</div><div>{entry.jurusan || '-'}</div></div>
                <div className="tf-recap-row">
                  <div>Status</div>
                  <div>{sentKind ? <div className="tf-kind" style={{ '--k': sentKind.color }}>{sentKind.key}</div> : '-'}</div>
                </div>
                {entry.detailTempat && (
                  <div className="tf-recap-row"><div>{sentKind?.detail || 'Tempat'}</div><div>{entry.detailTempat}</div></div>
                )}
                <div className="tf-recap-row"><div>Tanggal lahir</div><div>{formatDate(entry.birthDate)}</div></div>
                <div className="tf-recap-row"><div>Kecamatan</div><div>{entry.domicile}</div></div>
              </div>

              <button type="button" className="tw-go" onClick={goBack}>
                {approved ? 'Lihat di tabel alumni' : 'Kembali ke Tracer Study'}
              </button>
            </div>
          ) : (
            /* ---------- FORM (baru, atau perbaikan data yang ditolak) ---------- */
            <form className="tw-form" onSubmit={handleSubmit} noValidate>
              {rejected && (
                <div className="tf-reject" role="alert">
                  <AlertTriangle size={18} aria-hidden="true" />
                  <div>
                    Datamu sebelumnya ditolak admin. Periksa kembali isiannya (terutama NISN dan nama),
                    perbaiki, lalu kirim ulang.
                  </div>
                </div>
              )}

              <h2 className="tw-hello">Halo, {firstName}. Isi data dirimu ya.</h2>
              <div className="tw-hello-copy">
                Pastikan datanya benar dan sesuai dokumen. Data baru tampil di tabel setelah diverifikasi admin.
              </div>

              <div className="tw-field">
                <label className="tw-legend" htmlFor="ts-nama">Nama lengkap</label>
                <input
                  id="ts-nama" type="text" className="tw-input" value={form.fullName} maxLength={200}
                  autoComplete="name" placeholder="Sesuai ijazah / kartu pelajar"
                  onChange={(e) => set('fullName', e.target.value)}
                />
              </div>

              <div className="tf-two">
                <div className="tw-field">
                  <label className="tw-legend" htmlFor="ts-angkatan">Angkatan</label>
                  <select
                    id="ts-angkatan" className="tw-input" value={form.angkatan}
                    onChange={(e) => set('angkatan', e.target.value)}
                  >
                    <option value="">Pilih angkatan</option>
                    {angkatanOptions.map((a) => (
                      <option key={a} value={a}>{a === current ? `Angkatan ${a} (tahun ini)` : `Angkatan ${a}`}</option>
                    ))}
                  </select>
                </div>
                <div className="tw-field">
                  <label className="tw-legend" htmlFor="ts-jurusan">Jurusan</label>
                  <select
                    id="ts-jurusan" className="tw-input" value={form.jurusan}
                    onChange={(e) => set('jurusan', e.target.value)}
                  >
                    <option value="">Pilih jurusan</option>
                    {jurusanOptions.map((j) => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
              </div>

              {/* ----- Status kegiatan saat ini ----- */}
              <div className="tw-field">
                <div className="tw-legend" id="ts-status-lbl">Kegiatanmu saat ini</div>
                <div className="tf-opts" role="radiogroup" aria-labelledby="ts-status-lbl">
                  {KINDS.map((k) => (
                    <button
                      type="button" key={k.key} role="radio"
                      aria-checked={form.workStatus === k.key}
                      className={`tf-opt ${form.workStatus === k.key ? 'is-on' : ''}`}
                      style={{ '--k': k.color }}
                      onClick={() => pickKind(k.key)}
                    >
                      <div className="tf-opt-dot" aria-hidden="true" />
                      <div>{k.key}</div>
                    </button>
                  ))}
                </div>
              </div>

              {needsDetail && (
                <div className="tw-field">
                  <label className="tw-legend" htmlFor="ts-detail">{kind.detail}</label>
                  <input
                    id="ts-detail" type="text" className="tw-input" value={form.detailTempat} maxLength={200}
                    placeholder={kind.hint} onChange={(e) => set('detailTempat', e.target.value)}
                  />
                </div>
              )}

              <div className="tf-two">
                <div className="tw-field">
                  <label className="tw-legend" htmlFor="ts-lahir">Tanggal lahir</label>
                  <input
                    id="ts-lahir" type="date" className="tw-input" value={form.birthDate}
                    max={todayISO()} min="1980-01-01" autoComplete="bday"
                    onChange={(e) => set('birthDate', e.target.value)}
                  />
                </div>
                <div className="tw-field">
                  <label className="tw-legend" htmlFor="ts-domisili">Domisili (kecamatan)</label>
                  <input
                    id="ts-domisili" type="text" className="tw-input" value={form.domicile} maxLength={200}
                    autoComplete="address-level3" placeholder="Contoh: Sukaseneng"
                    onChange={(e) => set('domicile', e.target.value)}
                  />
                </div>
              </div>
              <div className="tw-hint tf-hint-gap">Tinggal di luar daerah? Tulis kota atau kabupatennya.</div>

              <div className="tw-field">
                <label className="tw-legend" htmlFor="ts-nisn">NISN</label>
                <input
                  id="ts-nisn" type="text" inputMode="numeric" className="tw-input" value={form.nisn}
                  placeholder="10 digit angka" onChange={setDigits('nisn', 10)}
                />
                <div className="tw-hint">Nomor Induk Siswa Nasional, 10 digit. Ada di rapor atau kartu pelajar. Hanya dipakai untuk verifikasi.</div>
              </div>

              <div className="tw-field">
                <label className="tw-legend" htmlFor="ts-nik">
                  NIK <span className="tw-optional">(opsional)</span>
                </label>
                <input
                  id="ts-nik" type="text" inputMode="numeric" className="tw-input" value={form.nik}
                  placeholder="16 digit angka" onChange={setDigits('nik', 16)}
                />
                <div className="tw-hint">Isi jika sudah punya KTP. Kosongkan jika belum mendaftar.</div>
              </div>

              <div className="tw-field">
                <label className="tw-legend" htmlFor="ts-hp">Nomor HP aktif</label>
                <input
                  id="ts-hp" type="tel" inputMode="tel" className="tw-input" value={form.phone} maxLength={16}
                  autoComplete="tel" placeholder="081234567890"
                  onChange={(e) => set('phone', e.target.value.replace(/[^\d+]/g, ''))}
                />
              </div>

              {error && <div className="tw-error" role="alert">{error}</div>}

              <button type="submit" className="tw-go" disabled={sending}>
                {sending
                  ? <><Loader2 size={18} className="tw-spin" /> Mengirim…</>
                  : <><Send size={18} /> {rejected ? 'Kirim ulang data' : 'Kirim data'}</>}
              </button>
              <div className="tw-fine">Data yang dikirim akan diperiksa admin sebelum ditampilkan.</div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}