import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Award, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { getImageUrl } from '../../utils/media';
import coverImg from '../../assets/prestasi-cover.jpeg';
import '../../css/viewer/AchievementViewer.css';

// Teks otomatis huruf Kapital Awal Kata (Title Case)
const toTitleCase = (str) => {
  if (!str) return '';
  return str.toLowerCase().replace(/(?:^|\s|-)\S/g, (m) => m.toUpperCase());
};

// Nilai "Prestasi" di database ditampilkan sebagai "Pendidikan" (alumni lulus perguruan tinggi).
const LEVEL_LABELS = { prestasi: 'Pendidikan' };
const getLevelLabel = (level) => LEVEL_LABELS[level?.toLowerCase()] || level || 'Nasional';
const getLevelSlug = (level) => (level || 'nasional').toLowerCase().trim().replace(/\s+/g, '-');

const API_URL = 'https://smkn-compreng-api-pi.vercel.app/api/achievements';

// Jumlah kartu yang tampil di landing page. Sisanya ada di halaman /prestasi.
const LANDING_LIMIT = 3;

/* --------------------------------------------------------------------------
   KARTU (dipakai di landing & halaman /prestasi)
   Susunan teks: label (kelas • tahun) -> nama -> prestasi. Tanpa "Lihat detail".
   -------------------------------------------------------------------------- */
const KpCard = ({ item, index }) => {
  const [imgError, setImgError] = useState(false);
  const showImg = item.photo && !imgError;
  const label = [item.class_name || 'SMKN Compreng', item.year || '2026'].join(' • ');

  return (
    <article className={`kp-tile kp-lv--${getLevelSlug(item.level)}`} style={{ '--i': index }}>
      <div className="kp-media">
        {showImg ? (
          <img
            src={getImageUrl(item.photo)}
            alt={item.student_name || 'Foto prestasi'}
            className="kp-img"
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="kp-img-fallback">
            <Award size={38} />
          </div>
        )}

        <div className="kp-level">{getLevelLabel(item.level)}</div>
      </div>

      <div className="kp-body">
        <div className="kp-label">{label}</div>
        <h3 className="kp-name">{item.student_name || 'Siswa SMKN Compreng'}</h3>
        <div className="kp-desc" title={item.achievement}>
          {toTitleCase(item.achievement)}
        </div>
      </div>
    </article>
  );
};

const KpSkeleton = ({ count }) => (
  <div className="kp-grid" aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <div className="kp-tile kp-skel" key={i}>
        <div className="kp-media kp-skel-block" />
        <div className="kp-body">
          <div className="kp-skel-bar" style={{ width: '38%', height: 12 }} />
          <div className="kp-skel-bar" style={{ width: '72%', height: 22 }} />
          <div className="kp-skel-bar" style={{ width: '95%' }} />
          <div className="kp-skel-bar" style={{ width: '60%' }} />
        </div>
      </div>
    ))}
  </div>
);

/* --------------------------------------------------------------------------
   KOMPONEN UTAMA
   variant="landing" -> maksimal 3 kartu + tombol "Lihat Semua" ke /prestasi
   variant="page"    -> banner foto + semua kartu (route /prestasi)
   -------------------------------------------------------------------------- */
const AchievementViewer = ({ variant = 'landing' }) => {
  const navigate = useNavigate();
  const isPage = variant === 'page';
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await axios.get(API_URL);
        if (alive && res.data && res.data.data) setAchievements(res.data.data);
      } catch (err) {
        console.error('Error fetching viewer achievements:', err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const visible = isPage ? achievements : achievements.slice(0, LANDING_LIMIT);
  const hasMore = !isPage && achievements.length > LANDING_LIMIT;

  // Kembali ke landing dan langsung scroll ke section Karya & Prestasi
  const handleBack = () => {
    sessionStorage.setItem('scrollToSection', 'section-prestasi');
    navigate('/');
  };

  const content = loading ? (
    <KpSkeleton count={LANDING_LIMIT} />
  ) : achievements.length === 0 ? (
    <div className="kp-empty">
      <Award size={44} />
      <h3>Belum Ada Prestasi Ditemukan</h3>
      <div>Data karya &amp; prestasi belum tersedia.</div>
    </div>
  ) : (
    <>
      {isPage && (
        <div className="kp-count">
          <div className="kp-count-num">{achievements.length}</div>
          <div className="kp-count-text">Karya &amp; Prestasi</div>
          <i className="kp-count-line" />
        </div>
      )}

      <div className="kp-grid">
        {visible.map((item, i) => (
          <KpCard item={item} index={i} key={item.id} />
        ))}
      </div>

      {hasMore && (
        <div className="kp-more">
          <Link to="/prestasi" className="kp-more-btn">
            Lihat Semua Karya &amp; Prestasi
            <ArrowRight size={18} />
          </Link>
        </div>
      )}
    </>
  );

  /* ---------- HALAMAN /prestasi: banner foto + grid ---------- */
  if (isPage) {
    return (
      <>
        <header className="kp-cover" style={{ '--kp-cover-img': `url(${coverImg})` }}>
          <div className="kp-cover-inner">
            <button type="button" className="kp-back" onClick={handleBack}>
              <i className="kp-back-ico"><ArrowLeft size={16} /></i>
              Kembali ke Beranda
            </button>

            <div className="kp-cover-text">
              <div className="kp-pill">
                <Sparkles size={14} /> TARUNA/I SMKN COMPRENG
              </div>

              <h1 className="kp-heading">
                Karya <span className="kp-heading-accent">&amp; Prestasi</span>
              </h1>

              <p className="kp-subtitle">
                Apresiasi atas kerja keras, inovasi, dan dedikasi luar biasa para siswa/i SMK Negeri Compreng dalam mengharumkan nama sekolah.
              </p>
            </div>
          </div>
        </header>

        <section className="kp-section kp-section--page" id="halaman-prestasi">
          <div className="kp-inner">{content}</div>
        </section>
      </>
    );
  }

  /* ---------- LANDING ---------- */
  return (
    <section className="kp-section" id="section-prestasi">
      <div className="kp-inner">
        <header className="kp-hero">
          <div className="kp-pill">
            <Sparkles size={14} /> KARYA &amp; PRESTASI
          </div>

          <h1 className="kp-heading">
            Karya <span className="kp-heading-accent">&amp; Prestasi</span> Taruna/i SMKN COMPRENG
          </h1>

          <p className="kp-subtitle">
            Apresiasi atas kerja keras, inovasi, dan dedikasi luar biasa para siswa/i SMK Negeri Compreng dalam mengharumkan nama sekolah.
          </p>
        </header>

        {content}
      </div>
    </section>
  );
};

export default AchievementViewer;