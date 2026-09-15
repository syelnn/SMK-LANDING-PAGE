import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Loader2, Calendar } from 'lucide-react';
import '../../css/viewer/newsPage.css';

const API_URL = 'http://localhost:5002/api/news';

const formatDate = (dateString) => {
  if (!dateString) return 'Terbaru';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

const createSlug = (text) => {
  if (!text) return 'detail';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function NewsSection() {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const res = await axios.get(API_URL);
        const dataArray = res.data?.data || (Array.isArray(res.data) ? res.data : []);
        
        // Filter hanya menampilkan berita yang di-publish oleh Admin
        const publishedNews = dataArray.filter(
          (item) => item.status === 'published' || item.status === 'Tampil'
        );

        setNewsList(publishedNews);
      } catch (err) {
        console.error('Error fetching news:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <section id="section-berita" className="viewer-news-page" style={{ paddingTop: '40px' }}>
      <div className="viewer-news-hero" style={{ padding: '10px 20px 30px', background: 'transparent' }}>
        <div className="hero-content">
          <span className="badge-pill">Berita & Informasi</span>
          <h2 className="hero-title">
            Baca Berita Terbaru <span className="highlight">Sekolahku</span>
          </h2>
          <p className="hero-subtitle">
            Dapatkan berita terkini, pengumuman penting, dan kabar prestasi seputar aktivitas sekolah kami.
          </p>
        </div>
      </div>

      <div className="viewer-news-container">
        {/* Grid Berita */}
        {loading ? (
          <div className="loading-state">
            <Loader2 className="animate-spin" size={32} />
            <p>Memuat berita terbaru...</p>
          </div>
        ) : newsList.length === 0 ? (
          <div className="empty-state">
            <p>Belum ada berita terbaru saat ini.</p>
          </div>
        ) : (
          <div className="viewer-news-grid">
            {newsList.map((item) => (
              <article key={item.id} className="viewer-news-card">
                <div className="card-image-wrapper">
                  <img
                    src={item.image || 'https://picsum.photos/600/400'}
                    alt={item.title}
                    onError={(e) => {
                      e.target.src = 'https://picsum.photos/600/400';
                    }}
                  />
                </div>

                <div className="card-body">
                  <div className="card-meta">
                    <span className="meta-date">
                      <Calendar size={13} />
                      {formatDate(item.createdAt || item.created_at)}
                    </span>
                  </div>

                  <h3 className="card-title">{item.title}</h3>

                  <p className="card-excerpt">
                    {item.excerpt || item.content?.substring(0, 110) + '...'}
                  </p>

                <div className="card-footer">
                    <Link 
                        to={`/berita/${item.slug || createSlug(item.title)}`} 
                        className="read-more-btn"
                    >
                        Baca Selengkapnya
                    </Link>
                    </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}