import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Calendar, User, Tag, Loader2 } from 'lucide-react';


export default function DetailNews() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewsDetail = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:5002/api/news/${slug}`);
        setNews(res.data?.data || res.data);
      } catch (err) {
        console.error('Error fetching detail news:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNewsDetail();
  }, [slug]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader2 className="animate-spin" size={32} color="#2563eb" />
        <span style={{ marginLeft: '10px', color: 'var(--compreng-text-secondary, #475569)' }}>Memuat berita...</span>
      </div>
    );
  }

  if (!news) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', background: 'var(--compreng-surface, #ffffff)', borderRadius: '12px', margin: '40px' }}>
        <h2>Berita Tidak Ditemukan</h2>
        <p style={{ color: 'var(--compreng-text-secondary, #475569)', marginBottom: '20px' }}>Artikel yang Anda cari tidak ada atau telah dihapus.</p>
        <button 
          onClick={() => navigate('/berita')} 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--compreng-accent, #2563eb)', fontWeight: '600', margin: '0 auto' }}
        >
          <ArrowLeft size={18} /> Kembali ke Berita
        </button>
      </div>
    );
  }

  const authorName = news.authorUser?.fullName || news.authorUser?.username || news.author || 'Admin';
  const rawDate = news.createdAt || news.date || news.publishedAt;

  // Format array tags dari database
  const parsedTags = Array.isArray(news.tags) 
    ? news.tags 
    : typeof news.tags === 'string' 
      ? news.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

  return (
    <div style={{ maxWidth: '850px', margin: '40px auto', padding: '30px', background: 'var(--compreng-surface, #ffffff)', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      {/* Tombol Kembali */}
      <button 
        onClick={() => navigate('/berita')} 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--compreng-accent, #2563eb)', fontWeight: '600', marginBottom: '20px' }}
      >
        <ArrowLeft size={18} /> Kembali ke Berita
      </button>

      {/* Category Badge */}
      {news.category && (
        <span style={{ background: 'var(--compreng-surface-soft, #f1f5f9)', color: 'var(--compreng-accent, #2563eb)', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
          {news.category}
        </span>
      )}

      {/* Judul */}
      <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: 'var(--compreng-text, #0f172a)', margin: '15px 0' }}>
        {news.title}
      </h1>

      {/* Meta Info */}
      <div style={{ display: 'flex', gap: '20px', color: 'var(--compreng-text-secondary, #475569)', fontSize: '14px', marginBottom: '25px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <User size={16} /> {authorName}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={16} /> {new Date(rawDate || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Gambar Utama */}
      {news.image && (
        <img 
          src={news.image} 
          alt={news.title} 
          style={{ width: '100%', maxHeight: '420px', objectFit: 'cover', borderRadius: '12px', marginBottom: '30px' }} 
          onError={(e) => { e.target.src = 'https://picsum.photos/800/400'; }}
        />
      )}

      {/* Deskripsi / Isi Berita */}
      <div style={{ lineHeight: '1.8', color: 'var(--compreng-text-secondary, #475569)', fontSize: '16px', whiteSpace: 'pre-line', marginBottom: '30px' }}>
        {news.content}
      </div>

      {/* Tags */}
      {parsedTags.length > 0 && (
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginTop: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Tag size={16} color="#64748b" />
            <span style={{ fontWeight: '600', color: 'var(--compreng-text-secondary, #475569)', fontSize: '14px' }}>Tags:</span>
            {parsedTags.map((tag, idx) => (
              <span key={idx} style={{ background: 'var(--compreng-surface-soft, #f1f5f9)', color: 'var(--compreng-text-secondary, #475569)', padding: '4px 10px', borderRadius: '6px', fontSize: '13px' }}>
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}