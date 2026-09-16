import React, { useState, useEffect } from 'react';
import { ArrowLeft, X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import '../../css/viewer/tampilangalery.css';

export default function TampilanGalery() {
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('albums'); // 'albums' atau 'detail'
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  // State untuk Lightbox / Slider Foto Interaktif
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);

  useEffect(() => {
    const fetchGalleries = async () => {
      try {
        const response = await fetch('http://localhost:5002/api/galleries');
        const result = await response.json();
        if (result.success) {
          // Hanya ambil foto yang aktif/show
          const activeGalleries = result.data.filter(item => item.show === 1 || item.show === true || item.show === undefined);
          setGalleries(activeGalleries);
        }
        setLoading(false);
      } catch (error) {
        console.error('Gagal memuat galeri:', error);
        setLoading(false);
      }
    };
    fetchGalleries();
  }, []);

  // Kelompokkan foto berdasarkan kategori album
  const groupedGalleries = galleries.reduce((acc, item) => {
    const cat = item.category || 'Umum';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const openAlbum = (categoryName) => {
    setSelectedAlbum(categoryName);
    setViewMode('detail');
  };

  const backToAlbums = () => {
    setSelectedAlbum(null);
    setViewMode('albums');
  };

  // Handler Slider Lightbox
  const currentAlbumPhotos = selectedAlbum ? (groupedGalleries[selectedAlbum] || []) : [];

  const handleNextPhoto = (e) => {
    e.stopPropagation();
    setActivePhotoIndex((prev) => (prev + 1) % currentAlbumPhotos.length);
  };

  const handlePrevPhoto = (e) => {
    e.stopPropagation();
    setActivePhotoIndex((prev) => (prev - 1 + currentAlbumPhotos.length) % currentAlbumPhotos.length);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px', fontSize: '16px', color: '#64748b' }}>Memuat Galeri Sekolah...</div>;
  }

  return (
    <div id="section-galeri" className="tampilan-galeri-wrapper">
      <div className="tg-container">
        
        {/* HEADER SECTION */}
        <div className="tg-header">
          {viewMode === 'albums' ? (
            <>
              <span className="tg-badge">Dokumentasi Sekolah</span>
              <h2 className="tg-title">
                Galeri <span style={{ color: '#16a34a' }}>Kegiatan & Album</span>
              </h2>
              <p className="tg-subtitle">
                Jelajahi berbagai momen dokumentasi aktivitas, fasilitas, dan prestasi siswa SMK Negeri Compreng.
              </p>
            </>
          ) : (
            <div className="tg-detail-top">
              <button onClick={backToAlbums} className="tg-btn-back">
                <ArrowLeft size={16} /> Kembali ke Daftar Album
              </button>
              <h2 className="tg-title" style={{ margin: 0, fontSize: '26px' }}>
                Album: <span style={{ color: '#16a34a' }}>{selectedAlbum}</span>
              </h2>
              <div style={{ width: '140px' }}></div>
            </div>
          )}
        </div>

        {/* TAMPILAN 1: DAFTAR ALBUM (GRID) */}
        {viewMode === 'albums' && (
          Object.keys(groupedGalleries).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>Belum ada album galeri yang tersedia.</div>
          ) : (
            <div className="tg-album-grid">
              {Object.keys(groupedGalleries).map((catName) => {
                const items = groupedGalleries[catName];
                const coverImage = items.find(i => i.isFeatured === 1 || i.is_featured === 1)?.image || items[0]?.image;

                return (
                  <div key={catName} onClick={() => openAlbum(catName)} className="tg-album-card">
                    <img src={coverImage} alt={catName} className="tg-album-img" loading="lazy" />
                    <div className="tg-album-overlay">
                      <span className="tg-album-count">{items.length} Foto</span>
                      <h3 className="tg-album-name">{catName}</h3>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* TAMPILAN 2: GRID FOTO DALAM 1 ALBUM */}
        {viewMode === 'detail' && selectedAlbum && (
          <div className="tg-photo-grid">
            {currentAlbumPhotos.map((item, index) => (
              <div key={item.id || index} onClick={() => setActivePhotoIndex(index)} className="tg-photo-item">
                <img src={item.image} alt={item.caption || 'Foto Galeri'} loading="lazy" />
                {item.caption && (
                  <div className="tg-photo-caption-overlay">
                    {item.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* LIGHTBOX / MODAL SLIDER FOTO PERGESERAN */}
        {activePhotoIndex !== null && (
          <div className="tg-lightbox" onClick={() => setActivePhotoIndex(null)}>
            <div className="tg-lightbox-content" onClick={(e) => e.stopPropagation()}>
              
              {/* TOMBOL SILANG ANIMASI */}
              <button className="tg-lightbox-close" onClick={() => setActivePhotoIndex(null)}>
                <X size={24} />
              </button>

              {/* TOMBOL GESER KIRI */}
              {currentAlbumPhotos.length > 1 && (
                <button className="tg-nav-btn tg-prev" onClick={handlePrevPhoto}>
                  <ChevronLeft size={28} />
                </button>
              )}

              {/* GAMBAR UTAMA DI LIGHTBOX */}
              <div className="tg-lightbox-img-wrapper">
                <img 
                  src={currentAlbumPhotos[activePhotoIndex]?.image} 
                  alt="Preview" 
                  className="tg-lightbox-img" 
                />
              </div>

              {/* TOMBOL GESER KANAN */}
              {currentAlbumPhotos.length > 1 && (
                <button className="tg-nav-btn tg-next" onClick={handleNextPhoto}>
                  <ChevronRight size={28} />
                </button>
              )}

              {/* CAPTION DI BAWAH LIGHTBOX */}
              {currentAlbumPhotos[activePhotoIndex]?.caption && (
                <p className="tg-lightbox-caption">
                  {currentAlbumPhotos[activePhotoIndex].caption}
                </p>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}