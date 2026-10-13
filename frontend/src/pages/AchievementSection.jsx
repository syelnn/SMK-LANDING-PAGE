import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { getImageUrl } from '../utils/media';
import axios from 'axios';
import { 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Plus, 
  Search, 
  X, 
  Loader2,
  ChevronDown,
  Check,
  Tag,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import ImageUploader from '../components/ImageUploader';
import '../css/AchievementSection.css';
import '../App.css';

// Nilai "Prestasi" di database ditampilkan sebagai "Pendidikan" (agar data lama tidak rusak).
// Semua pilihan digabung dalam satu daftar tanpa grup "Khusus Alumni".
const LEVEL_LABELS = {
  Prestasi: 'Pendidikan',
};
const BASE_LEVELS = ['Kecamatan', 'Kabupaten', 'Provinsi', 'Nasional', 'Internasional', 'Prestasi'];
const getLevelLabel = (level) => LEVEL_LABELS[level] || level || 'Nasional';

// Daftar kategori (Tingkat) disimpan di browser agar tetap ada setelah refresh. Semua kategori
// (bawaan maupun buatan admin) bisa diubah & dihapus. Kategori yang sudah dipakai data prestasi
// otomatis ikut muncul dari database, jadi tidak pernah "hilang" dari pilihan.
const LEVELS_KEY = 'achievement_levels_v2';
const LEGACY_CUSTOM_KEY = 'achievement_custom_levels'; // versi sebelumnya (hanya kategori buatan)
const MAX_LEVEL_LENGTH = 30;
const LEVEL_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} &\-/.()]*$/u;

const cleanLevelName = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();
const levelKey = (v) => cleanLevelName(v).toLowerCase();

const dedupeLevels = (list) => {
  const seen = new Set();
  const out = [];
  list.forEach((v) => {
    const clean = cleanLevelName(v);
    const k = levelKey(clean);
    if (!k || seen.has(k)) return;
    seen.add(k);
    out.push(clean);
  });
  return out;
};

const loadLevelList = () => {
  try {
    const raw = localStorage.getItem(LEVELS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return dedupeLevels(arr);
    }
    let legacy = [];
    try {
      const old = JSON.parse(localStorage.getItem(LEGACY_CUSTOM_KEY) || '[]');
      if (Array.isArray(old)) legacy = old;
    } catch {
      /* abaikan data lama yang rusak */
    }
    return dedupeLevels([...BASE_LEVELS, ...legacy]);
  } catch {
    return [...BASE_LEVELS];
  }
};
const saveLevelList = (list) => {
  try {
    localStorage.setItem(LEVELS_KEY, JSON.stringify(list));
  } catch {
    /* penyimpanan browser penuh / diblokir: kategori tetap berjalan untuk sesi ini */
  }
};

// Pilihan awal yang masuk akal setelah kategori dihapus / form baru dibuka
const pickDefaultLevel = (list) => list.find((o) => levelKey(o) === 'nasional') || list[0] || '';

