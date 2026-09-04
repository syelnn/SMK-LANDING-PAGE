import React, { useContext } from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';
import { SettingsContext } from '../context/SettingsContext';

const WebsiteFavicon = ({ url, title }) => {
  if (!url) return null;
  // Mengambil favicon otomatis dari domain URL
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
  const { settings } = useContext(SettingsContext);

  // Data dinamis dengan fallback teks aslinya
  const schoolName = settings?.school_name || 'SMK NEGERI COMPRENG';
  const schoolDesc = settings?.school_history || 'Mewujudkan lulusan yang berkarakter, kompeten, dan siap kerja di dunia industri.';
  
  // Validasi URL Peta: Jika link dari database valid (mengandung kata 'embed'), gunakan itu.
  // Jika tidak valid atau kosong, paksa gunakan peta asli SMK Compreng agar tidak blank/zoom-out.
  const mapUrl = settings?.contact_map_embed_url?.includes('embed') 
    ? settings.contact_map_embed_url 
    : "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.551322194605!2d107.8184518147699!3d-6.451582995332217!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e693b4a22b7b3b3%3A0x6b6b6b6b6b6b6b6b!2sSMK%20Negeri%20Compreng!5e0!3m2!1sen!2sid!4v1622543210000!5m2!1sen!2sid";

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
            {schoolName}
          </h3>
          <p className="footer-desc">
            {schoolDesc}
          </p>

          <div className="footer-socials" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {/* Memaksa kelima ikon tetap muncul dengan URL default jika database kosong */}
            <WebsiteFavicon url={settings?.social_facebook || 'https://facebook.com'} title="Facebook" />
            <WebsiteFavicon url={settings?.social_instagram || 'https://instagram.com'} title="Instagram" />
            <WebsiteFavicon url={settings?.social_tiktok || 'https://tiktok.com'} title="TikTok" />
            <WebsiteFavicon url={settings?.social_youtube || 'https://youtube.com'} title="YouTube" />
            <WebsiteFavicon url={settings?.social_twitter || 'https://x.com'} title="X / Twitter" />
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
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings?.contact_address || 'SMK Negeri Compreng')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'inherit', textDecoration: 'none' }}
              >
                <span>{settings?.contact_address || 'Jl. Raya Compreng, Kecamatan Compreng, Kabupaten Subang, Jawa Barat 41258'}</span>
              </a>
            </li>
            <li className="footer-contact-item">
              <Phone size={18} className="footer-icon" />
              <a href={`tel:${settings?.contact_phone || '02607547733'}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                <span>{settings?.contact_phone || '0260 7547733'}</span>
              </a>
            </li>
            <li className="footer-contact-item">
              <Mail size={18} className="footer-icon" />
              <a href={`mailto:${settings?.contact_email || 'info@smkncompreng.sch.id'}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                <span>{settings?.contact_email || 'info@smkncompreng.sch.id'}</span>
              </a>
            </li>
          </ul>
        </div>

        {/* KOLOM 4: LOKASI GOOGLE MAPS EMBED */}
        <div className="footer-column">
          <h4 className="footer-title">Lokasi</h4>
          <div className="footer-map-box">
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

export default Footer;