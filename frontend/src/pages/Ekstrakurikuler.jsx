import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Compass, 
  Users, 
  Music, 
  Swords, 
  Activity, 
  Palette, 
  Cpu,
  Plus,
  Edit,
  Trash2,
  X,
  Search,
  MoreHorizontal
} from 'lucide-react';

import ImageUploader from '../components/ImageUploader';
import '../css/ekstrakurikuler.css';

const renderIcon = (iconValue) => {
  const props = { className: "ekskul-icon" };

  if (!iconValue || iconValue === 'EMPTY') return <Shield {...props} className="ekskul-icon text-blue" />;

  if (iconValue.startsWith('data:image') || iconValue.startsWith('http') || iconValue.startsWith('/uploads')) {
    return (
      <img 
        src={iconValue} 
        alt="Logo" 
        style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '4px' }} 
      />
    );
  }

  const key = iconValue.trim().toLowerCase();

  switch (key) {
    case 'shield': return <Shield {...props} className="ekskul-icon text-blue" />;
    case 'compass': return <Compass {...props} className="ekskul-icon text-green" />;
    case 'users': return <Users {...props} className="ekskul-icon text-yellow" />;
    case 'music': case 'fas fa-music': return <Music {...props} className="ekskul-icon text-orange" />;
    case 'swords': return <Swords {...props} className="ekskul-icon text-red" />;
    case 'activity': return <Activity {...props} className="ekskul-icon text-emerald" />;
    case 'palette': case 'fas fa-paint-brush': return <Palette {...props} className="ekskul-icon text-pink" />;
    case 'cpu': return <Cpu {...props} className="ekskul-icon text-purple" />;
    default: return <Shield {...props} className="ekskul-icon text-blue" />;
  }
};

