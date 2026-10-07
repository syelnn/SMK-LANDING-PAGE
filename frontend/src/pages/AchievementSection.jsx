import React, { useEffect, useState, useRef } from 'react';
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
  Check
} from 'lucide-react';
import ImageUploader from '../components/ImageUploader';
import '../css/AchievementSection.css';
import '../App.css';

// Nilai "Prestasi" di database ditampilkan sebagai "Pendidikan" (agar data lama tidak rusak).
// Semua pilihan digabung dalam satu daftar tanpa grup "Khusus Alumni".
const LEVEL_LABELS = {
  Prestasi: 'Pendidikan',
};
const LEVEL_GROUPS = [
  { label: '', options: ['Kecamatan', 'Kabupaten', 'Provinsi', 'Nasional', 'Internasional', 'Prestasi'] },
];
const getLevelLabel = (level) => LEVEL_LABELS[level] || level || 'Nasional';

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

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setSelectedId(null);
    setImageTab('url');
    setSelectedFile(null);
    setFormData({
      student_name: '',
      class_name: '',
      achievement: '',
      level: 'Nasional',
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
                      <span>{getLevelLabel(formData.level)}</span>
                      <ChevronDown size={16} className={`lvl-select-chevron ${levelOpen ? 'open' : ''}`} />
                    </button>

                    {levelOpen && (
                      <div className="lvl-select-list" role="listbox" ref={levelListRef}>
                        {LEVEL_GROUPS.map((group) => (
                          <div key={group.label || 'semua'}>
                            {group.label && <div className="lvl-select-group">{group.label}</div>}
                            {group.options.map((opt) => (
                              <button
                                type="button"
                                role="option"
                                aria-selected={formData.level === opt}
                                key={opt}
                                className={`lvl-select-option ${formData.level === opt ? 'selected' : ''}`}
                                onClick={() => {
                                  setFormData((prev) => ({ ...prev, level: opt }));
                                  setLevelOpen(false);
                                }}
                              >
                                <span>{getLevelLabel(opt)}</span>
                                {formData.level === opt && <Check size={14} />}
                              </button>
                            ))}
                          </div>
                        ))}
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
    </div>
  );
};

export default AchievementSection;