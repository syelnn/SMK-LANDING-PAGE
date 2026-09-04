import React, { useEffect, useState } from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';

const WebsiteFavicon = ({ url, title }) => {
  if (!url) return null;
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${url}&sz=64`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        backgroundColor: '#1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        border: '1px solid #334155',
        transition: 'all 0.3s'
      }}
      title={title}
    >
      <img
        src={faviconUrl}
        alt={title || 'Icon Website'}
        style={{ width: '20px', height: '20px', objectFit: 'contain' }}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    </a>
  );
};

const Footer = () => {
  const [footerData, setFooterData] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5002/api/footer')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setFooterData(resData.data);
        }
      })
      .catch((err) => console.error('Gagal memuat footer data:', err));
  }, []);

  // Fungsi scroll yang memaksa berpindah section & scroll ke atas
  // Fungsi scroll khusus Footer (tanpa ubah App.jsx)
  const handleNavigate = (e, sectionId) => {
    e.preventDefault();
    
    // 1. Update Hash di URL
    window.history.pushState(null, '', `/dashboard#${sectionId}`);

    // 2. Cari elemen dengan prefix 'section-' atau ID langsung
    const targetId = sectionId.startsWith('section-') ? sectionId : `section-${sectionId}`;
    const targetElement = document.getElementById(targetId) || document.getElementById(sectionId);
    
    // 3. Ambil kontainer scroll dashboard
    const contentElement = document.querySelector('.dashboard-content');

    if (targetElement && contentElement) {
      // Scroll kontainer dashboard ke posisi section
      contentElement.scrollTo({
        top: targetElement.offsetTop - 70,
        behavior: 'smooth'
      });
    } else if (contentElement) {
      // Jika section tidak ditemukan, scroll ke paling atas kontainer
      contentElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="footer-container">
      <div className="footer-content">
        
        {/* KOLOM 1: NAMA SEKOLAH & SOSIAL MEDIA */}
        <div className="footer-column">
          <h3 className="footer-title-main">
            {footerData?.schoolName || footerData?.school_name || 'SMK NEGERI COMPRENG'}
          </h3>
          <p className="footer-desc">
            {footerData?.description || 'Membangun generasi cerdas, berkarakter, dan berprestasi unggul di bidang keahlian vokasi.'}
          </p>

          <div className="footer-socials" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(footerData?.facebookUrl || footerData?.facebook_url) && (
              <WebsiteFavicon url={footerData?.facebookUrl || footerData?.facebook_url} title="Facebook" />
            )}
            {(footerData?.instagramUrl || footerData?.instagram_url) && (
              <WebsiteFavicon url={footerData?.instagramUrl || footerData?.instagram_url} title="Instagram" />
            )}
            {(footerData?.tiktokUrl || footerData?.tiktok_url) && (
              <WebsiteFavicon url={footerData?.tiktokUrl || footerData?.tiktok_url} title="TikTok" />
            )}
            {(footerData?.youtubeUrl || footerData?.youtube_url) && (
              <WebsiteFavicon url={footerData?.youtubeUrl || footerData?.youtube_url} title="YouTube" />
            )}
            {(footerData?.twitterUrl || footerData?.twitter_url) && (
              <WebsiteFavicon url={footerData?.twitterUrl || footerData?.twitter_url} title="Twitter / X" />
            )}
          </div>
        </div>

        {/* KOLOM 2: TAUTAN CEPAT */}
<div className="footer-column">
  <h4 className="footer-title">Tautan Cepat</h4>
  <ul className="footer-links-list">
    {/* Ubah 'beranda' menjadi 'hero' */}
    <li><a href="/dashboard#hero" onClick={(e) => handleNavigate(e, 'hero')}>Dashboard</a></li>
    <li><a href="/dashboard#profil" onClick={(e) => handleNavigate(e, 'profil')}>Profil Sekolah</a></li>
    <li><a href="/dashboard#jurusan" onClick={(e) => handleNavigate(e, 'jurusan')}>Jurusan</a></li>
    {/* Ubah 'ekstrakurikuler' menjadi 'ekskul' */}
    <li><a href="/dashboard#ekskul" onClick={(e) => handleNavigate(e, 'ekskul')}>Ekstrakurikuler</a></li>
    <li><a href="/dashboard#pengajar" onClick={(e) => handleNavigate(e, 'pengajar')}>Tenaga Pengajar</a></li>
    <li><a href="/dashboard#berita" onClick={(e) => handleNavigate(e, 'berita')}>Berita & Artikel</a></li>
    <li><a href="/dashboard#galeri" onClick={(e) => handleNavigate(e, 'galeri')}>Galeri</a></li>
    <li><a href="/dashboard#faq" onClick={(e) => handleNavigate(e, 'faq')}>FAQ</a></li>
  </ul>
</div>

        {/* KOLOM 3: HUBUNGI KAMI */}
        <div className="footer-column">
          <h4 className="footer-title">Hubungi Kami</h4>
          <ul className="footer-contact-list">
            <li className="footer-contact-item">
              <MapPin size={18} className="footer-icon" style={{ marginTop: '2px' }} />
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(footerData?.address || 'SMK Negeri Compreng')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'inherit', textDecoration: 'none' }}
              >
                <span>{footerData?.address || 'Jl. Raya Compreng, Kabupaten Subang, Jawa Barat'}</span>
              </a>
            </li>
            <li className="footer-contact-item">
              <Phone size={18} className="footer-icon" />
              <a href={`tel:${footerData?.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                <span>{footerData?.phone || '(0260) 123456'}</span>
              </a>
            </li>
            <li className="footer-contact-item">
              <Mail size={18} className="footer-icon" />
              <a href={`mailto:${footerData?.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                <span>{footerData?.email || 'info@smkncompreng.sch.id'}</span>
              </a>
            </li>
          </ul>
        </div>

        {/* KOLOM 4: LOKASI GOOGLE MAPS EMBED */}
        <div className="footer-column">
          <h4 className="footer-title">Lokasi</h4>
          <div className="footer-map-box">
            {(footerData?.mapsEmbedUrl || footerData?.maps_embed_url) ? (
              <iframe
                title="Peta Lokasi Sekolah"
                src={footerData?.mapsEmbedUrl || footerData?.maps_embed_url}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            ) : (
              <div className="footer-map-empty">
                Peta Lokasi Belum Diatur
              </div>
            )}
          </div>
        </div>

      </div>

      {/* COPYRIGHT BOTTOM */}
      <div className="footer-copyright">
        © {new Date().getFullYear()} {footerData?.schoolName || footerData?.school_name || 'SMK NEGERI COMPRENG'}. Seluruh Hak Cipta Dilindungi.
      </div>
    </footer>
  );
};

export default Footer;