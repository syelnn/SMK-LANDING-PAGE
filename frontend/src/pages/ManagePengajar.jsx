import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit, X, MoreHorizontal, Search, Filter, ChevronDown } from 'lucide-react';
import ImageUploader from '../components/ImageUploader';
import '../css/managepengajar.css'; 
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
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', role: '', photo: '', sort_order: 1, show: 1 
  });
  const [isCustomRole, setIsCustomRole] = useState(false);

  // State Dropdown Action & Filter
  const [dropdownConfig, setDropdownConfig] = useState({ id: null, right: null, top: null, bottom: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState(''); 

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

  useEffect(() => {
    const handleScroll = () => {
      if (dropdownConfig.id !== null) {
        setDropdownConfig({ id: null, right: null, top: null, bottom: null });
      }
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [dropdownConfig.id]);

  // Callback dari <ImageUploader>: file asli/hasil edit disimpan di state (dikirim ke backend),
  // URL-nya dipakai untuk pratinjau.
  const handlePhotoChange = ({ file, url }) => {
    setSelectedFile(file);
    setImageType(file ? 'file' : 'url');
    setFormData((prev) => ({ ...prev, photo: url }));
  };

  const handleDropdownClick = (e, teacherId) => {
    e.stopPropagation();
    if (dropdownConfig.id === teacherId) {
      setDropdownConfig({ id: null, right: null, top: null, bottom: null });
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const dropdownHeight = 90; 
    
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
    setSelectedFile(null);
    setIsCustomRole(false); 
    setShowModal(true);
  };

  const openEdit = (item) => {
    setDropdownConfig({ id: null, right: null, top: null, bottom: null });
    setEditId(item.id);
    setFormData({ ...item, sort_order: item.sort_order ?? item.sortOrder ?? 0 });
    setImageType(item.photo && item.photo.length > 200 ? 'file' : 'url');
    setSelectedFile(null);
    setIsCustomRole(false); 
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // File asli dikirim via FormData -> backend upload ke Cloudinary,
      // hanya URL hasilnya yang disimpan ke database (bukan base64).
      const fd = new FormData();
      fd.append('name', formData.name || '');
      fd.append('role', formData.role || '');
      fd.append('sort_order', formData.sort_order);
      fd.append('show', formData.show);
      fd.append('photo', imageType === 'file' && selectedFile ? selectedFile : (formData.photo || ''));

      if (editId) {
        await axios.put(`${API_URL}/teacher/${editId}`, fd);
      } else {
        await axios.post(`${API_URL}/teacher`, fd);
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

  // 1. Ekstrak daftar mapel/jabatan unik (Otomatis Kapital)
  const rawRoles = teachers.map(t => (t.role || '').trim().toUpperCase()).filter(Boolean);
  const uniqueRoles = [...new Set(rawRoles)].sort();

  // 2. Modifikasi logika filter agar mencocokkan data
  const filteredTeachers = teachers.filter(teacher => {
    const term = searchTerm.toLowerCase();
    const teacherRole = (teacher.role || '').trim().toUpperCase();
    
    const matchesSearch = (teacher.name || '').toLowerCase().includes(term) || teacherRole.toLowerCase().includes(term);
    const matchesRole = filterRole === '' || teacherRole === filterRole;
    
    return matchesSearch && matchesRole;
  });

  // Hapus Massal berdasarkan Mapel (Pembersihan Duplikat/Salah Ketik)
  const handleDeleteRoleBatch = async (roleName) => {
    if (!window.confirm(`YAWAS! Anda akan MENGHAPUS SEMUA guru dengan jabatan "${roleName}". Lanjutkan?`)) return;
    try {
      const teachersToDelete = teachers.filter(t => (t.role || '').trim().toUpperCase() === roleName);
      for (const t of teachersToDelete) {
        await axios.delete(`${API_URL}/teacher/${t.id}`);
      }
      setFilterRole('');
      fetchData();
      alert(`Berhasil menghapus ${teachersToDelete.length} data guru dengan jabatan ${roleName}`);
    } catch (error) {
      alert('Gagal menghapus data secara massal');
    }
  };

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
        
        {/* Tambahan Filter Dropdown Mapel (Modern UI) */}
        <div className="mp-filter-wrapper">
          <Filter size={16} className="mp-filter-icon" />
          <select 
            className="mp-filter-select"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="">Semua Mata Pelajaran</option>
            {uniqueRoles.map((role, idx) => (
              <option key={idx} value={role}>{role}</option>
            ))}
          </select>
          <ChevronDown size={14} className="mp-filter-arrow" />
        </div>
        
        {/* Tombol Hapus Massal (Muncul jika ada filter aktif) */}
        {filterRole && (userRole === 'admin') && (
           <button 
             onClick={() => handleDeleteRoleBatch(filterRole)}
             style={{ background: 'var(--compreng-surface-soft, #f1f5f9)', color: '#dc2626', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}
           >
             <Trash2 size={14} /> Hapus Mapel Ini
           </button>
        )}
      </div>

      <div className="mp-table-card">
        <table className="mp-table">
          <thead>
            <tr>
              <th className="mp-th">Nama & Gelar</th>
              <th className="mp-th">Jabatan / Mapel</th>
              <th className="mp-th" style={{ textAlign: 'center' }}>Urutan</th>
              <th className="mp-th">Status Tampil</th>
              <th className="mp-th" style={{ textAlign: 'center' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--compreng-text-muted)', fontSize: '13px' }}>
                  {searchTerm || filterRole ? `Tidak ditemukan data yang sesuai kriteria pencarian.` : 'Belum ada data pengajar.'}
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
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--compreng-green)', color: 'var(--compreng-accent-text, #ffffff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span style={{ fontWeight: '600' }}>{item.name}</span>
                    </div>
                  </td>
                  
                  <td className="mp-td">
                    {/* Selalu cetak dalam huruf besar */}
                    {item.role.toUpperCase().includes('KEPALA') ? (
                      <span className="mp-badge-role">{item.role.toUpperCase()}</span>
                    ) : (
                      <span style={{ color: 'var(--compreng-text-secondary)' }}>{item.role.toUpperCase()}</span>
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
                        style={{ margin: '0 auto' }}
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

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content modern-modal">
            <div className="modal-header-modern">
              <h3>{editId ? 'Edit Data Pengajar' : 'Tambah Pengajar Baru'}</h3>
              <button onClick={() => setShowModal(false)} className="btn-close-modal"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="form-modern-layout">
              <div className="form-group-modern">
                <label>NAMA LENGKAP & GELAR</label>
                <input type="text" placeholder="Contoh: Budi Santoso, S.Pd." className="input-modern" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="form-group-modern">
                  <label>JABATAN / POSISI / MAPEL</label>
                  
                  {!isCustomRole ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select 
                        className="input-modern" 
                        style={{ flex: 1 }}
                        value={formData.role.toUpperCase()} 
                        onChange={(e) => {
                          if (e.target.value === 'LAINNYA') {
                            setIsCustomRole(true);
                            setFormData({ ...formData, role: '' }); 
                          } else {
                            setFormData({ ...formData, role: e.target.value });
                          }
                        }} 
                        required
                      >
                        <option value="" disabled>-- Pilih Jabatan / Mapel --</option>
                        {uniqueRoles.map((roleItem, idx) => (
                          <option key={idx} value={roleItem}>{roleItem}</option>
                        ))}
                        <option value="LAINNYA" style={{ fontWeight: 'bold', color: '#16a34a' }}>
                          + Ketik Jabatan Baru...
                        </option>
                      </select>

                      <button 
                        type="button" 
                        onClick={() => setIsCustomRole(true)}
                        className="btn-modern-secondary"
                        style={{ padding: '0 12px' }}
                        title="Ketik / Edit Manual"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="Ketik mapel baru..." 
                        className="input-modern" 
                        style={{ flex: 1, textTransform: 'uppercase' }} 
                        value={formData.role} 
                        onChange={e => setFormData({...formData, role: e.target.value.toUpperCase()})} // <--- AUTO CAPSLOCK DI SINI
                        required 
                        autoFocus
                      />
                      <button 
                        type="button" 
                        onClick={() => setIsCustomRole(false)}
                        className="btn-modern-secondary"
                        style={{ padding: '0 12px' }}
                        title="Kembali ke pilihan dropdown"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              
              <div className="form-row-modern" style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group-modern" style={{ flex: 1 }}>
                  <label>URUTAN TAMPIL (ANGKA)</label>
                  <input type="number" className="input-modern" value={formData.sort_order} onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value)})} required />
                </div>
                <div className="form-group-modern" style={{ flex: 1 }}>
                  <label>STATUS TAMPIL</label>
                  <select className="input-modern" value={formData.show} onChange={e => setFormData({...formData, show: parseInt(e.target.value)})}>
                    <option value={1}>Ditampilkan</option>
                    <option value={0}>Disembunyikan</option>
                  </select>
                </div>
              </div>

              <div className="form-group-modern upload-section">
                <label>FOTO PROFIL</label>
                <ImageUploader
                  value={formData.photo}
                  onChange={handlePhotoChange}
                  aspect={1}
                  shape="round"
                  maxSizeMB={2}
                  previewLabel="PRATINJAU FOTO PROFIL"
                  urlPlaceholder="https://contoh.com/foto.jpg"
                  editorTitle="Edit Foto Profil"
                />
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