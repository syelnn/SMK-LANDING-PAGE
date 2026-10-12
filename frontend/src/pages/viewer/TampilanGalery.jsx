import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, Image as ImageIcon, Sparkles } from 'lucide-react';
import { getImageUrl } from '../../utils/media';
import { sortPhotos, orderAlbumNames } from '../../utils/galleryOrder';
import coverImg from '../../assets/galeri-cover.jpeg';
import '../../css/viewer/tampilangalery.css';
import '../../css/viewer/GaleriPage.css';

// Ubah nama album jadi slug URL
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

// Jumlah album yang tampil di landing page. Selebihnya ada di halaman /galeri.
const LANDING_LIMIT = 3;

/*  variant="landing" -> maksimal 3 album + tombol "Lihat Semua Album" ke /galeri
    variant="page"    -> banner foto + semua album (route /galeri)            */
export default function TampilanGalery({ variant = 'landing' }) {
  const navigate = useNavigate();
  const isPage = variant === 'page';
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGalleries = async () => {
      try {
        const response = await fetch('https://smkn-compreng-api-pi.vercel.app/api/galleries');
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
  const groupedGalleries = useMemo(() => (
    sortPhotos(galleries).reduce((acc, item) => {
      const cat = item.category || 'Umum';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {})
  ), [galleries]);

  // Urutan album berdasarkan urutan pembuatan
  const albumNames = useMemo(() => orderAlbumNames(groupedGalleries), [groupedGalleries]);

  const visibleAlbums = isPage ? albumNames : albumNames.slice(0, LANDING_LIMIT);
  const hasMore = !isPage && albumNames.length > LANDING_LIMIT;

  // Klik album -> pindah ke halaman tersendiri
  const openAlbum = (categoryName) => {
    navigate(`/galeri/${createSlug(categoryName)}`);
  };

  // Kembali ke landing dan langsung scroll ke section Galeri
  const handleBack = () => {
    sessionStorage.setItem('scrollToSection', 'section-galeri');
    navigate('/');
  };

  const loadingBox = (
    <div style={{ textAlign: 'center', padding: '100px', fontSize: '16px', color: 'var(--compreng-text-secondary, #475569)' }}>
      Memuat Galeri Sekolah...
    </div>
  );

  const albumGrid = albumNames.length === 0 ? (
    <div style={{ textAlign: 'center', padding: '50px', color: 'var(--compreng-text-secondary, #475569)' }}>Belum ada album galeri yang tersedia.</div>
  ) : (
    <div className="gx-album-grid">
      {visibleAlbums.map((catName) => {
        const items = groupedGalleries[catName];
        const coverImage = items.find(i => i.isFeatured === 1 || i.is_featured === 1)?.image || items[0]?.image;

        return (
          <button
            type="button"
            key={catName}
            onClick={() => openAlbum(catName)}
            className="gx-album"
            aria-label={`Buka album ${catName}, ${items.length} foto`}
          >
            <img src={getImageUrl(coverImage)} alt="" className="gx-album-cover" loading="lazy" draggable={false} />
            <span className="gx-album-shade" />
            <span className="gx-album-go"><ArrowUpRight size={18} /></span>
            <span className="gx-album-info">
              <span className="gx-album-count"><ImageIcon size={12} /> {items.length} Foto</span>
              <span className="gx-album-name">{catName}</span>
            </span>
          </button>
        );
      })}
    </div>
  );

  /* ---------- HALAMAN /galeri: banner foto + semua album ---------- */
  if (isPage) {
    return (
      <>
        <header className="gx-cover" style={{ '--gx-cover-img': `url(${coverImg})` }}>
          <div className="gx-cover-inner">
            <button type="button" className="gx-back-pill" onClick={handleBack}>
              <i className="gx-back-ico"><ArrowLeft size={16} /></i>
              Kembali ke Beranda
            </button>

            <div className="gx-cover-text">
              <div className="gx-pill">
                <Sparkles size={14} /> DOKUMENTASI SEKOLAH
              </div>

              <h1 className="gx-heading">
                Galeri <em className="gx-heading-accent">Kegiatan &amp; Album</em>
              </h1>

              <p className="gx-lede">
                Jelajahi berbagai momen dokumentasi aktivitas, fasilitas, dan prestasi siswa SMK Negeri Compreng.
              </p>
            </div>
          </div>
        </header>

        <div id="halaman-galeri" className="tampilan-galeri-wrapper gx-listpage">
          <div className="tg-container">
            {loading ? loadingBox : (
              <>
                {albumNames.length > 0 && (
                  <div className="gx-count">
                    <div className="gx-count-num">{albumNames.length}</div>
                    <div className="gx-count-text">Album Galeri</div>
                    <i className="gx-count-rule" />
                  </div>
                )}
                {albumGrid}
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  /* ---------- LANDING (tampilan tidak berubah, hanya dibatasi 3 + tombol) ---------- */
  if (loading) return loadingBox;

  return (
    <div id="section-galeri" className="tampilan-galeri-wrapper">
      <div className="tg-container">

        {/* HEADER SECTION */}
        <div className="tg-header">
          <span className="tg-badge">Dokumentasi Sekolah</span>
          <h2 className="tg-title">
            Galeri <span style={{ color: '#16a34a' }}>Kegiatan & Album</span>
          </h2>
          <p className="tg-subtitle">
            Jelajahi berbagai momen dokumentasi aktivitas, fasilitas, dan prestasi siswa SMK Negeri Compreng.
          </p>
        </div>

        {albumGrid}

        {hasMore && (
          <div className="gx-more">
            <Link to="/galeri" className="gx-more-btn">
              Lihat Semua Album
              <ArrowRight size={18} />
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}