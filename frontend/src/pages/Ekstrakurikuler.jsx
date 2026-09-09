import React, { useState, useEffect, useRef } from 'react';
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
  Upload,
  Link as LinkIcon,
  Loader2,
  Search,
  MoreHorizontal
} from 'lucide-react';

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

  // State & Ref untuk mengontrol Dropdown Aksi (Titik Tiga)
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const dropdownRef = useRef(null);

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

  // Menutup dropdown secara otomatis saat mengklik luar area menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    setIsEditing(true);
    setCurrentId(item.id);
    setSelectedFile(null);
    setLogoType('url');
    setFormData({
      title: item.title,
      description: item.description || '',
      icon: item.icon || '',
      sort_order: item.sort_order || item.sortOrder || 1,
      show: item.show !== undefined ? Number(item.show) : 1
    });
    setShowModal(true);
    setActiveDropdownId(null);
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const url = isEditing 
      ? `http://localhost:5002/api/extracurriculars/${currentId}` 
      : 'http://localhost:5002/api/extracurriculars';
    
    const method = isEditing ? 'PUT' : 'POST';

    try {
      let iconValue = formData.icon;

      if (logoType === 'file' && selectedFile) {
        iconValue = await convertFileToBase64(selectedFile);
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        icon: iconValue,
        sort_order: Number(formData.sort_order),
        sortOrder: Number(formData.sort_order),
        show: Number(formData.show)
      };

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
    setActiveDropdownId(null);
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
    return <div className="text-center py-5" style={{ color: '#64748b' }}>Memuat data ekstrakurikuler...</div>;
  }

  // Filter Publik
  const baseList = canAccessCRUD 
    ? listEkskul 
    : listEkskul.filter(item => Number(item.show) === 1);

  // Filter Search berdasarkan Nama Ekstrakurikuler dan Deskripsi
  const filteredList = baseList.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="ekskul-container">
      {/* HEADER MODEL FOTO 2 */}
      <div className="ekskul-header-wrapper">
        <div className="ekskul-header-text">
          <h2 className="ekskul-title">Kelola Ekstrakurikuler</h2>
          <p className="ekskul-desc">
            Kelola seluruh ekstrakurikuler SMK Negeri Compreng di sini.
          </p>
        </div>
        
        {canAccessCRUD && (
          <div className="ekskul-add-wrapper">
            <button onClick={handleOpenAdd} className="ekskul-add-btn">
              <Plus size={16} /> Tambah Ekskul
            </button>
          </div>
        )}
      </div>

      {/* KARTU UTAMA DENGAN FILTER SEARCH & TABEL */}
      <div className="ekskul-table-card">
        {/* INPUT SEARCH */}
        <div className="ekskul-search-wrapper">
          <div className="ekskul-search-input-box">
            <Search size={18} className="ekskul-search-icon" />
            <input
              type="text"
              placeholder="Cari ekstrakurikuler..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ekskul-search-input"
            />
          </div>
        </div>

        {/* TABEL RESPONSIVE */}
        <div className="ekskul-table-responsive">
          <table className="ekskul-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>No</th>
                <th style={{ width: '70px' }}>Logo</th>
                <th>Nama Ekstrakurikuler</th>
                <th>Deskripsi</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Urutan</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Status</th>
                {canAccessCRUD && <th style={{ width: '80px', textAlign: 'center' }}>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={canAccessCRUD ? 7 : 6} className="text-center py-4" style={{ padding: '30px', color: '#64748b' }}>
                    Belum ada data ekstrakurikuler yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="ekskul-table-icon">
                        {renderIcon(item.icon)}
                      </div>
                    </td>
                    <td className="font-semibold text-dark">{item.title}</td>
                    <td className="text-muted">{item.description || '-'}</td>
                    <td className="text-center">{item.sort_order || item.sortOrder || 1}</td>
                    <td className="text-center">
                      {Number(item.show) === 1 ? (
                        <span className="badge-status show">Tampil</span>
                      ) : (
                        <span className="badge-status hide">Sembunyi</span>
                      )}
                    </td>
                    {canAccessCRUD && (
                      <td className="text-center">
                        <div 
                          className="dropdown-action-wrapper" 
                          ref={activeDropdownId === item.id ? dropdownRef : null}
                        >
                          <button 
                            type="button"
                            className="btn-more-action" 
                            onClick={() => setActiveDropdownId(activeDropdownId === item.id ? null : item.id)}
                            title="Opsi Aksi"
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          {activeDropdownId === item.id && (
                            <div className="dropdown-action-menu">
                              <button 
                                type="button" 
                                onClick={() => handleOpenEdit(item)} 
                                className="dropdown-item"
                              >
                                <Edit size={14} /> Edit Data
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleDelete(item.id)} 
                                className="dropdown-item danger"
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM RESPONSIVE */}
      {showModal && canAccessCRUD && (
        <div className="ekskul-modal-overlay">
          <div className="ekskul-modal-box">
            <div className="ekskul-modal-header">
              <h3>{isEditing ? 'Edit Ekstrakurikuler' : 'Tambah Ekstrakurikuler Baru'}</h3>
              <button 
                type="button" 
                onClick={() => !isSubmitting && setShowModal(false)}
                className="ekskul-close-btn"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="ekskul-modal-body">
              <div className="ekskul-form-group">
                <label className="ekskul-form-label">NAMA EKSTRAKURIKULER</label>
                <input 
                  type="text" 
                  className="ekskul-form-input"
                  placeholder="Contoh: Paskibra, Pramuka, Futsal"
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  required 
                />
              </div>

              <div className="ekskul-form-group">
                <label className="ekskul-form-label">DESKRIPSI</label>
                <textarea 
                  rows="3" 
                  className="ekskul-form-textarea"
                  placeholder="Penjelasan singkat mengenai ekstrakurikuler..."
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>

              <div className="ekskul-form-group">
                <label className="ekskul-form-label">URUTAN</label>
                <input 
                  type="number" 
                  min="1"
                  className="ekskul-form-input"
                  value={formData.sort_order} 
                  onChange={(e) => setFormData({...formData, sort_order: e.target.value})} 
                  required 
                />
              </div>

              <div className="ekskul-logo-box">
                <label className="ekskul-form-label">LOGO / ICON EKSTRAKURIKULER</label>
                
                <div className="ekskul-tab-container">
                  <button
                    type="button"
                    onClick={() => setLogoType('url')}
                    className={`ekskul-tab-btn ${logoType === 'url' ? 'active' : ''}`}
                  >
                    <LinkIcon size={14} /> Link URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoType('file')}
                    className={`ekskul-tab-btn ${logoType === 'file' ? 'active' : ''}`}
                  >
                    <Upload size={14} /> Upload Foto
                  </button>
                </div>

                {logoType === 'url' ? (
                  <input 
                    type="text" 
                    placeholder="https://contoh.com/foto.jpg"
                    className="ekskul-form-input white-bg"
                    value={formData.icon} 
                    onChange={(e) => setFormData({...formData, icon: e.target.value})} 
                  />
                ) : (
                  <input 
                    type="file" 
                    accept="image/*"
                    className="ekskul-form-input white-bg"
                    onChange={(e) => setSelectedFile(e.target.files[0])} 
                  />
                )}
              </div>

              <div className="ekskul-checkbox-group">
                <label className="ekskul-checkbox-label">
                  <input 
                    type="checkbox"
                    checked={Number(formData.show) === 1}
                    onChange={(e) => setFormData({ ...formData, show: e.target.checked ? 1 : 0 })}
                  />
                  <span>TAMPILKAN EKSTRAKURIKULER (PUBLIC)</span>
                </label>
              </div>

              <div className="ekskul-modal-actions">
                <button 
                  type="button" 
                  disabled={isSubmitting}
                  onClick={() => setShowModal(false)} 
                  className="ekskul-btn-cancel"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="ekskul-btn-submit"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="ekskul-spinner" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Data'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}