import React, { useState, useEffect } from 'react';
import { getImageUrl } from '../utils/media';
import axios from 'axios';
import { Plus, Trash2, Edit, X, MoreHorizontal, Search, Filter, ChevronDown, Users, Check } from 'lucide-react';
import ImageUploader from '../components/ImageUploader';
import '../css/managepengajar.css'; 
import '../App.css'; 

// ---------- Komponen kecil (di luar komponen utama agar tidak re-mount tiap render) ----------
const initialOf = (name) => (name || '?').trim().charAt(0).toUpperCase();
const roleOf = (role) => (role || '').trim().toUpperCase();
const isHeadmaster = (role) => roleOf(role).includes('KEPALA');

function Avatar({ item }) {
  return item.photo ? (
    <img className="mp-avatar" src={getImageUrl(item.photo)} alt="" loading="lazy" />
  ) : (
    <div className="mp-avatar mp-avatar-fallback" aria-hidden="true">{initialOf(item.name)}</div>
  );
}

function ShowPill({ on }) {
  return (
    <div className={`mp-pill ${on ? 'mp-pill-on' : 'mp-pill-off'}`}>
      {on ? 'Ditampilkan' : 'Disembunyikan'}
    </div>
  );
}

function EmptyState({ filtering, canEdit }) {
  return (
    <div className="mp-empty">
      <div className="mp-empty-icon">{filtering ? <Search size={20} /> : <Users size={20} />}</div>
      <div className="mp-empty-title">{filtering ? 'Tidak ada hasil' : 'Belum ada data pengajar'}</div>
      <p className="mp-empty-text">
        {filtering
          ? 'Coba kata kunci lain atau ubah filter mata pelajaran.'
          : canEdit ? 'Klik Tambah untuk menambahkan pengajar pertama.' : 'Data akan muncul di sini setelah ditambahkan.'}
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mp-wrapper" id="admin-pengajar" aria-busy="true">
      <div className="mp-head">
        <div className="mp-sk-bar" style={{ width: 180, height: 24 }} />
        <div className="mp-sk-bar" style={{ width: 280, height: 14 }} />
      </div>
      <div className="mp-skel">
        {[0, 1, 2, 3, 4].map((i) => (
          <div className="mp-sk-row" key={i}>
            <div className="mp-sk-av" />
            <div className="mp-sk-col">
              <div className="mp-sk-bar" style={{ width: '45%', height: 13 }} />
              <div className="mp-sk-bar" style={{ width: '25%', height: 11 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ManagePengajar() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const userRole = localStorage.getItem('role');

  const API_URL = 'https://smkn-compreng-api-pi.vercel.app/api';

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
  const [filterOpen, setFilterOpen] = useState(false);

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

  // Tutup dropdown filter dengan tombol Esc
  useEffect(() => {
    if (!filterOpen) return;
    const onKey = (e) => e.key === 'Escape' && setFilterOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filterOpen]);

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

  const canEdit = userRole === 'admin' || userRole === 'editor';
  const totalCount = teachers.length;
  const shownCount = teachers.filter((t) => t.show === 1).length;
  const hiddenCount = totalCount - shownCount;
  const isFiltering = Boolean(searchTerm || filterRole);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="mp-wrapper" id="admin-pengajar">

      <div className="mp-head">
        <div>
          <h2 className="mp-title">Tenaga Pengajar</h2>
          <p className="mp-subtitle">Kelola daftar guru, kepala sekolah, dan staf pengajar.</p>
        </div>
        <div className="mp-stats">
          <div className="mp-stat"><b>{totalCount}</b> total</div>
          <div className="mp-stat"><b>{shownCount}</b> ditampilkan</div>
          {hiddenCount > 0 && <div className="mp-stat"><b>{hiddenCount}</b> disembunyikan</div>}
        </div>
      </div>

      <div className="mp-toolbar">
        {/* Cari */}
        <div className="mp-search-wrapper">
          <Search size={14} className="mp-search-icon" />
          <input
            type="text"
            placeholder="Cari"
            aria-label="Cari nama atau jabatan"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mp-search-input"
          />
        </div>

        {/* Filter (dropdown kustom: popover di desktop, bottom sheet di mobile) */}
        <div className="mp-filter-wrapper">
          <button
            type="button"
            className={`mp-filter-trigger${filterRole ? ' is-active' : ''}${filterOpen ? ' is-open' : ''}`}
            onClick={() => setFilterOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={filterOpen}
            aria-label="Filter mata pelajaran"
          >
            <Filter size={14} className="mp-filter-icon" />
            <span className="mp-filter-label">{filterRole || 'Semua mapel'}</span>
            <ChevronDown size={14} className="mp-filter-arrow" />
          </button>

          {filterOpen && (
            <>
              <div className="mp-filter-backdrop" onClick={() => setFilterOpen(false)} />
              <div className="mp-filter-menu" role="listbox">
                <div className="mp-filter-sheet-title">Filter mapel</div>
                {['', ...uniqueRoles].map((role) => (
                  <button
                    key={role || 'all'}
                    type="button"
                    role="option"
                    aria-selected={filterRole === role}
                    className={`mp-filter-option${filterRole === role ? ' is-selected' : ''}`}
                    onClick={() => { setFilterRole(role); setFilterOpen(false); }}
                  >
                    <span>{role || 'Semua mapel'}</span>
                    {filterRole === role && <Check size={14} />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {canEdit && (
          <button type="button" className="mp-add-btn" onClick={openAdd}>
            <Plus size={14} />Tambah
          </button>
        )}

        {filterRole && userRole === 'admin' && (
          <button type="button" className="mp-danger-btn" onClick={() => handleDeleteRoleBatch(filterRole)}>
            <Trash2 size={14} />Hapus mapel ini
          </button>
        )}
      </div>

      {/* Tabel (tablet & desktop) */}
      <div className="mp-table-card">
        <table className="mp-table">
          <thead>
            <tr>
              <th className="mp-th" scope="col">Nama & gelar</th>
              <th className="mp-th" scope="col">Jabatan / mapel</th>
              <th className="mp-th mp-th-center" scope="col">Urutan</th>
              <th className="mp-th" scope="col">Tampil</th>
              <th className="mp-th mp-th-action" scope="col"><span className="mp-sr">Aksi</span></th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.length === 0 ? (
              <tr>
                <td colSpan="5" className="mp-td mp-td-empty">
                  <EmptyState filtering={isFiltering} canEdit={canEdit} />
                </td>
              </tr>
            ) : (
              filteredTeachers.map((item) => (
                <tr key={item.id} className="mp-tr">
                  <td className="mp-td">
                    <div className="mp-person">
                      <Avatar item={item} />
                      <div className="mp-name">{item.name}</div>
                    </div>
                  </td>
                  <td className="mp-td">
                    {isHeadmaster(item.role)
                      ? <div className="mp-chip">{roleOf(item.role)}</div>
                      : <div className="mp-role">{roleOf(item.role)}</div>}
                  </td>
                  <td className="mp-td mp-td-center mp-order">{item.sort_order ?? item.sortOrder}</td>
                  <td className="mp-td"><ShowPill on={item.show === 1} /></td>
                  <td className="mp-td mp-td-action">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={(e) => handleDropdownClick(e, item.id)}
                        className="mp-action-btn"
                        aria-label={`Aksi untuk ${item.name}`}
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

      {/* Daftar kartu (mobile) */}
      <div className="mp-mlist">
        {filteredTeachers.length === 0 ? (
          <div className="mp-mempty"><EmptyState filtering={isFiltering} canEdit={canEdit} /></div>
        ) : (
          filteredTeachers.map((item) => (
            <div key={item.id} className="mp-mcard">
              <Avatar item={item} />
              <div className="mp-mbody">
                <div className="mp-mname">{item.name}</div>
                {isHeadmaster(item.role)
                  ? <div className="mp-chip">{roleOf(item.role)}</div>
                  : <div className="mp-mrole">{roleOf(item.role)}</div>}
                <div className="mp-mmeta">
                  <ShowPill on={item.show === 1} />
                  <span className="mp-morder">Urutan {item.sort_order ?? item.sortOrder}</span>
                </div>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={(e) => handleDropdownClick(e, item.id)}
                  className="mp-action-btn"
                  aria-label={`Aksi untuk ${item.name}`}
                >
                  <MoreHorizontal size={18} />
                </button>
              )}
            </div>
          ))
        )}
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
                    <Edit size={14} color="var(--compreng-text-secondary)" /> Edit data
                  </button>
                  <div style={{ margin: '2px 0', borderTop: '1px solid var(--compreng-border)' }}></div>
                  <button onClick={() => handleDelete(targetItem.id, targetItem.name)} className="mp-dropdown-item danger">
                    <Trash2 size={14} color="currentColor" /> Hapus
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