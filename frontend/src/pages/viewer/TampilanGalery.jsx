import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Image as ImageIcon,
} from 'lucide-react';
import '../../css/viewer/tampilangalery.css';

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

export default function TampilanGalery() {
  const navigate = useNavigate();
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);




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
  const groupedGalleries = useMemo(() => (
    galleries.reduce((acc, item) => {
      const cat = item.category || 'Umum';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {})
  ), [galleries]);

  // Klik album -> pindah ke halaman tersendiri 
  
  const openAlbum = (categoryName) => {
    navigate(`/galeri/${createSlug(categoryName)}`);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px', fontSize: '16px', color: 'var(--compreng-text-secondary, #475569)' }}>Memuat Galeri Sekolah...</div>;
  }



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

        {/* DAFTAR ALBUM (GRID) */}
        {Object.keys(groupedGalleries).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: 'var(--compreng-text-secondary, #475569)' }}>Belum ada album galeri yang tersedia.</div>
        ) : (
          <div className="gx-album-grid">
            {Object.keys(groupedGalleries).map((catName) => {
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
                  <img src={coverImage} alt="" className="gx-album-cover" loading="lazy" draggable={false} />
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
        )}

      </div>
    </div>
  );
}