import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, ArrowLeft, Star } from 'lucide-react';

export default function Galeri() {
  const storedUser = localStorage.getItem('userData') || localStorage.getItem('user') || '{}';
  const currentUser = JSON.parse(storedUser);
  const userRole = (currentUser.role || currentUser.user?.role || 'admin').toLowerCase();
  const canAccessCRUD = userRole === 'admin' || userRole === 'editor';

  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('albums');
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [logoType, setLogoType] = useState('url');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    category: '', caption: '', image: '', is_featured: 0, sort_order: 1, show: 1
  });

  const fetchGalleries = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/galleries');
      const result = await response.json();
      if (result.success) setGalleries(result.data);
      setLoading(false);
    } catch (error) {
      console.error('Gagal memuat galeri:', error);
      setLoading(false);
    }
  };

  useEffect(() => { fetchGalleries(); }, []);

  const groupedGalleries = galleries.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const openAlbum = (categoryName) => { setSelectedAlbum(categoryName); setViewMode('detail'); };
  const backToAlbums = () => { setSelectedAlbum(null); setViewMode('albums'); };

  const handleOpenAddAlbum = () => {
    setIsEditing(false); setLogoType('url'); setSelectedFile(null);
    setFormData({ category: '', caption: '', image: '', is_featured: 1, sort_order: 1, show: 1 });
    setShowModal(true);
  };

  const handleOpenAddPhoto = () => {
    setIsEditing(false); setLogoType('url'); setSelectedFile(null);
    setFormData({ category: selectedAlbum, caption: '', image: '', is_featured: 0, sort_order: 1, show: 1 });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditing(true); setCurrentId(item.id); setSelectedFile(null); setLogoType('url');
    setFormData({ ...item, sort_order: item.sort_order || item.sortOrder || 1, is_featured: item.isFeatured || item.is_featured || 0 });
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
    const url = isEditing ? `http://localhost:5002/api/galleries/${currentId}` : 'http://localhost:5002/api/galleries';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      let imgValue = formData.image;
      if (logoType === 'file' && selectedFile) imgValue = await convertFileToBase64(selectedFile);

      const payload = { ...formData, image: imgValue, is_featured: Number(formData.is_featured) };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await res.json();

      if (result.success) { 
        setShowModal(false); 
        fetchGalleries(); 
      } else {
        alert(result.message || 'Gagal menyimpan foto');
      }
    } catch (err) { 
      console.error(err); 
      alert('Terjadi kesalahan sistem');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, currentCategory) => {
    if (!window.confirm('Yakin ingin menghapus foto ini?')) return;
    try {
      const res = await fetch(`http://localhost:5002/api/galleries/${id}`, { method: 'DELETE' });
      if ((await res.json()).success) {
        if (galleries.filter(g => g.category === currentCategory && g.id !== id).length === 0) backToAlbums();
        fetchGalleries();
      }
    } catch (err) { console.error(err); }
  };

  const handleEditAlbum = async (categoryName, e) => {
    e.stopPropagation();
    const newName = window.prompt(`Masukkan nama baru untuk album "${categoryName}":`, categoryName);
    if (!newName || newName === categoryName) return;

    try {
      await Promise.all(groupedGalleries[categoryName].map(photo => 
        fetch(`http://localhost:5002/api/galleries/${photo.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...photo, category: newName })
        })
      ));
      fetchGalleries();
    } catch (err) { console.error(err); }
  };

  const handleDeleteAlbum = async (categoryName, e) => {
    e.stopPropagation();
    if (!window.confirm(`AWAS! Hapus album "${categoryName}" beserta semua foto di dalamnya?`)) return;
    try {
      await Promise.all(groupedGalleries[categoryName].map(photo => fetch(`http://localhost:5002/api/galleries/${photo.id}`, { method: 'DELETE' })));
      fetchGalleries();
    } catch (err) { console.error(err); }
  };

  // FITUR JADIKAN UTAMA (Dengan Pembersihan Bug Multiple Cover)
  const handleSetCover = async (photo) => {
    if (!window.confirm(`Yakin ingin jadikan foto ini sebagai cover utama album "${photo.category}"?`)) return;

    setIsSubmitting(true);
    
    try {
      // 1. Sapu bersih: Cari SEMUA foto di album ini yang telanjur jadi cover
      const currentCovers = groupedGalleries[photo.category].filter(
        p => (p.isFeatured === 1 || p.is_featured === 1) && p.id !== photo.id
      );
      
      // 2. Matikan status cover pada semua foto yang salah tersebut satu per satu
      for (const oldCover of currentCovers) {
        const resetPayload = { 
          ...oldCover, 
          is_featured: 0, 
          sort_order: oldCover.sortOrder || oldCover.sort_order || 1 
        };
        
        await fetch(`http://localhost:5002/api/galleries/${oldCover.id}`, {
          method: 'PUT', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resetPayload)
        });
      }

      // 3. Pasang mahkota cover pada foto yang baru dipilih
      const newCoverPayload = {
        ...photo,
        is_featured: 1,
        sort_order: photo.sortOrder || photo.sort_order || 1
      };

      await fetch(`http://localhost:5002/api/galleries/${photo.id}`, {
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCoverPayload)
      });
      
      // 4. Tarik ulang data agar tampilan langsung rapi
      fetchGalleries();
    } catch (err) { 
      console.error(err); 
      alert('Gagal memperbarui cover album. Cek koneksi server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-5">Memuat Galeri...</div>;

  return (
    <div className="galeri-container">
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        {viewMode === 'albums' ? (
          <>
            <span className="galeri-header-badge">Manajemen Galeri</span>
            <h2 className="galeri-title">
              Daftar Album <span style={{ color: 'var(--smk-green)' }}>Kegiatan Sekolah</span>
            </h2>
            <p className="galeri-subtitle">
              Dokumentasi aktivitas, prestasi, dan kegiatan siswa SMK Negeri Compreng.
            </p>
            {canAccessCRUD && (
              <button onClick={handleOpenAddAlbum} className="btn-primary" style={{ marginTop: '8px' }}>
                <Plus size={18} /> Buat Album Baru
              </button>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={backToAlbums} className="btn-back">
              <ArrowLeft size={16} /> Daftar Album
            </button>
            <h2 className="galeri-title" style={{ margin: 0, fontSize: '28px' }}>
              Album: <span style={{ color: 'var(--smk-green)' }}>{selectedAlbum}</span>
            </h2>
            {canAccessCRUD ? (
              <button onClick={handleOpenAddPhoto} className="btn-success">
                <Plus size={16} /> Tambah Foto
              </button>
            ) : <div style={{ width: '150px' }}></div>}
          </div>
        )}
      </div>

      {viewMode === 'albums' && (
        <div className="album-grid">
          {Object.keys(groupedGalleries).map((catName) => {
            const items = groupedGalleries[catName];
            // Pengecekan aman untuk kedua format penamaan dari backend
            const coverImage = items.find(i => i.isFeatured === 1 || i.is_featured === 1)?.image || items[0].image;

            return (
              <div key={catName} onClick={() => openAlbum(catName)} className="album-card">
                <img src={coverImage} alt={catName} className="album-img" loading="lazy" />
                {canAccessCRUD && (
                  <div className="album-actions">
                    <button onClick={(e) => handleEditAlbum(catName, e)} className="btn-icon"><Edit size={16} /></button>
                    <button onClick={(e) => handleDeleteAlbum(catName, e)} className="btn-icon danger"><Trash2 size={16} /></button>
                  </div>
                )}
                <div className="album-overlay">
                  <span className="album-count">{items.length} Foto</span>
                  <h3 className="album-name">{catName}</h3>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'detail' && selectedAlbum && (
        <div className="photo-grid">
          {/* Tambahkan .sort() sebelum .map() agar cover otomatis naik ke atas */}
          {[...(groupedGalleries[selectedAlbum] || [])].sort((a, b) => {
            const aIsCover = (a.isFeatured === 1 || a.is_featured === 1) ? 1 : 0;
            const bIsCover = (b.isFeatured === 1 || b.is_featured === 1) ? 1 : 0;
            return bIsCover - aIsCover; 
          }).map((item) => (
            <div key={item.id} className="photo-card">
              <div className="photo-img-wrapper">
                <img src={item.image} alt="foto" className="album-img" loading="lazy" />
                {(item.isFeatured === 1 || item.is_featured === 1) && <span className="photo-cover-badge">★ Foto Utama</span>}
              </div>
              <div className="photo-info">
                <p className="photo-caption">{item.caption || '(Tidak ada deskripsi)'}</p>
                {canAccessCRUD && (
                  <>
                    {(item.isFeatured !== 1 && item.is_featured !== 1) && (
                      <button onClick={() => handleSetCover(item)} className="btn-set-cover" disabled={isSubmitting}>
                         {isSubmitting ? 'Memproses...' : 'Jadikan Cover Album'}
                      </button>
                    )}
                    <div className="photo-actions">
                      {/* Pastikan onClick di sini tidak terblokir */}
                      <button onClick={() => handleOpenEdit(item)} className="btn-action-sm edit"><Edit size={14} /> Edit</button>
                      <button onClick={() => handleDelete(item.id, item.category)} className="btn-action-sm delete"><Trash2 size={14} /> Hapus</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && canAccessCRUD && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--smk-navy)' }}>{isEditing ? 'Edit Foto' : (viewMode === 'detail' ? 'Tambah Foto' : 'Buat Album Baru')}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#64748b" /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Kategori (Album)</label>
                <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required readOnly={viewMode === 'detail' && !isEditing} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: (viewMode === 'detail' && !isEditing) ? '#f1f5f9' : '#fff' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Deskripsi / Caption</label>
                <textarea rows="2" value={formData.caption} onChange={(e) => setFormData({ ...formData, caption: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Pilih Foto</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <button type="button" onClick={() => setLogoType('url')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: logoType === 'url' ? '#e0e7ff' : '#fff', fontWeight: '500' }}>URL Tautan</button>
                  <button type="button" onClick={() => setLogoType('file')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: logoType === 'file' ? '#e0e7ff' : '#fff', fontWeight: '500' }}>Upload File</button>
                </div>
                {logoType === 'url' ? (
                  <input type="text" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                ) : (
                  <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files[0])} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-back" disabled={isSubmitting}>Batal</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
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