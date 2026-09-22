import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import axios from 'axios';
import { SettingsContext } from '../../context/SettingsContext';
import { resolveContact, normalizeUrl, toMapEmbedSrc } from '../../utils/contact';
import '../../css/viewer/footerviewer.css';

const API_URL = 'http://localhost:5002';

const WebsiteFavicon = ({ url, title }) => {
  if (!url) return null;
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${url}&sz=64`;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="footer-social-icon" title={title}>
      <img
        src={faviconUrl}
        alt={title || 'Icon Website'}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    </a>
  );
};

const FooterViewer = () => {
  const { settings } = useContext(SettingsContext);
  const [footerData, setFooterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFooter = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/footer`);
        if (response.data.success && response.data.data) setFooterData(response.data.data);
      } catch (error) {
        console.error('Gagal mengambil data footer dari API:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFooter();
  }, []);

  // Tautan cepat:
  //  - /download            -> pindah halaman via router
  //  - sedang di landing    -> smooth scroll ke section
  //  - sedang di halaman lain -> kembali ke landing lalu scroll ke section
  const handleQuickLink = (e, path, sectionId) => {
    e.preventDefault();

    if (path === '/download') {
      navigate('/download');
      window.scrollTo({ top: 0 });
      return;
    }

    const onLanding = !!document.getElementById('section-hero');
    const element = sectionId ? document.getElementById(sectionId) : null;

    if (onLanding && element) {
      window.history.replaceState(null, '', path);
      requestAnimationFrame(() => element.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      return;
    }

    sessionStorage.setItem('scrollToSection', sectionId || 'section-hero');
    navigate('/');
  };

  if (loading) {
    return (
      <footer className="footer-container" id="section-kontak">
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--compreng-footer-muted, var(--compreng-nav-text-muted, #94a3b8))' }}>
          Memuat data footer...
        </div>
      </footer>
    );
  }

  // Nama & deskripsi: dari data footer
  const schoolName = footerData?.school_name || footerData?.schoolName || settings?.school_name || '';
  const description = footerData?.description || '';

  // KONTAK & SOSMED: dari Pengaturan Website (Contact & Maps). Belum pernah disimpan -> data footer lama.
  const c = resolveContact(settings, footerData);
  const address = c.contact_address;
  const phone = c.contact_phone;
  const email = c.contact_email;
  const mapUrl = toMapEmbedSrc(c.contact_map_embed_url, address);

  const facebookUrl = normalizeUrl(c.social_facebook);
  const instagramUrl = normalizeUrl(c.social_instagram);
  const tiktokUrl = normalizeUrl(c.social_tiktok);
  const twitterUrl = normalizeUrl(c.social_twitter);
  const youtubeUrl = normalizeUrl(c.social_youtube);

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
                <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>
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
                key={mapUrl}
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