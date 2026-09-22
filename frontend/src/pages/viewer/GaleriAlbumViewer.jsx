import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Image as ImageIcon,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import FooterViewer from './FooterViewer';
import '../../css/viewer/tampilangalery.css';

// Harus sama persis dengan cara slug dibuat di TampilanGalery.jsx
const createSlug = (text) => {
  if (!text) return 'album';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/* ------------------------------------------------------------------
   Jumlah kolom masonry mengikuti lebar layar (kiri -> kanan, bukan atas -> bawah)
   ------------------------------------------------------------------ */
function useColumnCount() {
  const read = () => {
    if (typeof window === 'undefined') return 3;
    const w = window.innerWidth;
    if (w < 860) return 2;
    return 3;
  };
  const [count, setCount] = useState(read);

  useEffect(() => {
    const onResize = () => setCount(read());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return count;
}

/* ------------------------------------------------------------------
   Satu foto di dalam album.
   ------------------------------------------------------------------ */
function PhotoTile({ photo, index, onOpen }) {
  const [ratio, setRatio] = useState(4 / 3);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const imgRef = useRef(null);

  const applyLoaded = (el) => {
    if (el && el.naturalWidth && el.naturalHeight) {
      const r = el.naturalWidth / el.naturalHeight;
      setRatio(Math.min(Math.max(r, 0.7), 1.8));
    }
    setLoaded(true);
  };

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth) {
      applyLoaded(imgRef.current);
    }
  }, []);

  return (
    <button
      type="button"
      className={`gx-tile${loaded ? ' is-loaded' : ''}${photo.caption ? ' has-cap' : ''}`}
      style={{ aspectRatio: ratio, '--gx-delay': `${Math.min(index, 10) * 70}ms` }}
      onClick={() => onOpen(index)}
      aria-label={photo.caption ? `Perbesar foto: ${photo.caption}` : `Perbesar foto ${index + 1}`}
    >
      {failed ? (
        <span className="gx-tile-fallback"><ImageIcon size={28} /></span>
      ) : (
        <img
          ref={imgRef}
          src={photo.image}
          alt={photo.caption || `Foto galeri ${index + 1}`}
          loading="lazy"
          draggable={false}
          onLoad={(e) => applyLoaded(e.currentTarget)}
          onError={() => { setFailed(true); setLoaded(true); }}
        />
      )}
      <span className="gx-tile-shade" />
      <span className="gx-tile-zoom"><Maximize2 size={15} /></span>
      {photo.caption && <span className="gx-tile-cap">{photo.caption}</span>}
    </button>
  );
}

