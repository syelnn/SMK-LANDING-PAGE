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
  Upload,
  Link as LinkIcon,
  Loader2
} from 'lucide-react';

const renderIcon = (iconValue) => {
  const props = { className: "ekskul-icon" };

  if (!iconValue) return <Shield {...props} className="ekskul-icon text-blue" />;

  // Jika berupa URL, path file, atau Base64 Image
  if (iconValue.startsWith('data:image') || iconValue.startsWith('http') || iconValue.startsWith('/uploads')) {
    return (
      <img 
        src={iconValue} 
        alt="Logo Ekskul" 
        style={{ width: '40px', height: '40px', objectFit: 'contain' }} 
      />
    );
  }

  // Normalisasi string ke lowercase agar tidak bermasalah dengan case-sensitive
  const key = iconValue.trim().toLowerCase();

  switch (key) {
    case 'shield': return <Shield {...props} className="ekskul-icon text-blue" />;
    case 'compass': return <Compass {...props} className="ekskul-icon text-green" />;
    case 'users': return <Users {...props} className="ekskul-icon text-yellow" />;
    case 'music': return <Music {...props} className="ekskul-icon text-orange" />;
    case 'swords': return <Swords {...props} className="ekskul-icon text-red" />;
    case 'activity': return <Activity {...props} className="ekskul-icon text-emerald" />;
    case 'palette': return <Palette {...props} className="ekskul-icon text-pink" />;
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

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [logoType, setLogoType] = useState('url');
  const [selectedFile, setSelectedFile] = useState(null);

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
      show: item.show !== undefined ? item.show : 1
    });
    setShowModal(true);
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

  return (
    <div className="ekskul-container">
      <div className="ekskul-header-wrapper">
        <div className="ekskul-header-text">
          <span className="ekskul-badge">Ekstrakurikuler</span>
          <h2 className="ekskul-title">
            Ekstrakurikuler <span>SMK Negeri Compreng</span>
          </h2>
          <p className="ekskul-desc">
            Wadah pengembangan minat, bakat, dan potensi siswa di luar kelas.
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

      <div className="ekskul-grid">
        {listEkskul.map((item) => (
          <div key={item.id} className="ekskul-card">
            {canAccessCRUD && (
              <div className="ekskul-card-actions">
                <button onClick={() => handleOpenEdit(item)} className="ekskul-action-btn edit" title="Edit">
                  <Edit size={14} />
                </button>
                <button onClick={() => handleDelete(item.id)} className="ekskul-action-btn delete" title="Hapus">
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            <div className="ekskul-card-content">
              <div className="ekskul-icon-box">
                {renderIcon(item.icon)}
              </div>
              <h3 className="ekskul-card-title">{item.title}</h3>
              <p className="ekskul-card-text">{item.description}</p>
            </div>


          </div>
        ))}
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

              <div className="ekskul-form-row">
                <div className="ekskul-form-group">
                  <label className="ekskul-form-label">URUTAN (OTOMATIS)</label>
                  <input 
                    type="number" 
                    min="1"
                    className="ekskul-form-input"
                    value={formData.sort_order} 
                    onChange={(e) => setFormData({...formData, sort_order: e.target.value})} 
                    required 
                  />
                </div>

                <div className="ekskul-form-group">
                  <label className="ekskul-form-label">STATUS TAMPIL</label>
                  <select
                    className="ekskul-form-select"
                    value={formData.show}
                    onChange={(e) => setFormData({...formData, show: e.target.value})}
                  >
                    <option value={1}>Ditampilkan</option>
                    <option value={0}>Sembunyi</option>
                  </select>
                </div>
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