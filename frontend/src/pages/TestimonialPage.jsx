import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Eye, EyeOff, Plus, X, Link as LinkIcon, UploadCloud, Search, MoreHorizontal } from 'lucide-react';
import '../css/testimonialpage.css'; // Hanya mengimpor CSS khusus testimoni, tanpa App.css

const TestimonialPage = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // State form Pengunjung
  const [viewerFormData, setViewerFormData] = useState({ name: '', role: '', quote: '', photo: '' });
  const [viewerPhotoMode, setViewerPhotoMode] = useState('url'); 
  
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

  useEffect(() => {
    fetchData();
  }, [userRole]);

  // Sembunyikan dropdown saat scroll halaman
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

  // --- SMART DROPDOWN LOGIC ---
  const handleDropdownClick = (e, testiId) => {
    e.stopPropagation();
    if (dropdownConfig.id === testiId) {
      setDropdownConfig({ id: null, right: null, top: null, bottom: null });
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Perbesar area deteksi untuk dropdown 3 aksi
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
    setDropdownConfig({ id: null, right: null, top: null, bottom: null });
    try {
      const newShow = currentShow === 1 ? 0 : 1;
      await axios.put(`http://localhost:5002/api/testimonials/${id}/toggle-show`, { show: newShow });
      fetchData();
    } catch (error) {
      alert('Gagal merubah status');
    }
  };

  const handleDelete = async (id) => {
    setDropdownConfig({ id: null, right: null, top: null, bottom: null });
    if (!window.confirm("Hapus testimoni ini secara permanen?")) return;
    try {
      await axios.delete(`http://localhost:5002/api/testimonials/${id}`);
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
          VIEW UNTUK PENGUNJUNG (Hanya tampil jika role = viewer)
      ========================================================= */}
      {userRole === 'viewer' ? (
        <>
          <div className="modern-testi-public">
            <div className="modern-testi-header">
              <span className="modern-testi-header-badge">Testimoni</span>
              <h2 style={{ color: 'var(--compreng-text)', margin: '10px 0' }}>Testimoni <span style={{ color: 'var(--compreng-green)' }}>SMK Negeri Compreng</span></h2>
              <p style={{ color: 'var(--compreng-text-secondary)' }}>Apa kata siswa, alumni, dan orang tua tentang pengalaman mereka.</p>
            </div>

            <div className="modern-testi-grid">
              {displayCards.map((t, index) => (
                <div key={t.id || index} className="testi-card-public">
                  <div className="testi-card-quote-icon">&ldquo;</div>
                  <p className="testi-card-text">{t.quote}</p>
                  
                  <div className="testi-card-author">
                    {t.photo ? (
                      <img src={t.photo} alt={t.name} className="testi-card-author-img" />
                    ) : (
                      <div className="testi-card-author-initial">{t.name.charAt(0).toUpperCase()}</div>
                    )}
                    <div>
                      <h4 style={{ margin: 0, color: 'var(--compreng-text)', fontSize: '15px' }}>{t.name}</h4>
                      <p style={{ margin: 0, color: 'var(--compreng-text-muted)', fontSize: '12px' }}>{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="testi-viewer-form-container">
            <h3 style={{ textAlign: 'center', color: 'var(--compreng-text)', marginBottom: '20px' }}>Bagikan Pengalamanmu</h3>
            {!userId ? (
              <div style={{ padding: '15px', backgroundColor: 'var(--compreng-surface-soft)', color: 'var(--compreng-text-muted)', textAlign: 'center', borderRadius: '8px' }}>Silakan login untuk mengirim testimoni.</div>
            ) : hasSubmitted ? (
              <div className="testi-viewer-alert">Terima kasih! Testimoni kamu sedang menunggu moderasi Admin.</div>
            ) : (
              <form onSubmit={handleViewerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label className="testi-form-label">Nama Lengkap</label>
                  <input type="text" required value={viewerFormData.name} onChange={e => setViewerFormData({...viewerFormData, name: e.target.value})} className="testi-form-input" />
                </div>
                <div>
                  <label className="testi-form-label">Status (contoh: Alumni 2025)</label>
                  <input type="text" required value={viewerFormData.role} onChange={e => setViewerFormData({...viewerFormData, role: e.target.value})} className="testi-form-input" />
                </div>
                
                <div>
                  <label className="testi-form-label">Foto Profil (Opsional)</label>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <button type="button" onClick={() => setViewerPhotoMode('url')} style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: viewerPhotoMode === 'url' ? 'var(--compreng-text)' : 'var(--compreng-surface-soft)', color: viewerPhotoMode === 'url' ? 'var(--compreng-bg)' : 'var(--compreng-text-muted)' }}><LinkIcon size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }}/> Link URL</button>
                    <button type="button" onClick={() => setViewerPhotoMode('upload')} style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: viewerPhotoMode === 'upload' ? 'var(--compreng-text)' : 'var(--compreng-surface-soft)', color: viewerPhotoMode === 'upload' ? 'var(--compreng-bg)' : 'var(--compreng-text-muted)' }}><UploadCloud size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }}/> Upload Foto</button>
                  </div>
                  {viewerPhotoMode === 'url' ? (
                    <input type="text" placeholder="https://..." value={viewerFormData.photo} onChange={e => setViewerFormData(prev => ({...prev, photo: e.target.value}))} className="testi-form-input" />
                  ) : (
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'viewer')} className="testi-form-input" style={{ padding: '7px 14px' }} />
                  )}
                </div>

                <div>
                  <label className="testi-form-label">Kutipan Pengalaman</label>
                  <textarea required value={viewerFormData.quote} onChange={e => setViewerFormData({...viewerFormData, quote: e.target.value})} rows={4} className="testi-form-textarea"></textarea>
                </div>
                <button type="submit" className="btn-viewer-submit">Kirim Testimoni</button>
              </form>
            )}
          </div>
        </>

      ) : (

        /* =========================================================
           VIEW UNTUK ADMIN/EDITOR
        ========================================================= */
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
                <tr>
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

          {/* MENAMPILKAN DROPDOWN SECARA FIXED (Di Luar Flow Tabel) */}
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
      )}

      {/* =========================================================
          MODAL CRUD ADMIN TERISOLASI
      ========================================================= */}
      {isModalOpen && (userRole === 'admin' || userRole === 'editor') && (
        <div className="testi-modal-overlay">
          <div className="testi-modal-content">
            <div className="testi-modal-header">
              <h3>{modalMode === 'add' ? 'Tambah Data Testimoni' : 'Edit Data Testimoni'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="testi-btn-close" type="button"><X size={20} /></button>
            </div>

            <form id="admin-testi-form" onSubmit={handleAdminSubmit} className="testi-form-layout">
              <div className="testi-form-group">
                <label>Nama Lengkap</label>
                <input type="text" placeholder="Contoh: Raka Firmansyah" className="testi-input" value={adminFormData.name} onChange={e => setAdminFormData({...adminFormData, name: e.target.value})} required />
              </div>

              <div className="testi-form-group">
                <label>Jabatan / Status</label>
                <input type="text" placeholder="Contoh: Alumni - Universitas Indonesia" className="testi-input" value={adminFormData.role} onChange={e => setAdminFormData({...adminFormData, role: e.target.value})} required />
              </div>
              
              <div className="testi-form-group">
                <label>Status Tampil</label>
                <select className="testi-input" value={adminFormData.show} onChange={e => setAdminFormData({...adminFormData, show: Number(e.target.value)})}>
                  <option value={1}>Ditampilkan</option>
                  <option value={0}>Sembunyikan (Pending)</option>
                </select>
              </div>

              <div className="testi-form-group">
                <label>Foto Profil (Opsional)</label>
                <div className="testi-radio-tabs">
                  <div className={`testi-radio-tab ${adminPhotoMode === 'url' ? 'active' : ''}`} onClick={() => setAdminPhotoMode('url')}>
                    <LinkIcon size={16}/> Link URL
                  </div>
                  <div className={`testi-radio-tab ${adminPhotoMode === 'upload' ? 'active' : ''}`} onClick={() => setAdminPhotoMode('upload')}>
                    <UploadCloud size={16}/> Upload Foto
                  </div>
                </div>
                
                {adminPhotoMode === 'url' ? (
                  <input type="text" placeholder="https://..." className="testi-input" value={adminFormData.photo || ''} onChange={e => setAdminFormData(prev => ({...prev, photo: e.target.value}))} />
                ) : (
                  <input type="file" accept="image/*" className="testi-input" style={{ padding: '7px 12px' }} onChange={(e) => handleFileUpload(e, 'admin')} />
                )}
              </div>

              <div className="testi-form-group">
                <label>Kutipan</label>
                <textarea className="testi-input" placeholder="Tulis kutipan testimoni..." value={adminFormData.quote} onChange={e => setAdminFormData({...adminFormData, quote: e.target.value})} required rows={4}></textarea>
              </div>

              <div className="testi-modal-actions">
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