import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Check, X, Plus, Search, Trash2, Loader2, ClipboardList, Pencil, MoreVertical, Lock } from 'lucide-react';
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

// Urutan tab: "Semua" paling depan (dan jadi tampilan awal).
const TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'pending', label: 'Menunggu verifikasi' },
  { key: 'approved', label: 'Disetujui' },
  { key: 'rejected', label: 'Ditolak' },
];

// Di tabel jurusan ditampilkan singkat (kode dalam kurung, mis. "PPLG/RPL"); nama lengkap ada di tooltip & kartu.
const shortJurusan = (name) => String(name || '').match(/\(([^)]+)\)\s*$/)?.[1] || name || '';

// Kolom tabel (urutan sesuai permintaan). fit = kolom angka/pendek: header & isi tidak membungkus,
// lebarnya mengikuti isi (tanpa ruang terbuang). Kolom teks membagi sisa lebar dan membungkus per kata.
const COLUMNS = [
  { key: 'nama', label: 'Nama' },
  { key: 'jurusan', label: 'Jurusan', fit: true },
  { key: 'angkatan', label: 'Angkatan', fit: true },
  { key: 'kegiatan', label: 'Kegiatan' },
  { key: 'detail', label: 'Detail Tempat Kerja / Universitas' },
  { key: 'nisn', label: 'NISN', fit: true },
  { key: 'nik', label: 'NIK', fit: true },
  { key: 'domisili', label: 'Domisili' },
  { key: 'hp', label: 'No. HP', fit: true },
  { key: 'approval', label: 'Approval', fit: true },
  { key: 'aksi', label: '', px: 40 },
];

/* ======================= Komponen kecil (di luar komponen utama) ======================= */

const Pill = ({ status }) => {
  const a = APPROVAL[status] || APPROVAL.pending;
  return <div className={`mt-pill ${a.cls}`}>{a.label}</div>;
};

const Kind = ({ item }) => {
  const k = KIND_MAP[item.workStatus];
  if (!k) return <div className="mt-minor">Belum diisi</div>;
  return <div className="mt-kind">{k.key}</div>;
};

const Detail = ({ item }) =>
  item.detailTempat ? <div className="mt-detail">{item.detailTempat}</div> : <div className="mt-dash">—</div>;

// Tanggal lahir ditampilkan apa adanya dari server (UTC) agar tidak bergeser sehari karena zona waktu
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '—';

// Field read-only di modal edit (dikunci: admin/editor tidak boleh mengubahnya)
const Locked = ({ label, value, id }) => (
  <div className="form-group-modern">
    <label htmlFor={id} className="mt-lock-lbl"><Lock size={12} aria-hidden="true" /> {label}</label>
    <input id={id} type="text" className="input-modern mt-locked" value={value || '—'} readOnly disabled tabIndex={-1} />
  </div>
);

const Owner = ({ item }) => (
  <div className="mt-minor">{item.user?.username ? `@${item.user.username}` : 'Input admin'}</div>
);

// Tombol Accept / Reject — perilaku & label TIDAK diubah dari versi sebelumnya.
const Decide = ({ item, busy, onApprove, onReject }) => {
  const st = item.approvalStatus;
  if (busy) return <div className="mt-acts"><Loader2 size={16} className="mt-spin" /></div>;
  if (st === 'approved') return null;
  return (
    <div className="mt-acts">
      <button type="button" className="mt-act mt-act-ok" onClick={() => onApprove(item)}><Check size={14} /> Accept</button>
      {st === 'pending' && (
        <button type="button" className="mt-act mt-act-no" onClick={() => onReject(item)}><X size={14} /> Reject</button>
      )}
    </div>
  );
};