const AchievementSection = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [imageTab, setImageTab] = useState('url');
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);

  const menuRef = useRef(null);
  const [levelOpen, setLevelOpen] = useState(false);
  const levelRef = useRef(null);
  const levelListRef = useRef(null);

  // Tambah kategori: dialog 2 langkah (isi nama -> konfirmasi)
  const [levelList, setLevelList] = useState(loadLevelList);
  const [catOpen, setCatOpen] = useState(false);
  const [catStep, setCatStep] = useState('input'); // 'input' | 'confirm'
  const [catMode, setCatMode] = useState('add'); // 'add' | 'edit'
  const [catFrom, setCatFrom] = useState(null); // nilai kategori yang sedang diubah (mode edit)
  const [catSaving, setCatSaving] = useState(false);
  const [catName, setCatName] = useState('');
  const [catError, setCatError] = useState('');
  const [toast, setToast] = useState('');
  const catInputRef = useRef(null);
  const catConfirmRef = useRef(null);

  // Hapus kategori: dialog konfirmasi (atau info jika kategori masih dipakai)
  const [delName, setDelName] = useState(null);
  const delConfirmRef = useRef(null);

  const [formData, setFormData] = useState({
    student_name: '',
    class_name: '',
    achievement: '',
    level: 'Nasional',
    year: new Date().getFullYear().toString(),
    sort_order: 1,
    photo: '',
    show: 1
  });

  const API_URL = 'https://smkn-compreng-api-pi.vercel.app/api/achievements';

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      if (res.data && res.data.data) {
        setAchievements(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tutup dropdown Tingkat saat klik di luar / tekan Escape
  useEffect(() => {
    if (!levelOpen) return;
    const onDown = (e) => {
      if (levelRef.current && !levelRef.current.contains(e.target)) setLevelOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); setLevelOpen(false); } };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    // Pastikan daftar yang terbuka ke bawah selalu terlihat penuh di dalam modal
    levelListRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [levelOpen]);

  // Dialog tambah kategori: Escape menutup, fokus otomatis ke elemen utama tiap langkah
  useEffect(() => {
    if (!catOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (!catSaving) setCatOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [catOpen, catSaving]);

  useEffect(() => {
    if (delName === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setDelName(null);
      }
    };
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => delConfirmRef.current?.focus(), 30);
    return () => {
      document.removeEventListener('keydown', onKey);
      clearTimeout(t);
    };
  }, [delName]);

  useEffect(() => {
    if (!catOpen) return;
    const t = setTimeout(() => {
      (catStep === 'input' ? catInputRef.current : catConfirmRef.current)?.focus();
    }, 30);
    return () => clearTimeout(t);
  }, [catOpen, catStep]);

  // Notifikasi sukses hilang sendiri
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  // Daftar kategori = daftar tersimpan + yang sudah terpakai di data (tanpa duplikat)
  const levelOptions = useMemo(() => {
    const seen = new Set();
    const out = [];
    const push = (v) => {
      const clean = cleanLevelName(v);
      const k = levelKey(clean);
      if (!k || seen.has(k)) return;
      seen.add(k);
      out.push(clean);
    };
    levelList.forEach(push);
    achievements.forEach((a) => push(a.level));
    return out;
  }, [levelList, achievements]);

  const validateCategory = (raw) => {
    const name = cleanLevelName(raw);
    if (!name) return 'Nama kategori tidak boleh kosong.';
    if (name.length > MAX_LEVEL_LENGTH) return `Maksimal ${MAX_LEVEL_LENGTH} karakter.`;
    if (!LEVEL_PATTERN.test(name)) return 'Gunakan huruf, angka, spasi, atau tanda & - / . ( ) saja.';
    const isEdit = catMode === 'edit' && catFrom !== null;
    if (isEdit && (name === cleanLevelName(catFrom) || name === getLevelLabel(catFrom))) {
      return 'Nama belum diubah.';
    }
    const k = levelKey(name);
    // Saat mengubah, kategori itu sendiri tidak dihitung sebagai duplikat
    const others = isEdit ? levelOptions.filter((o) => levelKey(o) !== levelKey(catFrom)) : levelOptions;
    const exists = others.some((o) => levelKey(o) === k || levelKey(getLevelLabel(o)) === k);
    if (exists) return `Kategori "${name}" sudah ada.`;
    return '';
  };

  const openCategoryDialog = () => {
    setLevelOpen(false);
    setCatMode('add');
    setCatFrom(null);
    setCatName('');
    setCatError('');
    setCatStep('input');
    setCatOpen(true);
  };

  const openEditCategoryDialog = (opt) => {
    setLevelOpen(false);
    setCatMode('edit');
    setCatFrom(opt);
    setCatName(getLevelLabel(opt));
    setCatError('');
    setCatStep('input');
    setCatOpen(true);
  };

  const closeCategoryDialog = () => {
    if (!catSaving) setCatOpen(false);
  };

  const countLevelUsage = (opt) => achievements.filter((a) => levelKey(a.level) === levelKey(opt)).length;

  const openDeleteDialog = (opt) => {
    setLevelOpen(false);
    setDelName(opt);
  };

  const handleCategoryDelete = () => {
    const name = delName;
    if (name === null) return;
    // Jangan hapus jika masih dipakai data prestasi (data bisa berubah sejak dialog dibuka)
    if (countLevelUsage(name) > 0) return;
    const next = levelList.filter((c) => levelKey(c) !== levelKey(name));
    setLevelList(next);
    saveLevelList(next);
    // Jika kategori yang dihapus sedang terpilih di form, pindahkan ke pilihan lain yang tersedia
    const fallback = pickDefaultLevel(levelOptions.filter((o) => levelKey(o) !== levelKey(name)));
    setFormData((prev) => (levelKey(prev.level) === levelKey(name) ? { ...prev, level: fallback } : prev));
    setDelName(null);
    setToast(`Kategori "${name}" berhasil dihapus.`);
  };

  // Langkah 1 -> 2: validasi dulu, lalu minta konfirmasi
  const handleCategoryNext = (e) => {
    e.preventDefault();
    const err = validateCategory(catName);
    if (err) {
      setCatError(err);
      return;
    }
    setCatName(cleanLevelName(catName));
    setCatError('');
    setCatStep('confirm');
  };

  // Form data lengkap untuk satu prestasi (dipakai saat nama kategori diubah)
  const buildItemFormData = (item, level) => {
    const fd = new FormData();
    fd.append('student_name', item.student_name || '');
    fd.append('class_name', item.class_name || '');
    fd.append('achievement', item.achievement || '');
    fd.append('level', level);
    fd.append('year', parseInt(item.year, 10) || new Date().getFullYear());
    fd.append('sort_order', parseInt(item.sort_order, 10) || 1);
    fd.append('show', Number(item.show) === 1 ? 1 : 0);
    fd.append('photo', item.photo || '');
    return fd;
  };

  // Mengubah nama kategori = memperbarui tingkat di semua prestasi yang memakainya.
  // Dikirim bertahap (5 sekaligus) agar server tidak kewalahan.
  const renameLevelInData = async (from, to) => {
    const targets = achievements.filter((a) => levelKey(a.level) === levelKey(from));
    let failed = 0;
    for (let i = 0; i < targets.length; i += 5) {
      const chunk = targets.slice(i, i + 5);
      const results = await Promise.allSettled(
        chunk.map((item) => axios.put(`${API_URL}/${item.id}`, buildItemFormData(item, to)))
      );
      failed += results.filter((r) => r.status === 'rejected').length;
    }
    return { total: targets.length, failed };
  };

  // Langkah 2: admin sudah menyetujui -> simpan (tambah / ubah)
  const handleCategoryConfirm = async () => {
    if (catSaving) return;
    const name = cleanLevelName(catName);
    const err = validateCategory(name);
    if (err) {
      setCatError(err);
      setCatStep('input');
      return;
    }

    if (catMode === 'edit' && catFrom !== null) {
      const from = catFrom;
      setCatSaving(true);
      const { total, failed } = await renameLevelInData(from, name);
      setCatSaving(false);

      if (total > 0 && failed === total) {
        setCatError('Gagal memperbarui data prestasi. Periksa koneksi, lalu coba lagi.');
        setCatStep('input');
        return;
      }

      const has = levelList.some((l) => levelKey(l) === levelKey(from));
      const next = has
        ? levelList.map((l) => (levelKey(l) === levelKey(from) ? name : l))
        : [...levelList, name];
      setLevelList(next);
      saveLevelList(next);
      setFormData((prev) => (levelKey(prev.level) === levelKey(from) ? { ...prev, level: name } : prev));
      setCatOpen(false);
      if (total > 0) fetchAchievements();

      if (failed > 0) {
        setToast(`Kategori diubah, tetapi ${failed} dari ${total} data prestasi gagal diperbarui.`);
      } else if (total > 0) {
        setToast(`Kategori diubah menjadi "${name}". ${total} data prestasi ikut diperbarui.`);
      } else {
        setToast(`Kategori diubah menjadi "${name}".`);
      }
      return;
    }

    const next = [...levelList, name];
    setLevelList(next);
    saveLevelList(next);
    setFormData((prev) => ({ ...prev, level: name }));
    setCatOpen(false);
    setToast(`Kategori "${name}" berhasil ditambahkan.`);
  };

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setSelectedId(null);
    setImageTab('url');
    setSelectedFile(null);
    setFormData({
      student_name: '',
      class_name: '',
      achievement: '',
      level: pickDefaultLevel(levelOptions),
      year: new Date().getFullYear().toString(),
      sort_order: achievements.length + 1,
      photo: '',
      show: 1
    });
    setLevelOpen(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setIsEditing(true);
    setSelectedId(item.id);
    setImageTab(item.photo?.startsWith('data:') || !item.photo?.startsWith('http') ? 'upload' : 'url');
    setSelectedFile(null);
    setFormData({
      student_name: item.student_name || '',
      class_name: item.class_name || '',
      achievement: item.achievement || '',
      level: item.level || 'Nasional',
      year: item.year || new Date().getFullYear().toString(),
      sort_order: item.sort_order || 1,
      photo: item.photo || '',
      show: item.show !== undefined ? item.show : 1
    });
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleCloseModal = () => {
    if (!submitting) {
      setIsModalOpen(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked ? 1 : 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Callback dari <ImageUploader>: file asli/hasil edit disimpan di state (dikirim ke backend),
  // URL-nya dipakai untuk pratinjau.
  const handlePhotoChange = ({ file, url }) => {
    setSelectedFile(file);
    setImageTab(file ? 'upload' : 'url');
    setFormData((prev) => ({ ...prev, photo: url }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // File asli dikirim via FormData -> backend upload ke Cloudinary,
    // hanya URL hasilnya yang disimpan ke database (bukan base64).
    const fd = new FormData();
    fd.append('student_name', formData.student_name || '');
    fd.append('class_name', formData.class_name || '');
    fd.append('achievement', formData.achievement || '');
    fd.append('level', formData.level || '');
    fd.append('year', parseInt(formData.year, 10) || new Date().getFullYear());
    fd.append('sort_order', parseInt(formData.sort_order, 10) || 1);
    fd.append('show', parseInt(formData.show, 10));
    fd.append('photo', imageTab === 'upload' && selectedFile ? selectedFile : (formData.photo || ''));

    try {
      if (isEditing) {
        await axios.put(`${API_URL}/${selectedId}`, fd);
      } else {
        await axios.post(API_URL, fd);
      }
      fetchAchievements();
      handleCloseModal();
    } catch (err) {
      console.error('Error saving data:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message;
      alert(`Gagal menyimpan data!\nDetail Error: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Sembunyikan / Tampilkan langsung dari menu aksi
  const handleToggleShow = async (item) => {
    setActiveMenuId(null);
    const newShow = Number(item.show) === 1 ? 0 : 1;
    try {
      const fd = new FormData();
      fd.append('student_name', item.student_name || '');
      fd.append('class_name', item.class_name || '');
      fd.append('achievement', item.achievement || '');
      fd.append('level', item.level || '');
      fd.append('year', parseInt(item.year, 10) || new Date().getFullYear());
      fd.append('sort_order', parseInt(item.sort_order, 10) || 1);
      fd.append('show', newShow);
      fd.append('photo', item.photo || '');
      await axios.put(`${API_URL}/${item.id}`, fd);
      fetchAchievements();
    } catch (err) {
      console.error('Error toggling show:', err);
      alert('Gagal merubah status');
    }
  };

  const handleDelete = async (id) => {
    setActiveMenuId(null);
    if (window.confirm('Apakah Anda yakin ingin menghapus data prestasi ini?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        fetchAchievements();
      } catch (err) {
        console.error('Error deleting data:', err);
        alert('Gagal menghapus data!');
      }
    }
  };

  // Normalisasi teks: huruf kecil, hilangkan aksen, rapikan spasi berlebih
  const normalize = (val) =>
    String(val ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  // Pencarian gabungan: semua kata yang diketik harus ada di salah satu kolom
  // (nama, kelas/kejuaraan, judul prestasi, tingkat, tahun, status).
  // Contoh: "alya juara web" akan cocok walau kata-katanya tersebar di kolom berbeda.
  const filteredAchievements = achievements.filter((item) => {
    const tokens = normalize(searchQuery).split(' ').filter(Boolean);
    if (tokens.length === 0) return true;

    const haystack = normalize(
      [
        item.student_name,
        item.class_name,
        item.achievement,
        item.level,
        item.year,
        item.show === 1 ? 'tampil' : 'sembunyi',
      ].join(' ')
    );

    return tokens.every((token) => haystack.includes(token));
  });

  const catIsEdit = catMode === 'edit' && catFrom !== null;
  const catUsage = catIsEdit ? countLevelUsage(catFrom) : 0;

  return (
    <div className="admin-container" id="admin-prestasi">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-title">Kelola Karya & Prestasi</h1>
          <p className="admin-subtitle">
            Kelola seluruh prestasi siswa SMK Negeri Compreng di sini.
          </p>
        </div>
        <button className="btn-primary ach-add-desktop" onClick={handleOpenAddModal}>
          <Plus size={18} /> Tambah Prestasi
        </button>
      </div>

      {/* Toolbar Search */}
      <div className="table-toolbar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Cari nama, kelas, kejuaraan, tingkat, tahun..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        {/* Tombol ringkas khusus mobile: sebaris dengan Search (aksi sama dengan tombol desktop) */}
        <button type="button" className="ach-add-mobile" onClick={handleOpenAddModal} aria-label="Tambah Prestasi">
          <Plus size={16} /> Tambah
        </button>
      </div>

      {/* Tabel */}
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: '90px' }}>Foto</th>
              <th>Nama Siswa & Kelas</th>
              <th>Judul Prestasi / Kejuaraan</th>
              <th>Tingkat</th>
              <th>Tahun</th>
              <th>Status</th>
              <th style={{ textAlign: 'center', width: '80px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>
                  <Loader2 className="animate-spin" style={{ display: 'inline', marginRight: '8px' }} />
                  Memuat data...
                </td>
              </tr>
            ) : filteredAchievements.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>
                  Belum ada data prestasi yang ditemukan.
                </td>
              </tr>
            ) : (
              filteredAchievements.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.photo ? (
                      <img
                        src={getImageUrl(item.photo)}
                        alt={item.student_name}
                        className="table-thumb-rect"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="table-thumb-fallback">
                        {item.student_name ? item.student_name.charAt(0).toUpperCase() : '?'}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="student-name-text">{item.student_name}</div>
                    <div className="student-class-text">{item.class_name || '-'}</div>
                  </td>
                  <td>
                    <span className="achievement-title-text">{item.achievement}</span>
                  </td>
                  <td>
                    <span className="badge badge-category">{getLevelLabel(item.level)}</span>
                  </td>
                  <td>
                    <span className="year-text">{item.year}</span>
                  </td>
                  <td>
                    <span className={`badge ${item.show === 1 ? 'badge-success' : 'badge-warning'}`}>
                      {item.show === 1 ? 'Tampil' : 'Sembunyi'}
                    </span>
                  </td>
                  <td>
                    {/* MENU DROPDOWN AKSI */}
                    <div className="dropdown-action-wrapper" ref={activeMenuId === item.id ? menuRef : null}>
                      <button
                        type="button"
                        className="btn-more-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === item.id ? null : item.id);
                        }}
                        title="Opsi"
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {activeMenuId === item.id && (
                        <div className="action-dropdown-menu">
                          <button
                            type="button"
                            className="dropdown-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleShow(item);
                            }}
                          >
                            {Number(item.show) === 1 ? <EyeOff size={14} /> : <Eye size={14} />}
                            {Number(item.show) === 1 ? 'Sembunyikan' : 'Tampilkan'}
                          </button>
                          <button
                            type="button"
                            className="dropdown-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(item);
                            }}
                          >
                            <Edit3 size={14} /> Edit Data
                          </button>
                          <button
                            type="button"
                            className="dropdown-item delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}
                          >
                            <Trash2 size={14} /> Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Tampilan Card List (mobile) - data & tombol aksi sama dengan tabel */}
      <div className="ach-mlist">
        {loading ? (
          <div className="ach-mempty">
            <Loader2 className="animate-spin" size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
            Memuat data...
          </div>
        ) : filteredAchievements.length === 0 ? (
          <div className="ach-mempty">Belum ada data prestasi yang ditemukan.</div>
        ) : (
          filteredAchievements.map((item) => (
            <div key={item.id} className="ach-mcard">
              <div className="ach-mtop">
                {item.photo ? (
                  <img
                    src={getImageUrl(item.photo)}
                    alt={item.student_name}
                    className="ach-mpic"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="ach-mpic ach-mpic-fallback">
                    {item.student_name ? item.student_name.charAt(0).toUpperCase() : '?'}
                  </div>
                )}
                <div className="ach-mbody">
                  <div className="student-name-text">{item.student_name}</div>
                  <div className="student-class-text">{item.class_name || '-'}</div>
                </div>
                {/* MENU DROPDOWN AKSI (versi card). Ref hanya dipegang jika card list sedang terlihat,
                    supaya klik-di-luar tetap benar baik di desktop (tabel) maupun mobile (card). */}
                <div
                  className="dropdown-action-wrapper ach-mmenu"
                  ref={(el) => {
                    if (activeMenuId === item.id && el && el.offsetParent !== null) menuRef.current = el;
                  }}
                >
                  <button
                    type="button"
                    className="btn-more-action"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === item.id ? null : item.id);
                    }}
                    title="Opsi"
                  >
                    <MoreHorizontal size={18} />
                  </button>

                  {activeMenuId === item.id && (
                    <div className="action-dropdown-menu">
                      <button
                        type="button"
                        className="dropdown-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleShow(item);
                        }}
                      >
                        {Number(item.show) === 1 ? <EyeOff size={14} /> : <Eye size={14} />}
                        {Number(item.show) === 1 ? 'Sembunyikan' : 'Tampilkan'}
                      </button>
                      <button
                        type="button"
                        className="dropdown-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(item);
                        }}
                      >
                        <Edit3 size={14} /> Edit Data
                      </button>
                      <button
                        type="button"
                        className="dropdown-item delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                      >
                        <Trash2 size={14} /> Hapus
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="ach-mtext">{item.achievement}</div>
              <div className="ach-mmeta">
                <span className="badge badge-category">{getLevelLabel(item.level)}</span>
                <span className="ach-myear">{item.year}</span>
                <span className={`badge ${item.show === 1 ? 'badge-success' : 'badge-warning'}`}>
                  {item.show === 1 ? 'Tampil' : 'Sembunyi'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Form Tambah/Edit */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content modern-modal">
            <div className="modal-header-modern">
              <h3>{isEditing ? 'Edit Prestasi' : 'Tambah Prestasi Baru'}</h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="btn-close-modal"
                disabled={submitting}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="form-modern-layout">
              <div className="form-group-modern">
                <label>Nama Siswa / Ekstrakurikuler*</label>
                <input
                  type="text"
                  name="student_name"
                  className="input-modern"
                  required
                  placeholder="Contoh: Alya Putri / Ekstrakurikuler"
                  value={formData.student_name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group-modern">
                <label>Kelas / Kejuaraan *</label>
                <input
                  type="text"
                  name="class_name"
                  className="input-modern"
                  required
                  placeholder="Contoh: XII RPL 1 / Kejuaraan"
                  value={formData.class_name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group-modern">
                <label>Judul Prestasi / Event *</label>
                <input
                  type="text"
                  name="achievement"
                  className="input-modern"
                  required
                  placeholder="Contoh: Juara 1 LKS Web Technologies / Event"
                  value={formData.achievement}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row-modern" style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group-modern" style={{ flex: 1 }}>
                  <label>Tingkat</label>
                  {/* Dropdown kustom: selalu terbuka ke bawah (select bawaan browser bisa membuka ke atas) */}
                  <div className="lvl-select" ref={levelRef}>
                    <button
                      type="button"
                      className="input-modern lvl-select-trigger"
                      aria-haspopup="listbox"
                      aria-expanded={levelOpen}
                      onClick={() => setLevelOpen((o) => !o)}
                    >
                      <span className="lvl-select-value">{formData.level ? getLevelLabel(formData.level) : 'Pilih tingkat'}</span>
                      <ChevronDown size={16} className={`lvl-select-chevron ${levelOpen ? 'open' : ''}`} />
                    </button>

                    {levelOpen && (
                      <div className="lvl-select-list" ref={levelListRef}>
                        <div className="lvl-select-scroll" role="listbox">
                          {levelOptions.map((opt) => (
                            <div className="lvl-select-row" key={opt}>
                              <button
                                type="button"
                                role="option"
                                aria-selected={levelKey(formData.level) === levelKey(opt)}
                                className={`lvl-select-option ${levelKey(formData.level) === levelKey(opt) ? 'selected' : ''}`}
                                onClick={() => {
                                  setFormData((prev) => ({ ...prev, level: opt }));
                                  setLevelOpen(false);
                                }}
                              >
                                <span>{getLevelLabel(opt)}</span>
                                {levelKey(formData.level) === levelKey(opt) && <Check size={14} />}
                              </button>
                              <button
                                type="button"
                                className="lvl-select-edit"
                                title={`Ubah kategori ${getLevelLabel(opt)}`}
                                aria-label={`Ubah kategori ${getLevelLabel(opt)}`}
                                onClick={() => openEditCategoryDialog(opt)}
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                type="button"
                                className="lvl-select-del"
                                title={`Hapus kategori ${getLevelLabel(opt)}`}
                                aria-label={`Hapus kategori ${getLevelLabel(opt)}`}
                                onClick={() => openDeleteDialog(opt)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button type="button" className="lvl-select-add" onClick={openCategoryDialog}>
                          <Plus size={14} /> Tambah kategori baru
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group-modern" style={{ flex: 1 }}>
                  <label>Tahun *</label>
                  <input
                    type="number"
                    name="year"
                    className="input-modern"
                    required
                    placeholder="2026"
                    value={formData.year}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group-modern">
                <label>Urutan Tampilan *</label>
                <input
                  type="number"
                  name="sort_order"
                  min="1"
                  className="input-modern"
                  required
                  placeholder="1"
                  value={formData.sort_order}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group-modern upload-section">
                <label>Foto Siswa / Dokumentasi</label>
                <ImageUploader
                  value={formData.photo}
                  onChange={handlePhotoChange}
                  aspect={4 / 3}
                  previewLabel="PRATINJAU FOTO"
                  urlPlaceholder="https://..."
                  editorTitle="Edit Foto Prestasi"
                />
              </div>

              <div className="form-group-modern">
                <label>Status Tampil</label>
                <select
                  name="show"
                  className="input-modern"
                  value={formData.show}
                  onChange={handleChange}
                >
                  <option value={1}>Ditampilkan (Public)</option>
                  <option value={0}>Disembunyikan</option>
                </select>
              </div>

              <div className="modal-actions-modern" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn-modern-secondary"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-modern-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      &nbsp;Menyimpan...
                    </>
                  ) : isEditing ? (
                    'Simpan Perubahan'
                  ) : (
                    'Simpan Data'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog Tambah Kategori (portal ke <body> agar tidak terpotong modal form) */}
      {catOpen &&
        createPortal(
          <div
            className="cat-dlg-overlay"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeCategoryDialog();
            }}
          >
            <div className="cat-dlg" role="dialog" aria-modal="true" aria-labelledby="cat-dlg-title">
              {catStep === 'input' ? (
                <form onSubmit={handleCategoryNext} noValidate>
                  <div className="cat-dlg-head">
                    <span className="cat-dlg-icon">{catIsEdit ? <Edit3 size={20} /> : <Tag size={20} />}</span>
                    <div className="cat-dlg-headtext">
                      <h4 id="cat-dlg-title">{catIsEdit ? 'Ubah Nama Kategori' : 'Tambah Kategori Baru'}</h4>
                      <p>
                        {catIsEdit
                          ? `Nama saat ini: ${getLevelLabel(catFrom)}`
                          : 'Kategori akan muncul di pilihan Tingkat.'}
                      </p>
                    </div>
                    <button type="button" className="cat-dlg-x" onClick={closeCategoryDialog} aria-label="Tutup">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="cat-dlg-body">
                    <label htmlFor="cat-name-input" className="cat-dlg-label">Nama Kategori</label>
                    <input
                      id="cat-name-input"
                      ref={catInputRef}
                      type="text"
                      className={`input-modern ${catError ? 'cat-dlg-invalid' : ''}`}
                      placeholder="Contoh: Sekolah, Antar Kota"
                      value={catName}
                      maxLength={MAX_LEVEL_LENGTH + 10}
                      autoComplete="off"
                      aria-invalid={!!catError}
                      aria-describedby="cat-name-help"
                      onChange={(e) => {
                        setCatName(e.target.value);
                        if (catError) setCatError('');
                      }}
                    />
                    <div className="cat-dlg-helprow" id="cat-name-help">
                      <span className={catError ? 'cat-dlg-error' : 'cat-dlg-hint'} role={catError ? 'alert' : undefined}>
                        {catError ||
                          (catIsEdit && catUsage > 0
                            ? `${catUsage} data prestasi memakai kategori ini dan akan ikut diperbarui.`
                            : 'Huruf, angka, dan spasi.')}
                      </span>
                      <span className={`cat-dlg-count ${cleanLevelName(catName).length > MAX_LEVEL_LENGTH ? 'over' : ''}`}>
                        {cleanLevelName(catName).length}/{MAX_LEVEL_LENGTH}
                      </span>
                    </div>
                  </div>

                  <div className="cat-dlg-actions">
                    <button type="button" className="btn-modern-secondary" onClick={closeCategoryDialog}>
                      Batal
                    </button>
                    <button type="submit" className="btn-modern-primary">
                      Lanjut
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="cat-dlg-head">
                    <span className="cat-dlg-icon cat-dlg-icon--ask"><Check size={20} /></span>
                    <div className="cat-dlg-headtext">
                      <h4 id="cat-dlg-title">{catIsEdit ? 'Konfirmasi Perubahan' : 'Konfirmasi Kategori'}</h4>
                      <p>
                        {catIsEdit
                          ? 'Apakah perubahan nama ini sudah benar?'
                          : 'Apakah nama kategori ini sudah benar?'}
                      </p>
                    </div>
                    <button type="button" className="cat-dlg-x" onClick={closeCategoryDialog} disabled={catSaving} aria-label="Tutup">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="cat-dlg-body">
                    <div className="cat-dlg-preview">
                      <span className="cat-dlg-preview-label">
                        {catIsEdit ? 'Perubahan nama kategori' : 'Kategori yang akan ditambahkan'}
                      </span>
                      {catIsEdit ? (
                        <div className="cat-dlg-change">
                          <span className="badge badge-category cat-dlg-preview-badge cat-dlg-old">{getLevelLabel(catFrom)}</span>
                          <span className="cat-dlg-arrow" aria-hidden="true">→</span>
                          <span className="badge badge-category cat-dlg-preview-badge">{catName}</span>
                        </div>
                      ) : (
                        <span className="badge badge-category cat-dlg-preview-badge">{catName}</span>
                      )}
                    </div>
                    <p className="cat-dlg-note">
                      {catIsEdit
                        ? catUsage > 0
                          ? `${catUsage} data prestasi yang memakai kategori ini akan ikut diubah ke nama baru. Proses ini langsung tersimpan ke server.`
                          : 'Belum ada data prestasi yang memakai kategori ini, jadi hanya daftar pilihan yang berubah.'
                        : 'Setelah ditambahkan, kategori ini langsung terpilih di form dan bisa dipakai untuk prestasi lain.'}
                    </p>
                  </div>

                  <div className="cat-dlg-actions">
                    <button
                      type="button"
                      className="btn-modern-secondary"
                      onClick={() => setCatStep('input')}
                      disabled={catSaving}
                    >
                      <ArrowLeft size={14} style={{ marginRight: 6, verticalAlign: '-2px' }} />
                      Ubah
                    </button>
                    <button
                      type="button"
                      className="btn-modern-primary"
                      ref={catConfirmRef}
                      onClick={handleCategoryConfirm}
                      disabled={catSaving}
                    >
                      {catSaving ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          &nbsp;Menyimpan...
                        </>
                      ) : catIsEdit ? (
                        'Ya, Simpan Perubahan'
                      ) : (
                        'Ya, Tambahkan'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Dialog Hapus Kategori */}
      {delName !== null &&
        createPortal(
          <div
            className="cat-dlg-overlay"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setDelName(null);
            }}
          >
            {(() => {
              const used = countLevelUsage(delName);
              return (
                <div className="cat-dlg" role="alertdialog" aria-modal="true" aria-labelledby="cat-del-title">
                  <div className="cat-dlg-head">
                    <span className={`cat-dlg-icon ${used > 0 ? 'cat-dlg-icon--warn' : 'cat-dlg-icon--danger'}`}>
                      {used > 0 ? <AlertTriangle size={20} /> : <Trash2 size={20} />}
                    </span>
                    <div className="cat-dlg-headtext">
                      <h4 id="cat-del-title">{used > 0 ? 'Kategori Masih Dipakai' : 'Hapus Kategori?'}</h4>
                      <p>
                        {used > 0
                          ? `Dipakai oleh ${used} data prestasi, jadi belum bisa dihapus.`
                          : 'Apakah Anda yakin ingin menghapus kategori ini?'}
                      </p>
                    </div>
                    <button type="button" className="cat-dlg-x" onClick={() => setDelName(null)} aria-label="Tutup">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="cat-dlg-body">
                    <div className="cat-dlg-preview">
                      <span className="cat-dlg-preview-label">Kategori</span>
                      <span className="badge badge-category cat-dlg-preview-badge">{getLevelLabel(delName)}</span>
                    </div>
                    <p className="cat-dlg-note">
                      {used > 0
                        ? 'Ubah dulu tingkat pada data prestasi yang memakainya (lewat menu Edit Data), lalu coba hapus lagi.'
                        : 'Kategori akan hilang dari pilihan Tingkat. Data prestasi lain tidak terpengaruh.'}
                    </p>
                  </div>

                  <div className="cat-dlg-actions">
                    {used > 0 ? (
                      <button type="button" className="btn-modern-primary" ref={delConfirmRef} onClick={() => setDelName(null)}>
                        Mengerti
                      </button>
                    ) : (
                      <>
                        <button type="button" className="btn-modern-secondary" onClick={() => setDelName(null)}>
                          Batal
                        </button>
                        <button type="button" className="cat-dlg-danger" ref={delConfirmRef} onClick={handleCategoryDelete}>
                          Ya, Hapus
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>,
          document.body
        )}

      {toast &&
        createPortal(
          <div className="cat-toast" role="status" aria-live="polite">
            <Check size={16} /> <span>{toast}</span>
          </div>,
          document.body
        )}
    </div>
  );
};

export default AchievementSection;