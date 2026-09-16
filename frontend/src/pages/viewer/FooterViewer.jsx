import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import axios from 'axios';
import '../../css/viewer/footerviewer.css';

const API_URL = 'http://localhost:5002';

const WebsiteFavicon = ({ url, title }) => {
  if (!url) return null;
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${url}&sz=64`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="footer-social-icon"
      title={title}
    >
      <img
        src={faviconUrl}
        alt={title || 'Icon Website'}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    </a>
  );
};

const FooterViewer = () => {
  const [footerData, setFooterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFooter = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/footer`);
        if (response.data.success && response.data.data) {
          setFooterData(response.data.data);
        }
      } catch (error) {
        console.error('Gagal mengambil data footer dari API:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFooter();
  }, []);

  // Perbaikan: Smooth Scroll Optimal Tanpa Lag
  const handleQuickLink = (e, path, sectionId) => {
    e.preventDefault();

    // 1. Ubah URL di address bar tanpa mentrigger re-render React Router yang berat
    window.history.pushState({}, '', path);

    // 2. Jalankan animasi scroll menggunakan requestAnimationFrame agar rendering frame mulus (60fps)
    requestAnimationFrame(() => {
      if (sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  };

  if (loading) {
    return (
      <footer className="footer-container" id="section-kontak">
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
          Memuat data footer...
        </div>
      </footer>
    );
  }

  // Mengambil data dari database (snake_case & camelCase)
  const schoolName = footerData?.school_name || footerData?.schoolName || '';
  const description = footerData?.description || '';
  const address = footerData?.address || '';
  const phone = footerData?.phone || '';
  const email = footerData?.email || '';
  
  // Mengambil URL Sosmed dari DB
  const facebookUrl = footerData?.facebook_url || footerData?.facebookUrl;
  const instagramUrl = footerData?.instagram_url || footerData?.instagramUrl;
  const tiktokUrl = footerData?.tiktok_url || footerData?.tiktokUrl;
  const twitterUrl = footerData?.twitter_url || footerData?.twitterUrl;
  const youtubeUrl = footerData?.youtube_url || footerData?.youtubeUrl;
  const mapUrl = footerData?.maps_embed_url || footerData?.mapsEmbedUrl;

  return (
    <footer className="footer-container" id="section-kontak">
      <div className="footer-content">
        
        {/* KOLOM 1: NAMA SEKOLAH & SOSIAL MEDIA */}
        <div className="footer-column brand-column">
          <h3 className="footer-title-main">{schoolName}</h3>
          <p className="footer-desc">{description}</p>

          <div className="footer-socials">
            {facebookUrl && <WebsiteFavicon url={facebookUrl} title="Facebook" />}
            {instagramUrl && <WebsiteFavicon url={instagramUrl} title="Instagram" />}
            {tiktokUrl && <WebsiteFavicon url={tiktokUrl} title="TikTok" />}
            {twitterUrl && <WebsiteFavicon url={twitterUrl} title="X (Twitter)" />}
            {youtubeUrl && <WebsiteFavicon url={youtubeUrl} title="YouTube" />}
          </div>
        </div>

        {/* KOLOM 2: TAUTAN CEPAT */}
        <div className="footer-column">
          <h4 className="footer-title">Tautan Cepat</h4>
          <ul className="footer-links-list">
            <li><a href="/" onClick={(e) => handleQuickLink(e, '/', 'section-hero')}>Beranda</a></li>
            <li><a href="/profil" onClick={(e) => handleQuickLink(e, '/profil', 'section-profil')}>Profil Sekolah</a></li>
            <li><a href="/berita" onClick={(e) => handleQuickLink(e, '/berita', 'section-berita')}>Berita & Artikel</a></li>
            <li><a href="/jurusan" onClick={(e) => handleQuickLink(e, '/jurusan', 'section-program')}>Jurusan</a></li>
            <li><a href="/ekstrakurikuler" onClick={(e) => handleQuickLink(e, '/ekstrakurikuler', 'section-ekskul')}>Ekstrakurikuler</a></li>
            <li><a href="/pengajar" onClick={(e) => handleQuickLink(e, '/pengajar', 'section-pengajar')}>Tenaga Pengajar</a></li>
            <li><a href="/prestasi" onClick={(e) => handleQuickLink(e, '/prestasi', 'section-prestasi')}>Karya & Prestasi</a></li>
            <li><a href="/galeri" onClick={(e) => handleQuickLink(e, '/galeri', 'section-galeri')}>Galeri</a></li>
            <li><a href="/testimoni" onClick={(e) => handleQuickLink(e, '/testimoni', 'section-testimoni')}>Testimoni</a></li>
            <li><a href="/faq" onClick={(e) => handleQuickLink(e, '/faq', 'section-faq')}>FAQ</a></li>
            <li><a href="/download" onClick={(e) => handleQuickLink(e, '/download', null)}>Download</a></li>
          </ul>
        </div>

        {/* KOLOM 3: HUBUNGI KAMI */}
        <div className="footer-column">
          <h4 className="footer-title">Hubungi Kami</h4>
          <ul className="footer-contact-list">
            {address && (
              <li className="footer-contact-item">
                <MapPin size={18} className="footer-icon" />
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>{address}</span>
                </a>
              </li>
            )}
            {phone && (
              <li className="footer-contact-item">
                <Phone size={18} className="footer-icon" />
                <a href={`tel:${phone.replace(/\s+/g, '')}`}>
                  <span>{phone}</span>
                </a>
              </li>
            )}
            {email && (
              <li className="footer-contact-item">
                <Mail size={18} className="footer-icon" />
                <a href={`mailto:${email}`}>
                  <span>{email}</span>
                </a>
              </li>
            )}
          </ul>
        </div>

        {/* KOLOM 4: LOKASI GOOGLE MAPS EMBED */}
        <div className="footer-column map-column">
          <h4 className="footer-title">Lokasi</h4>
          <div className="footer-map-box">
            {mapUrl ? (
              <iframe
                title="Peta Lokasi Sekolah"
                src={mapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            ) : (
              <div className="footer-map-empty">Peta tidak tersedia</div>
            )}
          </div>
        </div>

      </div>

      {/* COPYRIGHT BOTTOM */}
      <div className="footer-copyright">
        © {new Date().getFullYear()} {schoolName}. Seluruh Hak Cipta Dilindungi.
      </div>
    </footer>
  );
};

export default FooterViewer;