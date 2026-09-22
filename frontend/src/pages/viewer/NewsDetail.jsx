import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Calendar, User, ChevronRight, Tag } from 'lucide-react';
import Navbar from '../../components/Navbar';
import '../../css/viewer/newsDetail.css';

const API_URL = 'http://localhost:5002/api/news';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

export default function NewsDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [news, setNews] = useState(null);
  const [otherNews, setOtherNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fungsi untuk kembali ke Landing Page dan scroll ke section-berita
  const handleGoToBeritaSection = (e) => {
    e.preventDefault();
    navigate('/');
    setTimeout(() => {
      const element = document.getElementById('section-berita');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch detail berita berdasarkan slug
        const res = await axios.get(`${API_URL}/${slug}`);
        if (res.data?.success) {
          setNews(res.data.data);
        } else {
          setError('Berita tidak ditemukan.');
        }

        // Fetch berita lainnya untuk bagian rekomendasi di bawah
        const recentRes = await axios.get(`${API_URL}`);
        if (recentRes.data?.success) {
          const allData = recentRes.data.data || [];
          setOtherNews(allData.filter((item) => item.slug !== slug).slice(0, 3));
        }
      } catch (err) {
        console.error('Error fetching detail:', err);
        setError('Gagal memuat berita.');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
      window.scrollTo(0, 0);
    }
  }, [slug]);

  const getTagsArray = () => {
    if (!news?.tags) return [];
    if (Array.isArray(news.tags)) return news.tags;
    if (typeof news.tags === 'string') {
      try {
        return JSON.parse(news.tags);
      } catch (e) {
        return news.tags.split(',').map((t) => t.trim());
      }
    }
    return [];
  };

  if (loading) {
    return (
      <div className="vnd-page">
        <Navbar />
        <div className="vnd-loading-container">
          <Loader2 className="vnd-spinner" size={36} />
          <p>Memuat berita...</p>
        </div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="vnd-page">
        <Navbar />
        <div className="vnd-error-container">
          <h2>404</h2>
          <p>{error || 'Berita tidak ditemukan'}</p>
          <Link to="/" onClick={handleGoToBeritaSection} className="vnd-btn-back">
            Kembali ke Daftar Berita
          </Link>
        </div>
      </div>
    );
  }

  const tagsList = getTagsArray();

  return (
    <div className="vnd-page">
      {/* Navbar Utama */}
      <Navbar />

      <main className="vnd-main-content">
        <div className="vnd-article-container">

          {/* Navigasi Breadcrumb */}
          <nav className="vnd-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">BERANDA</Link>
            <ChevronRight size={14} className="vnd-breadcrumb-icon" />
            <a href="/#section-berita" onClick={handleGoToBeritaSection}>BERITA</a>
            <ChevronRight size={14} className="vnd-breadcrumb-icon" />
            <span className="vnd-breadcrumb-active">{news.title}</span>
          </nav>

          {/* Tag Badges di Atas Judul */}
          {tagsList.length > 0 && (
            <div className="vnd-tags-wrapper">
              {tagsList.map((tag, idx) => (
                <span key={idx} className="vnd-tag-badge">
                  {String(tag).replace(/^["'\[\]]+|["'\[\]]+$/g, '').toUpperCase()}
                </span>
              ))}
            </div>
          )}

          {/* Judul Artikel */}
          <h1 className="vnd-title">{news.title}</h1>

          {/* Meta Penulis & Tanggal (Gaya Gambar 2) */}
          <div className="vnd-author-card">
            <div className="vnd-author-avatar">
              <User size={18} />
            </div>
            <div className="vnd-author-info">
              <span className="vnd-author-label">PENULIS</span>
              <span className="vnd-author-name">{news.author || 'Administrator'}</span>
            </div>

            <div className="vnd-author-divider"></div>

            <div className="vnd-date-info">
              <Calendar size={16} className="vnd-date-icon" />
              <div>
                <span className="vnd-author-label">DITERBITKAN</span>
                <span className="vnd-date-value">{formatDate(news.createdAt || news.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Gambar Utama Artikel */}
          <div className="vnd-banner-wrapper">
            <img
              src={news.image || 'https://picsum.photos/1000/500'}
              alt={news.title}
              onError={(e) => { e.target.src = 'https://picsum.photos/1000/500'; }}
            />
          </div>

          {/* Isi Konten Artikel */}
          <article className="vnd-content">
            {news.content ? (
              news.content.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))
            ) : (
              <p>{news.excerpt}</p>
            )}
          </article>

          {/* Section Tags Bawah Konten */}
          {tagsList.length > 0 && (
            <div className="vnd-footer-tags">
              <span className="vnd-footer-tags-title">
                <Tag size={14} /> Tag Terkait:
              </span>
              <div className="vnd-footer-tags-list">
                {tagsList.map((tag, idx) => (
                  <span key={idx} className="vnd-footer-tag-item">
                    #{String(tag).replace(/^["'\[\]]+|["'\[\]]+$/g, '')}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Section Berita Lainnya */}
        {otherNews.length > 0 && (
          <section className="vnd-other-section">
            <div className="vnd-other-container">
              <h2 className="vnd-other-title">Berita Lainnya</h2>
              <div className="vnd-other-grid">
                {otherNews.map((item) => (
                  <Link to={`/berita/${item.slug}`} key={item.id || item.slug} className="vnd-other-card">
                    <div className="vnd-other-img">
                      <img 
                        src={item.image || 'https://picsum.photos/400/250'} 
                        alt={item.title}
                        onError={(e) => { e.target.src = 'https://picsum.photos/400/250'; }}
                      />
                    </div>
                    <div className="vnd-other-body">
                      <span className="vnd-other-date">{formatDate(item.createdAt || item.created_at)}</span>
                      <h3>{item.title}</h3>
                      <p>{item.excerpt || item.content?.substring(0, 85) + '...'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}