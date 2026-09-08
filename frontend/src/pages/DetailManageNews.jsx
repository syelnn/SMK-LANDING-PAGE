import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Calendar, User, Loader2 } from 'lucide-react';

export default function DetailManageNews() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fungsi navigasi balik ke section berita di dashboard
  const handleBackToNews = () => {
    navigate('/admin');

    setTimeout(() => {
      const newsElement = document.getElementById('section-berita');
      const contentElement = document.querySelector('.dashboard-content');

      if (newsElement && contentElement) {
        contentElement.scrollTo({
          top: newsElement.offsetTop - 70,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

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
        <span style={{ marginLeft: '10px', color: '#64748b' }}>Memuat berita...</span>
      </div>
    );
  }

  if (!news) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', background: '#fff', borderRadius: '12px', margin: '40px' }}>
        <h2>Berita Tidak Ditemukan</h2>
        <p style={{ color: '#64748b', marginBottom: '20px' }}>Artikel yang Anda cari tidak ada atau telah dihapus.</p>
        <button 
          onClick={handleBackToNews} 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#2563eb', fontWeight: '600', marginBottom: '20px', margin: '0 auto' }}
        >
          <ArrowLeft size={18} /> Kembali ke Berita
        </button>
      </div>
    );
  }

  const authorName = 
    news.authorUser?.fullName || 
    news.authorUser?.username || 
    news.authorName || 
    news.author || 
    'Admin';

  // Mengambil field tanggal terbit dari database
  const rawDate = news.createdAt || news.date || news.publishedAt || news.updatedAt;

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '30px', background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      {/* Tombol Kembali */}
      <button 
        onClick={handleBackToNews} 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#2563eb', fontWeight: '600', marginBottom: '20px' }}
      >
        <ArrowLeft size={18} /> Kembali ke Berita
      </button>

      {/* Badge Kategori */}
      <span style={{ background: '#eff6ff', color: '#2563eb', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
        {news.category || 'Berita'}
      </span>

      {/* Judul Berita */}
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#0f172a', margin: '15px 0' }}>
        {news.title}
      </h1>

      {/* Meta Penulis & Tanggal (Sudah ditambah keterangannya) */}
      <div style={{ display: 'flex', gap: '20px', color: '#64748b', fontSize: '14px', marginBottom: '25px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <User size={16} /> Penulis: {authorName}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={16} /> Tanggal Terbit: {new Date(rawDate || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Gambar Banner Utama */}
      {news.image && (
        <img 
          src={news.image} 
          alt={news.title} 
          style={{ width: '100%', maxHeight: '420px', objectFit: 'cover', borderRadius: '12px', marginBottom: '30px' }} 
          onError={(e) => { e.target.src = 'https://picsum.photos/800/400'; }}
        />
      )}

      {/* Isi Berita Lengkap */}
      <div 
        style={{ lineHeight: '1.8', color: '#334155', fontSize: '16px', whiteSpace: 'pre-line' }}
      >
        {news.content}
      </div>
    </div>
  );
}