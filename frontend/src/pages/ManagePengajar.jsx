import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit, Image as ImageIcon, Link as LinkIcon, X, MoreHorizontal, Search } from 'lucide-react';
import '../App.css';

export default function ManagePengajar() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const userRole = localStorage.getItem('role');

  const API_URL = 'http://localhost:5002/api';

  // State Modal Form
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [imageType, setImageType] = useState('url');
  const [formData, setFormData] = useState({ 
    name: '', role: '', photo: '', sort_order: 1, show: 1 
  });

  // State Dropdown Action & Pencarian
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/teacher`);
      // Urutkan berdasarkan sort_order agar rapi dari atas ke bawah
      const sortedTeachers = (res.data.data || []).sort((a, b) => {
        const orderA = a.sort_order ?? a.sortOrder ?? 99;
        const orderB = b.sort_order ?? b.sortOrder ?? 99;
        return orderA - orderB;
      });
      setTeachers(sortedTeachers);
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
      if (file.size > 2 * 1024 * 1024) return alert("Ukuran file terlalu besar! Maksimal 2MB.");
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, photo: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const openAdd = () => {
    setEditId(null);
    const maxSortOrder = teachers.length > 0 ? Math.max(...teachers.map(t => t.sort_order ?? t.sortOrder ?? 0)) : 0;
    setFormData({ name: '', role: '', photo: '', sort_order: maxSortOrder + 1, show: 1 });
    setImageType('url');
    setShowModal(true);
  };

  const openEdit = (item) => {
    setOpenDropdownId(null);
    setEditId(item.id);
    setFormData({ ...item, sort_order: item.sort_order ?? item.sortOrder ?? 0 });
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

  const handleDelete = async (id, name) => {
    setOpenDropdownId(null);
    if (!window.confirm(`Yakin ingin menghapus data pengajar "${name}"?`)) return;
    try {
      await axios.delete(`${API_URL}/teacher/${id}`);
      fetchData();
    } catch (error) {
      alert('Gagal menghapus data');
    }
  };

  // --- LOGIKA FILTER PENCARIAN ---
  const filteredTeachers = teachers.filter(teacher => {
    const term = searchTerm.toLowerCase();
    return (
      (teacher.name || '').toLowerCase().includes(term) ||
      (teacher.role || '').toLowerCase().includes(term)
    );
  });

  // --- STYLES (RESPONSIVE SHADCN ADMIN LOOK) ---
  const styles = {
    wrapper: { width: '100%', maxWidth: '1150px', margin: '0 auto', padding: '30px 24px', boxSizing: 'border-box' },
    headerBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '15px' },
    title: { fontSize: '22px', fontWeight: '700', color: 'var(--compreng-text)', margin: '0 0 4px 0', letterSpacing: '-0.02em' },
    subtitle: { fontSize: '13px', color: 'var(--compreng-text-secondary)', margin: 0 },
    
    // Buttons
    btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'var(--compreng-text)', color: 'var(--compreng-bg)', borderRadius: '6px', border: 'none', fontWeight: '500', cursor: 'pointer', fontSize: '13px', transition: 'opacity 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', whiteSpace: 'nowrap' },
    
    // Toolbar (Search)
    toolbar: { display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '16px' },
    searchInputWrapper: { position: 'relative', width: '280px', maxWidth: '100%' },
    searchInput: { width: '100%', padding: '8px 12px 8px 36px', borderRadius: '6px', border: '1px solid var(--compreng-border)', background: 'var(--compreng-surface)', color: 'var(--compreng-text)', fontSize: '13px', outline: 'none' },
    searchIcon: { position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--compreng-text-muted)' },

    // Table Styles
    tableCard: { backgroundColor: 'var(--compreng-surface)', borderRadius: '8px', border: '1px solid var(--compreng-border)', overflowX: 'auto', overflowY: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '40px', width: '100%' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' },
    th: { padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: 'var(--compreng-text-secondary)', borderBottom: '1px solid var(--compreng-border)', whiteSpace: 'nowrap' },
    td: { padding: '14px 16px', borderBottom: '1px solid var(--compreng-border)', verticalAlign: 'middle', color: 'var(--compreng-text)', fontSize: '13px' },
    
    // Helpers
    badgeActive: { display: 'inline-flex', background: 'rgba(34, 197, 94, 0.15)', color: '#16a34a', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },
    badgeInactive: { display: 'inline-flex', background: 'var(--compreng-surface-soft)', color: 'var(--compreng-text-muted)', border: '1px solid var(--compreng-border)', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },
    badgeRole: { display: 'inline-block', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' },
    
    // Dropdown Action
    actionBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', color: 'var(--compreng-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    dropdownMenu: { position: 'absolute', right: '15px', top: '70%', background: 'var(--compreng-surface)', border: '1px solid var(--compreng-border)', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '150px', padding: '4px', zIndex: 50 },
    dropdownItem: { display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 10px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', borderRadius: '4px', fontSize: '12px', fontWeight: '500', color: 'var(--compreng-text)', textDecoration: 'none', transition: 'background 0.2s' },
  };

  if (loading) return <div style={{ padding: '30px', color: 'var(--compreng-text-muted)', textAlign: 'center' }}>Memuat data pengajar...</div>;

  return (
    <div style={styles.wrapper}>
      
      <div style={styles.headerBox}>
        <div>
          <h2 style={styles.title}>Tenaga Pengajar</h2>
          <p style={styles.subtitle}>Kelola daftar guru, kepala sekolah, dan staf pengajar.</p>
        </div>
        {(userRole === 'admin' || userRole === 'editor') && (
          <button style={styles.btnPrimary} onClick={openAdd}>
            <Plus size={16} /> Tambah Pengajar
          </button>
        )}
      </div>

      {/* TOOLBAR: SEARCH (SHADCN STYLE) */}
      <div style={styles.toolbar}>
        <div style={styles.searchInputWrapper}>
          <Search size={16} style={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Cari nama atau jabatan..." 
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
              <th style={styles.th}>Nama & Gelar</th>
              <th style={styles.th}>Jabatan</th>
              <th style={{ ...styles.th, textAlign: 'center' }}>Urutan</th>
              <th style={styles.th}>Status Tampil</th>
              <th style={{ ...styles.th, textAlign: 'center' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--compreng-text-muted)', fontSize: '13px' }}>
                  {searchTerm ? `Tidak ditemukan pengajar dengan kata kunci "${searchTerm}"` : 'Belum ada data pengajar.'}
                </td>
              </tr>
            ) : (
              filteredTeachers.map((item) => (
                <tr key={item.id} style={{ transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--compreng-surface-soft)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {item.photo ? (
                        <img src={item.photo} alt="Foto" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--compreng-border)' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--compreng-green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span style={{ fontWeight: '600' }}>{item.name}</span>
                    </div>
                  </td>
                  
                  <td style={styles.td}>
                    {item.role.toLowerCase().includes('kepala') ? (
                      <span style={styles.badgeRole}>{item.role}</span>
                    ) : (
                      <span style={{ color: 'var(--compreng-text-secondary)' }}>{item.role}</span>
                    )}
                  </td>
                  
                  <td style={{ ...styles.td, textAlign: 'center', fontWeight: '600', color: 'var(--compreng-text-secondary)' }}>
                    {item.sort_order ?? item.sortOrder}
                  </td>
                  
                  <td style={styles.td}>
                    <span style={item.show === 1 ? styles.badgeActive : styles.badgeInactive}>
                      {item.show === 1 ? 'Ditampilkan' : 'Disembunyikan'}
                    </span>
                  </td>
                  
                  <td style={{ ...styles.td, textAlign: 'center', position: 'relative' }}>
                    {(userRole === 'admin' || userRole === 'editor') && (
                      <>
                        <button 
                          onClick={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)}
                          style={styles.actionBtn}
                          onMouseOver={(e) => e.currentTarget.style.background = 'var(--compreng-surface-soft)'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {openDropdownId === item.id && (
                          <>
                            <div onClick={() => setOpenDropdownId(null)} style={{ position: 'fixed', inset: 0, zIndex: 40 }}></div>
                            <div style={styles.dropdownMenu}>
                              <button onClick={() => openEdit(item)} style={styles.dropdownItem} onMouseOver={(e) => e.currentTarget.style.background = 'var(--compreng-surface-soft)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                <Edit size={14} color="var(--compreng-text-secondary)" /> Edit Data
                              </button>
                              <div style={{ margin: '2px 0', borderTop: '1px solid var(--compreng-border)' }}></div>
                              <button onClick={() => handleDelete(item.id, item.name)} style={{ ...styles.dropdownItem, color: '#dc2626' }} onMouseOver={(e) => e.currentTarget.style.background = '#fef2f2'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                <Trash2 size={14} color="#dc2626" /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ================= MODAL FORM SHADCN STYLE ================= */}
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
                  <label>Urutan Tampil (Angka)</label>
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