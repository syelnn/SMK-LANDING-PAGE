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
  Lock
} from 'lucide-react';

const renderIcon = (iconValue) => {
  const props = { className: "ekskul-icon" };

  if (iconValue && (iconValue.startsWith('data:image') || iconValue.startsWith('http') || iconValue.startsWith('/uploads'))) {
    return (
      <img 
        src={iconValue} 
        alt="Logo Ekskul" 
        style={{ width: '40px', height: '40px', objectFit: 'contain' }} 
      />
    );
  }

  switch (iconValue) {
    case 'Shield': return <Shield {...props} className="ekskul-icon text-blue" />;
    case 'Compass': return <Compass {...props} className="ekskul-icon text-green" />;
    case 'Users': return <Users {...props} className="ekskul-icon text-yellow" />;
    case 'Music': return <Music {...props} className="ekskul-icon text-orange" />;
    case 'Swords': return <Swords {...props} className="ekskul-icon text-red" />;
    case 'Activity': return <Activity {...props} className="ekskul-icon text-emerald" />;
    case 'Palette': return <Palette {...props} className="ekskul-icon text-pink" />;
    case 'Cpu': return <Cpu {...props} className="ekskul-icon text-purple" />;
    default: return <Shield {...props} className="ekskul-icon text-blue" />;
  }
};

export default function Ekstrakurikuler() {
  // Ambil data user & role dari localStorage (default ke 'viewer' jika kosong)
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = (currentUser.role || 'viewer').toLowerCase();

  // Izinkan CRUD hanya jika role 'admin' atau 'editor'
  const canAccessCRUD = userRole === 'admin' || userRole === 'editor';

  const [listEkskul, setListEkskul] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
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
    setFormData({ title: '', description: '', icon: '', sort_order: listEkskul.length + 1, show: 1 });
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
      <div style={{ maxWidth: '1100px', margin: '0 auto 30px auto', padding: '0 15px' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="ekskul-badge">Ekstrakurikuler</span>
          <h2 className="ekskul-title" style={{ marginTop: '10px' }}>
            Ekstrakurikuler <span>SMK Negeri Compreng</span>
          </h2>
          <p className="ekskul-desc" style={{ margin: '8px auto 0 auto' }}>
            Wadah pengembangan minat, bakat, dan potensi siswa di luar kelas.
          </p>
        </div>
        
        {/* Tombol Tambah HANYA Tampil untuk Admin & Editor */}
        {canAccessCRUD && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button onClick={handleOpenAdd} className="ekskul-add-btn">
              <Plus size={16} /> Tambah Ekskul
            </button>
          </div>
        )}
      </div>

      <div className="ekskul-grid">
        {listEkskul.map((item) => (
          <div key={item.id} className="ekskul-card" style={{ position: 'relative' }}>
            {/* Action Buttons HANYA Tampil untuk Admin & Editor */}
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

            <div>
              <div className="ekskul-icon-box">
                {renderIcon(item.icon)}
              </div>
              <h3 className="ekskul-card-title">{item.title}</h3>
              <p className="ekskul-card-text">{item.description}</p>
            </div>
            
            <button onClick={() => {}} className="ekskul-btn">
              Daftar Sekarang
            </button>
          </div>
        ))}
      </div>

      {/* MODAL FORM (HANYA UNTUK ADMIN & EDITOR) */}
      {showModal && canAccessCRUD && (
        <div className="ekskul-modal-overlay">
          <div className="ekskul-modal-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>
                {isEditing ? 'Edit Ekstrakurikuler' : 'Tambah Ekstrakurikuler'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Nama Ekskul */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#334155' }}>Nama Ekskul</label>
                <input 
                  type="text" 
                  className="form-control" 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  required 
                />
              </div>

              {/* Deskripsi */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#334155' }}>Deskripsi</label>
                <textarea 
                  rows="3" 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontFamily: 'inherit' }}
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>

              {/* Urutan Tampilan (Sort Order) - Hanya muncul saat Mode EDIT */}
              {isEditing && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#334155' }}>
                    Urutan Tampilan (Sort Order)
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    value={formData.sort_order} 
                    onChange={(e) => setFormData({...formData, sort_order: e.target.value})} 
                    required 
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    *Angka lebih kecil (misal: 1) akan muncul paling awal.
                  </span>
                </div>
              )}

              {/* Opsi Logo / Gambar */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#334155' }}>Logo Ekstrakurikuler</label>
                
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setLogoType('url')}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: logoType === 'url' ? '#e0f2fe' : '#ffffff',
                      color: logoType === 'url' ? '#0369a1' : '#475569',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <LinkIcon size={14} /> URL Gambar
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoType('file')}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: logoType === 'file' ? '#e0f2fe' : '#ffffff',
                      color: logoType === 'file' ? '#0369a1' : '#475569',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <Upload size={14} /> Upload File
                  </button>
                </div>

                {logoType === 'url' ? (
                  <input 
                    type="text" 
                    placeholder="Masukkan URL Gambar (https://...)"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    value={formData.icon} 
                    onChange={(e) => setFormData({...formData, icon: e.target.value})} 
                  />
                ) : (
                  <input 
                    type="file" 
                    accept="image/*"
                    style={{ width: '100%', padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    onChange={(e) => setSelectedFile(e.target.files[0])} 
                  />
                )}
              </div>

              {/* Button Action */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  style={{ padding: '8px 14px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', color: '#334155' }}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  style={{ padding: '8px 14px', backgroundColor: '#2563eb', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', color: '#ffffff' }}
                >
                  {isEditing ? 'Simpan Perubahan' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}