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
  X
} from 'lucide-react';

const renderIcon = (iconName) => {
  const props = { className: "ekskul-icon" };
  switch (iconName) {
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
  const [listEkskul, setListEkskul] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'Shield',
    iconColor: '#14b8a6',
    sort_order: 0,
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
    setFormData({ title: '', description: '', icon: 'Shield', iconColor: '#14b8a6', sort_order: 0, show: 1 });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setCurrentId(item.id);
    setFormData({
      title: item.title,
      description: item.description || '',
      icon: item.icon || 'Shield',
      iconColor: item.iconColor || '#14b8a6',
      sort_order: item.sortOrder || 0,
      show: item.show !== undefined ? item.show : 1
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isEditing 
      ? `http://localhost:5002/api/extracurriculars/${currentId}` 
      : 'http://localhost:5002/api/extracurriculars';
    
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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
      {/* Judul, Deskripsi di Tengah, dan Tombol di Pojok Kanan dalam 1 Wrapper */}
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
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button onClick={handleOpenAdd} className="ekskul-add-btn">
            <Plus size={16} /> Tambah Ekskul
          </button>
        </div>
      </div>

      <div className="ekskul-grid">
        {listEkskul.map((item) => (
          <div key={item.id} className="ekskul-card" style={{ position: 'relative' }}>
            {/* Tombol Aksi Edit & Hapus */}
            <div className="ekskul-card-actions">
              <button onClick={() => handleOpenEdit(item)} className="ekskul-action-btn edit" title="Edit">
                <Edit size={14} />
              </button>
              <button onClick={() => handleDelete(item.id)} className="ekskul-action-btn delete" title="Hapus">
                <Trash2 size={14} />
              </button>
            </div>

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

      {/* MODAL FORM */}
      {showModal && (
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

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#334155' }}>Deskripsi</label>
                <textarea 
                  rows="3" 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontFamily: 'inherit' }}
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#334155' }}>Pilih Icon</label>
                <select 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff' }}
                  value={formData.icon} 
                  onChange={(e) => setFormData({...formData, icon: e.target.value})}
                >
                  <option value="Shield">Shield (Paskibra)</option>
                  <option value="Compass">Compass (Pramuka)</option>
                  <option value="Users">Users (Pasustar)</option>
                  <option value="Music">Music (Marching Band)</option>
                  <option value="Swords">Swords (Silat)</option>
                  <option value="Activity">Activity (Futsal)</option>
                  <option value="Palette">Palette (Seni Tari)</option>
                  <option value="Cpu">Cpu (E-sport)</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#334155' }}>Urutan (Sort Order)</label>
                <input 
                  type="number" 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  value={formData.sort_order} 
                  onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})} 
                />
              </div>

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