export default function Ekstrakurikuler() {
  const getUserRole = () => {
    const token = localStorage.getItem('token');
    let role = (localStorage.getItem('role') || 'viewer').toLowerCase();

    if (token && token.split('.').length === 3) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          window.atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        if (payload.role) role = payload.role.toLowerCase();
      } catch (e) {
        console.error('Gagal membaca token di Ekstrakurikuler:', e);
      }
    }
    return role;
  };

  const userRole = getUserRole();
  const canAccessCRUD = userRole === 'admin' || userRole === 'editor';

  const [listEkskul, setListEkskul] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [logoType, setLogoType] = useState('url');
  const [selectedFile, setSelectedFile] = useState(null);

  // State Dropdown Action (Smart Positioning)
  const [dropdownConfig, setDropdownConfig] = useState({ id: null, right: null, top: null, bottom: null });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: '',
    sort_order: 1,
    show: 1
  });

  const fetchEkskul = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/extracurriculars');
      const result = await response.json();
      if (result.success) {
        setListEkskul(result.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Gagal memuat data ekstrakurikuler:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEkskul();
  }, []);

  // Tutup dropdown saat melakukan scroll
  useEffect(() => {
    const handleScroll = () => {
      if (dropdownConfig.id !== null) {
        setDropdownConfig({ id: null, right: null, top: null, bottom: null });
      }
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [dropdownConfig.id]);

  const handleDropdownClick = (e, itemId) => {
    e.stopPropagation();
    if (dropdownConfig.id === itemId) {
      setDropdownConfig({ id: null, right: null, top: null, bottom: null });
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const dropdownHeight = 90;

    const spaceBelow = windowHeight - rect.bottom;
    const openUpwards = spaceBelow < dropdownHeight;

    setDropdownConfig({
      id: itemId,
      right: window.innerWidth - rect.right,
      top: openUpwards ? null : rect.bottom + 4,
      bottom: openUpwards ? windowHeight - rect.top + 4 : null
    });
  };

  // Callback dari <ImageUploader>: file asli/hasil edit disimpan di state (dikirim ke backend),
  // URL-nya dipakai untuk pratinjau.
  const handleIconChange = ({ file, url }) => {
    setSelectedFile(file);
    setLogoType(file ? 'file' : 'url');
    setFormData((prev) => ({ ...prev, icon: url }));
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setLogoType('url');
    setSelectedFile(null);
    setFormData({ 
      title: '', 
      description: '', 
      icon: '', 
      sort_order: listEkskul.length + 1, 
      show: 1 
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setDropdownConfig({ id: null, right: null, top: null, bottom: null });
    setIsEditing(true);
    setCurrentId(item.id);
    setSelectedFile(null);
    setLogoType(item.icon && (item.icon.length > 200 || item.icon.startsWith('data:')) ? 'file' : 'url');
    setFormData({
      title: item.title,
      description: item.description || '',
      icon: item.icon || '',
      sort_order: item.sort_order || item.sortOrder || 1,
      show: item.show !== undefined ? Number(item.show) : 1
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const url = isEditing 
      ? `http://localhost:5002/api/extracurriculars/${currentId}` 
      : 'http://localhost:5002/api/extracurriculars';
    
    const method = isEditing ? 'PUT' : 'POST';

    try {
      // File asli dikirim apa adanya via FormData -> backend yang unduh/upload ke Cloudinary
      // dan cuma URL hasil upload yang disimpan ke database (bukan base64).
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('description', formData.description || '');
      fd.append('sort_order', Number(formData.sort_order));
      fd.append('sortOrder', Number(formData.sort_order));
      fd.append('show', Number(formData.show));

      if (logoType === 'file' && selectedFile) {
        fd.append('icon', selectedFile);
      } else {
        fd.append('icon', formData.icon || '');
      }

      const response = await fetch(url, {
        method: method,
        body: fd
      });

      const result = await response.json();

      if (result.success) {
        setShowModal(false);
        fetchEkskul();
      } else {
        alert(result.message || 'Gagal menyimpan data');
      }
    } catch (error) {
      console.error('Error saat menyimpan:', error);
      alert('Terjadi kesalahan pada server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDropdownConfig({ id: null, right: null, top: null, bottom: null });
    if (!window.confirm('Apakah kamu yakin ingin menghapus ekstrakurikuler ini?')) return;

    try {
      const response = await fetch(`http://localhost:5002/api/extracurriculars/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();

      if (result.success) {
        fetchEkskul();
      } else {
        alert(result.message || 'Gagal menghapus');
      }
    } catch (error) {
      console.error('Error saat menghapus:', error);
    }
  };

  if (loading) {
    return <div className="text-center text-muted" style={{ padding: '40px' }}>Memuat data ekstrakurikuler...</div>;
  }

  // Filter Publik
  const baseList = canAccessCRUD 
    ? listEkskul 
    : listEkskul.filter(item => Number(item.show) === 1);

  // Filter Search
  const filteredList = baseList.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="ekskul-container">
      {/* HEADER SECTION */}
      <div className="ekskul-header-wrapper">
        <div className="ekskul-header-text">
          <h2 className="ekskul-title">Kelola Ekstrakurikuler</h2>
          <p className="ekskul-desc">Kelola seluruh ekstrakurikuler SMK Negeri Compreng di sini.</p>
        </div>

        {canAccessCRUD && (
          <div className="ekskul-add-wrapper">
            <button className="ekskul-add-btn" onClick={handleOpenAdd}>
              <Plus size={16} /> Tambah Ekskul
            </button>
          </div>
        )}
      </div>

      {/* TABLE CARD */}
      <div className="ekskul-table-card">
        {/* SEARCH BAR */}
        <div className="ekskul-search-wrapper">
          <div className="ekskul-search-input-box">
            <Search size={16} className="ekskul-search-icon" />
            <input 
              type="text" 
              placeholder="Cari nama atau deskripsi ekstrakurikuler..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ekskul-search-input"
            />
          </div>
        </div>

        {/* TABLE CONTENT */}
        <div className="ekskul-table-responsive">
          <table className="ekskul-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Logo</th>
                <th>Nama Ekstrakurikuler</th>
                <th>Deskripsi</th>
                <th style={{ textAlign: 'center' }}>Urutan</th>
                <th>Status</th>
                <th style={{ textAlign: 'center', width: '50px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted" style={{ padding: '40px' }}>
                    {searchQuery ? `Tidak ditemukan ekstrakurikuler dengan kata kunci "${searchQuery}"` : 'Belum ada data ekstrakurikuler.'}
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="ekskul-table-icon">
                        {renderIcon(item.icon)}
                      </div>
                    </td>
                    
                    <td>
                      <span className="font-semibold text-dark">{item.title}</span>
                    </td>

                    <td>
                      <span className="text-muted">
                        {item.description || '-'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }} className="font-semibold text-muted">
                      {item.sort_order || item.sortOrder || 1}
                    </td>

                    <td>
                      <span className={`badge-status ${Number(item.show) === 1 ? 'show' : 'hide'}`}>
                        {Number(item.show) === 1 ? 'Tampil' : 'Sembunyi'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      {canAccessCRUD && (
                        <div className="dropdown-action-wrapper">
                          <button 
                            onClick={(e) => handleDropdownClick(e, item.id)}
                            className="btn-more-action"
                          >
                            <MoreHorizontal size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DROPDOWN MENU (PORTAL-STYLE POSITIONING) */}
      {dropdownConfig.id && (
        <>
          <div 
            onClick={() => setDropdownConfig({ id: null, right: null, top: null, bottom: null })} 
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          ></div>
          
          <div 
            className="dropdown-action-menu" 
            style={{ 
              position: 'fixed', 
              right: dropdownConfig.right, 
              ...(dropdownConfig.top !== null ? { top: dropdownConfig.top } : {}),
              ...(dropdownConfig.bottom !== null ? { bottom: dropdownConfig.bottom } : {}),
              zIndex: 50 
            }}
          >
            {(() => {
              const targetItem = listEkskul.find(t => t.id === dropdownConfig.id);
              if (!targetItem) return null;
              return (
                <>
                  <button onClick={() => handleOpenEdit(targetItem)} className="dropdown-item">
                    <Edit size={14} /> Edit Data
                  </button>
                  <button onClick={() => handleDelete(targetItem.id)} className="dropdown-item danger">
                    <Trash2 size={14} /> Delete
                  </button>
                </>
              );
            })()}
          </div>
        </>
      )}

      {/* MODAL FORM */}
      {showModal && canAccessCRUD && (
        <div className="ekskul-modal-overlay">
          <div className="ekskul-modal-box">
            <div className="ekskul-modal-header">
              <h3>{isEditing ? 'Edit Ekstrakurikuler' : 'Tambah Ekstrakurikuler Baru'}</h3>
              <button onClick={() => !isSubmitting && setShowModal(false)} className="ekskul-close-btn">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="ekskul-modal-body">
              <div className="ekskul-form-group">
                <label className="ekskul-form-label">Nama Ekstrakurikuler</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Paskibra, Pramuka, Futsal" 
                  className="ekskul-form-input" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  required 
                />
              </div>
              
              <div className="ekskul-form-group">
                <label className="ekskul-form-label">Deskripsi</label>
                <textarea 
                  rows="3" 
                  placeholder="Penjelasan singkat mengenai ekstrakurikuler..." 
                  className="ekskul-form-textarea" 
                  style={{ resize: 'vertical' }}
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="ekskul-form-group">
                  <label className="ekskul-form-label">Urutan Tampil</label>
                  <input 
                    type="number" 
                    min="1"
                    className="ekskul-form-input" 
                    value={formData.sort_order} 
                    onChange={e => setFormData({...formData, sort_order: e.target.value})} 
                    required 
                  />
                </div>
                <div className="ekskul-form-group">
                  <label className="ekskul-form-label">Status Tampil</label>
                  <select 
                    className="ekskul-form-input" 
                    value={formData.show} 
                    onChange={e => setFormData({...formData, show: Number(e.target.value)})}
                  >
                    <option value={1}>Ditampilkan</option>
                    <option value={0}>Disembunyikan</option>
                  </select>
                </div>
              </div>

              <div className="ekskul-logo-box">
                <label className="ekskul-form-label">Logo / Icon Ekstrakurikuler</label>
                <ImageUploader
                  value={formData.icon}
                  onChange={handleIconChange}
                  aspect={1}
                  defaultMode="url"
                  previewLabel="PRATINJAU LOGO / IKON"
                  urlPlaceholder="https://contoh.com/foto.jpg (Atau ketik: shield, music, dsb)"
                  editorTitle="Edit Logo / Ikon"
                  renderTextPreview={(val) => (
                    <div style={{
                      width: '80px', height: '80px', borderRadius: '8px',
                      border: '1px solid var(--compreng-border)', background: 'var(--compreng-bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}>
                      {renderIcon(val)}
                    </div>
                  )}
                />
              </div>

              <div className="ekskul-modal-actions">
                <button type="button" disabled={isSubmitting} onClick={() => setShowModal(false)} className="ekskul-btn-cancel">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="ekskul-btn-submit">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}