import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Plus, 
  Search, 
  X, 
  Loader2 
} from 'lucide-react';
import '../css/AchievementSection.css';
import '../App.css';

const AchievementSection = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [imageTab, setImageTab] = useState('url');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);

  const menuRef = useRef(null);

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

  const API_URL = 'http://localhost:5002/api/achievements';

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

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setSelectedId(null);
    setImageTab('url');
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
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setIsEditing(true);
    setSelectedId(item.id);
    setImageTab(item.photo?.startsWith('data:') || !item.photo?.startsWith('http') ? 'upload' : 'url');
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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      ...formData,
      year: parseInt(formData.year, 10) || new Date().getFullYear(),
      sort_order: parseInt(formData.sort_order, 10) || 1,
      show: parseInt(formData.show, 10)
    };

    try {
      if (isEditing) {
        await axios.put(`${API_URL}/${selectedId}`, payload);
      } else {
        await axios.post(API_URL, payload);
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

  const filteredAchievements = achievements.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.student_name?.toLowerCase().includes(query) ||
      item.achievement?.toLowerCase().includes(query) ||
      item.class_name?.toLowerCase().includes(query) ||
      item.level?.toLowerCase().includes(query) ||
      String(item.year || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-title">Kelola Karya & Prestasi</h1>
          <p className="admin-subtitle">
            Kelola seluruh prestasi siswa SMK Negeri Compreng di sini.
          </p>
        </div>
        <button className="btn-primary" onClick={handleOpenAddModal}>
          <Plus size={18} /> Tambah Prestasi
        </button>
      </div>

      {/* Toolbar Search */}
      <div className="table-toolbar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Cari prestasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
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
                        src={item.photo}
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
                    <span className="badge badge-category">{item.level || 'Nasional'}</span>
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
                            <Trash2 size={14} /> Delete
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
                <label>Nama Siswa *</label>
                <input
                  type="text"
                  name="student_name"
                  className="input-modern"
                  required
                  placeholder="Contoh: Alya Putri"
                  value={formData.student_name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group-modern">
                <label>Kelas *</label>
                <input
                  type="text"
                  name="class_name"
                  className="input-modern"
                  required
                  placeholder="Contoh: XII RPL 1"
                  value={formData.class_name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group-modern">
                <label>Judul Prestasi / Kejuaraan *</label>
                <input
                  type="text"
                  name="achievement"
                  className="input-modern"
                  required
                  placeholder="Contoh: Juara 1 LKS Web Technologies"
                  value={formData.achievement}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row-modern" style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group-modern" style={{ flex: 1 }}>
                  <label>Tingkat</label>
                  <select
                    name="level"
                    className="input-modern"
                    value={formData.level}
                    onChange={handleChange}
                  >
                    <option value="Kota">Kota</option>
                    <option value="Provinsi">Provinsi</option>
                    <option value="Nasional">Nasional</option>
                    <option value="Internasional">Internasional</option>
                  </select>
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
                <label>Foto Profil / Siswa</label>
                <div className="radio-tabs">
                  <div
                    className={`radio-tab ${imageTab === 'url' ? 'active' : ''}`}
                    onClick={() => setImageTab('url')}
                  >
                    <LinkIcon size={16} /> Link URL
                  </div>
                  <div
                    className={`radio-tab ${imageTab === 'upload' ? 'active' : ''}`}
                    onClick={() => setImageTab('upload')}
                  >
                    <ImageIcon size={16} /> Upload Foto
                  </div>
                </div>

                {imageTab === 'url' ? (
                  <input
                    type="text"
                    name="photo"
                    className="input-modern"
                    placeholder="https://..."
                    value={formData.photo}
                    onChange={handleChange}
                  />
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    className="input-modern file-style"
                    onChange={handleFileUpload}
                  />
                )}
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