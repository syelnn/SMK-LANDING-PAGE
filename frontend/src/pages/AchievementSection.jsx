import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { SquarePen, Trash2, Link as LinkIcon, Upload } from 'lucide-react';

const AchievementSection = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [imageTab, setImageTab] = useState('url');

  const [formData, setFormData] = useState({
    student_name: '',
    class_name: '',
    achievement: '',
    level: 'Nasional',
    year: new Date().getFullYear().toString(),
    sort_order: 1,
    photo: ''
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
      photo: ''
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
      photo: item.photo || ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      sort_order: parseInt(formData.sort_order, 10) || 1
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

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

  if (loading) {
    return <div className="achievement-loading">Memuat data Prestasi Siswa...</div>;
  }

  return (
    <div className="achievement-page-wrapper">
      <div className="achievement-header-clean">
        <span className="achievement-pill">PRESTASI SISWA</span>
        <h1 className="achievement-main-title">
          Karya & Prestasi <span className="highlight-green">SMK NEGERI COMPRENG</span>
        </h1>
        <p className="achievement-sub-title">
          Capaian membanggakan yang telah diraih Taruna/i SMK NEGERI COMPRENG.
        </p>

        <div style={{ marginTop: '20px' }}>
          <button className="btn-add-achievement" onClick={handleOpenAddModal}>
            + Tambah Prestasi Baru
          </button>
        </div>
      </div>

      <div className="achievement-container">
        {achievements.length === 0 ? (
          <p className="achievement-empty">Belum ada data prestasi yang ditampilkan.</p>
        ) : (
          <div className="achievement-grid">
            {achievements.map((item) => (
              <div key={item.id} className="achievement-card-clean">
                <div className="card-actions-top">
                  <button 
                    className="btn-action edit" 
                    title="Edit Data" 
                    onClick={() => handleOpenEditModal(item)}
                  >
                    <SquarePen size={16} />
                  </button>
                  <button 
                    className="btn-action delete" 
                    title="Hapus Data" 
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {item.photo ? (
                  <img 
                    src={item.photo} 
                    alt={item.student_name} 
                    style={{ 
                      width: '60px', 
                      height: '60px', 
                      borderRadius: '50%', 
                      objectFit: 'cover', 
                      margin: '0 auto 10px',
                      display: 'block'
                    }} 
                  />
                ) : (
                  <div className="avatar-circle">{getInitial(item.student_name)}</div>
                )}

                <h3 className="student-name-title">{item.student_name}</h3>
                <span className="student-class-sub">{item.class_name || 'Siswa'}</span>

                <p className="achievement-detail-title">{item.achievement}</p>

                <div className="badge-footer-group">
                  <span className={`badge-level ${item.level?.toLowerCase() || 'nasional'}`}>
                    {item.level || 'NASIONAL'}
                  </span>
                  {item.year && <span className="badge-year">{item.year}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="crud-modal-overlay">
          <div className="crud-modal-content">
            <div className="crud-modal-header">
              <h2>{isEditing ? 'Edit Prestasi' : 'Tambah Prestasi Baru'}</h2>
              <button className="btn-close-modal" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="crud-form">
              <div className="form-group">
                <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666' }}>
                  NAMA SISWA
                </label>
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
                <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666' }}>
                  KELAS
                </label>
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
                <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666' }}>
                  JUDUL PRESTASI / KEJUARAAN
                </label>
                <input
                  type="text"
                  name="achievement"
                  value={formData.achievement}
                  onChange={handleChange}
                  placeholder="Contoh: Juara 1 Olimpiade Sains"
                  required
                />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666' }}>
                    TINGKAT
                  </label>
                  <select name="level" value={formData.level} onChange={handleChange}>
                    <option value="Kota">Kota</option>
                    <option value="Provinsi">Provinsi</option>
                    <option value="Nasional">Nasional</option>
                    <option value="Internasional">Internasional</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666' }}>
                    TAHUN
                  </label>
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
                <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666' }}>
                  URUTAN TAMPILAN
                </label>
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
                <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666' }}>
                  FOTO PROFIL
                </label>
                
                <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px', marginBottom: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setImageTab('url')}
                    style={{
                      flex: 1,
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      background: imageTab === 'url' ? '#ffffff' : 'transparent',
                      color: imageTab === 'url' ? '#000000' : '#64748b',
                      boxShadow: imageTab === 'url' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    <LinkIcon size={14} /> Link URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab('upload')}
                    style={{
                      flex: 1,
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      background: imageTab === 'upload' ? '#ffffff' : 'transparent',
                      color: imageTab === 'upload' ? '#000000' : '#64748b',
                      boxShadow: imageTab === 'upload' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
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

              <div className="crud-modal-footer" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
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