export default function GaleriAlbumViewer() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);

  const stripRef = useRef(null);
  const touchStartX = useRef(null);
  const columnCount = useColumnCount();

  // Selalu mulai dari atas halaman saat berpindah dari daftar album
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchGalleries = async () => {
      try {
        const response = await fetch('http://localhost:5002/api/galleries');
        const result = await response.json();
        if (result.success) {
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
  const groupedGalleries = useMemo(() => (
    galleries.reduce((acc, item) => {
      const cat = item.category || 'Umum';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {})
  ), [galleries]);

  // Cari nama album asli berdasarkan slug di URL
  const selectedAlbum = useMemo(() => (
    Object.keys(groupedGalleries).find((catName) => createSlug(catName) === slug) || null
  ), [groupedGalleries, slug]);

  const currentAlbumPhotos = useMemo(
    () => (selectedAlbum ? (groupedGalleries[selectedAlbum] || []) : []),
    [selectedAlbum, groupedGalleries]
  );
  const photoCount = currentAlbumPhotos.length;

  // Bagi foto ke kolom secara round-robin supaya urutan tetap terbaca kiri -> kanan
  const masonryColumns = useMemo(() => {
    const n = Math.max(1, Math.min(columnCount, photoCount || 1));
    const cols = Array.from({ length: n }, () => []);
    currentAlbumPhotos.forEach((photo, index) => cols[index % n].push({ photo, index }));
    return cols;
  }, [currentAlbumPhotos, columnCount, photoCount]);

  // Kembali ke daftar album di halaman Galeri (landing page, section galeri)
  const backToAlbums = () => {
    navigate('/galeri');
  };

  // Handler Slider Lightbox
  const closeLightbox = useCallback(() => setActivePhotoIndex(null), []);
  const goNext = useCallback(() => {
    if (!photoCount) return;
    setActivePhotoIndex((prev) => (prev === null ? prev : (prev + 1) % photoCount));
  }, [photoCount]);
  const goPrev = useCallback(() => {
    if (!photoCount) return;
    setActivePhotoIndex((prev) => (prev === null ? prev : (prev - 1 + photoCount) % photoCount));
  }, [photoCount]);

  const lightboxOpen = activePhotoIndex !== null;

  // Keyboard (Esc / panah) + kunci scroll halaman saat lightbox terbuka
  useEffect(() => {
    if (!lightboxOpen) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [lightboxOpen, closeLightbox, goNext, goPrev]);

  // Strip thumbnail otomatis menggulir ke foto yang sedang dibuka
  useEffect(() => {
    if (!lightboxOpen || !stripRef.current) return;
    const current = stripRef.current.querySelector('[data-current="true"]');
    if (current && current.scrollIntoView) {
      current.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }
  }, [activePhotoIndex, lightboxOpen]);

  // Preload foto sebelum & sesudahnya supaya perpindahan terasa instan
  useEffect(() => {
    if (!lightboxOpen || photoCount < 2) return;
    [1, -1].forEach((step) => {
      const target = currentAlbumPhotos[(activePhotoIndex + step + photoCount) % photoCount];
      if (target?.image) {
        const img = new Image();
        img.src = target.image;
      }
    });
  }, [activePhotoIndex, lightboxOpen, photoCount, currentAlbumPhotos]);

  // Geser jari (swipe) di HP
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) > 50) (delta < 0 ? goNext : goPrev)();
  };

  const activePhoto = lightboxOpen ? currentAlbumPhotos[activePhotoIndex] : null;

  return (
    <div className="gav-page-wrapper">
      <Navbar />

      <div id="section-galeri-album" className="tampilan-galeri-wrapper gav-standalone">
        <div className="tg-container">

          {/* HEADER SECTION */}
          <div className="tg-header">
            <div className="tg-detail-top">
              <button onClick={backToAlbums} className="tg-btn-back">
                <ArrowLeft size={16} /> Kembali ke Daftar Album
              </button>
              <h2 className="tg-title" style={{ margin: 0, fontSize: '26px' }}>
                Album: <span style={{ color: '#16a34a' }}>{selectedAlbum || '...'}</span>
              </h2>
              <div style={{ width: '140px' }}></div>
            </div>
          </div>

          {/* STATE: MEMUAT */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '100px', fontSize: '16px', color: 'var(--compreng-text-secondary, #475569)' }}>
              Memuat Album Galeri...
            </div>
          )}

          {/* STATE: ALBUM TIDAK DITEMUKAN */}
          {!loading && !selectedAlbum && (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <p style={{ color: 'var(--compreng-text-secondary, #475569)', marginBottom: '20px' }}>
                Album galeri tidak ditemukan atau sudah tidak tersedia.
              </p>
              <button onClick={backToAlbums} className="tg-btn-back" style={{ margin: '0 auto' }}>
                <ArrowLeft size={16} /> Kembali ke Daftar Album
              </button>
            </div>
          )}

          {/* FOTO DALAM ALBUM (MASONRY) */}
          {!loading && selectedAlbum && (
            <>
              <div className="gx-meta">
                <span className="gx-meta-pill"><ImageIcon size={14} /> {photoCount} Foto</span>
                <span className="gx-meta-hint">Klik foto untuk memperbesar</span>
              </div>

              <div className={`gx-masonry${masonryColumns.length === 1 ? ' is-single' : ''}`}>
                {masonryColumns.map((col, colIndex) => (
                  <div className="gx-col" key={colIndex}>
                    {col.map(({ photo, index }) => (
                      <PhotoTile
                        key={photo.id || index}
                        photo={photo}
                        index={index}
                        onOpen={setActivePhotoIndex}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* LIGHTBOX / SLIDER FOTO */}
          {activePhoto && (
            <div
              className="gx-lightbox"
              role="dialog"
              aria-modal="true"
              aria-label="Pratinjau foto"
              onClick={closeLightbox}
            >
              <div
                key={`bg-${activePhotoIndex}`}
                className="gx-lb-ambient"
                style={{ backgroundImage: `url("${activePhoto.image}")` }}
              />

              <div className="gx-lb-top" onClick={(e) => e.stopPropagation()}>
                <span className="gx-lb-count">
                  {activePhotoIndex + 1}<em> / {photoCount}</em>
                </span>
                <button type="button" className="gx-lb-close" onClick={closeLightbox} aria-label="Tutup">
                  <X size={20} />
                </button>
              </div>

              {photoCount > 1 && (
                <button
                  type="button"
                  className="gx-lb-nav gx-lb-prev"
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  aria-label="Foto sebelumnya"
                >
                  <ChevronLeft size={26} />
                </button>
              )}

              <figure
                className="gx-lb-stage"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              >
                <img
                  key={`photo-${activePhotoIndex}`}
                  src={activePhoto.image}
                  alt={activePhoto.caption || 'Preview foto'}
                  className="gx-lb-photo"
                  draggable={false}
                />
                {activePhoto.caption && (
                  <figcaption className="gx-lb-caption">{activePhoto.caption}</figcaption>
                )}
              </figure>

              {photoCount > 1 && (
                <button
                  type="button"
                  className="gx-lb-nav gx-lb-next"
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  aria-label="Foto berikutnya"
                >
                  <ChevronRight size={26} />
                </button>
              )}

              {photoCount > 1 && (
                <div className="gx-lb-strip" ref={stripRef} onClick={(e) => e.stopPropagation()}>
                  <div className="gx-lb-strip-inner">
                    {currentAlbumPhotos.map((p, i) => (
                      <button
                        type="button"
                        key={p.id || i}
                        className={`gx-mini${i === activePhotoIndex ? ' is-current' : ''}`}
                        data-current={i === activePhotoIndex}
                        onClick={() => setActivePhotoIndex(i)}
                        aria-label={`Lihat foto ${i + 1}`}
                      >
                        <img src={p.image} alt="" loading="lazy" draggable={false} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      <FooterViewer />
    </div>
  );
}
