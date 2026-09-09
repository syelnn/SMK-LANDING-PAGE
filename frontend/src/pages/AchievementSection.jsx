import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { MoreHorizontal, SquarePen, Trash2, Link as LinkIcon, Upload, Plus, Search } from 'lucide-react';

const AchievementSection = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
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
    setImageTab('url');
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
    setIsModalOpen(false);
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
    item.level?.toLowerCase().includes(query) ||          // <-- Ditambahkan untuk filter Tingkat
    String(item.year || '').toLowerCase().includes(query) // <-- Ditambahkan untuk filter Tahun
  );
});

  if (loading) {
    return <div className="achievement-loading">Memuat data Prestasi Siswa...</div>;
  }

  return (
    <div className="achievement-admin-wrapper">
      {/* Kontainer Card Utama ala Foto 1 */}
      <div className="admin-card-container">
        
        {/* Top Header di dalam Card */}
        <div className="admin-page-header">
          <div className="header-text-group">
            <h1 className="admin-page-title">Kelola Karya & Prestasi</h1>
            <p className="admin-page-subtitle">Kelola seluruh prestasi siswa SMK Negeri Compreng di sini.</p>
          </div>
          <button className="btn-add-primary" onClick={handleOpenAddModal}>
            <Plus size={16} /> Tambah Prestasi
          </button>
        </div>

        {/* Filter / Search Bar */}
        <div className="admin-table-controls">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Cari prestasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table Section */}
        <div className="table-responsive-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '70px' }}>Foto</th>
                <th>Nama Siswa & Kelas</th>
                <th>Judul Prestasi / Kejuaraan</th>
                <th>Tingkat</th>
                <th>Tahun</th>
                <th>Status</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredAchievements.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-empty-state">
                    Belum ada data prestasi yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredAchievements.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.photo ? (
                        <img src={item.photo} alt={item.student_name} className="table-avatar-img" />
                      ) : (
                        <div className="table-avatar-circle">
                          {item.student_name ? item.student_name.charAt(0).toUpperCase() : '?'}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="table-student-name">{item.student_name}</div>
                      <div className="table-student-class">{item.class_name || '-'}</div>
                    </td>
                    <td>
                      <span className="table-achievement-text">{item.achievement}</span>
                    </td>
                    <td>
                      <span className={`table-badge-level ${item.level?.toLowerCase() || 'nasional'}`}>
                        {item.level || 'Nasional'}
                      </span>
                    </td>
                    <td>{item.year}</td>
                    <td>
                      <span className={`status-badge ${item.show === 1 ? 'status-tampil' : 'status-sembunyi'}`}>
                        {item.show === 1 ? 'Tampil' : 'Sembunyi'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', position: 'relative' }}>
                      <button
                        className="btn-action-more"
                        onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {activeMenuId === item.id && (
                        <div className="action-dropdown-menu" ref={menuRef}>
                          <button onClick={() => handleOpenEditModal(item)} className="dropdown-item edit">
                            <SquarePen size={14} /> Edit Data
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="dropdown-item delete">
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="crud-modal-overlay">
          <div className="crud-modal-content">
            <div className="crud-modal-header">
              <h2>{isEditing ? 'Edit Prestasi' : 'Tambah Prestasi Baru'}</h2>
              <button className="btn-close-modal" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="crud-form">
              <div className="form-group">
                <label>NAMA SISWA</label>
                <input
                  type="text"
                  name="student_name"
                  value={formData.student_name}
                  onChange={handleChange}
                  placeholder="Contoh: Alya Putri"
                  required
                />
              </div>

              <div className="form-group">
                <label>KELAS</label>
                <input
                  type="text"
                  name="class_name"
                  value={formData.class_name}
                  onChange={handleChange}
                  placeholder="Contoh: Kelas XII IPA"
                  required
                />
              </div>

              <div className="form-group">
                <label>JUDUL PRESTASI / KEJUARAAN</label>
                <input
                  type="text"
                  name="achievement"
                  value={formData.achievement}
                  onChange={handleChange}
                  placeholder="Contoh: Juara 1 Olimpiade Sains"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>TINGKAT</label>
                  <select name="level" value={formData.level} onChange={handleChange}>
                    <option value="Kota">Kota</option>
                    <option value="Provinsi">Provinsi</option>
                    <option value="Nasional">Nasional</option>
                    <option value="Internasional">Internasional</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>TAHUN</label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    placeholder="2026"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>URUTAN TAMPILAN</label>
                <input
                  type="number"
                  name="sort_order"
                  min="1"
                  value={formData.sort_order}
                  onChange={handleChange}
                  placeholder="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>FOTO PROFIL</label>
                <div className="image-tab-group">
                  <button
                    type="button"
                    onClick={() => setImageTab('url')}
                    className={`tab-btn ${imageTab === 'url' ? 'active' : ''}`}
                  >
                    <LinkIcon size={14} /> Link URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab('upload')}
                    className={`tab-btn ${imageTab === 'upload' ? 'active' : ''}`}
                  >
                    <Upload size={14} /> Upload Foto
                  </button>
                </div>

                {imageTab === 'url' ? (
                  <input
                    type="text"
                    name="photo"
                    value={formData.photo}
                    onChange={handleChange}
                    placeholder="https://contoh.com/foto.jpg"
                  />
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                )}
              </div>

              <div className="form-group-checkbox">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    name="show"
                    checked={formData.show === 1}
                    onChange={handleChange}
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-label-text">TAMPILKAN BERKAS (PUBLIC)</span>
                </label>
              </div>

              <div className="crud-modal-footer">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Batal
                </button>
                <button type="submit" className="btn-submit">
                  {isEditing ? 'Simpan Perubahan' : 'Simpan Data'}
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