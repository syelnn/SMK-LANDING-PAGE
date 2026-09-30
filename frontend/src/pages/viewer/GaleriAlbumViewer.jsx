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
import { sortPhotos } from '../../utils/galleryOrder';
import { getImageUrl } from '../../utils/media';
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

// Jarak geser minimal (px) agar dianggap perpindahan foto, bukan sentuhan biasa
const SWIPE_THRESHOLD = 60;

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
          src={getImageUrl(photo.image)}
          alt={photo.caption || `Foto galeri ${index + 1}`}
          loading="lazy"
          draggable={false}
          onLoad={(e) => applyLoaded(e.currentTarget)}
          onError={() => { setFailed(true); setLoaded(true); }}
        />
      )}
      <span className="gx-tile-shade" />
      <span className="gx-tile-zoom"><Maximize2 size={15} /></span>
      {photo.caption && (
        <span className="gx-tile-cap">
          {/* padding ada di .gx-tile-cap, pemotongan baris di teks di dalamnya,
              supaya baris ke-3 tidak "bocor" ke area padding */}
          <span className="gx-tile-cap-text">{photo.caption}</span>
        </span>
      )}
    </button>
  );
}

export default function GaleriAlbumViewer() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);

  // Geser jari / mouse di lightbox
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const stripRef = useRef(null);
  const closeBtnRef = useRef(null);
  const dragRef = useRef(null);
  const columnCount = useColumnCount();

  // Selalu mulai dari atas halaman saat berpindah dari daftar album
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchGalleries = async () => {
      try {
        const response = await fetch('https://smkn-compreng-api-pi.vercel.app/api/galleries');
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
    sortPhotos(galleries).reduce((acc, item) => {
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
  const closeLightbox = useCallback(() => {
    setActivePhotoIndex(null);
    setDragX(0);
    setDragging(false);
    dragRef.current = null;
  }, []);
  const goNext = useCallback(() => {
    if (!photoCount) return;
    setActivePhotoIndex((prev) => (prev === null ? prev : (prev + 1) % photoCount));
  }, [photoCount]);
  const goPrev = useCallback(() => {
    if (!photoCount) return;
    setActivePhotoIndex((prev) => (prev === null ? prev : (prev - 1 + photoCount) % photoCount));
  }, [photoCount]);

  const lightboxOpen = activePhotoIndex !== null;

  // Keyboard (Esc / panah) + kunci scroll halaman saat lightbox terbuka.
  // <html> ikut dikunci (bukan hanya <body>) supaya browser HP tidak ikut
  // menggeser halaman ke samping ketika foto di-swipe.
  useEffect(() => {
    if (!lightboxOpen) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);

    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyOverflow: body.style.overflow,
    };
    html.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';
    body.style.overflow = 'hidden';

    closeBtnRef.current?.focus({ preventScroll: true });

    return () => {
      window.removeEventListener('keydown', onKey);
      html.style.overflow = prev.htmlOverflow;
      html.style.overscrollBehavior = prev.htmlOverscroll;
      body.style.overflow = prev.bodyOverflow;
    };
  }, [lightboxOpen, closeLightbox, goNext, goPrev]);

  // Strip thumbnail otomatis menggulir ke foto yang sedang dibuka.
  // Hanya menggeser strip-nya sendiri (bukan scrollIntoView, yang bisa ikut
  // menggeser halaman/viewport di HP).
  useEffect(() => {
    const strip = stripRef.current;
    if (!lightboxOpen || !strip) return;
    const current = strip.querySelector('[data-current="true"]');
    if (!current) return;
    const target = current.offsetLeft - (strip.clientWidth - current.offsetWidth) / 2;
    strip.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [activePhotoIndex, lightboxOpen]);

  // Preload foto sebelum & sesudahnya supaya perpindahan terasa instan
  useEffect(() => {
    if (!lightboxOpen || photoCount < 2) return;
    [1, -1].forEach((step) => {
      const target = currentAlbumPhotos[(activePhotoIndex + step + photoCount) % photoCount];
      if (target?.image) {
        const img = new Image();
        img.src = getImageUrl(target.image);
      }
    });
  }, [activePhotoIndex, lightboxOpen, photoCount, currentAlbumPhotos]);

  // Geser (swipe) memakai pointer events. Area foto memakai `touch-action: none`
  // di CSS, sehingga browser tidak ikut menggeser halaman.
  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragRef.current = { id: e.pointerId, startX: e.clientX, startY: e.clientY, moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.abs(dx) < 6) return;
    if (!d.moved && Math.abs(dy) > Math.abs(dx)) return; // gerakan vertikal, abaikan
    d.moved = true;
    setDragging(true);
    // Foto ikut jari, tapi dibatasi supaya tidak lari keluar layar
    setDragX(Math.max(-160, Math.min(160, dx)));
  };

  const endDrag = (e) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const moved = d.moved;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    setDragging(false);
    setDragX(0);
    if (moved && photoCount > 1 && Math.abs(dx) > SWIPE_THRESHOLD) {
      (dx < 0 ? goNext : goPrev)();
    }
    // `moved` dibiarkan sebentar agar klik susulan setelah geser tidak menutup lightbox
    dragRef.current = moved ? { id: null, moved: true } : null;
    if (moved) setTimeout(() => { dragRef.current = null; }, 0);
  };

  const onStageClick = (e) => {
    // Klik di area kosong sekitar foto = tutup; klik di foto/caption = tidak
    if (dragRef.current?.moved) return;
    if (e.target === e.currentTarget) closeLightbox();
  };

  const activePhoto = lightboxOpen ? currentAlbumPhotos[activePhotoIndex] : null;

  return (
    <div className="gav-page-wrapper">
      <Navbar />

      <div id="section-galeri-album" className="tampilan-galeri-wrapper gx-standalone gav-standalone">
        <div className="tg-container">

          {/* HEADER: tombol kembali di atas, judul di bawahnya (tidak saling menabrak) */}
          <header className="gx-head">
            <button type="button" onClick={backToAlbums} className="tg-btn-back gx-back">
              <ArrowLeft size={16} /> Kembali ke Daftar Album
            </button>

            <h1 className="gx-head-title">{selectedAlbum || (loading ? 'Memuat album…' : 'Album')}</h1>

            {!loading && selectedAlbum && (
              <div className="gx-meta">
                <span className="gx-meta-pill"><ImageIcon size={14} /> {photoCount} Foto</span>
                <span className="gx-meta-hint">Ketuk foto untuk memperbesar</span>
              </div>
            )}
          </header>

          {/* STATE: MEMUAT */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '80px 0', fontSize: '16px', color: 'var(--compreng-text-secondary, #475569)' }}>
              Memuat Album Galeri...
            </div>
          )}

          {/* STATE: ALBUM TIDAK DITEMUKAN */}
          {!loading && !selectedAlbum && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p style={{ color: 'var(--compreng-text-secondary, #475569)', marginBottom: '20px' }}>
                Album galeri tidak ditemukan atau sudah tidak tersedia.
              </p>
            </div>
          )}

          {/* FOTO DALAM ALBUM (MASONRY) */}
          {!loading && selectedAlbum && (
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
                style={{ backgroundImage: `url("${getImageUrl(activePhoto.image)}")` }}
              />

              <div className="gx-lb-top" onClick={(e) => e.stopPropagation()}>
                <span className="gx-lb-count">
                  {activePhotoIndex + 1}<em> / {photoCount}</em>
                </span>
                <button
                  ref={closeBtnRef}
                  type="button"
                  className="gx-lb-close"
                  onClick={closeLightbox}
                  aria-label="Tutup"
                >
                  <X size={20} />
                </button>
              </div>

              <figure
                className="gx-lb-stage"
                onClick={(e) => { e.stopPropagation(); onStageClick(e); }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                <div
                  className={`gx-lb-slide${dragging ? ' is-dragging' : ''}`}
                  style={{ transform: dragX ? `translate3d(${dragX}px, 0, 0)` : undefined }}
                >
                  <img
                    key={`photo-${activePhotoIndex}`}
                    src={getImageUrl(activePhoto.image)}
                    alt={activePhoto.caption || 'Preview foto'}
                    className="gx-lb-photo"
                    draggable={false}
                  />
                  {activePhoto.caption && (
                    <figcaption className="gx-lb-caption">{activePhoto.caption}</figcaption>
                  )}
                </div>
              </figure>

              {photoCount > 1 && (
                <>
                  <button
                    type="button"
                    className="gx-lb-nav gx-lb-prev"
                    onClick={(e) => { e.stopPropagation(); goPrev(); }}
                    aria-label="Foto sebelumnya"
                  >
                    <ChevronLeft size={26} />
                  </button>
                  <button
                    type="button"
                    className="gx-lb-nav gx-lb-next"
                    onClick={(e) => { e.stopPropagation(); goNext(); }}
                    aria-label="Foto berikutnya"
                  >
                    <ChevronRight size={26} />
                  </button>

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
                          <img src={getImageUrl(p.image)} alt="" loading="lazy" draggable={false} />
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>

      <FooterViewer />
    </div>
  );
}