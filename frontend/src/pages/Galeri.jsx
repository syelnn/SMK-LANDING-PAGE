import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, ArrowLeft, Image as ImageIcon, Link as LinkIcon, MoreHorizontal, Star, FolderOpen, Search } from 'lucide-react';
import '../css/galeri.css'; 
import '../App.css'; // Wajib panggil CSS global

export default function Galeri() {
  const storedUser = localStorage.getItem('userData') || localStorage.getItem('user') || '{}';
  const currentUser = JSON.parse(storedUser);
  const userRole = (currentUser.role || currentUser.user?.role || 'admin').toLowerCase();
  const canAccessCRUD = userRole === 'admin' || userRole === 'editor';

  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('albums');
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [logoType, setLogoType] = useState('url');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdown Action State (SMART POSITIONING)
  const [dropdownConfig, setDropdownConfig] = useState({ id: null, type: null, right: null, top: null, bottom: null });
  const [searchTerm, setSearchTerm] = useState('');

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

  useEffect(() => {
    const handleScroll = () => {
      if (dropdownConfig.id !== null) {
        setDropdownConfig({ id: null, type: null, right: null, top: null, bottom: null });
      }
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [dropdownConfig.id]);

  const groupedGalleries = galleries.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const openAlbum = (categoryName) => { 
    setSelectedAlbum(categoryName); 
    setViewMode('detail'); 
    setSearchTerm('');
    setDropdownConfig({ id: null, type: null, right: null, top: null, bottom: null });
  };
  
  const backToAlbums = () => { 
    setSelectedAlbum(null); 
    setViewMode('albums'); 
    setSearchTerm('');
    setDropdownConfig({ id: null, type: null, right: null, top: null, bottom: null });
  };

  const handleDropdownClick = (e, itemId, itemType) => {
    e.stopPropagation();
    if (dropdownConfig.id === itemId && dropdownConfig.type === itemType) {
      setDropdownConfig({ id: null, type: null, right: null, top: null, bottom: null });
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const dropdownHeight = 120;
    
    const spaceBelow = windowHeight - rect.bottom;
    const openUpwards = spaceBelow < dropdownHeight;

    setDropdownConfig({
      id: itemId,
      type: itemType,
      right: window.innerWidth - rect.right,
      top: openUpwards ? null : rect.bottom + 4,
      bottom: openUpwards ? windowHeight - rect.top + 4 : null
    });
  };

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
    setDropdownConfig({ id: null, type: null, right: null, top: null, bottom: null });
    setIsEditing(true); setCurrentId(item.id); setSelectedFile(null); 
    setLogoType(item.image && item.image.length > 200 ? 'file' : 'url');
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
    setDropdownConfig({ id: null, type: null, right: null, top: null, bottom: null });
    if (!window.confirm('Yakin ingin menghapus foto ini secara permanen?')) return;
    try {
      const res = await fetch(`http://localhost:5002/api/galleries/${id}`, { method: 'DELETE' });
      if ((await res.json()).success) {
        if (galleries.filter(g => g.category === currentCategory && g.id !== id).length === 0) backToAlbums();
        fetchGalleries();
      }
    } catch (err) { console.error(err); }
  };

  const handleEditAlbum = async (categoryName, e) => {
    if (e) e.stopPropagation();
    setDropdownConfig({ id: null, type: null, right: null, top: null, bottom: null });
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
    if (e) e.stopPropagation();
    setDropdownConfig({ id: null, type: null, right: null, top: null, bottom: null });
    if (!window.confirm(`AWAS! Hapus album "${categoryName}" beserta SEMUA foto di dalamnya secara permanen?`)) return;
    try {
      await Promise.all(groupedGalleries[categoryName].map(photo => fetch(`http://localhost:5002/api/galleries/${photo.id}`, { method: 'DELETE' })));
      fetchGalleries();
    } catch (err) { console.error(err); }
  };

  const handleSetCover = async (photo) => {
    setDropdownConfig({ id: null, type: null, right: null, top: null, bottom: null });
    if (!window.confirm(`Jadikan foto ini sebagai cover utama album "${photo.category}"?`)) return;

    setIsSubmitting(true);
    try {
      const currentCovers = groupedGalleries[photo.category].filter(
        p => (p.isFeatured === 1 || p.is_featured === 1) && p.id !== photo.id
      );
      
      for (const oldCover of currentCovers) {
        const resetPayload = { ...oldCover, is_featured: 0, sort_order: oldCover.sortOrder || oldCover.sort_order || 1 };
        await fetch(`http://localhost:5002/api/galleries/${oldCover.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(resetPayload)
        });
      }

      const newCoverPayload = { ...photo, is_featured: 1, sort_order: photo.sortOrder || photo.sort_order || 1 };
      await fetch(`http://localhost:5002/api/galleries/${photo.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCoverPayload)
      });
      
      fetchGalleries();
    } catch (err) { 
      console.error(err); 
      alert('Gagal memperbarui cover album.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const albumKeys = Object.keys(groupedGalleries).filter(key => key.toLowerCase().includes(searchTerm.toLowerCase()));
  const currentAlbumPhotos = selectedAlbum ? (groupedGalleries[selectedAlbum] || []).filter(p => (p.caption || '').toLowerCase().includes(searchTerm.toLowerCase())) : [];

  if (loading) return <div style={{ padding: '30px', color: 'var(--compreng-text-muted)', textAlign: 'center' }}>Memuat Galeri...</div>;

  return (
    <div className="galeri-wrapper">
      
      <div className="galeri-header-box">
        <div>
          {viewMode === 'albums' ? (
            <>
              <h2 className="galeri-title">Manajemen Galeri</h2>
              <p className="galeri-subtitle">Kelola album dokumentasi kegiatan, fasilitas, dan prestasi sekolah.</p>
            </>
          ) : (
            <>
              <h2 className="galeri-title">
                <button onClick={backToAlbums} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--compreng-text-secondary)', display: 'flex', alignItems: 'center', padding: 0 }} title="Kembali">
                  <ArrowLeft size={20} />
                </button>
                Album: {selectedAlbum}
              </h2>
              <p className="galeri-subtitle">Kelola foto-foto di dalam album ini.</p>
            </>
          )}
        </div>

        {canAccessCRUD && (
          <div>
            {viewMode === 'albums' ? (
              <button className="btn-modern-primary" onClick={handleOpenAddAlbum}>
                <Plus size={16} /> Buat Album Baru
              </button>
            ) : (
              <button className="btn-modern-primary" onClick={handleOpenAddPhoto}>
                <Plus size={16} /> Tambah Foto
              </button>
            )}
          </div>
        )}
      </div>

      <div className="galeri-toolbar">
        <div className="galeri-search-wrapper">
          <Search size={16} className="galeri-search-icon" />
          <input 
            type="text" 
            placeholder={viewMode === 'albums' ? "Cari nama album..." : "Cari deskripsi foto..."} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="galeri-search-input"
          />
        </div>
      </div>

      {viewMode === 'albums' && (
        <div className="galeri-table-card">
          <table className="galeri-table">
            <thead>
              <tr>
                <th className="galeri-th">Nama Album</th>
                <th className="galeri-th">Cover Preview</th>
                <th className="galeri-th">Jumlah Foto</th>
                <th className="galeri-th" style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {albumKeys.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--compreng-text-muted)', fontSize: '13px' }}>
                    {searchTerm ? `Tidak ditemukan album "${searchTerm}"` : 'Belum ada album.'}
                  </td>
                </tr>
              ) : (
                albumKeys.map((catName) => {
                  const items = groupedGalleries[catName];
                  const coverImage = items.find(i => i.isFeatured === 1 || i.is_featured === 1)?.image || items[0].image;

                  return (
                    <tr key={catName} className="galeri-tr" onClick={() => openAlbum(catName)} style={{ cursor: 'pointer' }}>
                      <td className="galeri-td" style={{ fontWeight: '600' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <FolderOpen size={18} color="var(--compreng-text-muted)" />
                          {catName}
                        </div>
                      </td>
                      <td className="galeri-td">
                        <img src={coverImage} alt="Cover" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--compreng-border)' }} />
                      </td>
                      <td className="galeri-td" style={{ color: 'var(--compreng-text-secondary)' }}>{items.length} Foto</td>
                      <td className="galeri-td" style={{ textAlign: 'center', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                        {canAccessCRUD && (
                          <button 
                            onClick={(e) => handleDropdownClick(e, catName, 'album')}
                            className="galeri-action-btn"
                            style={{ margin: '0 auto' }}
                          >
                            <MoreHorizontal size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'detail' && selectedAlbum && (
        <div className="galeri-table-card">
          <table className="galeri-table">
            <thead>
              <tr>
                <th className="galeri-th">Pratinjau Foto</th>
                <th className="galeri-th">Deskripsi / Caption</th>
                <th className="galeri-th">Status Album</th>
                <th className="galeri-th" style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {currentAlbumPhotos.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--compreng-text-muted)', fontSize: '13px' }}>
                    {searchTerm ? `Tidak ditemukan deskripsi foto "${searchTerm}"` : 'Album ini belum memiliki foto.'}
                  </td>
                </tr>
              ) : (
                currentAlbumPhotos.sort((a, b) => {
                  const aIsCover = (a.isFeatured === 1 || a.is_featured === 1) ? 1 : 0;
                  const bIsCover = (b.isFeatured === 1 || b.is_featured === 1) ? 1 : 0;
                  return bIsCover - aIsCover; 
                }).map((item) => (
                  <tr key={item.id} className="galeri-tr">
                    <td className="galeri-td">
                      <img src={item.image} alt="foto" style={{ width: '80px', height: '50px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--compreng-border)' }} />
                    </td>
                    <td className="galeri-td galeri-truncate">{item.caption || <span style={{ color: 'var(--compreng-text-muted)', fontStyle: 'italic' }}>Tidak ada deskripsi</span>}</td>
                    <td className="galeri-td">
                      {(item.isFeatured === 1 || item.is_featured === 1) ? (
                        <span className="galeri-badge-cover"><Star size={12} fill="currentColor" /> Cover Utama</span>
                      ) : (
                        <span className="galeri-badge-normal">Foto Biasa</span>
                      )}
                    </td>
                    <td className="galeri-td" style={{ textAlign: 'center', position: 'relative' }}>
                      {canAccessCRUD && (
                        <button 
                          onClick={(e) => handleDropdownClick(e, item.id, 'photo')}
                          className="galeri-action-btn"
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
      )}

      {/* DROPDOWN MENU */}
      {dropdownConfig.id && (
        <>
          <div 
            onClick={() => setDropdownConfig({ id: null, type: null, right: null, top: null, bottom: null })} 
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          ></div>
          
          <div 
            className="galeri-dropdown-menu" 
            style={{ 
              position: 'fixed', 
              right: dropdownConfig.right, 
              ...(dropdownConfig.top !== null ? { top: dropdownConfig.top } : {}),
              ...(dropdownConfig.bottom !== null ? { bottom: dropdownConfig.bottom } : {}),
              zIndex: 50 
            }}
          >
            {dropdownConfig.type === 'album' ? (
              <>
                <button onClick={() => openAlbum(dropdownConfig.id)} className="galeri-dropdown-item">
                  <FolderOpen size={14} color="var(--compreng-text-secondary)" /> Buka Album
                </button>
                <button onClick={(e) => handleEditAlbum(dropdownConfig.id, e)} className="galeri-dropdown-item">
                  <Edit size={14} color="var(--compreng-text-secondary)" /> Ganti Nama
                </button>
                <div style={{ margin: '2px 0', borderTop: '1px solid var(--compreng-border)' }}></div>
                <button onClick={(e) => handleDeleteAlbum(dropdownConfig.id, e)} className="galeri-dropdown-item danger">
                  <Trash2 size={14} color="currentColor" /> Hapus Album
                </button>
              </>
            ) : (() => {
              const photoItem = currentAlbumPhotos.find(p => p.id === dropdownConfig.id);
              if (!photoItem) return null;
              return (
                <>
                  {(photoItem.isFeatured !== 1 && photoItem.is_featured !== 1) && (
                    <button onClick={() => handleSetCover(photoItem)} disabled={isSubmitting} className="galeri-dropdown-item">
                      <Star size={14} color="var(--compreng-text-secondary)" /> Jadikan Cover
                    </button>
                  )}
                  <button onClick={() => handleOpenEdit(photoItem)} className="galeri-dropdown-item">
                    <Edit size={14} color="var(--compreng-text-secondary)" /> Edit Foto
                  </button>
                  <div style={{ margin: '2px 0', borderTop: '1px solid var(--compreng-border)' }}></div>
                  <button onClick={() => handleDelete(photoItem.id, photoItem.category)} className="galeri-dropdown-item danger">
                    <Trash2 size={14} color="currentColor" /> Hapus Foto
                  </button>
                </>
              );
            })()}
          </div>
        </>
      )}

      {/* =========================================================
          MODAL FORM MENGGUNAKAN KELAS APP.CSS
      ========================================================= */}
      {showModal && canAccessCRUD && (
        <div className="modal-overlay">
          <div className="modal-content modern-modal">
            
            <div className="modal-header-modern">
              <h3>{isEditing ? 'Edit Foto' : (viewMode === 'detail' ? 'Tambah Foto Baru' : 'Buat Album Baru')}</h3>
              <button type="button" onClick={() => setShowModal(false)} className="btn-close-modal"><X size={20} /></button>
            </div>
            
            <form id="gallery-form" onSubmit={handleSubmit} className="form-modern-layout">
              
              <div className="form-group-modern">
                <label>KATEGORI (NAMA ALBUM)</label>
                <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required readOnly={viewMode === 'detail' && !isEditing} className="input-modern" placeholder="Contoh: Lomba 17 Agustus" />
              </div>
              
              <div className="form-group-modern">
                <label>DESKRIPSI / CAPTION (OPSIONAL)</label>
                <textarea value={formData.caption} onChange={(e) => setFormData({ ...formData, caption: e.target.value })} className="input-modern" placeholder="Tuliskan keterangan foto..." style={{ minHeight: '80px', resize: 'vertical' }} />
              </div>

              <div className="form-group-modern upload-section">
                <label>PILIH FOTO</label>
                <div className="radio-tabs">
                  <div className={`radio-tab ${logoType === 'url' ? 'active' : ''}`} onClick={() => setLogoType('url')}>
                    <LinkIcon size={16} style={{ marginRight: '6px' }} /> Link URL
                  </div>
                  <div className={`radio-tab ${logoType === 'file' ? 'active' : ''}`} onClick={() => setLogoType('file')}>
                    <ImageIcon size={16} style={{ marginRight: '6px' }} /> Upload Foto
                  </div>
                </div>
                
                {logoType === 'url' ? (
                  <input type="text" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="input-modern" placeholder="https://..." />
                ) : (
                  <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files[0])} className="input-modern file-style" />
                )}
              </div>

              <div className="modal-actions-modern">
                <button type="button" onClick={() => setShowModal(false)} disabled={isSubmitting} className="btn-modern-secondary">Batal</button>
                <button type="submit" disabled={isSubmitting} className="btn-modern-primary" style={{ cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
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