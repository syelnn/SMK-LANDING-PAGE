import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, X, Loader2, CheckCircle, Search, MoreHorizontal, HelpCircle } from 'lucide-react';
import '../css/FaqPage.css';
import '../App.css';

const FaqPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // State untuk mengontrol dropdown aksi
  const [activeDropdown, setActiveDropdown] = useState(null);

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'Umum',
    sortOrder: 1,
    show: 1
  });

  // Fetch semua data untuk Admin
  const fetchFaqs = () => {
    setLoading(true);
    fetch('http://localhost:5002/api/faqs?admin=true')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setFaqs(resData.data || []);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Gagal mengambil FAQ:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  // Menutup dropdown otomatis jika klik di luar menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-action-wrapper')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleOpenModal = (faq = null) => {
    setActiveDropdown(null); // Tutup dropdown jika terbuka
    if (faq) {
      setEditingId(faq.id);
      setFormData({
        question: faq.question || '',
        answer: faq.answer || '',
        category: faq.category || 'Umum',
        sortOrder: faq.sortOrder || 1,
        show: faq.show ?? 1
      });
    } else {
      setEditingId(null);
      setFormData({
        question: '',
        answer: '',
        category: 'Umum',
        sortOrder: faqs.length + 1,
        show: 1
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const url = editingId 
      ? `http://localhost:5002/api/faqs/${editingId}` 
      : 'http://localhost:5002/api/faqs';
    const method = editingId ? 'PUT' : 'POST';

    const payload = {
      question: formData.question,
      answer: formData.answer,
      category: formData.category || 'Umum',
      show: Number(formData.show)
    };

    if (editingId) {
      payload.sortOrder = Number(formData.sortOrder);
    }

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          fetchFaqs();
          setIsModalOpen(false);
          alert(editingId ? 'FAQ berhasil diperbarui!' : 'FAQ baru berhasil ditambahkan!');
        } else {
          alert(data.message || 'Gagal menyimpan data');
        }
      })
      .catch((err) => {
        console.error('Error saat submit:', err);
        alert('Terjadi kesalahan koneksi ke server');
      });
  };

  const handleDelete = (id) => {
    setActiveDropdown(null); // Tutup dropdown
    if (window.confirm('Yakin ingin menghapus FAQ ini? Urutan FAQ lainnya akan otomatis disesuaikan.')) {
      fetch(`http://localhost:5002/api/faqs/${id}`, { method: 'DELETE' })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            fetchFaqs();
            alert('FAQ berhasil dihapus!');
          }
        })
        .catch((err) => console.error('Error saat menghapus:', err));
    }
  };

  // Filtering berdasarkan pencarian
  const filteredFaqs = faqs.filter((faq) => {
    const q = faq.question ? faq.question.toLowerCase() : '';
    const a = faq.answer ? faq.answer.toLowerCase() : '';
    const c = faq.category ? faq.category.toLowerCase() : '';
    const search = searchTerm.toLowerCase();
    return q.includes(search) || a.includes(search) || c.includes(search);
  });

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-title">Kelola FAQ (Pertanyaan)</h1>
          <p className="admin-subtitle">
            Kelola seluruh daftar pertanyaan yang sering diajukan di sini.
          </p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Tambah FAQ
        </button>
      </div>

      {/* Toolbar Search */}
      <div className="table-toolbar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Cari FAQ..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Tabel */}
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>No</th>
              <th>Pertanyaan & Jawaban</th>
              <th>Kategori</th>
              <th style={{ textAlign: 'center' }}>Urutan</th>
              <th>Status</th>
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
            ) : filteredFaqs.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>
                  Tidak ada FAQ ditemukan.
                </td>
              </tr>
            ) : (
              filteredFaqs.map((faq, index) => (
                <tr key={faq.id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="news-table-title" style={{ fontWeight: '600' }}>{faq.question}</div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{faq.answer}</div>
                  </td>
                  <td>
                    <span className="badge badge-category">{faq.category || 'Umum'}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge" style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>
                      {faq.sortOrder || index + 1}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${faq.show === 1 ? 'badge-success' : 'badge-warning'}`}>
                      {faq.show === 1 ? 'Tampil' : 'Sembunyi'}
                    </span>
                  </td>
                  <td>
                    {/* MENU DROPDOWN AKSI */}
                    <div className="dropdown-action-wrapper">
                      <button 
                        type="button" 
                        className="btn-more-action" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === faq.id ? null : faq.id);
                        }}
                        title="Opsi"
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {activeDropdown === faq.id && (
                        <div className="action-dropdown-menu">
                          <button 
                            type="button" 
                            className="dropdown-item" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenModal(faq);
                            }}
                          >
                            <Edit3 size={14} /> Edit Data
                          </button>
                          <button 
                            type="button" 
                            className="dropdown-item delete" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(faq.id);
                            }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form Tambah/Edit */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content modern-modal">
            <div className="modal-header-modern">
              <h3>{editingId ? 'Edit FAQ' : 'Tambah FAQ Baru'}</h3>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="btn-close-modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="form-modern-layout">
              <div className="form-group-modern">
                <label>Pertanyaan *</label>
                <input 
                  type="text" 
                  className="input-modern"
                  required 
                  value={formData.question} 
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Tuliskan pertanyaan..."
                />
              </div>

              <div className="form-group-modern">
                <label>Jawaban *</label>
                <textarea 
                  rows="4" 
                  className="input-modern"
                  style={{ resize: 'vertical', minHeight: '80px' }}
                  required 
                  value={formData.answer} 
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Tuliskan jawaban singkat & jelas..."
                ></textarea>
              </div>

              <div className="form-row-modern" style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group-modern" style={{ flex: 1 }}>
                  <label>Kategori FAQ</label>
                  <select 
                    className="input-modern"
                    value={formData.category} 
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Umum">Umum</option>
                    <option value="SPMB">SPMB (Pendaftaran)</option>
                    <option value="Akademik">Akademik</option>
                    <option value="Fasilitas">Fasilitas</option>
                    <option value="Biaya">Biaya</option>
                  </select>
                </div>

                {editingId && (
                  <div className="form-group-modern" style={{ flex: 1 }}>
                    <label>Urutan Tampil</label>
                    <input 
                      type="number" 
                      min="1"
                      max={faqs.length}
                      className="input-modern"
                      value={formData.sortOrder} 
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                )}
              </div>

              <div className="form-group-modern">
                <label>Status Tampil</label>
                <select 
                  className="input-modern"
                  value={formData.show} 
                  onChange={(e) => setFormData({ ...formData, show: Number(e.target.value) })}
                >
                  <option value={1}>Ditampilkan</option>
                  <option value={0}>Disembunyikan</option>
                </select>
              </div>

              <div className="modal-actions-modern" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button 
                  type="button" 
                  className="btn-modern-secondary" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn-modern-primary"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaqPage;