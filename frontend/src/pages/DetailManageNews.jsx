import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, User, Calendar } from 'lucide-react';

const API_URL = 'http://localhost:5002/api/news';

export default function DetailManageNews() {
  const { slug } = useParams();

  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Detail Berita dari Backend
    const fetchDetail = async () => {
      try {
        const res = await axios.get(`${API_URL}/${slug}`);
        const newsData = res.data?.data || res.data;
        setNews(newsData);
      } catch (err) {
        console.error('Error fetching news detail:', err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchDetail();
    else setLoading(false);
  }, [slug]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Memuat berita...</div>;

  if (!news) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h3>Berita tidak ditemukan</h3>
        <Link to="/dashboard" className="btn-back">
          <ArrowLeft size={16} /> Kembali ke Berita
        </Link>
      </div>
    );
  }

  const category = news.category || news.kategori || 'Kegiatan';
  const title = news.title || news.judul || 'Tanpa Judul';
  const author = news.author || news.penulis || 'Administrator';
  const publishedAt = news.publishedAt || news.published_at || news.createdAt;
  const image = news.image || news.gambar || 'https://picsum.photos/800/400';
  const content = news.content || news.isi || news.konten || '';

  const cleanContent = content.replace(/<\/?[^>]+(>|$)/g, "");

  return (
    <div className="news-detail-container">
      {/* Header Berita */}
      <div className="news-detail-header">
        <span className="news-badge-detail">{category.toUpperCase()}</span>
        <h1 className="news-detail-title">{title}</h1>

        <div className="news-meta">
          <div className="meta-item">
            <div className="meta-icon-bg">
              <User size={14} color="#ffffff" />
            </div>
            <div>
              <small>PENULIS</small>
              <span>{author}</span>
            </div>
          </div>
          <div className="meta-item">
            <div className="meta-icon-bg gray">
              <Calendar size={14} color="#64748b" />
            </div>
            <div>
              <small>DITERBITKAN</small>
              <span>
                {publishedAt
                  ? new Date(publishedAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : ' - '}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gambar Banner */}
      <div className="news-detail-banner">
        <img
          src={image}
          alt={title}
          onError={(e) => {
            e.target.src = 'https://picsum.photos/800/400';
          }}
        />
      </div>

      {/* Isi Berita */}
      <div className="news-detail-body">
        <p style={{ whiteSpace: 'pre-line' }}>{cleanContent}</p>
      </div>

      {/* Tombol Kembali */}
      <div className="back-button-container" style={{ marginTop: '32px' }}>
        <Link to="/dashboard" className="btn-back">
          <ArrowLeft size={16} /> Kembali ke Berita
        </Link>
      </div>
    </div>
  );
}