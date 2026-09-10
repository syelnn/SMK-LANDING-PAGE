import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import heroBg from '../assets/bgdownload.png';

export default function DownloadPage() {
  const navigate = useNavigate();

  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Tab State: 'url' atau 'file'
  const [activeTab, setActiveTab] = useState('url');

  // State Form CRUD
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Kalender Akademik',
    description: '',
    url: '',
    file_size: '',
    sort_order: 1,
    show: 1
  });

  const API_URL = 'http://localhost:5002/api/downloads';

  useEffect(() => {
    fetchDownloads();
  }, []);

  const fetchDownloads = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const result = await res.json();
      if (result.success || Array.isArray(result)) {
        setDownloads(result.data || result);
      }
    } catch (err) {
      console.error('Gagal mengambil data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  // Upload File ke Supabase Storage
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `files/${fileName}`;

      const { error } = await supabase.storage
        .from('downloads')
        .upload(filePath, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('downloads')
        .getPublicUrl(filePath);

      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      const sizeString = sizeInMB < 1 
        ? `${(file.size / 1024).toFixed(0)} KB` 
        : `${sizeInMB} MB`;

      setFormData((prev) => ({
        ...prev,
        url: publicUrlData.publicUrl,
        file_size: sizeString
      }));

    } catch (err) {
      alert('Gagal mengunggah berkas: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditId(item.id);
      setFormData({
        title: item.title || '',
        category: item.category || 'Kalender Akademik',
        description: item.description || '',
        url: item.url || '',
        file_size: item.file_size || item.fileSize || '',
        sort_order: item.sort_order ?? item.sortOrder ?? 1,
        show: item.show ?? 1
      });
      setActiveTab('url');
    } else {
      setEditId(null);
      setFormData({
        title: '',
        category: 'Kalender Akademik',
        description: '',
        url: '',
        file_size: '',
        sort_order: 1,
        show: 1
      });
      setActiveTab('url');
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.url) {
      alert('Silakan masukkan Link URL atau upload file terlebih dahulu!');
      return;
    }

    try {
      const url = editId ? `${API_URL}/${editId}` : API_URL;
      const method = editId ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        sortOrder: Number(formData.sort_order),
        fileSize: formData.file_size,
        show: Number(formData.show)
      };

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();

      if (res.ok) {
        setShowModal(false);
        fetchDownloads();
      } else {
        alert(`Gagal: ${resData.message || 'Terjadi kesalahan'}`);
      }
    } catch (err) {
      console.error('Error saving data:', err);
      alert('Gagal terhubung ke server.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus berkas ini?')) {
      try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchDownloads();
        } else {
          alert('Gagal menghapus data.');
        }
      } catch (err) {
        console.error('Error deleting:', err);
      }
    }
  };

  const visibleDownloads = isAdmin ? downloads : downloads.filter(d => d.show === 1);
  const categories = [...new Set(visibleDownloads.map((item) => item.category || 'Lainnya'))];

  return (
    <div className="download-page">

      {/* Header Page dengan Background Foto Proporsional */}
      <div 
        className="header-box"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="header-overlay"></div>

        <div className="header-content">
          <span className="badge">Pusat Unduhan</span>
          <h1 className="main-title">Pusat Unduhan Sekolah</h1>
          <p className="subtitle">
            Unduh berkas-berkas penting seputar akademik, kurikulum, dan administrasi sekolah secara resmi.
          </p>
        </div>
      </div>

      {/* Content List */}
      <div className="content-wrapper">

        {/* Action Bar Atas */}
        {isAdmin && (
          <div className="top-action-bar">
            <button className="add-btn" onClick={() => handleOpenModal()}>
              + Tambah Berkas Baru
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-text">Memuat data berkas...</div>
        ) : visibleDownloads.length === 0 ? (
          <div className="empty-box">Belum ada berkas yang diunggah.</div>
        ) : (
          categories.map((cat, idx) => (
            <div key={idx} className="category-block">
              <div className="category-header">
                <div className="category-title-group">
                  <span className="category-accent-bar"></span>
                  <h2 className="category-title">{cat}</h2>
                </div>
                <span className="count-badge">
                  {visibleDownloads.filter((d) => (d.category || 'Lainnya') === cat).length} berkas
                </span>
              </div>

              <div className="card-list">
                {visibleDownloads
                  .filter((item) => (item.category || 'Lainnya') === cat)
                  .map((item) => (
                    <div key={item.id} className={`card-item ${item.show === 0 ? 'hidden-item' : ''}`}>
                      <div className="card-icon-box">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <line x1="10" y1="9" x2="8" y2="9"/>
                        </svg>
                      </div>

                      <div className="card-info">
                        <h3 className="item-title">
                          {item.title} 
                          {item.show === 0 && <span className="hidden-tag">(Sembunyi)</span>}
                        </h3>
                        <p className="item-desc">{item.description || 'Tidak ada deskripsi berkas.'}</p>
                      </div>

                      <div className="card-actions">
                        {(item.file_size || item.fileSize) && (
                          <span className="file-size">{item.file_size || item.fileSize}</span>
                        )}

                        <a
                          href={item.url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="download-btn"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                          Unduh
                        </a>

                        {isAdmin && (
                          <div className="admin-action-group">
                            <button
                              className="edit-btn"
                              onClick={() => handleOpenModal(item)}
                              title="Edit Data"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                            <button
                              className="delete-btn"
                              onClick={() => handleDelete(item.id)}
                              title="Hapus Data"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))
        )}

      </div>

      {/* MODAL POPUP FORM */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            
            <div className="modal-header">
              <h3 className="modal-title">{editId ? 'Edit Berkas' : 'Tambah Berkas Baru'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">JUDUL BERKAS</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="Contoh: Kalender Akademik 2026/2027"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">KATEGORI</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="Kalender Akademik">Kalender Akademik</option>
                    <option value="Kurikulum">Kurikulum</option>
                    <option value="Formulir">Formulir</option>
                    <option value="Jadwal Pelajaran">Jadwal Pelajaran</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">DESKRIPSI SINGKAT</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="form-input textarea"
                    placeholder="Tuliskan deskripsi singkat..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">SUMBER BERKAS / FILE</label>
                  <div className="tab-container">
                    <button
                      type="button"
                      className={`tab-btn ${activeTab === 'url' ? 'active' : ''}`}
                      onClick={() => setActiveTab('url')}
                    >
                      🔗 Link URL
                    </button>
                    <button
                      type="button"
                      className={`tab-btn ${activeTab === 'file' ? 'active' : ''}`}
                      onClick={() => setActiveTab('file')}
                    >
                      Upload Berkas
                    </button>
                  </div>

                  {activeTab === 'url' ? (
                    <input
                      type="url"
                      name="url"
                      value={formData.url}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="https://contoh.com/berkas.pdf"
                    />
                  ) : (
                    <div className="file-upload-box">
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="file-input"
                      />
                      {uploading && <span className="upload-status">Sedang mengunggah...</span>}
                      {formData.url && !uploading && (
                        <span className="upload-success">✓ Berkas berhasil diunggah</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">UKURAN BERKAS (OPSIONAL)</label>
                  <input
                    type="text"
                    name="file_size"
                    value={formData.file_size}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Contoh: 1.2 MB"
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="show"
                      checked={Number(formData.show) === 1}
                      onChange={handleChange}
                    />
                    Tampilkan Berkas (Public)
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn-submit" disabled={uploading}>
                  {uploading ? 'Mengunggah...' : 'Simpan Data'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}