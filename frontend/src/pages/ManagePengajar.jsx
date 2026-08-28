import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit, Image as ImageIcon, Link as LinkIcon, X } from 'lucide-react';
import '../App.css';

export default function ManagePengajar() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const userRole = localStorage.getItem('role');

  const API_URL = 'http://localhost:5002/api';

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [imageType, setImageType] = useState('url');
  const [formData, setFormData] = useState({ 
    name: '', role: '', photo: '', sort_order: 1, show: 1 
  });

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/teacher`);
      setTeachers(res.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Gagal memuat data pengajar:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, photo: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const openAdd = () => {
    setEditId(null);
    // OTOMATISASI SORT ORDER: Cari angka terbesar, lalu tambah 1
    const maxSortOrder = teachers.length > 0 ? Math.max(...teachers.map(t => t.sortOrder || 0)) : 0;
    setFormData({ name: '', role: '', photo: '', sort_order: maxSortOrder + 1, show: 1 });
    setImageType('url');
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditId(item.id);
    setFormData({ ...item, sort_order: item.sortOrder || 0 });
    setImageType(item.photo && item.photo.length > 200 ? 'file' : 'url');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`${API_URL}/teacher/${editId}`, formData);
      } else {
        await axios.post(`${API_URL}/teacher`, formData);
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      alert(`Gagal menyimpan data: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus guru ini?')) return;
    try {
      await axios.delete(`${API_URL}/teacher/${id}`);
      fetchData();
    } catch (error) {
      alert('Gagal menghapus data');
    }
  };

  const principal = teachers.find(t => t.role.toLowerCase().includes('kepala'));
  const staff = teachers.filter(t => !t.role.toLowerCase().includes('kepala'));

  if (loading) return <div className="section-container"><p>Memuat data...</p></div>;

  return (
    <div className="section-container">
      <div className="section-header">
        <span className="section-tag" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}>TENAGA PENGAJAR</span>
        <h2 className="section-title">Guru <span>profesional dan berpengalaman</span> di bidangnya</h2>
        <p className="section-desc">Pilar utama pembentuk karakter dan kompetensi siswa SMK Negeri Compreng.</p>
      </div>

      {(userRole === 'admin' || userRole === 'editor') && (
        <div className="admin-action-bar" style={{ justifyContent: 'center', marginBottom: '40px' }}>
          <button className="btn-modern-primary" onClick={openAdd}>
            <Plus size={18} /> Tambah Pengajar Baru
          </button>
        </div>
      )}

      {/* KARTU KEPALA SEKOLAH */}
      {principal && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
          <div className="teacher-card-light principal-card">
            <div className="teacher-photo-light">
              <img src={principal.photo || 'https://via.placeholder.com/150'} alt={principal.name} />
            </div>
            <h3 className="teacher-name-light">{principal.name}</h3>
            <span className="teacher-role-light highlight-role">{principal.role}</span>

            {(userRole === 'admin' || userRole === 'editor') && (
              <div className="teacher-admin-actions-light">
                <button className="btn-edit-icon" onClick={() => openEdit(principal)}><Edit size={16} /></button>
                <button className="btn-delete-icon" onClick={() => handleDelete(principal.id)}><Trash2 size={16} /></button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STAF PENGAJAR */}
      {staff.length > 0 && (
        <div className="staff-scroll-container">
          {staff.map((teacher) => (
            <div className="teacher-card-light" key={teacher.id}>
              <div className="teacher-photo-light">
                <img src={teacher.photo || 'https://via.placeholder.com/150'} alt={teacher.name} />
              </div>
              <h3 className="teacher-name-light">{teacher.name}</h3>
              <span className="teacher-role-light">{teacher.role}</span>

              {(userRole === 'admin' || userRole === 'editor') && (
                <div className="teacher-admin-actions-light">
                  <button className="btn-edit-icon" onClick={() => openEdit(teacher)}><Edit size={16} /></button>
                  <button className="btn-delete-icon" onClick={() => handleDelete(teacher.id)}><Trash2 size={16} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL FORM SUPER MODERN */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content modern-modal">
            <div className="modal-header-modern">
              <h3>{editId ? 'Edit Data Pengajar' : 'Tambah Pengajar Baru'}</h3>
              <button onClick={() => setShowModal(false)} className="btn-close-modal"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="form-modern-layout">
              <div className="form-group-modern">
                <label>Nama Lengkap & Gelar</label>
                <input type="text" placeholder="Contoh: Budi Santoso, S.Pd." className="input-modern" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              
              <div className="form-group-modern">
                <label>Jabatan / Posisi</label>
                <input type="text" placeholder="Contoh: Kepala Sekolah / Guru Kejuruan" className="input-modern" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} required />
              </div>
              
              <div className="form-row-modern">
                <div className="form-group-modern" style={{ flex: 1 }}>
                  <label>Urutan (Otomatis)</label>
                  <input type="number" className="input-modern" value={formData.sort_order} onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value)})} required />
                </div>
                <div className="form-group-modern" style={{ flex: 1 }}>
                  <label>Status Tampil</label>
                  <select className="input-modern" value={formData.show} onChange={e => setFormData({...formData, show: parseInt(e.target.value)})}>
                    <option value={1}>Ditampilkan</option>
                    <option value={0}>Disembunyikan</option>
                  </select>
                </div>
              </div>

              <div className="form-group-modern upload-section">
                <label>Foto Profil</label>
                <div className="radio-tabs">
                  <div className={`radio-tab ${imageType === 'url' ? 'active' : ''}`} onClick={() => setImageType('url')}>
                    <LinkIcon size={16}/> Link URL
                  </div>
                  <div className={`radio-tab ${imageType === 'file' ? 'active' : ''}`} onClick={() => setImageType('file')}>
                    <ImageIcon size={16}/> Upload Foto
                  </div>
                </div>
                
                {imageType === 'url' ? (
                  <input type="text" placeholder="https://contoh.com/foto.jpg" className="input-modern" value={formData.photo} onChange={e => setFormData({...formData, photo: e.target.value})} />
                ) : (
                  <input type="file" accept="image/*" className="input-modern file-style" onChange={handleFileUpload} />
                )}
              </div>

              <div className="modal-actions-modern">
                <button type="button" onClick={() => setShowModal(false)} className="btn-modern-secondary">Batal</button>
                <button type="submit" className="btn-modern-primary">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}