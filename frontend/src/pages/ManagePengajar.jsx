import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit, Image as ImageIcon, Link as LinkIcon, X, MoreHorizontal, Search } from 'lucide-react';
import '../css/managepengajar.css'; // Import file CSS yang baru dibuat
import '../App.css'; // Pertahankan untuk class modal overlay bawaan

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

  // State Dropdown Action (SMART POSITIONING)
  const [dropdownConfig, setDropdownConfig] = useState({ id: null, right: null, top: null, bottom: null });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/teacher`);
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

  // Tutup dropdown saat user melakukan scroll
  useEffect(() => {
    const handleScroll = () => {
      if (dropdownConfig.id !== null) {
        setDropdownConfig({ id: null, right: null, top: null, bottom: null });
      }
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [dropdownConfig.id]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("Ukuran file terlalu besar! Maksimal 2MB.");
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, photo: reader.result });
      reader.readAsDataURL(file);
    }
  };

  // --- SMART DROPDOWN LOGIC ---
  const handleDropdownClick = (e, teacherId) => {
    e.stopPropagation();
    if (dropdownConfig.id === teacherId) {
      setDropdownConfig({ id: null, right: null, top: null, bottom: null });
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const dropdownHeight = 90; // Estimasi tinggi menu (Edit + Delete)
    
    const spaceBelow = windowHeight - rect.bottom;
    const openUpwards = spaceBelow < dropdownHeight;

    setDropdownConfig({
      id: teacherId,
      right: window.innerWidth - rect.right,
      top: openUpwards ? null : rect.bottom + 4,
      bottom: openUpwards ? windowHeight - rect.top + 4 : null
    });
  };

  const openAdd = () => {
    setEditId(null);
    const maxSortOrder = teachers.length > 0 ? Math.max(...teachers.map(t => t.sort_order ?? t.sortOrder ?? 0)) : 0;
    setFormData({ name: '', role: '', photo: '', sort_order: maxSortOrder + 1, show: 1 });
    setImageType('url');
    setShowModal(true);
  };

  const openEdit = (item) => {
    setDropdownConfig({ id: null, right: null, top: null, bottom: null });
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
    setDropdownConfig({ id: null, right: null, top: null, bottom: null });
    if (!window.confirm(`Yakin ingin menghapus data pengajar "${name}"?`)) return;
    try {
      await axios.delete(`${API_URL}/teacher/${id}`);
      fetchData();
    } catch (error) {
      alert('Gagal menghapus data');
    }
  };

  const filteredTeachers = teachers.filter(teacher => {
    const term = searchTerm.toLowerCase();
    return (
      (teacher.name || '').toLowerCase().includes(term) ||
      (teacher.role || '').toLowerCase().includes(term)
    );
  });

  if (loading) return <div style={{ padding: '30px', color: 'var(--compreng-text-muted)', textAlign: 'center' }}>Memuat data pengajar...</div>;

  return (
    <div className="mp-wrapper">
      
      <div className="mp-header-box">
        <div>
          <h2 className="mp-title">Tenaga Pengajar</h2>
          <p className="mp-subtitle">Kelola daftar guru, kepala sekolah, dan staf pengajar.</p>
        </div>
        {(userRole === 'admin' || userRole === 'editor') && (
          <button className="btn-modern-primary" onClick={openAdd}>
            <Plus size={16} /> Tambah Pengajar
          </button>
        )}
      </div>

      <div className="mp-toolbar">
        <div className="mp-search-wrapper">
          <Search size={16} className="mp-search-icon" />
          <input 
            type="text" 
            placeholder="Cari nama atau jabatan..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mp-search-input"
          />
        </div>
      </div>

      <div className="mp-table-card">
        <table className="mp-table">
          <thead>
            <tr>
              <th className="mp-th">Nama & Gelar</th>
              <th className="mp-th">Jabatan</th>
              <th className="mp-th" style={{ textAlign: 'center' }}>Urutan</th>
              <th className="mp-th">Status Tampil</th>
              <th className="mp-th" style={{ textAlign: 'center' }}></th>
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
                <tr key={item.id} className="mp-tr">
                  <td className="mp-td">
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
                  
                  <td className="mp-td">
                    {item.role.toLowerCase().includes('kepala') ? (
                      <span className="mp-badge-role">{item.role}</span>
                    ) : (
                      <span style={{ color: 'var(--compreng-text-secondary)' }}>{item.role}</span>
                    )}
                  </td>
                  
                  <td className="mp-td" style={{ textAlign: 'center', fontWeight: '600', color: 'var(--compreng-text-secondary)' }}>
                    {item.sort_order ?? item.sortOrder}
                  </td>
                  
                  <td className="mp-td">
                    <span className={item.show === 1 ? 'mp-badge-active' : 'mp-badge-inactive'}>
                      {item.show === 1 ? 'Ditampilkan' : 'Disembunyikan'}
                    </span>
                  </td>
                  
                  <td className="mp-td" style={{ textAlign: 'center', position: 'relative' }}>
                    {(userRole === 'admin' || userRole === 'editor') && (
                      <button 
                        onClick={(e) => handleDropdownClick(e, item.id)}
                        className="mp-action-btn"
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* =======================================================
          DROPDOWN MENU BERADA DI LUAR TABEL (SMART POSITIONING)
      ======================================================= */}
      {dropdownConfig.id && (
        <>
          <div 
            onClick={() => setDropdownConfig({ id: null, right: null, top: null, bottom: null })} 
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          ></div>
          
          <div 
            className="mp-dropdown-menu" 
            style={{ 
              position: 'fixed', 
              right: dropdownConfig.right, 
              ...(dropdownConfig.top !== null ? { top: dropdownConfig.top } : {}),
              ...(dropdownConfig.bottom !== null ? { bottom: dropdownConfig.bottom } : {}),
              zIndex: 50 
            }}
          >
            {(() => {
              const targetItem = teachers.find(t => t.id === dropdownConfig.id);
              if (!targetItem) return null;
              return (
                <>
                  <button onClick={() => openEdit(targetItem)} className="mp-dropdown-item">
                    <Edit size={14} color="var(--compreng-text-secondary)" /> Edit Data
                  </button>
                  <div style={{ margin: '2px 0', borderTop: '1px solid var(--compreng-border)' }}></div>
                  <button onClick={() => handleDelete(targetItem.id, targetItem.name)} className="mp-dropdown-item danger">
                    <Trash2 size={14} color="currentColor" /> Delete
                  </button>
                </>
              );
            })()}
          </div>
        </>
      )}

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

              <div className="modal-actions-modern" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
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