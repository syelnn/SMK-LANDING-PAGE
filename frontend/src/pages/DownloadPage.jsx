import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, Link as LinkIcon, MoreHorizontal, Search, FileText, Download, X } from 'lucide-react';
import '../css/DownloadPage.css';
import '../App.css';

export default function DownloadPage() {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(true);

  // State Modal Form
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

  // State Dropdown & Search
  const [dropdownConfig, setDropdownConfig] = useState({ id: null, right: null, top: null, bottom: null });
  const [searchTerm, setSearchTerm] = useState('');

  const API_URL = 'http://localhost:5002/api/downloads';

  useEffect(() => {
    fetchDownloads();
  }, []);

  // Tutup dropdown saat scroll
  useEffect(() => {
    const handleScroll = () => {
      if (dropdownConfig.id !== null) {
        setDropdownConfig({ id: null, right: null, top: null, bottom: null });
      }
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [dropdownConfig.id]);

  const fetchDownloads = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const result = await res.json();
      if (result.success || Array.isArray(result)) {
        const rawData = result.data || result;
        const sortedData = rawData.sort((a, b) => {
          const orderA = a.sort_order ?? a.sortOrder ?? 99;
          const orderB = b.sort_order ?? b.sortOrder ?? 99;
          return orderA - orderB;
        });
        setDownloads(sortedData);
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

  // Smart Dropdown Logic
  const handleDropdownClick = (e, downloadId) => {
    e.stopPropagation();
    if (dropdownConfig.id === downloadId) {
      setDropdownConfig({ id: null, right: null, top: null, bottom: null });
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const dropdownHeight = 90;
    
    const spaceBelow = windowHeight - rect.bottom;
    const openUpwards = spaceBelow < dropdownHeight;

    setDropdownConfig({
      id: downloadId,
      right: window.innerWidth - rect.right,
      top: openUpwards ? null : rect.bottom + 4,
      bottom: openUpwards ? windowHeight - rect.top + 4 : null
    });
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
    } else {
      setEditId(null);
      const maxSortOrder = downloads.length > 0 ? Math.max(...downloads.map(d => d.sort_order ?? d.sortOrder ?? 0)) : 0;
      setFormData({
        title: '',
        category: 'Kalender Akademik',
        description: '',
        url: '',
        file_size: '',
        sort_order: maxSortOrder + 1,
        show: 1
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.url) {
      alert('Silakan masukkan Link URL berkas terlebih dahulu!');
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

  const handleDelete = async (id, title) => {
    setDropdownConfig({ id: null, right: null, top: null, bottom: null });
    if (window.confirm(`Apakah Anda yakin ingin menghapus berkas "${title || 'ini'}"?`)) {
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
  
  const filteredDownloads = visibleDownloads.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      (item.title || '').toLowerCase().includes(term) ||
      (item.category || '').toLowerCase().includes(term) ||
      (item.description || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="download-page mp-wrapper">

      {/* Header Simpel */}
      <div className="simple-page-header">
        <div className="header-text-group">
          <h1 className="simple-main-title">Pusat Unduhan Sekolah</h1>
          <p className="simple-subtitle">
            Kelola berkas-berkas penting seputar akademik, kurikulum, dan administrasi sekolah di sini.
          </p>
        </div>
        {isAdmin && (
          <button className="btn-modern-primary" onClick={() => handleOpenModal()}>
            <Plus size={16} /> Tambah Berkas Baru
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="simple-toolbar">
        <div className="mp-search-wrapper" style={{ width: '100%', maxWidth: '360px' }}>
          <Search size={16} className="mp-search-icon" />
          <input 
            type="text" 
            placeholder="Cari judul, kategori, atau deskripsi..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mp-search-input"
          />
        </div>
      </div>

      {/* Table Berkas */}
      <div className="mp-table-card">
        <table className="mp-table">
          <thead>
            <tr>
              <th className="mp-th">Judul & Deskripsi Berkas</th>
              <th className="mp-th">Kategori</th>
              <th className="mp-th" style={{ textAlign: 'center' }}>Ukuran</th>
              <th className="mp-th" style={{ textAlign: 'center' }}>Urutan</th>
              <th className="mp-th">Status Tampil</th>
              <th className="mp-th" style={{ textAlign: 'center' }}>Aksi / Unduh</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--compreng-text-muted)' }}>
                  Memuat data berkas...
                </td>
              </tr>
            ) : filteredDownloads.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--compreng-text-muted)', fontSize: '13px' }}>
                  {searchTerm ? `Tidak ditemukan berkas dengan kata kunci "${searchTerm}"` : 'Belum ada berkas yang diunggah.'}
                </td>
              </tr>
            ) : (
              filteredDownloads.map((item) => (
                <tr key={item.id} className="mp-tr">
                  <td className="mp-td">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--compreng-text-main)' }}>{item.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--compreng-text-muted)', marginTop: '2px' }}>
                          {item.description || 'Tidak ada deskripsi.'}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="mp-td">
                    <span className="mp-badge-role" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                      {item.category || 'Lainnya'}
                    </span>
                  </td>

                  <td className="mp-td" style={{ textAlign: 'center', fontSize: '13px', color: 'var(--compreng-text-secondary)' }}>
                    {item.file_size || item.fileSize || '-'}
                  </td>
                  
                  <td className="mp-td" style={{ textAlign: 'center', fontWeight: '600', color: 'var(--compreng-text-secondary)' }}>
                    {item.sort_order ?? item.sortOrder ?? '-'}
                  </td>
                  
                  <td className="mp-td">
                    <span className={item.show === 1 ? 'mp-badge-active' : 'mp-badge-inactive'}>
                      {item.show === 1 ? 'Ditampilkan' : 'Disembunyikan'}
                    </span>
                  </td>
                  
                  <td className="mp-td" style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        download
                        className="btn-modern-secondary" 
                        style={{ padding: '6px 12px', fontSize: '12px', gap: '4px', textDecoration: 'none' }}
                      >
                        <Download size={14} /> Unduh
                      </a>

                      {isAdmin && (
                        <button 
                          onClick={(e) => handleDropdownClick(e, item.id)}
                          className="mp-action-btn"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* DROPDOWN MENU OUTSIDE TABLE */}
      {dropdownConfig.id && (
        <>
          <div 
            onClick={() => setDropdownConfig({ id: null, right: null, top: null, bottom: null })} 
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          ></div>
          
          <div 
            className="mp-dropdown-menu" 
            style={{ 
              position: 'fixed', 
              right: dropdownConfig.right, 
              ...(dropdownConfig.top !== null ? { top: dropdownConfig.top } : {}),
              ...(dropdownConfig.bottom !== null ? { bottom: dropdownConfig.bottom } : {}),
              zIndex: 50 
            }}
          >
            {(() => {
              const targetItem = downloads.find(t => t.id === dropdownConfig.id);
              if (!targetItem) return null;
              return (
                <>
                  <button onClick={() => { setDropdownConfig({ id: null, right: null, top: null, bottom: null }); handleOpenModal(targetItem); }} className="mp-dropdown-item">
                    <Edit size={14} color="var(--compreng-text-secondary)" /> Edit Berkas
                  </button>
                  <div style={{ margin: '2px 0', borderTop: '1px solid var(--compreng-border)' }}></div>
                  <button onClick={() => handleDelete(targetItem.id, targetItem.title)} className="mp-dropdown-item danger">
                    <Trash2 size={14} color="currentColor" /> Delete
                  </button>
                </>
              );
            })()}
          </div>
        </>
      )}

      {/* MODAL FORM SHADCN STYLE */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content modern-modal">
            <div className="modal-header-modern">
              <h3>{editId ? 'Edit Berkas' : 'Tambah Berkas Baru'}</h3>
              <button onClick={() => setShowModal(false)} className="btn-close-modal"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="form-modern-layout">
              <div className="form-group-modern">
                <label>Judul Berkas</label>
                <input 
                  type="text" 
                  name="title"
                  placeholder="Contoh: Kalender Akademik 2026/2027" 
                  className="input-modern" 
                  value={formData.title} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <div className="form-group-modern">
                <label>Kategori</label>
                <select 
                  name="category"
                  className="input-modern" 
                  value={formData.category} 
                  onChange={handleChange}
                >
                  <option value="Kalender Akademik">Kalender Akademik</option>
                  <option value="Kurikulum">Kurikulum</option>
                  <option value="Formulir">Formulir</option>
                  <option value="Jadwal Pelajaran">Jadwal Pelajaran</option>
                </select>
              </div>

              <div className="form-group-modern">
                <label>Deskripsi Singkat</label>
                <textarea 
                  name="description"
                  rows="3" 
                  placeholder="Tuliskan deskripsi singkat..." 
                  className="input-modern" 
                  style={{ resize: 'vertical' }}
                  value={formData.description} 
                  onChange={handleChange} 
                />
              </div>
              
              <div className="form-row-modern">
                <div className="form-group-modern" style={{ flex: 1 }}>
                  <label>Urutan Tampil (Angka)</label>
                  <input 
                    type="number" 
                    name="sort_order"
                    className="input-modern" 
                    value={formData.sort_order} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="form-group-modern" style={{ flex: 1 }}>
                  <label>Status Tampil</label>
                  <select 
                    name="show"
                    className="input-modern" 
                    value={formData.show} 
                    onChange={handleChange}
                  >
                    <option value={1}>Ditampilkan</option>
                    <option value={0}>Disembunyikan</option>
                  </select>
                </div>
              </div>

              {/* Link URL Berkas Input Direct */}
              <div className="form-group-modern">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <LinkIcon size={15} color="#2563eb" /> Link URL Berkas
                </label>
                <input 
                  type="url" 
                  name="url"
                  placeholder="https://drive.google.com/file/... atau https://contoh.com/berkas.pdf" 
                  className="input-modern" 
                  value={formData.url} 
                  onChange={handleChange} 
                  required
                />
              </div>

              <div className="form-group-modern">
                <label>Ukuran Berkas (Opsional)</label>
                <input 
                  type="text" 
                  name="file_size"
                  placeholder="Contoh: 1.2 MB" 
                  className="input-modern" 
                  value={formData.file_size} 
                  onChange={handleChange} 
                />
              </div>

              <div className="modal-actions-modern" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-modern-secondary">Batal</button>
                <button type="submit" className="btn-modern-primary">
                  Simpan Data
                </button>
              </div>
            </form>
            
          </div>
        </div>
      )}

    </div>
  );
}