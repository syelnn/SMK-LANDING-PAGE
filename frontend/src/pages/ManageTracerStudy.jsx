import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Check, X, Plus, Search, Trash2, Loader2, ClipboardList } from 'lucide-react';
import '../css/managetracerstudy.css';
import '../App.css'; // class modal-overlay, modern-modal, input-modern, dll (sama seperti halaman Testimoni)

const BASE = 'https://smkn-compreng-api-pi.vercel.app/api';
const API = `${BASE}/tracer-study`;
const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

// Status kegiatan alumni. detail = label isian detail tempat (null => tidak ada, mis. Freelance).
const KINDS = [
  { key: 'Bekerja', color: '#3b82f6', detail: 'Nama perusahaan / instansi' },
  { key: 'Wirausaha', color: '#f59e0b', detail: 'Nama usaha' },
  { key: 'Kuliah', color: '#8b5cf6', detail: 'Nama kampus' },
  { key: 'Freelance', color: '#14b8a6', detail: null },
  { key: 'Pencari Kerja Aktif', color: '#f43f5e', detail: null },
];
const KIND_MAP = Object.fromEntries(KINDS.map((k) => [k.key, k]));
const FALLBACK_JURUSAN = ['Agribisnis Tanaman Pangan dan Hortikultura', 'Teknik dan Bisnis Sepeda Motor'];

const EMPTY_FORM = {
  fullName: '', angkatan: '', jurusan: '', workStatus: '', detailTempat: '',
  nisn: '', nik: '', birthDate: '', domicile: '', phone: '',
};

const APPROVAL = {
  pending: { label: 'Menunggu', cls: 'is-pending' },
  approved: { label: 'Disetujui', cls: 'is-ok' },
  rejected: { label: 'Ditolak', cls: 'is-no' },
};

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '-';
const fmtSent = (iso) =>
  iso ? new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

