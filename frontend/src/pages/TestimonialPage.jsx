import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Eye, EyeOff, Plus, X, Link as LinkIcon, UploadCloud } from 'lucide-react';

const TestimonialPage = () => {
  const [testimonials, setTestimonials] = useState([]);
  
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [viewerFormData, setViewerFormData] = useState({ name: '', role: '', quote: '', photo: '' });
  const [viewerPhotoMode, setViewerPhotoMode] = useState('url'); 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editId, setEditId] = useState(null);
  const [adminFormData, setAdminFormData] = useState({ name: '', role: '', quote: '', show: 1, photo: '' });
  const [adminPhotoMode, setAdminPhotoMode] = useState('url');
  
  const userRole = localStorage.getItem('role') || 'viewer';
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    fetchData();
  }, [userRole]);

  const fetchData = async () => {
    try {
      const endpoint = userRole === 'admin' || userRole === 'editor' 
        ? 'http://localhost:5002/api/testimonials' 
        : 'http://localhost:5002/api/testimonials/public';
        
      const res = await axios.get(endpoint);
      setTestimonials(res.data.data);

      if (userRole === 'viewer' && userId) {
        const checkAll = await axios.get('http://localhost:5002/api/testimonials');
        const submitted = checkAll.data.data.find(t => t.userId === Number(userId));
        if (submitted) setHasSubmitted(true);
      }
    } catch (error) {
      console.error("Gagal memuat testimoni", error);
    }
  };

  const handleFileUpload = (e, formType) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (formType === 'viewer') {
        setViewerFormData(prev => ({ ...prev, photo: reader.result }));
      } else {
        setAdminFormData(prev => ({ ...prev, photo: reader.result }));
      }
    };
    reader.onerror = () => alert("Gagal memproses gambar!");
  };

  const handleViewerSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5002/api/testimonials', { ...viewerFormData, userId });
      alert('Testimoni terkirim! Menunggu persetujuan Admin.');
      setHasSubmitted(true);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal mengirim');
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setAdminFormData({ name: '', role: '', quote: '', show: 1, photo: '' });
    setAdminPhotoMode('url');
    setIsModalOpen(true);
  };

  const openEditModal = (t) => {
    setModalMode('edit');
    setEditId(t.id);
    setAdminFormData({ name: t.name, role: t.role, quote: t.quote, show: t.show, photo: t.photo || '' });
    setAdminPhotoMode(t.photo && t.photo.startsWith('data:image') ? 'upload' : 'url');
    setIsModalOpen(true);
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await axios.post('http://localhost:5002/api/testimonials/admin', adminFormData);
      } else {
        await axios.put(`http://localhost:5002/api/testimonials/${editId}`, adminFormData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      alert('Terjadi kesalahan saat menyimpan data.');
    }
  };

  const handleToggleShow = async (id, currentShow) => {
    try {
      const newShow = currentShow === 1 ? 0 : 1;
      await axios.put(`http://localhost:5002/api/testimonials/${id}/toggle-show`, { show: newShow });
      fetchData();
    } catch (error) {
      alert('Gagal merubah status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus testimoni ini?")) return;
    try {
      await axios.delete(`http://localhost:5002/api/testimonials/${id}`);
      fetchData();
    } catch (error) {
      alert('Gagal menghapus');
    }
  };

  const displayCards = testimonials.filter(t => t.show === 1).reverse();

  return (
    <div className="modern-testi-wrapper">
      
      {/* 1. KARTU PREVIEW (PUBLIK) */}
      <div className="modern-testi-public">
        <div className="modern-testi-header">
          <span className="modern-badge-title">Testimoni</span>
          <h2>Testimoni <span>SMK Negeri Compreng</span></h2>
          <p>Apa kata siswa, alumni, dan orang tua tentang pengalaman mereka.</p>
        </div>

        <div className="modern-testi-grid">
          {displayCards.map((t, index) => (
            <div key={t.id || index} className="modern-testi-card">
              <div className="modern-testi-quote-mark">&ldquo;</div>
              <p className="modern-testi-quote-text">{t.quote}</p>
              
              <div className="modern-testi-profile">
                {t.photo ? (
                  <img src={t.photo} alt={t.name} className="modern-avatar-img" />
                ) : (
                  <div className="modern-avatar-initial">{t.name.charAt(0).toUpperCase()}</div>
                )}
                <div className="modern-profile-info">
                  <h4>{t.name}</h4>
                  <p>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. FORM VIEWER */}
      {userRole === 'viewer' && (
        <div className="modern-viewer-form-container">
          <h3>Bagikan Pengalamanmu</h3>
          {!userId ? (
            <div className="modern-alert normal">Silakan login untuk mengirim testimoni.</div>
          ) : hasSubmitted ? (
            <div className="modern-alert success">Terima kasih! Testimoni kamu sedang menunggu moderasi Admin.</div>
          ) : (
            <form onSubmit={handleViewerSubmit} className="modern-form">
              <div className="modern-form-group">
                <label>Nama Lengkap</label>
                <input type="text" required value={viewerFormData.name} onChange={e => setViewerFormData({...viewerFormData, name: e.target.value})} />
              </div>
              <div className="modern-form-group">
                <label>Status (contoh: Alumni 2025)</label>
                <input type="text" required value={viewerFormData.role} onChange={e => setViewerFormData({...viewerFormData, role: e.target.value})} />
              </div>
              
              <div className="modern-photo-box">
                <label>Foto Profil (Opsional)</label>
                <div className="modern-tabs">
                  <button type="button" onClick={() => setViewerPhotoMode('url')} className={viewerPhotoMode === 'url' ? 'active' : ''}><LinkIcon size={16} /> Link URL</button>
                  <button type="button" onClick={() => setViewerPhotoMode('upload')} className={viewerPhotoMode === 'upload' ? 'active' : ''}><UploadCloud size={16} /> Upload Foto</button>
                </div>
                {viewerPhotoMode === 'url' ? (
                  <input type="text" placeholder="https://..." value={viewerFormData.photo} onChange={e => setViewerFormData(prev => ({...prev, photo: e.target.value}))} />
                ) : (
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'viewer')} className="modern-file-input" />
                )}
              </div>

              <div className="modern-form-group">
                <label>Kutipan</label>
                <textarea required value={viewerFormData.quote} onChange={e => setViewerFormData({...viewerFormData, quote: e.target.value})}></textarea>
              </div>
              <button type="submit" className="modern-btn-primary w-full">Kirim Testimoni</button>
            </form>
          )}
        </div>
      )}

      {/* 3. TABEL ADMIN */}
      {(userRole === 'admin' || userRole === 'editor') && (
        <div className="modern-admin-section">
          <div className="modern-admin-header">
            <div>
              <h2>Manajemen Testimoni</h2>
              <p>Kelola data kutipan yang tampil di halaman depan.</p>
            </div>
            <button onClick={openAddModal} className="modern-btn-primary flex-center gap-2">
              <Plus size={18} /> Tambah Data
            </button>
          </div>

          <div className="modern-table-card">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Nama & Foto</th>
                  <th>Role</th>
                  <th>Kutipan</th>
                  <th>Status</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {testimonials.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-8">Belum ada data testimoni.</td>
                  </tr>
                ) : (
                  testimonials.map(t => (
                    <tr key={t.id}>
                      <td>
                        <div className="modern-table-profile">
                          {t.photo ? (
                            <img src={t.photo} alt="pic" className="modern-table-avatar" />
                          ) : (
                            <div className="modern-table-initial">{t.name.charAt(0).toUpperCase()}</div>
                          )}
                          <span className="font-semibold">{t.name}</span>
                        </div>
                      </td>
                      <td className="text-muted">{t.role}</td>
                      <td className="modern-quote-cell">{t.quote}</td>
                      <td>
                        <span className={`modern-status-badge ${t.show === 1 ? 'show' : 'hide'}`}>
                          {t.show === 1 ? 'Ditampilkan' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <div className="modern-action-btns">
                          <button 
                            onClick={() => handleToggleShow(t.id, t.show)} 
                            title={t.show === 1 ? 'Sembunyikan' : 'Tampilkan'} 
                            className={`modern-icon-btn ${t.show === 1 ? 'btn-green' : 'btn-gray'}`}
                          >
                            {/* Jika show === 1 (Ditampilkan), pakai Eye (buka). Jika 0 (Pending), pakai EyeOff (tutup) */}
                            {t.show === 1 ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                          <button onClick={() => openEditModal(t)} title="Edit" className="modern-icon-btn btn-blue">
                            <Pencil size={18} />
                          </button>
                          <button onClick={() => handleDelete(t.id)} title="Hapus" className="modern-icon-btn btn-red">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. MODAL CRUD ADMIN */}
      {isModalOpen && (
        <div className="modern-modal-overlay">
          <div className="modern-modal">
            <div className="modern-modal-header">
              <h3>{modalMode === 'add' ? 'Tambah Data Testimoni' : 'Edit Data Testimoni'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="modern-close-btn"><X size={20} /></button>
            </div>

            <div className="modern-modal-body">
              <form id="admin-testi-form" onSubmit={handleAdminSubmit} className="modern-form">
                <div className="modern-form-group">
                  <label>Nama Lengkap</label>
                  <input type="text" value={adminFormData.name} onChange={e => setAdminFormData({...adminFormData, name: e.target.value})} required />
                </div>
                <div className="modern-form-group">
                  <label>Jabatan / Status</label>
                  <input type="text" value={adminFormData.role} onChange={e => setAdminFormData({...adminFormData, role: e.target.value})} required />
                </div>
                
                <div className="modern-form-group">
                  <label>Status Tampil</label>
                  <select value={adminFormData.show} onChange={e => setAdminFormData({...adminFormData, show: Number(e.target.value)})}>
                    <option value={1}>Ditampilkan</option>
                    <option value={0}>Sembunyikan</option>
                  </select>
                </div>

                <div className="modern-photo-box">
                  <label>Foto Profil (Opsional)</label>
                  <div className="modern-tabs">
                    <button type="button" onClick={() => setAdminPhotoMode('url')} className={adminPhotoMode === 'url' ? 'active' : ''}><LinkIcon size={16} /> Link URL</button>
                    <button type="button" onClick={() => setAdminPhotoMode('upload')} className={adminPhotoMode === 'upload' ? 'active' : ''}><UploadCloud size={16} /> Upload Foto</button>
                  </div>
                  {adminPhotoMode === 'url' ? (
                    <input type="text" placeholder="https://..." value={adminFormData.photo || ''} onChange={e => setAdminFormData(prev => ({...prev, photo: e.target.value}))} />
                  ) : (
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'admin')} className="modern-file-input" />
                  )}
                </div>

                <div className="modern-form-group">
                  <label>Kutipan</label>
                  <textarea value={adminFormData.quote} onChange={e => setAdminFormData({...adminFormData, quote: e.target.value})} required></textarea>
                </div>
              </form>
            </div>

            <div className="modern-modal-footer">
              <button type="button" onClick={() => setIsModalOpen(false)} className="modern-btn-outline">Batal</button>
              <button type="submit" form="admin-testi-form" className="modern-btn-primary">Simpan Data</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TestimonialPage;