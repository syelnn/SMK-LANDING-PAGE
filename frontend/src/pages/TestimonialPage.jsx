import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Eye, EyeOff, Plus, X, Link as LinkIcon, UploadCloud, Search } from 'lucide-react';
import '../App.css';

const TestimonialPage = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // State untuk form Pengunjung (Viewer)
  const [viewerFormData, setViewerFormData] = useState({ name: '', role: '', quote: '', photo: '' });
  const [viewerPhotoMode, setViewerPhotoMode] = useState('url'); 
  
  // State untuk form Admin
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editId, setEditId] = useState(null);
  const [adminFormData, setAdminFormData] = useState({ name: '', role: '', quote: '', show: 1, photo: '' });
  const [adminPhotoMode, setAdminPhotoMode] = useState('url');
  
  // State Pencarian Admin
  const [searchTerm, setSearchTerm] = useState('');
  
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
    try {
      const newShow = currentShow === 1 ? 0 : 1;
      await axios.put(`http://localhost:5002/api/testimonials/${id}/toggle-show`, { show: newShow });
      fetchData();
    } catch (error) {
      alert('Gagal merubah status');
    }
  };

  const handleDelete = async (id) => {
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

  // --- STYLES (RESPONSIVE SHADCN ADMIN LOOK) ---
  const styles = {
    wrapper: { width: '100%', maxWidth: '1150px', margin: '0 auto', padding: '30px 24px', boxSizing: 'border-box' },
    headerBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '15px' },
    title: { fontSize: '22px', fontWeight: '700', color: 'var(--compreng-text)', margin: '0 0 4px 0', letterSpacing: '-0.02em' },
    subtitle: { fontSize: '13px', color: 'var(--compreng-text-secondary)', margin: 0 },
    
    btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'var(--compreng-text)', color: 'var(--compreng-bg)', borderRadius: '6px', border: 'none', fontWeight: '500', cursor: 'pointer', fontSize: '13px', transition: 'opacity 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', whiteSpace: 'nowrap' },
    
    // Toolbar (Search)
    toolbar: { display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '16px' },
    searchInputWrapper: { position: 'relative', width: '280px', maxWidth: '100%' },
    searchInput: { width: '100%', padding: '8px 12px 8px 36px', borderRadius: '6px', border: '1px solid var(--compreng-border)', background: 'var(--compreng-surface)', color: 'var(--compreng-text)', fontSize: '13px', outline: 'none' },
    searchIcon: { position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--compreng-text-muted)' },

    // Table Styles
    tableCard: { backgroundColor: 'var(--compreng-surface)', borderRadius: '8px', border: '1px solid var(--compreng-border)', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '40px', width: '100%' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' },
    th: { padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: 'var(--compreng-text-secondary)', borderBottom: '1px solid var(--compreng-border)', whiteSpace: 'nowrap' },
    td: { padding: '14px 16px', borderBottom: '1px solid var(--compreng-border)', verticalAlign: 'middle', color: 'var(--compreng-text)', fontSize: '13px' },
    
    // Helpers
    badgeActive: { display: 'inline-flex', background: 'rgba(34, 197, 94, 0.15)', color: '#16a34a', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },
    badgePending: { display: 'inline-flex', background: 'rgba(234, 179, 8, 0.15)', color: '#ca8a04', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },
    truncate: { maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    
    // Inline Action Buttons
    iconBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '6px', color: 'var(--compreng-text-secondary)', transition: 'all 0.2s ease' },
  };

  return (
    <div style={styles.wrapper}>
      
      {/* =========================================================
          VIEW UNTUK PENGUNJUNG (Hanya tampil jika role = viewer)
      ========================================================= */}
      {userRole === 'viewer' ? (
        <>
          <div className="modern-testi-public" style={{ marginBottom: '50px' }}>
            <div className="modern-testi-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
              <span style={{ backgroundColor: 'var(--compreng-surface-soft)', color: 'var(--compreng-green)', padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px' }}>Testimoni</span>
              <h2 style={{ color: 'var(--compreng-text)', margin: '10px 0' }}>Testimoni <span style={{ color: 'var(--compreng-green)' }}>SMK Negeri Compreng</span></h2>
              <p style={{ color: 'var(--compreng-text-secondary)' }}>Apa kata siswa, alumni, dan orang tua tentang pengalaman mereka.</p>
            </div>

            <div className="modern-testi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {displayCards.map((t, index) => (
                <div key={t.id || index} style={{ backgroundColor: 'var(--compreng-surface)', border: '1px solid var(--compreng-border)', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '40px', color: 'var(--compreng-text-muted)', lineHeight: '1', marginBottom: '10px', fontFamily: 'serif' }}>&ldquo;</div>
                  <p style={{ color: 'var(--compreng-text)', fontStyle: 'italic', flexGrow: 1, marginBottom: '20px' }}>{t.quote}</p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {t.photo ? (
                      <img src={t.photo} alt={t.name} style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--compreng-border)' }} />
                    ) : (
                      <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: 'var(--compreng-green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>{t.name.charAt(0).toUpperCase()}</div>
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

          <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'var(--compreng-surface)', padding: '30px', borderRadius: '16px', border: '1px solid var(--compreng-border)' }}>
            <h3 style={{ textAlign: 'center', color: 'var(--compreng-text)', marginBottom: '20px' }}>Bagikan Pengalamanmu</h3>
            {!userId ? (
              <div style={{ padding: '15px', backgroundColor: 'var(--compreng-surface-soft)', color: 'var(--compreng-text-muted)', textAlign: 'center', borderRadius: '8px' }}>Silakan login untuk mengirim testimoni.</div>
            ) : hasSubmitted ? (
              <div style={{ padding: '15px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', textAlign: 'center', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>Terima kasih! Testimoni kamu sedang menunggu moderasi Admin.</div>
            ) : (
              <form onSubmit={handleViewerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--compreng-text-muted)', display: 'block', marginBottom: '6px' }}>Nama Lengkap</label>
                  <input type="text" required value={viewerFormData.name} onChange={e => setViewerFormData({...viewerFormData, name: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--compreng-border)', backgroundColor: 'var(--compreng-bg)', color: 'var(--compreng-text)', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--compreng-text-muted)', display: 'block', marginBottom: '6px' }}>Status (contoh: Alumni 2025)</label>
                  <input type="text" required value={viewerFormData.role} onChange={e => setViewerFormData({...viewerFormData, role: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--compreng-border)', backgroundColor: 'var(--compreng-bg)', color: 'var(--compreng-text)', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--compreng-text-muted)', display: 'block', marginBottom: '6px' }}>Foto Profil (Opsional)</label>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <button type="button" onClick={() => setViewerPhotoMode('url')} style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: viewerPhotoMode === 'url' ? 'var(--compreng-text)' : 'var(--compreng-surface-soft)', color: viewerPhotoMode === 'url' ? 'var(--compreng-bg)' : 'var(--compreng-text-muted)' }}><LinkIcon size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }}/> Link URL</button>
                    <button type="button" onClick={() => setViewerPhotoMode('upload')} style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: viewerPhotoMode === 'upload' ? 'var(--compreng-text)' : 'var(--compreng-surface-soft)', color: viewerPhotoMode === 'upload' ? 'var(--compreng-bg)' : 'var(--compreng-text-muted)' }}><UploadCloud size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }}/> Upload Foto</button>
                  </div>
                  {viewerPhotoMode === 'url' ? (
                    <input type="text" placeholder="https://..." value={viewerFormData.photo} onChange={e => setViewerFormData(prev => ({...prev, photo: e.target.value}))} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--compreng-border)', backgroundColor: 'var(--compreng-bg)', color: 'var(--compreng-text)', outline: 'none', boxSizing: 'border-box' }} />
                  ) : (
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'viewer')} style={{ width: '100%', padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--compreng-border)', backgroundColor: 'var(--compreng-bg)', color: 'var(--compreng-text)', outline: 'none', boxSizing: 'border-box' }} />
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--compreng-text-muted)', display: 'block', marginBottom: '6px' }}>Kutipan Pengalaman</label>
                  <textarea required value={viewerFormData.quote} onChange={e => setViewerFormData({...viewerFormData, quote: e.target.value})} rows={4} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--compreng-border)', backgroundColor: 'var(--compreng-bg)', color: 'var(--compreng-text)', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}></textarea>
                </div>
                <button type="submit" style={{ backgroundColor: 'var(--compreng-green)', color: '#fff', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>Kirim Testimoni</button>
              </form>
            )}
          </div>
        </>

      ) : (

        /* =========================================================
           VIEW UNTUK ADMIN/EDITOR (Hanya Tabel Manajemen)
        ========================================================= */
        <div>
          <div style={styles.headerBox}>
            <div>
              <h2 style={styles.title}>Manajemen Testimoni</h2>
              <p style={styles.subtitle}>Kelola persetujuan (approval) dan data kutipan yang tampil di halaman depan.</p>
            </div>
            <button style={styles.btnPrimary} onClick={openAddModal}>
              <Plus size={16} /> Tambah Data
            </button>
          </div>

          <div style={styles.toolbar}>
            <div style={styles.searchInputWrapper}>
              <Search size={16} style={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Cari nama, role, atau kutipan..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          </div>

          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr style={{ background: 'var(--compreng-surface-soft)' }}>
                  <th style={styles.th}>Nama & Foto</th>
                  <th style={styles.th}>Role / Status</th>
                  <th style={styles.th}>Kutipan</th>
                  <th style={styles.th}>Status Tampil</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Aksi</th>
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
                    <tr key={t.id} style={{ transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--compreng-surface-soft)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={styles.td}>
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
                      <td style={{ ...styles.td, color: 'var(--compreng-text-secondary)' }}>{t.role}</td>
                      <td style={{ ...styles.td, ...styles.truncate }} title={t.quote}>{t.quote}</td>
                      <td style={styles.td}>
                        <span style={t.show === 1 ? styles.badgeActive : styles.badgePending}>
                          {t.show === 1 ? 'Ditampilkan' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        
                        {/* INLINE ACTIONS (Mencegah elemen terpotong overflow) */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <button 
                            onClick={() => handleToggleShow(t.id, t.show)} 
                            title={t.show === 1 ? 'Sembunyikan' : 'Tampilkan'}
                            style={styles.iconBtn}
                            onMouseOver={(e) => { e.currentTarget.style.background = 'var(--compreng-surface-soft)'; e.currentTarget.style.color = 'var(--compreng-text)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--compreng-text-secondary)'; }}
                          >
                            {/* IKON SUDAH DIBALIK AGAR INTUITIF SESUAI STATUS */}
                            {t.show === 1 ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                          
                          <button 
                            onClick={() => openEditModal(t)} 
                            title="Edit Data"
                            style={styles.iconBtn}
                            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)'; e.currentTarget.style.color = '#2563eb'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--compreng-text-secondary)'; }}
                          >
                            <Pencil size={16} />
                          </button>
                          
                          <button 
                            onClick={() => handleDelete(t.id)} 
                            title="Hapus Permanen"
                            style={styles.iconBtn}
                            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)'; e.currentTarget.style.color = '#dc2626'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--compreng-text-secondary)'; }}
                          >
                            <Trash2 size={16} />
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

      {/* =========================================================
          MODAL CRUD ADMIN (Style Modern Shadcn)
      ========================================================= */}
      {isModalOpen && (userRole === 'admin' || userRole === 'editor') && (
        <div className="modal-overlay">
          <div className="modal-content modern-modal">
            <div className="modal-header-modern">
              <h3>{modalMode === 'add' ? 'Tambah Data Testimoni' : 'Edit Data Testimoni'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="btn-close-modal" type="button"><X size={20} /></button>
            </div>

            <form id="admin-testi-form" onSubmit={handleAdminSubmit} className="form-modern-layout">
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

              <div className="form-group-modern upload-section">
                <label>Foto Profil (Opsional)</label>
                <div className="radio-tabs">
                  <div className={`radio-tab ${adminPhotoMode === 'url' ? 'active' : ''}`} onClick={() => setAdminPhotoMode('url')}>
                    <LinkIcon size={16}/> Link URL
                  </div>
                  <div className={`radio-tab ${adminPhotoMode === 'upload' ? 'active' : ''}`} onClick={() => setAdminPhotoMode('upload')}>
                    <UploadCloud size={16}/> Upload Foto
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
                <textarea className="input-modern" placeholder="Tulis kutipan testimoni..." value={adminFormData.quote} onChange={e => setAdminFormData({...adminFormData, quote: e.target.value})} required rows={4} style={{ resize: 'vertical' }}></textarea>
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