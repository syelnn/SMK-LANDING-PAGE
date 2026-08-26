import { useState, useEffect } from 'react';
import axios from 'axios';
import { Newspaper, Plus, Trash2, Edit } from 'lucide-react';

export default function ManageNews() {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulasi ambil data berita (Nanti kita sambungkan ke content-service Port 5002)
  useEffect(() => {
    // Contoh data dummy sebelum backend API content-service sepenuhnya aktif
    setNewsList([
      { id: 1, title: 'Penerimaan Peserta Didik Baru 2026 Resmi Dibuka', category: 'Pengumuman', author: 'Admin', status: 'published' },
      { id: 2, title: 'Siswa SMKN Compreng Juara LKS Tingkat Provinsi', category: 'Prestasi', author: 'Editor', status: 'published' }
    ]);
    setLoading(false);
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b' }}>Kelola Berita & Artikel</h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#64748b' }}>Tambah, ubah, atau hapus berita sekolah di sini.</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          <Plus size={16} /> Tambah Berita Baru
        </button>
      </div>

      {loading ? (
        <p>Memuat data...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '12px' }}>Judul Berita</th>
                <th style={{ padding: '12px' }}>Kategori</th>
                <th style={{ padding: '12px' }}>Penulis</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {newsList.map((news) => (
                <tr key={news.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px', fontWeight: '500', color: '#1e293b' }}>{news.title}</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{news.category}</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{news.author}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', backgroundColor: '#dcfce7', color: '#16a34a', fontWeight: 'bold' }}>
                      {news.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <button style={{ padding: '6px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}><Edit size={16} /></button>
                    <button style={{ padding: '6px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}