import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Edit, Trash2, X, CheckCircle, EyeOff } from 'lucide-react';

const FaqPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'Umum',
    sortOrder: 1,
    show: 1
  });

  // Fetch semua data untuk Admin
  const fetchFaqs = () => {
    fetch('http://localhost:5002/api/faqs?admin=true')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setFaqs(resData.data);
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

  const toggleAccordion = (id) => {
    setOpenId(openId === id ? null : id);
  };

  const handleOpenModal = (faq = null) => {
    if (faq) {
      setEditingId(faq.id);
      setFormData({
        question: faq.question,
        answer: faq.answer,
        category: faq.category || 'Umum',
        sortOrder: faq.sortOrder,
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
          // POPUP NOTIFIKASI BERHASIL
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

  if (loading) return <p className="faq-loading">Memuat FAQ...</p>;

  return (
    <div className="faq-section">
      <div className="faq-header">
        <span className="faq-badge">FAQ</span>
        <h2>Pertanyaan yang Sering Diajukan</h2>
        <p>Informasi seputar pendaftaran, program, dan layanan sekolah.</p>
        
        <button className="faq-add-btn" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Tambah FAQ
        </button>
      </div>

      <div className="faq-container">
        {faqs.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div key={faq.id} className={`faq-card ${isOpen ? 'active' : ''}`}>
              <div className="faq-card-header">
                <button className="faq-question-btn" onClick={() => toggleAccordion(faq.id)}>
  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    {faq.question}
    {faq.show === 0 && (
                      <span style={{ fontSize: '11px', color: '#dc2626', background: '#fef2f2', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <EyeOff size={12} /> Disembunyikan
                      </span>
                    )}
                  </span>
                  {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>

              {isOpen && (
                <div className="faq-answer-body">
                  <p>{faq.answer}</p>
                  <div className="faq-crud-actions">
                    <button className="btn-edit" onClick={() => handleOpenModal(faq)}>
                      <Edit size={14} /> Edit
                    </button>
                    <button className="btn-delete" onClick={() => handleDelete(faq.id)}>
                      <Trash2 size={14} /> Hapus
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL FORM CRUD */}
      {isModalOpen && (
        <div className="faq-modal-overlay">
          <div className="faq-modal-card">
            <div className="faq-modal-header">
              <h3>{editingId ? 'Edit FAQ' : 'Tambah FAQ Baru'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="faq-form">
              <div className="form-group">
                <label>Pertanyaan</label>
                <input 
                  type="text" 
                  required 
                  value={formData.question} 
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Masukkan pertanyaan..."
                />
              </div>

              <div className="form-group">
                <label>Jawaban</label>
                <textarea 
                  rows="4" 
                  required 
                  value={formData.answer} 
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Masukkan jawaban..."
                ></textarea>
              </div>

              {/* INPUT KATEGORI (DROPDOWN) */}
              <div className="form-group">
                <label>Kategori FAQ</label>
                <select 
                  value={formData.category} 
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="Umum">Umum</option>
                  <option value="SPMB">SPMB (Pendaftaran, Syarat, Jadwal)</option>
                  <option value="Akademik">Akademik</option>
                  <option value="Fasilitas">Fasilitas</option>
                  <option value="Biaya">Biaya</option>
                </select>
              </div>
              
              <div className="form-row">
                {editingId && (
                  <div className="form-group">
                    <label>Urutan Tampil (Posisi)</label>
                    <input 
                      type="number" 
                      min="1"
                      max={faqs.length}
                      value={formData.sortOrder} 
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                )}

                <div className="form-group" style={{ gridColumn: editingId ? 'auto' : '1 / -1' }}>
                  <label>Status Tampil</label>
                  <select 
                    value={formData.show} 
                    onChange={(e) => setFormData({ ...formData, show: parseInt(e.target.value) })}
                  >
                    <option value={1}>Tampilkan</option>
                    <option value={0}>Sembunyikan</option>
                  </select>
                </div>
              </div>

              <div className="faq-modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Batal</button>
                <button type="submit" className="btn-submit"><CheckCircle size={16} /> Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaqPage;