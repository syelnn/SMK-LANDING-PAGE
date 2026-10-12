import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Check, X, Plus, Search, Trash2, Loader2, Pencil, MoreVertical, Lock, ChevronDown } from 'lucide-react';
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

// Angkatan yang ditambahkan manual oleh admin (angkatan baru di atas angkatan "tahun ini")
const EXTRA_ANGKATAN_KEY = 'tracerExtraAngkatan';
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

// Satu baris "label : nilai" pada kartu HP/tablet (gaya kartu Berita)
const MRow = ({ label, children }) => (
  <div className="mt-m-row">
    <div className="mt-m-label">{label}</div>
    <div className="mt-m-value">{children}</div>
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

// Dropdown kustom untuk form modal (sama seperti dropdown "Tingkat" di Karya Prestasi):
// selalu terbuka ke bawah, rapi di dalam modal, dan ikut tema. options = [{ value, label }]
const ModalSelect = ({ id, value, options, placeholder, onChange, addAction }) => {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const listRef = useRef(null);
  const selected = options.find((o) => String(o.value) === String(value));

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    const list = listRef.current;
    if (list) {
      const sel = list.querySelector('[aria-selected="true"]');
      if (sel) list.scrollTop = Math.max(0, sel.offsetTop - list.clientHeight / 2 + sel.clientHeight / 2);
      list.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); // pastikan daftar terlihat penuh di dalam modal
    }
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const moveFocus = (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const opts = [...listRef.current.querySelectorAll('[role="option"]')];
    const i = opts.indexOf(document.activeElement);
    const next = e.key === 'ArrowDown' ? Math.min(opts.length - 1, i + 1) : Math.max(0, i - 1);
    opts[next]?.focus();
  };

  return (
    <div className={`mt-dd ${open ? 'is-open' : ''}`} ref={boxRef}>
      <button
        type="button" id={id} className={`input-modern mt-dd-trigger ${selected ? '' : 'is-empty'}`}
        aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}
      >
        <span className="mt-dd-text">{selected ? selected.label : placeholder}</span>
        <ChevronDown size={16} className="mt-dd-chev" aria-hidden="true" />
      </button>
      {open && (
        <div className="mt-dd-list" role="listbox" ref={listRef} onKeyDown={moveFocus}>
          {addAction && (
            <button
              type="button" className="mt-dd-opt mt-dd-add"
              onClick={() => { addAction.onClick(); setOpen(false); }}
            >
              <span>{addAction.label}</span>
              <Plus size={14} aria-hidden="true" />
            </button>
          )}
          {options.map((o) => {
            const on = String(o.value) === String(value);
            return (
              <button
                type="button" role="option" aria-selected={on} key={o.value}
                className={`mt-dd-opt ${on ? 'is-on' : ''}`}
                onClick={() => { onChange(String(o.value)); setOpen(false); }}
              >
                <span>{o.label}</span>
                {on && <Check size={14} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ManageTracerStudy = () => {
  const [items, setItems] = useState([]);
  const [current, setCurrent] = useState(10);
  const [extraAngkatan, setExtraAngkatan] = useState(() => {
    try { return Number(localStorage.getItem(EXTRA_ANGKATAN_KEY)) || 0; } catch { return 0; }
  });
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

  // Kolom cari ala "Tenaga Pengajar": di HP tampil ringkas (ikon + "Cari" di tengah), melebar saat diketuk
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 600px)').matches);
  const [findFocus, setFindFocus] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 600px)');
    const on = (e) => setNarrow(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  // tambah data manual
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // edit (admin/editor boleh: nama, jurusan, angkatan, kegiatan, NISN, NIK, tanggal lahir, no HP, status approval; sisanya terkunci)
  const [editing, setEditing] = useState(null); // item yang sedang diedit
  const [editForm, setEditForm] = useState({
    fullName: '', jurusan: '', angkatan: '', workStatus: '', detailTempat: '', nisn: '', nik: '', birthDate: '', phone: '', approvalStatus: 'pending',
  });
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
      workStatus: item.workStatus || '',
      detailTempat: item.detailTempat || '',
      nisn: item.nisn || '',
      nik: item.nik || '',
      birthDate: item.birthDate ? String(item.birthDate).slice(0, 10) : '',
      phone: item.phone || '',
      approvalStatus: item.approvalStatus || 'pending',
    });
    setEditError('');
  };
  const closeEdit = () => { if (!editSaving) setEditing(null); };
  const setEditField = (k, v) => setEditForm((f) => ({ ...f, [k]: v }));
  const setEditDigits = (k, max) => (e) => setEditField(k, e.target.value.replace(/\D/g, '').slice(0, max));
  // Ganti kegiatan: detail tempat dikosongkan bila kegiatan baru tidak memakainya
  const pickEditKind = (key) =>
    setEditForm((f) => ({ ...f, workStatus: key, detailTempat: KIND_MAP[key]?.detail && key === editing?.workStatus ? (editing.detailTempat || '') : '' }));

  const handleEdit = async (e) => {
    e.preventDefault();
    const editKind = KIND_MAP[editForm.workStatus];
    const payload = {
      fullName: editForm.fullName.trim(),
      jurusan: editForm.jurusan,
      angkatan: Number(editForm.angkatan),
      workStatus: editForm.workStatus,
      detailTempat: editKind?.detail ? editForm.detailTempat.trim() : '',
      nisn: editForm.nisn,
      nik: editForm.nik,
      birthDate: editForm.birthDate,
      phone: editForm.phone,
    };
    if (payload.fullName.length < 3) return setEditError('Nama lengkap minimal 3 karakter.');
    if (!payload.jurusan) return setEditError('Pilih jurusan.');
    if (!payload.angkatan) return setEditError('Pilih angkatan.');
    if (!payload.workStatus) return setEditError('Pilih kegiatan saat ini.');
    if (editKind?.detail && !payload.detailTempat) return setEditError(`${editKind.detail} wajib diisi.`);
    if (!/^\d{10}$/.test(payload.nisn)) return setEditError('NISN harus 10 digit.');
    if (payload.nik && !/^\d{16}$/.test(payload.nik)) return setEditError('NIK harus 16 digit (atau kosongkan).');
    if (!payload.birthDate) return setEditError('Isi tanggal lahir.');
    if (!payload.phone) return setEditError('Isi nomor HP.');

    setEditError('');
    setEditSaving(true);
    try {
      const statusChanged = editForm.approvalStatus !== (editing.approvalStatus || 'pending');
      const res = await axios.put(
        `${API}/${editing.id}`,
        statusChanged && editForm.approvalStatus === 'pending' ? { ...payload, approvalStatus: 'pending' } : payload,
        authHeaders()
      );
      let saved = res.data?.data || {};
      // Disetujui / Ditolak memakai endpoint approve & reject yang sudah ada (perilaku sama seperti tombol Accept / Reject)
      if (statusChanged && editForm.approvalStatus !== 'pending') {
        const act = editForm.approvalStatus === 'approved' ? 'approve' : 'reject';
        const r2 = await axios.put(`${API}/${editing.id}/${act}`, {}, authHeaders());
        saved = { ...saved, ...(r2.data?.data || {}) };
      }
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
  const editFormKind = KIND_MAP[editForm.workStatus];

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.angkatan) return setFormError('Pilih angkatan.');
    if (!form.jurusan) return setFormError('Pilih jurusan.');
    if (!form.workStatus) return setFormError('Pilih kegiatan saat ini.');
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

  // Angkatan tertinggi = yang terbesar di antara angkatan berjalan, angkatan tambahan, dan angkatan pada data
  const maxAngkatan = Math.max(current, extraAngkatan, ...items.map((i) => Number(i.angkatan) || 0));
  const angkatanOptions = Array.from({ length: maxAngkatan }, (_, i) => maxAngkatan - i);
  const addAngkatan = (setField) => {
    const next = maxAngkatan + 1;
    if (!window.confirm(`Tambah Angkatan ${next}?\n\nAngkatan ${next} akan muncul di daftar pilihan angkatan.`)) return;
    setExtraAngkatan(next);
    try { localStorage.setItem(EXTRA_ANGKATAN_KEY, String(next)); } catch { /* abaikan */ }
    setField('angkatan', String(next));
    flash(`Angkatan ${next} ditambahkan.`);
  };
  // Jurusan lama (mis. berkode singkatan) tetap tampil agar tidak hilang saat diedit
  const editJurusanOptions = editForm.jurusan && !jurusanList.includes(editForm.jurusan)
    ? [editForm.jurusan, ...jurusanList]
    : jurusanList;
  const angkatanSelectOptions = angkatanOptions.map((a) => ({
    value: String(a), label: `Angkatan ${a}`,
  }));
  const jurusanSelectOptions = jurusanList.map((j) => ({ value: j, label: j }));
  const editJurusanSelectOptions = editJurusanOptions.map((j) => ({ value: j, label: j }));
  const kindSelectOptions = KINDS.map((k) => ({ value: k.key, label: k.key }));
  const approvalSelectOptions = [
    { value: 'pending', label: 'Menunggu verifikasi' },
    { value: 'approved', label: 'Disetujui' },
    { value: 'rejected', label: 'Ditolak' },
  ];

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
          <Plus size={14} /> Tambah
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
        <div className={`mt-find${narrow && !findFocus && !query ? ' is-compact' : ''}`}>
          <Search size={16} className="mt-find-ico" />
          <input
            type="text" className="mt-find-input" value={query}
            aria-label="Cari nama, NISN, NIK, jurusan, tempat, atau akun"
            placeholder={narrow && !findFocus && !query ? 'Cari' : 'Cari nama, NISN, NIK, jurusan, tempat, atau akun…'}
            onFocus={() => setFindFocus(true)} onBlur={() => setFindFocus(false)}
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
            <div key={i.id} className={`mt-tile${i.approvalStatus === 'pending' ? ' is-pending' : i.approvalStatus === 'rejected' ? ' is-no' : ''}`}>
              <div className="mt-m-head">
                <div className="mt-ava" aria-hidden="true">{(i.fullName || '?').trim().charAt(0).toUpperCase()}</div>
                <div className="mt-m-main">
                  <div className="mt-m-name">{i.fullName}</div>
                  <Owner item={i} />
                  <div className="mt-m-tags">
                    <div className="mt-gen-tag">Angkatan {i.angkatan}</div>
                    <Kind item={i} />
                  </div>
                </div>
                <RowMore item={i} disabled={busyId === i.id} onEdit={openEdit} onDelete={remove} />
              </div>
              <div className="mt-m-details">
                <MRow label="Jurusan">{i.jurusan || '—'}</MRow>
                {i.detailTempat && <MRow label="Tempat">{i.detailTempat}</MRow>}
                <MRow label="NISN"><span className="mt-mono">{i.nisn || '—'}</span></MRow>
                <MRow label="NIK"><span className="mt-mono">{i.nik || '—'}</span></MRow>
                <MRow label="Domisili">{i.domicile || '—'}</MRow>
                <MRow label="No. HP"><span className="mt-mono">{i.phone || '—'}</span></MRow>
                <MRow label="Status"><Pill status={i.approvalStatus} /></MRow>
              </div>
              <Decide {...rowProps(i)} />
            </div>
          ))}
        </div>
      </div>

      {/* ===== Modal edit (nama, jurusan, angkatan, kegiatan, NISN, NIK, tgl lahir, HP, status; sisanya terkunci) ===== */}
      {editing && (
        <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeEdit(); }}>
          <div className="modal-content modern-modal" role="dialog" aria-modal="true" aria-label="Edit data alumni">
            <div className="modal-header-modern">
              <h3>Edit Data Alumni</h3>
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
                <ModalSelect id="mt-edit-jurusan" value={editForm.jurusan} placeholder="Pilih jurusan"
                  options={editJurusanSelectOptions} onChange={(v) => setEditField('jurusan', v)} />
              </div>
              <div className="mt-row">
                <div className="form-group-modern">
                  <label htmlFor="mt-edit-angkatan">Angkatan</label>
                  <ModalSelect id="mt-edit-angkatan" value={editForm.angkatan} placeholder="Pilih angkatan"
                    options={angkatanSelectOptions} onChange={(v) => setEditField('angkatan', v)}
                    addAction={{ label: `Tambah Angkatan ${maxAngkatan + 1}`, onClick: () => addAngkatan(setEditField) }} />
                </div>
                <div className="form-group-modern">
                  <label htmlFor="mt-edit-kegiatan">Kegiatan Saat Ini</label>
                  <ModalSelect id="mt-edit-kegiatan" value={editForm.workStatus} placeholder="Pilih status"
                    options={kindSelectOptions} onChange={pickEditKind} />
                </div>
              </div>
              {editFormKind?.detail && editForm.workStatus !== editing.workStatus && (
                <div className="form-group-modern">
                  <label htmlFor="mt-edit-detail">{editFormKind.detail}</label>
                  <input id="mt-edit-detail" type="text" className="input-modern" value={editForm.detailTempat} maxLength={200} required
                    onChange={(e) => setEditField('detailTempat', e.target.value)} />
                </div>
              )}
              <div className="mt-row">
                <div className="form-group-modern">
                  <label htmlFor="mt-edit-nisn">NISN (10 digit)</label>
                  <input id="mt-edit-nisn" type="text" inputMode="numeric" className="input-modern" value={editForm.nisn} required
                    onChange={setEditDigits('nisn', 10)} />
                </div>
                <div className="form-group-modern">
                  <label htmlFor="mt-edit-nik">NIK (opsional, 16 digit)</label>
                  <input id="mt-edit-nik" type="text" inputMode="numeric" className="input-modern" value={editForm.nik}
                    onChange={setEditDigits('nik', 16)} />
                </div>
              </div>
              <div className="mt-row">
                <div className="form-group-modern">
                  <label htmlFor="mt-edit-lahir">Tanggal Lahir</label>
                  <input id="mt-edit-lahir" type="date" className="input-modern" value={editForm.birthDate} required min="1980-01-01"
                    max={new Date().toISOString().slice(0, 10)} onChange={(e) => setEditField('birthDate', e.target.value)} />
                </div>
                <div className="form-group-modern">
                  <label htmlFor="mt-edit-hp">Nomor HP Aktif</label>
                  <input id="mt-edit-hp" type="tel" className="input-modern" value={editForm.phone} maxLength={16} required
                    onChange={(e) => setEditField('phone', e.target.value.replace(/[^\d+]/g, ''))} />
                </div>
              </div>

              <div className="form-group-modern">
                <label htmlFor="mt-edit-status">Status Approval</label>
                <ModalSelect id="mt-edit-status" value={editForm.approvalStatus} placeholder="Pilih status"
                  options={approvalSelectOptions} onChange={(v) => setEditField('approvalStatus', v)} />
              </div>

              <div className="mt-lock-head"><Lock size={14} aria-hidden="true" /> Data terkunci (tidak dapat diubah)</div>
              <div className="mt-lock-grid">
                {editFormKind?.detail && editForm.workStatus === editing.workStatus && (
                  <Locked id="mt-lk-detail" label={editFormKind.detail} value={editing.detailTempat} />
                )}
                <Locked id="mt-lk-domisili" label="Domisili (Kecamatan)" value={editing.domicile} />
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
              <h3>Tambah Data Alumni</h3>
              <button onClick={() => setIsModalOpen(false)} className="btn-close-modal" type="button" aria-label="Tutup"><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} className="form-modern-layout">
              <div className="form-group-modern">
                <label htmlFor="mt-add-nama">Nama Lengkap</label>
                <input id="mt-add-nama" type="text" className="input-modern" value={form.fullName} maxLength={200} required
                  onChange={(e) => setField('fullName', e.target.value)} />
              </div>
              <div className="mt-row">
                <div className="form-group-modern">
                  <label htmlFor="mt-add-angkatan">Angkatan</label>
                  <ModalSelect id="mt-add-angkatan" value={form.angkatan} placeholder="Pilih angkatan"
                    options={angkatanSelectOptions} onChange={(v) => setField('angkatan', v)}
                    addAction={{ label: `Tambah Angkatan ${maxAngkatan + 1}`, onClick: () => addAngkatan(setField) }} />
                </div>
                <div className="form-group-modern">
                  <label htmlFor="mt-add-kegiatan">Kegiatan Saat Ini</label>
                  <ModalSelect id="mt-add-kegiatan" value={form.workStatus} placeholder="Pilih status"
                    options={kindSelectOptions} onChange={pickKind} />
                </div>
              </div>
              <div className="form-group-modern">
                <label htmlFor="mt-add-jurusan">Jurusan (Program Keahlian)</label>
                <ModalSelect id="mt-add-jurusan" value={form.jurusan} placeholder="Pilih jurusan"
                  options={jurusanSelectOptions} onChange={(v) => setField('jurusan', v)} />
              </div>
              {formKind?.detail && (
                <div className="form-group-modern">
                  <label htmlFor="mt-add-detail">{formKind.detail}</label>
                  <input id="mt-add-detail" type="text" className="input-modern" value={form.detailTempat} maxLength={200} required
                    onChange={(e) => setField('detailTempat', e.target.value)} />
                </div>
              )}
              <div className="mt-row">
                <div className="form-group-modern">
                  <label htmlFor="mt-add-nisn">NISN (10 digit)</label>
                  <input id="mt-add-nisn" type="text" inputMode="numeric" className="input-modern" value={form.nisn} required
                    onChange={setDigits('nisn', 10)} />
                </div>
                <div className="form-group-modern">
                  <label htmlFor="mt-add-nik">NIK (opsional, 16 digit)</label>
                  <input id="mt-add-nik" type="text" inputMode="numeric" className="input-modern" value={form.nik}
                    onChange={setDigits('nik', 16)} />
                </div>
              </div>
              <div className="mt-row">
                <div className="form-group-modern">
                  <label htmlFor="mt-add-lahir">Tanggal Lahir</label>
                  <input id="mt-add-lahir" type="date" className="input-modern" value={form.birthDate} required min="1980-01-01"
                    max={new Date().toISOString().slice(0, 10)} onChange={(e) => setField('birthDate', e.target.value)} />
                </div>
                <div className="form-group-modern">
                  <label htmlFor="mt-add-hp">Nomor HP Aktif</label>
                  <input id="mt-add-hp" type="tel" className="input-modern" value={form.phone} maxLength={16} required
                    placeholder="081234567890" onChange={(e) => setField('phone', e.target.value.replace(/[^\d+]/g, ''))} />
                </div>
              </div>
              <div className="form-group-modern">
                <label htmlFor="mt-add-domisili">Domisili (Kecamatan)</label>
                <input id="mt-add-domisili" type="text" className="input-modern" value={form.domicile} maxLength={200} required
                  placeholder="Contoh: Sukaseneng" onChange={(e) => setField('domicile', e.target.value)} />
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