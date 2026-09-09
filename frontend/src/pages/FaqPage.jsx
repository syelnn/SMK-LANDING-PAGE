import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, X, CheckCircle, Search, Eye, EyeOff, HelpCircle, MoreHorizontal } from 'lucide-react';

const FaqPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // State untuk mengontrol dropdown aksi
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);

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

  // Menutup dropdown jika klik di luar area menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = (id, e) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === id ? null : id);
  };

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
    <div className="faq-admin-container">
      {/* HEADER PAGE */}
      <div className="faq-page-header">
        <div>
          <h2>Kelola FAQ (Pertanyaan)</h2>
          <p>Kelola seluruh daftar pertanyaan yang sering diajukan di sini.</p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR + BUTTON TAMBAH FAQ */}
      <div className="faq-toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Cari FAQ..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-add-faq" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Tambah FAQ
        </button>
      </div>

      {/* TABEL DATA FAQ */}
      <div className="faq-table-card">
        {loading ? (
          <div className="faq-loading-state">Memuat data FAQ...</div>
        ) : filteredFaqs.length === 0 ? (
          <div className="faq-empty-state">
            <HelpCircle size={40} />
            <p>Tidak ada data FAQ yang ditemukan.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="faq-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>No</th>
                  <th>Pertanyaan & Jawaban</th>
                  <th style={{ width: '130px' }}>Kategori</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Urutan</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Status</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredFaqs.map((faq, index) => (
                  <tr key={faq.id}>
                    <td className="col-no">{index + 1}</td>
                    <td className="col-qa">
                      <div className="faq-question-title">{faq.question}</div>
                      <div className="faq-answer-snippet">{faq.answer}</div>
                    </td>
                    <td>
                      <span className="badge-category">{faq.category || 'Umum'}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge-sort">{faq.sortOrder || index + 1}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {faq.show === 1 ? (
                        <span className="badge-status status-active">
                          <Eye size={12} /> Tampil
                        </span>
                      ) : (
                        <span className="badge-status status-hidden">
                          <EyeOff size={12} /> Sembunyi
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', position: 'relative' }}>
                      <button 
                        className="btn-action-more" 
                        onClick={(e) => toggleDropdown(faq.id, e)}
                        title="Opsi"
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {/* DROPDOWN MENU */}
                      {activeDropdown === faq.id && (
                        <div className="action-dropdown-menu" ref={dropdownRef}>
                          <button 
                            className="dropdown-item edit" 
                            onClick={() => handleOpenModal(faq)}
                          >
                            <Edit size={14} /> Edit Data
                          </button>
                          <button 
                            className="dropdown-item delete" 
                            onClick={() => handleDelete(faq.id)}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL FORM TAMBAH / EDIT */}
      {isModalOpen && (
        <div className="faq-modal-overlay">
          <div className="faq-modal-card">
            <div className="faq-modal-header">
              <h3>{editingId ? 'Edit FAQ' : 'Tambah FAQ Baru'}</h3>
              <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="faq-form">
              <div className="form-group">
                <label>PERTANYAAN</label>
                <input 
                  type="text" 
                  required 
                  value={formData.question} 
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Tuliskan pertanyaan..."
                />
              </div>

              <div className="form-group">
                <label>JAWABAN</label>
                <textarea 
                  rows="4" 
                  required 
                  value={formData.answer} 
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Tuliskan jawaban singkat & jelas..."
                ></textarea>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>KATEGORI FAQ</label>
                  <select 
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
                  <div className="form-group">
                    <label>URUTAN TAMPIL</label>
                    <input 
                      type="number" 
                      min="1"
                      max={faqs.length}
                      value={formData.sortOrder} 
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                )}
              </div>

              {/* CHECKBOX TAMPILKAN FAQ (PUBLIC) - BOX CONTAINER SEPERTI FOTO 2 */}
              <div className="form-checkbox-group">
                <label className="checkbox-container">
                  <input 
                    type="checkbox" 
                    checked={formData.show === 1}
                    onChange={(e) => setFormData({ ...formData, show: e.target.checked ? 1 : 0 })}
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-label">TAMPILKAN FAQ (PUBLIC)</span>
                </label>
              </div>

              <div className="faq-modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-submit">
                  <CheckCircle size={16} /> Simpan Data
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