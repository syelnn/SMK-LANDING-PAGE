import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit3, Trash2, X, Loader2, CheckCircle, AlertCircle, Search, MoreHorizontal, Tag } from 'lucide-react';
import ImageUploader from '../components/ImageUploader';
import '../css/managenews.css';
import '../App.css';

const API_URL = 'http://localhost:5002/api/news';

export default function ManageNews() {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [imageMode, setImageMode] = useState('file');
  const [selectedFile, setSelectedFile] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Kegiatan',
    excerpt: '',
    content: '',
    image: '',
    author: 'Admin',
    status: 'published',
    tags: ''
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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-action-wrapper')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: name === 'status' ? (checked ? 'published' : 'draft') : checked,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Callback dari <ImageUploader>: file asli/hasil edit disimpan di state (dikirim ke backend),
  // URL-nya dipakai untuk pratinjau.
  const handleImageChange = ({ file, url }) => {
    setSelectedFile(file);
    setImageMode(file ? 'file' : 'url');
    setFormData((prev) => ({ ...prev, image: url }));
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setImageMode('file');
    setSelectedFile(null);
    setFormData({
      title: '',
      category: 'Kegiatan',
      excerpt: '',
      content: '',
      image: '',
      author: 'Admin',
      status: 'published',
      tags: ''
    });
    setShowModal(true);
  };
const handleOpenEdit = (item) => {
    const itemId = item.id || item._id;
    setEditId(itemId);
    setImageMode(item.image?.startsWith('data:') || !item.image?.startsWith('http') ? 'file' : 'url');
    setSelectedFile(null);

    // Memastikan format tags selalu aman saat di-load ke input teks
    let formattedTags = '';
    if (Array.isArray(item.tags)) {
      formattedTags = item.tags.join(', ');
    } else if (typeof item.tags === 'string') {
      try {
        const parsed = JSON.parse(item.tags);
        formattedTags = Array.isArray(parsed) ? parsed.join(', ') : item.tags;
      } catch {
        formattedTags = item.tags;
      }
    }

    setFormData({
      title: item.title || '',
      category: item.category || 'Kegiatan',
      excerpt: item.excerpt || '',
      content: item.content || '',
      image: item.image || '',
      author: 'Admin',
      status: item.status || 'published',
      tags: formattedTags
    });
    
    setOpenMenuId(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // File asli dikirim via FormData -> backend upload ke Cloudinary,
    // hanya URL hasilnya yang disimpan ke database (bukan base64).
    const fd = new FormData();
    fd.append('title', formData.title || '');
    fd.append('category', formData.category || '');
    fd.append('excerpt', formData.excerpt || '');
    fd.append('content', formData.content || '');
    fd.append('author', 'Admin');
    fd.append('status', formData.status || 'published');
    const tagsArr = formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
    fd.append('tags', tagsArr.join(','));
    fd.append('image', imageMode === 'file' && selectedFile ? selectedFile : (formData.image || ''));

    try {
      if (editId) {
        await axios.put(`${API_URL}/${editId}`, fd);
        showNotification('Berita berhasil diperbarui!', 'success');
      } else {
        await axios.post(API_URL, fd);
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
    setOpenMenuId(null);
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

  const toggleDropdown = (e, id) => {
    e.stopPropagation();
    setOpenMenuId((prevId) => (prevId === id ? null : id));
  };

  const filteredNews = newsList.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchTitle = item.title?.toLowerCase().includes(query);
    const matchCategory = item.category?.toLowerCase().includes(query);
    const matchTags = Array.isArray(item.tags) 
      ? item.tags.some(t => t.toLowerCase().includes(query))
      : item.tags?.toLowerCase().includes(query);
    
    return matchTitle || matchCategory || matchTags;
  });

  return (
    <div className="admin-container" id="admin-berita">
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="admin-page-header">
        <div>
          <h1 className="admin-title">Kelola Berita & Kegiatan</h1>
          <p className="admin-subtitle">
            Kelola seluruh berita, pengumuman, dan artikel kegiatan sekolah di sini.
          </p>
        </div>
        <button className="btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} /> Tambah Berita
        </button>
      </div>

      <div className="table-toolbar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Cari berita atau tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Gambar</th>
              <th>Judul Berita</th>
              <th>Kategori</th>
              <th>Status</th>
              <th>Penulis</th>
              <th style={{ textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>
                  <Loader2 className="animate-spin" style={{ display: 'inline', marginRight: '8px' }} />
                  Memuat data...
                </td>
              </tr>
            ) : filteredNews.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>
                  Tidak ada berita ditemukan.
                </td>
              </tr>
            ) : (
              filteredNews.map((item) => {
                const itemId = item.id || item._id;
                const formattedTags = Array.isArray(item.tags) 
                  ? item.tags 
                  : (item.tags ? item.tags.split(',') : []);

                return (
                  <tr key={itemId}>
                    <td>
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="table-thumb"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '60px',
                            height: '45px',
                            backgroundColor: 'var(--compreng-surface-soft, #f1f5f9)',
                            borderRadius: '6px',
                            border: '1px dashed #cbd5e1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--compreng-text-secondary, #475569)',
                            fontSize: '10px'
                          }}
                        >
                          No Image
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="news-table-title-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div className="news-table-title">
                          <span style={{ fontWeight: '500', color: 'inherit' }}>
                            {item.title}
                          </span>
                        </div>

                        {formattedTags.length > 0 && (
                          <div className="news-meta-sub">
                            <div className="table-tags-list" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {formattedTags.map((tag, idx) => (
                                <span key={idx} className="badge-tag">
                                  #{tag.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-category">{item.category || 'Berita'}</span>
                    </td>
                    <td>
                      <span className={`badge ${item.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                        {item.status === 'published' ? 'Tampil' : 'Sembunyi'}
                      </span>
                    </td>
                    <td>Admin</td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="dropdown-action-wrapper">
                        <button
                          type="button"
                          className="btn-more-action"
                          onClick={(e) => toggleDropdown(e, itemId)}
                          title="Opsi"
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {openMenuId === itemId && (
                          <div className="action-dropdown-menu">
                            <button
                              type="button"
                              className="dropdown-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(item);
                              }}
                            >
                              <Edit3 size={14} /> Edit Data
                            </button>
                            <button
                              type="button"
                              className="dropdown-item delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(itemId);
                              }}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content modern-modal">
            <div className="modal-header-modern">
              <h3>{editId ? 'Edit Berita' : 'Tambah Berita Baru'}</h3>
              <button 
                type="button"
                onClick={() => !submitting && setShowModal(false)} 
                className="btn-close-modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="form-modern-layout">
              <div className="form-group-modern">
                <label>Judul Berita *</label>
                <input
                  type="text"
                  name="title"
                  className="input-modern"
                  required
                  placeholder="Masukkan judul berita"
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row-modern" style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group-modern" style={{ flex: 1 }}>
                  <label>Kategori</label>
                  <select
                    name="category"
                    className="input-modern"
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
                <div className="form-group-modern" style={{ flex: 1 }}>
                  <label>Penulis</label>
                  <input
                    type="text"
                    name="author"
                    className="input-modern"
                    value="Admin"
                    readOnly
                    style={{ backgroundColor: 'var(--compreng-surface-soft, #f1f5f9)', cursor: 'not-allowed', color: '#374151', fontWeight: '500' }}
                  />
                </div>
              </div>

              <div className="form-group-modern">
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Tag size={13} /> Tags (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  name="tags"
                  className="input-modern"
                  placeholder="Contoh: PPLG, Prestasi, SMK"
                  value={formData.tags}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group-modern upload-section">
                <label>Gambar Banner</label>
                <ImageUploader
                  value={formData.image}
                  onChange={handleImageChange}
                  aspect={16 / 9}
                  previewLabel="PRATINJAU BANNER"
                  urlPlaceholder="https://..."
                  editorTitle="Edit Gambar Banner"
                />
              </div>

              <div className="form-group-modern">
                <label>Ringkasan (Excerpt)</label>
                <input
                  type="text"
                  name="excerpt"
                  className="input-modern"
                  placeholder="Cuplikan singkat berita..."
                  value={formData.excerpt}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group-modern">
                <label>Isi Berita Lengkap *</label>
                <textarea
                  name="content"
                  rows="4"
                  className="input-modern"
                  style={{ resize: 'vertical', minHeight: '80px' }}
                  required
                  placeholder="Tuliskan isi berita..."
                  value={formData.content}
                  onChange={handleChange}
                ></textarea>
              </div>

              <div className="form-group-modern">
                <label>Status Tampil</label>
                <select
                  name="status"
                  className="input-modern"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="published">Ditampilkan</option>
                  <option value="draft">Disembunyikan</option>
                </select>
              </div>

              <div className="modal-actions-modern" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn-modern-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-modern-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      &nbsp;Menyimpan...
                    </>
                  ) : (
                    'Simpan Data'
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