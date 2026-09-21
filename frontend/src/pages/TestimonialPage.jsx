import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Eye, EyeOff, Plus, X, Link as LinkIcon, Image as ImageIcon, Search, MoreHorizontal } from 'lucide-react';
import '../css/testimonialpage.css';
import '../App.css'; // Wajib di-import agar class .modal-overlay, .modern-modal dll berfungsi persis seperti Jurusan

const TestimonialPage = () => {
  const [testimonials, setTestimonials] = useState([]);

  // State form Admin
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editId, setEditId] = useState(null);
  const [adminFormData, setAdminFormData] = useState({ name: '', role: '', quote: '', show: 1, photo: '' });
  const [adminPhotoMode, setAdminPhotoMode] = useState('url');
  
  // State Pencarian & Smart Dropdown
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownConfig, setDropdownConfig] = useState({ id: null, right: null, top: null, bottom: null });
  
  const userRole = localStorage.getItem('role') || 'viewer';
  const userId = localStorage.getItem('userId');
  const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  useEffect(() => {
    fetchData();
  }, [userRole]);

  useEffect(() => {
    const handleScroll = () => {
      if (dropdownConfig.id !== null) {
        setDropdownConfig({ id: null, right: null, top: null, bottom: null });
      }
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [dropdownConfig.id]);

  const fetchData = async () => {
    try {
      const endpoint = userRole === 'admin' || userRole === 'editor' 
        ? 'http://localhost:5002/api/testimonials' 
        : 'http://localhost:5002/api/testimonials/public';
        
      const isStaff = userRole === 'admin' || userRole === 'editor';
      const res = await axios.get(endpoint, isStaff ? authHeaders() : undefined);
      setTestimonials(res.data.data);
    } catch (error) {
      console.error("Gagal memuat testimoni", error);
    }
  };

  const handleFileUpload = (e, formType) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert("Ukuran file terlalu besar! Maksimal 2MB.");

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

  const handleDropdownClick = (e, testiId) => {
    e.stopPropagation();
    if (dropdownConfig.id === testiId) {
      setDropdownConfig({ id: null, right: null, top: null, bottom: null });
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const dropdownHeight = 160; 
    
    const spaceBelow = windowHeight - rect.bottom;
    const openUpwards = spaceBelow < dropdownHeight;

    setDropdownConfig({
      id: testiId,
      right: window.innerWidth - rect.right,
      top: openUpwards ? null : rect.bottom + 4,
      bottom: openUpwards ? windowHeight - rect.top + 4 : null
    });
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
    setDropdownConfig({ id: null, right: null, top: null, bottom: null });
    setModalMode('edit');
    setEditId(t.id);
    setAdminFormData({ name: t.name, role: t.role, quote: t.quote, show: t.show, photo: t.photo || '' });
    setAdminPhotoMode(t.photo && t.photo.length > 200 ? 'upload' : 'url');
    setIsModalOpen(true);
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await axios.post('http://localhost:5002/api/testimonials/admin', adminFormData, authHeaders());
      } else {
        await axios.put(`http://localhost:5002/api/testimonials/${editId}`, adminFormData, authHeaders());
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      alert('Terjadi kesalahan saat menyimpan data.');
    }
  };

  const handleToggleShow = async (id, currentShow) => {
    setDropdownConfig({ id: null, right: null, top: null, bottom: null });
    try {
      const newShow = currentShow === 1 ? 0 : 1;
      await axios.put(`http://localhost:5002/api/testimonials/${id}/toggle-show`, { show: newShow }, authHeaders());
      fetchData();
    } catch (error) {
      alert('Gagal merubah status');
    }
  };

  const handleDelete = async (id) => {
    setDropdownConfig({ id: null, right: null, top: null, bottom: null });
    if (!window.confirm("Hapus testimoni ini secara permanen?")) return;
    try {
      await axios.delete(`http://localhost:5002/api/testimonials/${id}`, authHeaders());
      fetchData();
    } catch (error) {
      alert('Gagal menghapus');
    }
  };

  const displayCards = testimonials.filter(t => t.show === 1).reverse();
  const filteredTestimonials = testimonials.filter(t => {
    const term = searchTerm.toLowerCase();
    return (
      (t.name || '').toLowerCase().includes(term) ||
      (t.role || '').toLowerCase().includes(term) ||
      (t.quote || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="testi-wrapper">
      {/* =========================================================
          Halaman ini KHUSUS admin/editor (dijaga juga oleh
          ProtectedRoute di App.jsx). Viewer TIDAK PERNAH melihat
          halaman ini — alur kirim testimoni untuk viewer ada di
          /testimoni/tulis (lihat pages/viewer/TulisTestimoni.jsx).
      ========================================================= */}
        <div>
          <div className="testi-header-box">
            <div>
              <h2 className="testi-title">Manajemen Testimoni</h2>
              <p className="testi-subtitle">Kelola persetujuan (approval) dan data kutipan yang tampil di halaman depan.</p>
            </div>
            <button className="btn-modern-primary" onClick={openAddModal}>
              <Plus size={16} /> Tambah Data
            </button>
          </div>

          <div className="testi-toolbar">
            <div className="testi-search-wrapper">
              <Search size={16} className="testi-search-icon" />
              <input 
                type="text" 
                placeholder="Cari nama, role, atau kutipan..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="testi-search-input"
              />
            </div>
          </div>

          <div className="testi-table-card">
            <table className="testi-table">
              <thead>
                <tr style={{ background: 'var(--compreng-surface-soft)' }}>
                  <th className="testi-th">Nama & Foto</th>
                  <th className="testi-th">Role / Status</th>
                  <th className="testi-th">Kutipan</th>
                  <th className="testi-th">Status Tampil</th>
                  <th className="testi-th" style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredTestimonials.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--compreng-text-muted)', fontSize: '13px' }}>
                      {searchTerm ? `Tidak ditemukan data untuk "${searchTerm}"` : 'Belum ada data testimoni.'}
                    </td>
                  </tr>
                ) : (
                  filteredTestimonials.map(t => (
                    <tr key={t.id} className="testi-tr">
                      <td className="testi-td">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {t.photo ? (
                            <img src={t.photo} alt="pic" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--compreng-border)' }} />
                          ) : (
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--compreng-bg)', border: '1px solid var(--compreng-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--compreng-text)' }}>
                              {t.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span style={{ fontWeight: '600' }}>{t.name}</span>
                        </div>
                      </td>
                      <td className="testi-td" style={{ color: 'var(--compreng-text-secondary)' }}>{t.role}</td>
                      <td className="testi-td testi-truncate" title={t.quote}>{t.quote}</td>
                      <td className="testi-td">
                        <span className={t.show === 1 ? 'testi-badge-active' : 'testi-badge-pending'}>
                          {t.show === 1 ? 'Ditampilkan' : 'Pending'}
                        </span>
                      </td>
                      <td className="testi-td" style={{ textAlign: 'center', position: 'relative' }}>
                        <button 
                          onClick={(e) => handleDropdownClick(e, t.id)}
                          className="testi-action-btn"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* DROPDOWN MENU */}
          {dropdownConfig.id && (
            <>
              <div 
                onClick={() => setDropdownConfig({ id: null, right: null, top: null, bottom: null })} 
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
              ></div>
              <div 
                className="testi-dropdown-menu" 
                style={{ 
                  position: 'fixed', 
                  right: dropdownConfig.right, 
                  ...(dropdownConfig.top !== null ? { top: dropdownConfig.top } : {}),
                  ...(dropdownConfig.bottom !== null ? { bottom: dropdownConfig.bottom } : {}),
                  zIndex: 50 
                }}
              >
                {(() => {
                  const targetItem = testimonials.find(t => t.id === dropdownConfig.id);
                  if (!targetItem) return null;
                  return (
                    <>
                      <button onClick={() => handleToggleShow(targetItem.id, targetItem.show)} className="testi-dropdown-item">
                        {targetItem.show === 1 ? <EyeOff size={14} color="var(--compreng-text-secondary)" /> : <Eye size={14} color="var(--compreng-text-secondary)" />} 
                        {targetItem.show === 1 ? 'Sembunyikan' : 'Tampilkan'}
                      </button>
                      <button onClick={() => openEditModal(targetItem)} className="testi-dropdown-item">
                        <Pencil size={14} color="var(--compreng-text-secondary)" /> Edit Data
                      </button>
                      <div style={{ margin: '4px 0', borderTop: '1px solid var(--compreng-border)' }}></div>
                      <button onClick={() => handleDelete(targetItem.id)} className="testi-dropdown-item danger">
                        <Trash2 size={14} color="currentColor" /> Hapus Permanen
                      </button>
                    </>
                  );
                })()}
              </div>
            </>
          )}

        </div>
      

      {/* =========================================================
          MODAL CRUD ADMIN IDENTIK JURUSAN
      ========================================================= */}
      {isModalOpen && (userRole === 'admin' || userRole === 'editor') && (
        <div className="modal-overlay">
          <div className="modal-content modern-modal">
            <div className="modal-header-modern">
              <h3>{modalMode === 'add' ? 'Tambah Data Testimoni' : 'Edit Data Testimoni'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="btn-close-modal" type="button"><X size={20} /></button>
            </div>
            <form onSubmit={handleAdminSubmit} className="form-modern-layout">
              <div className="form-group-modern">
                <label>Nama Lengkap</label>
                <input type="text" placeholder="Contoh: Raka Firmansyah" className="input-modern" value={adminFormData.name} onChange={e => setAdminFormData({...adminFormData, name: e.target.value})} required />
              </div>

              <div className="form-group-modern">
                <label>Jabatan / Status</label>
                <input type="text" placeholder="Contoh: Alumni - Universitas Indonesia" className="input-modern" value={adminFormData.role} onChange={e => setAdminFormData({...adminFormData, role: e.target.value})} required />
              </div>
              
              <div className="form-group-modern">
                <label>Status Tampil</label>
                <select className="input-modern" value={adminFormData.show} onChange={e => setAdminFormData({...adminFormData, show: Number(e.target.value)})}>
                  <option value={1}>Ditampilkan</option>
                  <option value={0}>Sembunyikan (Pending)</option>
                </select>
              </div>

              {/* UPLOAD SECTION IDENTIK JURUSAN */}
              <div className="form-group-modern upload-section">
                <label>Foto Profil (Opsional)</label>
                <div className="radio-tabs">
                  <div 
                    className={`radio-tab ${adminPhotoMode === 'url' ? 'active' : ''}`} 
                    onClick={() => setAdminPhotoMode('url')}
                  >
                    <LinkIcon size={16}/> Link URL
                  </div>
                  <div 
                    className={`radio-tab ${adminPhotoMode === 'upload' ? 'active' : ''}`} 
                    onClick={() => setAdminPhotoMode('upload')}
                  >
                    <ImageIcon size={16}/> Upload Foto
                  </div>
                </div>
                
                {adminPhotoMode === 'url' ? (
                  <input type="text" placeholder="https://..." className="input-modern" value={adminFormData.photo || ''} onChange={e => setAdminFormData(prev => ({...prev, photo: e.target.value}))} />
                ) : (
                  <input type="file" accept="image/*" className="input-modern file-style" onChange={(e) => handleFileUpload(e, 'admin')} />
                )}
              </div>

              <div className="form-group-modern">
                <label>Kutipan</label>
                <textarea className="input-modern" placeholder="Tulis kutipan testimoni..." value={adminFormData.quote} onChange={e => setAdminFormData({...adminFormData, quote: e.target.value})} required rows={3}></textarea>
              </div>

              <div className="modal-actions-modern">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-modern-secondary">Batal</button>
                <button type="submit" className="btn-modern-primary">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
        )}
    </div>
  );
};

export default TestimonialPage;