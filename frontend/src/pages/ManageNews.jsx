import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit3, Trash2, X, ArrowRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = 'http://localhost:5002/api/news';

// Helper untuk membuat slug
const createSlug = (text) => {
  if (!text) return 'detail';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function ManageNews() {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [imageMode, setImageMode] = useState('file');

  const [formData, setFormData] = useState({
    title: '',
    category: 'Kegiatan',
    excerpt: '',
    content: '',
    image: '',
    author: 'Admin',
    status: 'published',
  });

  const showNotification = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      const dataArray = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setNewsList(dataArray);
    } catch (err) {
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // KETIKA TOMBOL "TAMBAH BERITA" DIKLIK:
  const handleOpenAdd = () => {
    setEditId(null);
    setImageMode('file');
    setFormData({
      title: '',
      category: 'Kegiatan',
      excerpt: '',
      content: '',
      image: '',
      author: 'Admin',
      status: 'published',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditId(item.id);
    setImageMode(item.image?.startsWith('data:') || !item.image?.startsWith('http') ? 'file' : 'url');

    setFormData({
      title: item.title || '',
      category: item.category || 'Kegiatan',
      excerpt: item.excerpt || '',
      content: item.content || '',
      image: item.image || '',
      author: 'Admin',
      status: item.status || 'published',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      ...formData,
      author: 'Admin',
    };

    try {
      if (editId) {
        await axios.put(`${API_URL}/${editId}`, payload);
        showNotification('Berita berhasil diperbarui!', 'success');
      } else {
        await axios.post(API_URL, payload);
        showNotification('Berita berhasil ditambahkan!', 'success');
      }
      setShowModal(false);
      fetchNews();
    } catch (err) {
      console.error('Error saving news:', err);
      showNotification('Gagal menyimpan berita. Coba lagi.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus berita ini?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        showNotification('Berita berhasil dihapus!', 'success');
        fetchNews();
      } catch (err) {
        console.error('Error deleting news:', err);
        showNotification('Gagal menghapus berita', 'error');
      }
    }
  };

  return (
    <div className="admin-container" style={{ position: 'relative' }}>
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="admin-news-header">
        <h1 className="admin-title">Berita & Kegiatan</h1>
        <p className="admin-subtitle">
          Kelola seluruh berita, pengumuman, dan artikel kegiatan sekolah di sini.
        </p>
        <div className="admin-news-actions">
          <button className="btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} /> Tambah Berita
          </button>
        </div>
      </div>

      <div className="news-grid" style={{ marginBottom: '40px' }}>
        {newsList.map((item) => (
          <div key={item.id} className="news-card">
            <div className="news-card-image">
              <span className="news-badge">{item.category || 'Berita'}</span>
              <img
                src={item.image || 'https://picsum.photos/400/250'}
                alt={item.title}
                onError={(e) => {
                  e.target.src = 'https://picsum.photos/400/250';
                }}
              />
            </div>
            <div className="news-card-content">
              <h3 className="news-title">{item.title}</h3>
              <p className="news-excerpt">
                {item.excerpt || item.content?.substring(0, 90) + '...'}
              </p>
              
              <Link 
                to={`/dashboard/berita/${item.slug || createSlug(item.title) || item.id}`} 
                className="news-readmore"
                style={{ position: 'relative', zIndex: 2, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  window.scrollTo(0, 0);
                }}
              >
                Baca Selengkapnya <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Gambar</th>
              <th>Judul Berita</th>
              <th>Kategori</th>
              <th>Penulis</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>
                  <Loader2 className="animate-spin" style={{ display: 'inline', marginRight: '8px' }} />
                  Memuat data...
                </td>
              </tr>
            ) : newsList.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>
                  Tidak ada berita ditemukan.
                </td>
              </tr>
            ) : (
              newsList.map((item) => (
                <tr key={item.id}>
                  <td>
                    <img
                      src={item.image || 'https://picsum.photos/50'}
                      alt=""
                      className="table-thumb"
                      onError={(e) => {
                        e.target.src = 'https://picsum.photos/50';
                      }}
                    />
                  </td>
                  <td>
                    <div className="news-table-title">{item.title}</div>
                  </td>
                  <td>
                    <span className="badge badge-category">{item.category || 'Berita'}</span>
                  </td>
                  <td>
                    Admin
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon edit"
                        onClick={() => handleOpenEdit(item)}
                        title="Edit"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        className="btn-icon delete"
                        onClick={() => handleDelete(item.id)}
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content-wrapper">
            <div className="modal-header-custom">
              <h2>{editId ? 'Edit Berita' : 'Tambah Berita Baru'}</h2>
              <button 
                type="button" 
                className="btn-icon-close"
                onClick={() => !submitting && setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="modal-body-custom">
                <div>
                  <label className="form-label">Judul Berita *</label>
                  <input
                    type="text"
                    name="title"
                    className="form-input"
                    required
                    placeholder="Masukkan judul berita"
                    value={formData.title}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-grid-2">
                  <div>
                    <label className="form-label">Kategori</label>
                    <select 
                      name="category" 
                      className="form-select"
                      value={formData.category} 
                      onChange={handleChange}
                    >
                      <option value="Kegiatan">Kegiatan</option>
                      <option value="Prestasi">Prestasi</option>
                      <option value="Pengumuman">Pengumuman</option>
                      <option value="Artikel">Artikel</option>
                      <option value="Pendidikan">Pendidikan</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Penulis</label>
                    <input
                      type="text"
                      name="author"
                      className="form-input"
                      value="Admin"
                      readOnly
                      style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed', color: '#374151', fontWeight: '500' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Gambar Banner</label>
                  <div className="image-mode-wrapper">
                    <button
                      type="button"
                      className={`btn-mode-switch ${imageMode === 'file' ? 'active' : ''}`}
                      onClick={() => setImageMode('file')}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      className={`btn-mode-switch ${imageMode === 'url' ? 'active' : ''}`}
                      onClick={() => setImageMode('url')}
                    >
                      Pakai URL
                    </button>
                  </div>

                  {imageMode === 'file' ? (
                    <input
                      type="file"
                      accept="image/*"
                      className="form-input"
                      onChange={handleFileChange}
                    />
                  ) : (
                    <input
                      type="text"
                      name="image"
                      className="form-input"
                      placeholder="https://..."
                      value={formData.image}
                      onChange={handleChange}
                    />
                  )}
                </div>

                <div>
                  <label className="form-label">Ringkasan (Excerpt)</label>
                  <input
                    type="text"
                    name="excerpt"
                    className="form-input"
                    placeholder="Cuplikan singkat berita..."
                    value={formData.excerpt}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="form-label">Isi Berita Lengkap *</label>
                  <textarea
                    name="content"
                    rows="4"
                    className="form-textarea"
                    required
                    placeholder="Tuliskan isi berita..."
                    value={formData.content}
                    onChange={handleChange}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer-custom">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Menyimpan...
                    </>
                  ) : editId ? (
                    'Simpan Perubahan'
                  ) : (
                    'Tambah Berita'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}