// Titik tiga -> popover berisi aksi Edit & Hapus (ikon + keterangan teks). Popover dirender lewat portal (position: fixed)
// supaya tidak terpotong oleh tabel/kartu dan tetap rapi di semua tema.
const POP_W = 132;
const POP_H = 90;
const RowMore = ({ item, disabled, onEdit, onDelete }) => {
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  const close = () => setPos(null);

  const toggle = () => {
    if (pos) return close();
    const r = btnRef.current.getBoundingClientRect();
    const below = r.bottom + 6 + POP_H <= window.innerHeight;
    const left = Math.min(Math.max(8, r.right - POP_W), window.innerWidth - POP_W - 8);
    setPos({ top: below ? r.bottom + 6 : r.top - POP_H - 6, left });
  };

  useEffect(() => {
    if (!pos) return undefined;
    const onDown = (e) => {
      if (popRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      close();
    };
    const onKey = (e) => { if (e.key === 'Escape') { close(); btnRef.current?.focus(); } };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [pos]);

  return (
    <>
      <button
        type="button" ref={btnRef} className={`mt-more ${pos ? 'is-open' : ''}`} disabled={disabled}
        onClick={toggle} aria-haspopup="true" aria-expanded={!!pos} aria-label={`Aksi untuk ${item.fullName}`}
      >
        <MoreVertical size={18} aria-hidden="true" />
      </button>
      {pos && createPortal(
        <div ref={popRef} className="mt-pop" style={{ top: pos.top, left: pos.left, width: POP_W }} role="group" aria-label="Aksi data">
          <button type="button" className="mt-pop-act" aria-label={`Edit ${item.fullName}`}
            onClick={() => { close(); onEdit(item); }}>
            <Pencil size={16} aria-hidden="true" /> <div className="mt-pop-lbl">Edit</div>
          </button>
          <button type="button" className="mt-pop-act is-del" aria-label={`Hapus ${item.fullName}`}
            onClick={() => { close(); onDelete(item); }}>
            <Trash2 size={16} aria-hidden="true" /> <div className="mt-pop-lbl">Hapus</div>
          </button>
        </div>,
        document.body
      )}
    </>
  );
};

const ManageTracerStudy = () => {
  const [items, setItems] = useState([]);
  const [current, setCurrent] = useState(10);
  const [jurusanList, setJurusanList] = useState(FALLBACK_JURUSAN);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [tab, setTab] = useState('all'); // all | pending | approved | rejected  (awal: semua data)
  const [query, setQuery] = useState('');
  const [angkatan, setAngkatan] = useState('all');
  const [kind, setKind] = useState('all');
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState('');
  const noticeTimer = useRef(null);

  // tambah data manual
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // edit (admin/editor hanya boleh: nama, jurusan, angkatan)
  const [editing, setEditing] = useState(null); // item yang sedang diedit
  const [editForm, setEditForm] = useState({ fullName: '', jurusan: '', angkatan: '' });
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

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
  const counts = { all: items.length, pending: countOf('pending'), approved: countOf('approved'), rejected: countOf('rejected') };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (tab !== 'all' && i.approvalStatus !== tab) return false;
      if (angkatan !== 'all' && i.angkatan !== Number(angkatan)) return false;
      if (kind !== 'all' && i.workStatus !== kind) return false;
      if (!q) return true;
      return [i.fullName, i.nisn, i.nik, i.domicile, i.phone, i.jurusan, i.workStatus, i.detailTempat, i.user?.username, i.user?.email]
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

  /* ---------- edit nama / jurusan / angkatan ---------- */
  const openEdit = (item) => {
    setEditing(item);
    setEditForm({
      fullName: item.fullName || '',
      jurusan: item.jurusan || '',
      angkatan: item.angkatan ? String(item.angkatan) : '',
    });
    setEditError('');
  };
  const closeEdit = () => { if (!editSaving) setEditing(null); };
  const setEditField = (k, v) => setEditForm((f) => ({ ...f, [k]: v }));

  const handleEdit = async (e) => {
    e.preventDefault();
    const payload = {
      fullName: editForm.fullName.trim(),
      jurusan: editForm.jurusan,
      angkatan: Number(editForm.angkatan),
    };
    if (payload.fullName.length < 3) return setEditError('Nama lengkap minimal 3 karakter.');
    if (!payload.jurusan) return setEditError('Pilih jurusan.');
    if (!payload.angkatan) return setEditError('Pilih angkatan.');

    setEditError('');
    setEditSaving(true);
    try {
      const res = await axios.put(`${API}/${editing.id}`, payload, authHeaders());
      const saved = res.data?.data || {};
      setItems((prev) => prev.map((i) => (i.id === editing.id ? { ...i, ...payload, ...saved } : i)));
      flash(`Data ${payload.fullName} diperbarui.`);
      setEditing(null);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Gagal menyimpan perubahan.');
    } finally {
      setEditSaving(false);
    }
  };

  /* ---------- tambah data manual ---------- */
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
  // Jurusan lama (mis. berkode singkatan) tetap tampil agar tidak hilang saat diedit
  const editJurusanOptions = editForm.jurusan && !jurusanList.includes(editForm.jurusan)
    ? [editForm.jurusan, ...jurusanList]
    : jurusanList;

  const hasFilter = query || angkatan !== 'all' || kind !== 'all';
  const emptyText = hasFilter
    ? 'Tidak ada data yang cocok dengan pencarian.'
    : tab === 'pending' ? 'Tidak ada data yang menunggu verifikasi.'
    : tab === 'approved' ? 'Belum ada data yang disetujui.'
    : tab === 'rejected' ? 'Tidak ada data yang ditolak.'
    : 'Belum ada data Tracer Study.';

  const rowProps = (i) => ({
    item: i,
    busy: busyId === i.id,
    onApprove: approve,
    onReject: reject,
  });

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
        {TABS.map((s) => (
          <button
            key={s.key} type="button"
            className={`mt-seg-pick ${tab === s.key ? 'is-on' : ''}`}
            aria-pressed={tab === s.key}
            onClick={() => setTab(s.key)}
          >
            {s.label} <div className="mt-seg-n">{counts[s.key]}</div>
          </button>
        ))}
      </div>

      <div className="mt-bar">
        <div className="mt-find">
          <Search size={16} className="mt-find-ico" />
          <input
            type="text" className="mt-find-input" value={query}
            placeholder="Cari nama, NISN, NIK, jurusan, tempat, atau akun…"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className="mt-pick" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Filter kegiatan">
          <button type="button"><selectedcontent /></button>
          <option value="all">Semua kegiatan</option>
          {KINDS.map((k) => <option key={k.key} value={k.key}>{k.key}</option>)}
        </select>
        <select className="mt-pick mt-pick--gen" value={angkatan} onChange={(e) => setAngkatan(e.target.value)} aria-label="Filter angkatan">
          <button type="button"><selectedcontent /></button>
          <option value="all">Semua angkatan</option>
          {angkatanOptions.map((a) => <option key={a} value={a}>Angkatan {a}</option>)}
        </select>
      </div>

      {loadError && <div className="mt-err" role="alert">{loadError}</div>}

      <div className="mt-data">
        {/* ===== Layar lebar: tabel (muat penuh, tanpa geser) ===== */}
        <div className="mt-sheet">
          <table className="mt-grid">
            <colgroup>
              {COLUMNS.map((c) => <col key={c.key} style={c.px ? { width: `${c.px}px` } : undefined} />)}
            </colgroup>
            <thead>
              <tr>
                {COLUMNS.map((c) => (
                  <th key={c.key} className={`${c.fit ? 'mt-fit' : ''} ${c.key === 'aksi' ? 'mt-th-act' : ''}`}>
                    {c.key === 'aksi' ? <div className="mt-sr">Aksi</div> : c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={COLUMNS.length} className="mt-empty">Memuat data…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={COLUMNS.length} className="mt-empty">{emptyText}</td></tr>
              ) : (
                filtered.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <div className="mt-name">{i.fullName}</div>
                      <Owner item={i} />
                    </td>
                    <td>{i.jurusan ? <div className="mt-nw" title={i.jurusan}>{shortJurusan(i.jurusan)}</div> : <div className="mt-minor">Belum diisi</div>}</td>
                    <td><div className="mt-gen">{i.angkatan}</div></td>
                    <td><Kind item={i} /></td>
                    <td><Detail item={i} /></td>
                    <td><div className="mt-mono">{i.nisn || '—'}</div></td>
                    <td>{i.nik ? <div className="mt-mono">{i.nik}</div> : <div className="mt-dash">—</div>}</td>
                    <td><div>{i.domicile || '—'}</div></td>
                    <td><div className="mt-mono">{i.phone || '—'}</div></td>
                    <td>
                      <Pill status={i.approvalStatus} />
                      <Decide {...rowProps(i)} />
                    </td>
                    <td className="mt-td-act">
                      <RowMore item={i} disabled={busyId === i.id} onEdit={openEdit} onDelete={remove} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ===== Tablet & HP: daftar kartu ===== */}
        <div className="mt-mlist">
          {loading && <div className="mt-mempty">Memuat data…</div>}
          {!loading && filtered.length === 0 && <div className="mt-mempty">{emptyText}</div>}
          {filtered.map((i) => (
            <div key={i.id} className="mt-tile">
              <div className="mt-tile-top">
                <div className="mt-tile-who">
                  <div className="mt-name">{i.fullName}</div>
                  <Owner item={i} />
                </div>
                <RowMore item={i} disabled={busyId === i.id} onEdit={openEdit} onDelete={remove} />
              </div>
              <div className="mt-kv"><div>Jurusan</div><div>{i.jurusan || '-'}</div></div>
              <div className="mt-kv"><div>Angkatan</div><div>{i.angkatan}</div></div>
              <div className="mt-kv"><div>Kegiatan</div><div><Kind item={i} /></div></div>
              <div className="mt-kv"><div>Tempat kerja / kampus</div><div>{i.detailTempat || '-'}</div></div>
              <div className="mt-kv"><div>NISN</div><div className="mt-mono">{i.nisn || '-'}</div></div>
              <div className="mt-kv"><div>NIK</div><div className="mt-mono">{i.nik || '-'}</div></div>
              <div className="mt-kv"><div>Domisili</div><div>{i.domicile || '-'}</div></div>
              <div className="mt-kv"><div>No. HP</div><div className="mt-mono">{i.phone || '-'}</div></div>
              <div className="mt-kv mt-kv-end">
                <div>Approval</div>
                <div><Pill status={i.approvalStatus} /></div>
              </div>
              <Decide {...rowProps(i)} />
            </div>
          ))}
        </div>
      </div>

      {/* ===== Modal edit (hanya nama, jurusan, angkatan) ===== */}
      {editing && (
        <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeEdit(); }}>
          <div className="modal-content modern-modal" role="dialog" aria-modal="true" aria-label="Edit data alumni">
            <div className="modal-header-modern">
              <h3><Pencil size={18} style={{ verticalAlign: '-3px', marginRight: 8 }} />Edit Data Alumni</h3>
              <button onClick={closeEdit} className="btn-close-modal" type="button" aria-label="Tutup"><X size={20} /></button>
            </div>
            <form onSubmit={handleEdit} className="form-modern-layout">
              <div className="form-group-modern">
                <label htmlFor="mt-edit-nama">Nama Lengkap</label>
                <input id="mt-edit-nama" type="text" className="input-modern" value={editForm.fullName} maxLength={200} required
                  onChange={(e) => setEditField('fullName', e.target.value)} />
              </div>
              <div className="form-group-modern">
                <label htmlFor="mt-edit-jurusan">Jurusan (Program Keahlian)</label>
                <select id="mt-edit-jurusan" className="input-modern" value={editForm.jurusan} required
                  onChange={(e) => setEditField('jurusan', e.target.value)}>
                  <button type="button"><selectedcontent /></button>
                  <option value="">Pilih jurusan</option>
                  {editJurusanOptions.map((j) => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div className="form-group-modern">
                <label htmlFor="mt-edit-angkatan">Angkatan</label>
                <select id="mt-edit-angkatan" className="input-modern" value={editForm.angkatan} required
                  onChange={(e) => setEditField('angkatan', e.target.value)}>
                  <button type="button"><selectedcontent /></button>
                  <option value="">Pilih angkatan</option>
                  {angkatanOptions.map((a) => <option key={a} value={a}>{a === current ? `Angkatan ${a} (tahun ini)` : `Angkatan ${a}`}</option>)}
                </select>
              </div>

              <div className="mt-lock-head"><Lock size={14} aria-hidden="true" /> Data terkunci (tidak dapat diubah)</div>
              <div className="mt-lock-grid">
                <Locked id="mt-lk-kegiatan" label="Kegiatan Saat Ini" value={editing.workStatus} />
                {KIND_MAP[editing.workStatus]?.detail && (
                  <Locked id="mt-lk-detail" label={KIND_MAP[editing.workStatus].detail} value={editing.detailTempat} />
                )}
                <Locked id="mt-lk-nisn" label="NISN" value={editing.nisn} />
                <Locked id="mt-lk-nik" label="NIK" value={editing.nik} />
                <Locked id="mt-lk-lahir" label="Tanggal Lahir" value={fmtDate(editing.birthDate)} />
                <Locked id="mt-lk-domisili" label="Domisili (Kecamatan)" value={editing.domicile} />
                <Locked id="mt-lk-hp" label="Nomor HP" value={editing.phone} />
                <Locked id="mt-lk-approval" label="Status Approval" value={(APPROVAL[editing.approvalStatus] || APPROVAL.pending).label} />
              </div>

              {editError && <div className="mt-err" role="alert">{editError}</div>}

              <div className="modal-actions-modern">
                <button type="button" onClick={closeEdit} className="btn-modern-secondary" disabled={editSaving}>Batal</button>
                <button type="submit" className="btn-modern-primary" disabled={editSaving}>{editSaving ? 'Menyimpan…' : 'Simpan Perubahan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  <button type="button"><selectedcontent /></button>
                  <option value="">Pilih angkatan</option>
                  {angkatanOptions.map((a) => <option key={a} value={a}>{a === current ? `Angkatan ${a} (tahun ini)` : `Angkatan ${a}`}</option>)}
                </select>
              </div>
              <div className="form-group-modern">
                <label>Jurusan (Program Keahlian)</label>
                <select className="input-modern" value={form.jurusan} required onChange={(e) => setField('jurusan', e.target.value)}>
                  <button type="button"><selectedcontent /></button>
                  <option value="">Pilih jurusan</option>
                  {jurusanList.map((j) => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div className="form-group-modern">
                <label>Kegiatan Saat Ini</label>
                <select className="input-modern" value={form.workStatus} required onChange={(e) => pickKind(e.target.value)}>
                  <button type="button"><selectedcontent /></button>
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