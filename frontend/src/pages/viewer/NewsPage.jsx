import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import '../../css/viewer/newsPage.css';

const API_URL = 'http://localhost:5002/api/news';

const formatDate = (dateString) => {
  if (!dateString) return 'TERBARU';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options).toUpperCase();
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
    <section id="section-berita" className="vnp-wrapper">
      {/* Hero Header dengan Pill Badge (Gaya Gambar 2) */}
      <div className="vnp-hero">
        <div className="vnp-hero-inner">
          <span className="vnp-hero-badge">BERITA & INFORMASI</span>
          <h1 className="vnp-main-title">
            Baca Berita Terbaru <span className="vnp-title-accent">Sekolahku</span>
          </h1>
          <p className="vnp-main-subtitle">
            Dapatkan berita terkini, pengumuman penting, dan kabar prestasi seputar aktivitas sekolah kami.
          </p>
        </div>
      </div>

      {/* Grid Container */}
      <div className="vnp-container">
        {loading ? (
          <div className="vnp-state-box">
            <Loader2 className="vnp-spinner" size={28} />
            <p>Memuat berita terbaru...</p>
          </div>
        ) : newsList.length === 0 ? (
          <div className="vnp-state-box">
            <p>Belum ada berita terbaru saat me-load data.</p>
          </div>
        ) : (
          <div className="vnp-grid">
            {newsList.map((item) => {
              const targetSlug = `/berita/${item.slug || createSlug(item.title)}`;
              
              return (
                <article key={item.id} className="vnp-card">
                  <Link to={targetSlug} className="vnp-card-thumb">
                    <span className="vnp-badge">{item.category || 'Bimtek'}</span>
                    <img
                      src={item.image || 'https://picsum.photos/600/400'}
                      alt={item.title}
                      onError={(e) => {
                        e.target.src = 'https://picsum.photos/600/400';
                      }}
                    />
                  </Link>

                  <div className="vnp-card-content">
                    <div className="vnp-card-date">
                      {formatDate(item.createdAt || item.created_at)}
                    </div>

                    <h3 className="vnp-card-heading">
                      <Link to={targetSlug}>{item.title}</Link>
                    </h3>

                    <p className="vnp-card-desc">
                      {item.excerpt || item.content?.substring(0, 110) + '...'}
                    </p>

                    <Link to={targetSlug} className="vnp-card-link">
                      Baca Selengkapnya <span>&rarr;</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}