const ManageTracerStudy = () => {
  const [items, setItems] = useState([]);
  const [current, setCurrent] = useState(10);
  const [jurusanList, setJurusanList] = useState(FALLBACK_JURUSAN);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [tab, setTab] = useState('pending'); // pending | approved | rejected | all
  const [query, setQuery] = useState('');
  const [angkatan, setAngkatan] = useState('all');
  const [kind, setKind] = useState('all');
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState('');
  const noticeTimer = useRef(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const flash = (msg) => {
    setNotice(msg);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(''), 3200);
  };
  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  const fetchData = async () => {
    try {
      setLoadError('');
      const res = await axios.get(API, authHeaders());
      setItems(res.data?.data?.items || []);
      if (res.data?.data?.currentAngkatan) setCurrent(res.data.data.currentAngkatan);
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Gagal memuat data Tracer Study.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
    axios
      .get(`${BASE}/jurusan`)
      .then((res) => {
        const titles = (res.data?.data || []).map((j) => String(j.title || '').trim()).filter(Boolean);
        if (titles.length) setJurusanList(titles);
      })
      .catch(() => {});
  }, []);

  const countOf = (s) => items.filter((i) => i.approvalStatus === s).length;
  const pendingCount = countOf('pending');
  const approvedCount = countOf('approved');
  const rejectedCount = countOf('rejected');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (tab !== 'all' && i.approvalStatus !== tab) return false;
      if (angkatan !== 'all' && i.angkatan !== Number(angkatan)) return false;
      if (kind !== 'all' && i.workStatus !== kind) return false;
      if (!q) return true;
      return [i.fullName, i.nisn, i.domicile, i.phone, i.jurusan, i.workStatus, i.detailTempat, i.user?.username, i.user?.email]
        .some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [items, tab, angkatan, kind, query]);

  const approve = async (item) => {
    setBusyId(item.id);
    try {
      const res = await axios.put(`${API}/${item.id}/approve`, {}, authHeaders());
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...res.data.data } : i)));
      flash(`Data ${item.fullName} disetujui dan tampil di tabel publik.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyetujui data.');
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (item) => {
    if (!window.confirm(`Tolak data ${item.fullName}?\n\nData tidak akan tampil di publik. Alumni bisa memperbaiki dan mengirim ulang.`)) return;
    setBusyId(item.id);
    try {
      const res = await axios.put(`${API}/${item.id}/reject`, {}, authHeaders());
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...res.data.data } : i)));
      flash(`Data ${item.fullName} ditolak.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menolak data.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Hapus permanen data ${item.fullName} dari Tracer Study?`)) return;
    setBusyId(item.id);
    try {
      await axios.delete(`${API}/${item.id}`, authHeaders());
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      flash('Data dihapus.');
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus data.');
    } finally {
      setBusyId(null);
    }
  };

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setIsModalOpen(true);
  };
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setDigits = (k, max) => (e) => setField(k, e.target.value.replace(/\D/g, '').slice(0, max));
  const pickKind = (key) =>
    setForm((f) => ({ ...f, workStatus: key, detailTempat: KIND_MAP[key]?.detail ? f.detailTempat : '' }));

  const formKind = KIND_MAP[form.workStatus];

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await axios.post(
        `${API}/admin`,
        { ...form, angkatan: Number(form.angkatan), detailTempat: formKind?.detail ? form.detailTempat : '' },
        authHeaders()
      );
      setIsModalOpen(false);
      flash('Data alumni ditambahkan dan langsung tampil di tabel publik.');
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  const angkatanOptions = Array.from({ length: current }, (_, i) => current - i);

  const Actions = ({ item }) => {
    const busy = busyId === item.id;
    if (busy) return <div className="mt-acts"><Loader2 size={16} className="mt-spin" /></div>;
    const st = item.approvalStatus;
    return (
      <div className="mt-acts">
        {st !== 'approved' && (
          <button type="button" className="mt-act mt-act-ok" onClick={() => approve(item)}><Check size={14} /> Accept</button>
        )}
        {st === 'pending' && (
          <button type="button" className="mt-act mt-act-no" onClick={() => reject(item)}><X size={14} /> Reject</button>
        )}
        {st !== 'pending' && (
          <button type="button" className="mt-act mt-act-no" onClick={() => remove(item)} aria-label={`Hapus ${item.fullName}`}>
            <Trash2 size={14} /> Hapus
          </button>
        )}
      </div>
    );
  };

  const Pill = ({ status }) => {
    const a = APPROVAL[status] || APPROVAL.pending;
    return <div className={`mt-pill ${a.cls}`}>{a.label}</div>;
  };

  const Kind = ({ item }) => {
    const k = KIND_MAP[item.workStatus];
    if (!k) return <div className="mt-minor">Belum diisi</div>;
    return (
      <div>
        <div className="mt-kind" style={{ '--k': k.color }}>{k.key}</div>
        {item.detailTempat && <div className="mt-detail">{item.detailTempat}</div>}
      </div>
    );
  };

  const hasFilter = query || angkatan !== 'all' || kind !== 'all';
  const emptyText = hasFilter
    ? 'Tidak ada data yang cocok dengan pencarian.'
    : tab === 'pending' ? 'Tidak ada data yang menunggu verifikasi.'
    : tab === 'rejected' ? 'Tidak ada data yang ditolak.'
    : 'Belum ada data Tracer Study.';

  return (
    <div className="mt-page">
      <div className="mt-head">
        <div>
          <h2 className="mt-h">Tracer Study</h2>
          <div className="mt-sub">Verifikasi data alumni yang diisi mandiri. Data yang di-Accept tampil di tabel dan statistik publik. Data yang di-Reject tidak tampil, dan alumni bisa memperbaikinya lalu mengirim ulang.</div>
        </div>
        <button type="button" className="btn-modern-primary mt-add" onClick={openAdd}>
          <Plus size={16} /> Tambah Data
        </button>
      </div>

      {notice && <div className="mt-notice" role="status"><Check size={16} /> {notice}</div>}

      <div className="mt-seg" role="group" aria-label="Filter data">
        {[
          { key: 'pending', label: 'Menunggu verifikasi', n: pendingCount },
          { key: 'approved', label: 'Disetujui', n: approvedCount },
          { key: 'rejected', label: 'Ditolak', n: rejectedCount },
          { key: 'all', label: 'Semua', n: items.length },
        ].map((s) => (
          <button
            key={s.key} type="button"
            className={`mt-seg-item ${tab === s.key ? 'is-on' : ''} ${s.key === 'pending' && s.n > 0 ? 'has-new' : ''}`}
            onClick={() => setTab(s.key)}
          >
            {s.label} <div className="mt-seg-n">{s.n}</div>
          </button>
        ))}
      </div>

      <div className="mt-bar">
        <div className="mt-find">
          <Search size={16} className="mt-find-ico" />
          <input
            type="text" className="mt-find-input" value={query}
            placeholder="Cari nama, NISN, jurusan, tempat, atau akun…"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className="mt-pick" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Filter kegiatan">
          <option value="all">Semua kegiatan</option>
          {KINDS.map((k) => <option key={k.key} value={k.key}>{k.key}</option>)}
        </select>
        <select className="mt-pick" value={angkatan} onChange={(e) => setAngkatan(e.target.value)} aria-label="Filter angkatan">
          <option value="all">Semua angkatan</option>
          {angkatanOptions.map((a) => <option key={a} value={a}>Angkatan {a}</option>)}
        </select>
      </div>

      {loadError && <div className="mt-err" role="alert">{loadError}</div>}

      {/* ===== Desktop & tablet: tabel ===== */}
      <div className="mt-sheet">
        <div className="mt-scroll">
          <table className="mt-grid">
            <thead>
              <tr>
                <th>Nama</th><th>Angkatan</th><th>Jurusan</th><th>Kegiatan</th><th>NISN / NIK</th>
                <th>Kecamatan</th><th>No. HP</th><th>Approval</th><th className="mt-th-act">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="mt-empty">Memuat data…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="9" className="mt-empty">{emptyText}</td></tr>
              ) : (
                filtered.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <div className="mt-name">{i.fullName}</div>
                      <div className="mt-minor">{i.user?.username ? `@${i.user.username}` : 'Input admin'} · Lahir {fmtDate(i.birthDate)}</div>
                    </td>
                    <td><div className="mt-gen">{i.angkatan}</div></td>
                    <td><div>{i.jurusan || <div className="mt-minor">Belum diisi</div>}</div></td>
                    <td><Kind item={i} /></td>
                    <td>
                      <div className="mt-mono">{i.nisn}</div>
                      <div className="mt-minor mt-mono">{i.nik || 'NIK: -'}</div>
                    </td>
                    <td>{i.domicile}</td>
                    <td><div className="mt-mono">{i.phone}</div></td>
                    <td>
                      <Pill status={i.approvalStatus} />
                      <div className="mt-minor">{fmtSent(i.createdAt)}</div>
                    </td>
                    <td><Actions item={i} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== Mobile: daftar kartu ===== */}
      <div className="mt-mlist">
        {!loading && filtered.length === 0 && <div className="mt-mempty">{emptyText}</div>}
        {filtered.map((i) => (
          <div key={i.id} className="mt-tile">
            <div className="mt-tile-top">
              <div>
                <div className="mt-name">{i.fullName}</div>
                <div className="mt-minor">{i.user?.username ? `@${i.user.username}` : 'Input admin'} · Angkatan {i.angkatan}</div>
              </div>
              <Pill status={i.approvalStatus} />
            </div>
            <div className="mt-kv"><div>Jurusan</div><div>{i.jurusan || '-'}</div></div>
            <div className="mt-kv"><div>Kegiatan</div><div><Kind item={i} /></div></div>
            <div className="mt-kv"><div>NISN</div><div className="mt-mono">{i.nisn}</div></div>
            <div className="mt-kv"><div>NIK</div><div className="mt-mono">{i.nik || '-'}</div></div>
            <div className="mt-kv"><div>Tgl lahir</div><div>{fmtDate(i.birthDate)}</div></div>
            <div className="mt-kv"><div>Kecamatan</div><div>{i.domicile}</div></div>
            <div className="mt-kv"><div>No. HP</div><div className="mt-mono">{i.phone}</div></div>
            <div className="mt-kv"><div>Dikirim</div><div>{fmtSent(i.createdAt)}</div></div>
            <Actions item={i} />
          </div>
        ))}
      </div>

      {/* ===== Modal tambah data manual ===== */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content modern-modal">
            <div className="modal-header-modern">
              <h3><ClipboardList size={18} style={{ verticalAlign: '-3px', marginRight: 8 }} />Tambah Data Alumni</h3>
              <button onClick={() => setIsModalOpen(false)} className="btn-close-modal" type="button" aria-label="Tutup"><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} className="form-modern-layout">
              <div className="form-group-modern">
                <label>Nama Lengkap</label>
                <input type="text" className="input-modern" value={form.fullName} maxLength={200} required
                  onChange={(e) => setField('fullName', e.target.value)} />
              </div>
              <div className="form-group-modern">
                <label>Angkatan</label>
                <select className="input-modern" value={form.angkatan} required onChange={(e) => setField('angkatan', e.target.value)}>
                  <option value="">Pilih angkatan</option>
                  {angkatanOptions.map((a) => <option key={a} value={a}>{a === current ? `Angkatan ${a} (tahun ini)` : `Angkatan ${a}`}</option>)}
                </select>
              </div>
              <div className="form-group-modern">
                <label>Jurusan (Program Keahlian)</label>
                <select className="input-modern" value={form.jurusan} required onChange={(e) => setField('jurusan', e.target.value)}>
                  <option value="">Pilih jurusan</option>
                  {jurusanList.map((j) => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div className="form-group-modern">
                <label>Kegiatan Saat Ini</label>
                <select className="input-modern" value={form.workStatus} required onChange={(e) => pickKind(e.target.value)}>
                  <option value="">Pilih status</option>
                  {KINDS.map((k) => <option key={k.key} value={k.key}>{k.key}</option>)}
                </select>
              </div>
              {formKind?.detail && (
                <div className="form-group-modern">
                  <label>{formKind.detail}</label>
                  <input type="text" className="input-modern" value={form.detailTempat} maxLength={200} required
                    onChange={(e) => setField('detailTempat', e.target.value)} />
                </div>
              )}
              <div className="form-group-modern">
                <label>NISN (10 digit)</label>
                <input type="text" inputMode="numeric" className="input-modern" value={form.nisn} required
                  onChange={setDigits('nisn', 10)} />
              </div>
              <div className="form-group-modern">
                <label>NIK (opsional, 16 digit)</label>
                <input type="text" inputMode="numeric" className="input-modern" value={form.nik}
                  onChange={setDigits('nik', 16)} />
              </div>
              <div className="form-group-modern">
                <label>Tanggal Lahir</label>
                <input type="date" className="input-modern" value={form.birthDate} required min="1980-01-01"
                  max={new Date().toISOString().slice(0, 10)} onChange={(e) => setField('birthDate', e.target.value)} />
              </div>
              <div className="form-group-modern">
                <label>Domisili (Kecamatan)</label>
                <input type="text" className="input-modern" value={form.domicile} maxLength={200} required
                  placeholder="Contoh: Sukaseneng" onChange={(e) => setField('domicile', e.target.value)} />
              </div>
              <div className="form-group-modern">
                <label>Nomor HP Aktif</label>
                <input type="tel" className="input-modern" value={form.phone} maxLength={16} required
                  placeholder="081234567890" onChange={(e) => setField('phone', e.target.value.replace(/[^\d+]/g, ''))} />
              </div>

              {formError && <div className="mt-err" role="alert">{formError}</div>}

              <div className="modal-actions-modern">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-modern-secondary">Batal</button>
                <button type="submit" className="btn-modern-primary" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan Data'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTracerStudy;