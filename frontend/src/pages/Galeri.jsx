import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, ArrowLeft, Image as ImageIcon, Link as LinkIcon, UploadCloud, Star, FolderOpen, Search } from 'lucide-react';

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

  // Pencarian
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

  const groupedGalleries = galleries.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const openAlbum = (categoryName) => { 
    setSelectedAlbum(categoryName); 
    setViewMode('detail'); 
    setSearchTerm('');
  };
  
  const backToAlbums = () => { 
    setSelectedAlbum(null); 
    setViewMode('albums'); 
    setSearchTerm('');
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
    if (!window.confirm(`AWAS! Hapus album "${categoryName}" beserta SEMUA foto di dalamnya secara permanen?`)) return;
    try {
      await Promise.all(groupedGalleries[categoryName].map(photo => fetch(`http://localhost:5002/api/galleries/${photo.id}`, { method: 'DELETE' })));
      fetchGalleries();
    } catch (err) { console.error(err); }
  };

  const handleSetCover = async (photo) => {
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

  // --- FILTER PENCARIAN ---
  const albumKeys = Object.keys(groupedGalleries).filter(key => key.toLowerCase().includes(searchTerm.toLowerCase()));
  const currentAlbumPhotos = selectedAlbum ? (groupedGalleries[selectedAlbum] || []).filter(p => (p.caption || '').toLowerCase().includes(searchTerm.toLowerCase())) : [];

  // --- STYLES (SHADCN ADMIN LOOK) ---
  const styles = {
    wrapper: { width: '100%', maxWidth: '1150px', margin: '0 auto', padding: '30px 24px', boxSizing: 'border-box' },
    headerBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '15px' },
    title: { fontSize: '22px', fontWeight: '700', color: 'var(--compreng-text)', margin: '0 0 4px 0', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' },
    subtitle: { fontSize: '13px', color: 'var(--compreng-text-secondary)', margin: 0 },
    
    btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'var(--compreng-text)', color: 'var(--compreng-bg)', borderRadius: '6px', border: 'none', fontWeight: '500', cursor: 'pointer', fontSize: '13px', transition: 'opacity 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', whiteSpace: 'nowrap' },
    
    toolbar: { display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '16px' },
    searchInputWrapper: { position: 'relative', width: '280px', maxWidth: '100%' },
    searchInput: { width: '100%', padding: '8px 12px 8px 36px', borderRadius: '6px', border: '1px solid var(--compreng-border)', background: 'var(--compreng-surface)', color: 'var(--compreng-text)', fontSize: '13px', outline: 'none' },
    searchIcon: { position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--compreng-text-muted)' },

    // Padding bottom yang menyebabkan ruang kosong sudah dihapus. minHeight memastikan tabel tidak mengkerut jelek.
    tableCard: { backgroundColor: 'var(--compreng-surface)', borderRadius: '8px', border: '1px solid var(--compreng-border)', overflowX: 'auto', overflowY: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '40px', width: '100%', minHeight: '300px' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' },
    th: { padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: 'var(--compreng-text-secondary)', borderBottom: '1px solid var(--compreng-border)', whiteSpace: 'nowrap' },
    td: { padding: '14px 16px', borderBottom: '1px solid var(--compreng-border)', verticalAlign: 'middle', color: 'var(--compreng-text)', fontSize: '13px' },
    
    badgeCover: { display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(234, 179, 8, 0.15)', color: '#ca8a04', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' },
    badgeNormal: { display: 'inline-flex', background: 'var(--compreng-surface-soft)', color: 'var(--compreng-text-muted)', border: '1px solid var(--compreng-border)', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' },
    truncate: { maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    
    iconBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '6px', color: 'var(--compreng-text-secondary)', transition: 'all 0.2s ease' },
  };

  if (loading) return <div style={{ padding: '30px', color: 'var(--compreng-text-muted)', textAlign: 'center' }}>Memuat Galeri...</div>;

  return (
    <div style={styles.wrapper}>
      
      {/* HEADER SECTION */}
      <div style={styles.headerBox}>
        <div>
          {viewMode === 'albums' ? (
            <>
              <h2 style={styles.title}>Manajemen Galeri</h2>
              <p style={styles.subtitle}>Kelola album dokumentasi kegiatan, fasilitas, dan prestasi sekolah.</p>
            </>
          ) : (
            <>
              <h2 style={styles.title}>
                <button onClick={backToAlbums} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--compreng-text-secondary)', display: 'flex', alignItems: 'center', padding: 0 }} title="Kembali">
                  <ArrowLeft size={20} />
                </button>
                Album: {selectedAlbum}
              </h2>
              <p style={styles.subtitle}>Kelola foto-foto di dalam album ini.</p>
            </>
          )}
        </div>

        {canAccessCRUD && (
          <div>
            {viewMode === 'albums' ? (
              <button style={styles.btnPrimary} onClick={handleOpenAddAlbum}>
                <Plus size={16} /> Buat Album Baru
              </button>
            ) : (
              <button style={styles.btnPrimary} onClick={handleOpenAddPhoto}>
                <Plus size={16} /> Tambah Foto
              </button>
            )}
          </div>
        )}
      </div>

      {/* SEARCH TOOLBAR */}
      <div style={styles.toolbar}>
        <div style={styles.searchInputWrapper}>
          <Search size={16} style={styles.searchIcon} />
          <input 
            type="text" 
            placeholder={viewMode === 'albums' ? "Cari nama album..." : "Cari deskripsi foto..."} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* =========================================================
          TABEL ALBUM (VIEW: ALBUMS)
      ========================================================= */}
      {viewMode === 'albums' && (
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={{ background: 'var(--compreng-surface-soft)' }}>
                <th style={styles.th}>Nama Album</th>
                <th style={styles.th}>Cover Preview</th>
                <th style={styles.th}>Jumlah Foto</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Aksi</th>
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
                    <tr key={catName} style={{ transition: 'background 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--compreng-surface-soft)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'} onClick={() => openAlbum(catName)}>
                      <td style={{ ...styles.td, fontWeight: '600' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <FolderOpen size={18} color="var(--compreng-text-muted)" />
                          {catName}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <img src={coverImage} alt="Cover" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--compreng-border)' }} />
                      </td>
                      <td style={{ ...styles.td, color: 'var(--compreng-text-secondary)' }}>{items.length} Foto</td>
                      <td style={{ ...styles.td, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        
                        {/* INLINE ACTIONS (Tanpa Dropdown) */}
                        {canAccessCRUD && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <button 
                              onClick={() => openAlbum(catName)} 
                              title="Buka Album"
                              style={styles.iconBtn}
                              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)'; e.currentTarget.style.color = '#2563eb'; }}
                              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--compreng-text-secondary)'; }}
                            >
                              <FolderOpen size={16} />
                            </button>
                            <button 
                              onClick={(e) => handleEditAlbum(catName, e)} 
                              title="Ganti Nama Album"
                              style={styles.iconBtn}
                              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)'; e.currentTarget.style.color = '#2563eb'; }}
                              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--compreng-text-secondary)'; }}
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={(e) => handleDeleteAlbum(catName, e)} 
                              title="Hapus Album"
                              style={styles.iconBtn}
                              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)'; e.currentTarget.style.color = '#dc2626'; }}
                              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--compreng-text-secondary)'; }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
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

      {/* =========================================================
          TABEL FOTO (VIEW: DETAIL / DALAM ALBUM)
      ========================================================= */}
      {viewMode === 'detail' && selectedAlbum && (
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={{ background: 'var(--compreng-surface-soft)' }}>
                <th style={styles.th}>Pratinjau Foto</th>
                <th style={styles.th}>Deskripsi / Caption</th>
                <th style={styles.th}>Status Album</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Aksi</th>
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
                  <tr key={item.id} style={{ transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--compreng-surface-soft)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={styles.td}>
                      <img src={item.image} alt="foto" style={{ width: '80px', height: '50px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--compreng-border)' }} />
                    </td>
                    <td style={{ ...styles.td, ...styles.truncate }}>{item.caption || <span style={{ color: 'var(--compreng-text-muted)', fontStyle: 'italic' }}>Tidak ada deskripsi</span>}</td>
                    <td style={styles.td}>
                      {(item.isFeatured === 1 || item.is_featured === 1) ? (
                        <span style={styles.badgeCover}><Star size={12} fill="currentColor" /> Cover Utama</span>
                      ) : (
                        <span style={styles.badgeNormal}>Foto Biasa</span>
                      )}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      
                      {/* INLINE ACTIONS (Tanpa Dropdown) */}
                      {canAccessCRUD && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          {(item.isFeatured !== 1 && item.is_featured !== 1) && (
                            <button 
                              onClick={() => handleSetCover(item)} 
                              disabled={isSubmitting}
                              title="Jadikan Cover Utama"
                              style={{ ...styles.iconBtn, opacity: isSubmitting ? 0.5 : 1 }}
                              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(234, 179, 8, 0.1)'; e.currentTarget.style.color = '#ca8a04'; }}
                              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--compreng-text-secondary)'; }}
                            >
                              <Star size={16} />
                            </button>
                          )}
                          <button 
                            onClick={() => handleOpenEdit(item)} 
                            title="Edit Foto"
                            style={styles.iconBtn}
                            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)'; e.currentTarget.style.color = '#2563eb'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--compreng-text-secondary)'; }}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id, item.category)} 
                            title="Hapus Foto"
                            style={styles.iconBtn}
                            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)'; e.currentTarget.style.color = '#dc2626'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--compreng-text-secondary)'; }}
                          >
                            <Trash2 size={16} />
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
      )}

      {/* =========================================================
          MODAL FORM (SHADCN STYLE)
      ========================================================= */}
      {showModal && canAccessCRUD && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--compreng-surface)', width: '100%', maxWidth: '450px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid var(--compreng-border)' }}>
            
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--compreng-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--compreng-text)' }}>
                  {isEditing ? 'Edit Foto' : (viewMode === 'detail' ? 'Tambah Foto Baru' : 'Buat Album Baru')}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--compreng-text-muted)', cursor: 'pointer', padding: '4px' }}><X size={18} /></button>
            </div>
            
            <div style={{ padding: '24px' }}>
              <form id="gallery-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--compreng-text)' }}>Kategori (Nama Album)</label>
                  <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required readOnly={viewMode === 'detail' && !isEditing} style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--compreng-border)', background: (viewMode === 'detail' && !isEditing) ? 'var(--compreng-surface-soft)' : 'var(--compreng-bg)', color: (viewMode === 'detail' && !isEditing) ? 'var(--compreng-text-muted)' : 'var(--compreng-text)', fontSize: '13px', outline: 'none' }} placeholder="Contoh: Lomba 17 Agustus" />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--compreng-text)' }}>Deskripsi / Caption (Opsional)</label>
                  <textarea rows="2" value={formData.caption} onChange={(e) => setFormData({ ...formData, caption: e.target.value })} style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--compreng-border)', background: 'var(--compreng-bg)', color: 'var(--compreng-text)', fontSize: '13px', outline: 'none', resize: 'vertical' }} placeholder="Tuliskan keterangan foto..." />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--compreng-text)' }}>Pilih Foto</label>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                    <button type="button" onClick={() => setLogoType('url')} style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: '500', background: logoType === 'url' ? 'var(--compreng-text)' : 'var(--compreng-surface-soft)', color: logoType === 'url' ? 'var(--compreng-bg)' : 'var(--compreng-text-muted)' }}><LinkIcon size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }}/> Link URL</button>
                    <button type="button" onClick={() => setLogoType('file')} style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: '500', background: logoType === 'file' ? 'var(--compreng-text)' : 'var(--compreng-surface-soft)', color: logoType === 'file' ? 'var(--compreng-bg)' : 'var(--compreng-text-muted)' }}><UploadCloud size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }}/> Upload File</button>
                  </div>
                  
                  {logoType === 'url' ? (
                    <input type="text" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--compreng-border)', background: 'var(--compreng-bg)', color: 'var(--compreng-text)', fontSize: '13px', outline: 'none' }} placeholder="https://..." />
                  ) : (
                    <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files[0])} style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid var(--compreng-border)', background: 'var(--compreng-bg)', color: 'var(--compreng-text)', fontSize: '13px', outline: 'none' }} />
                  )}
                </div>

              </form>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--compreng-border)', background: 'var(--compreng-surface-soft)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowModal(false)} disabled={isSubmitting} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--compreng-border)', background: 'transparent', color: 'var(--compreng-text-secondary)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Batal</button>
              <button type="submit" form="gallery-form" disabled={isSubmitting} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'var(--compreng-text)', color: 'var(--compreng-bg)', fontSize: '13px', fontWeight: '600', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}