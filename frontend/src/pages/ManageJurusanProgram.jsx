import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Plus, Trash2, Edit, Image as ImageIcon, Link as LinkIcon, Database, X } from 'lucide-react';
import '../App.css';

export default function ManageJurusanProgram() {
  const [jurusanList, setJurusanList] = useState([]);
  const [programList, setProgramList] = useState([]);
  const [loading, setLoading] = useState(true);
  const userRole = localStorage.getItem('role');

  const API_URL = 'http://localhost:5002/api'; 

  // State Modal Jurusan
  const [showModalJurusan, setShowModalJurusan] = useState(false);
  const [editIdJurusan, setEditIdJurusan] = useState(null);
  const [imageTypeJurusan, setImageTypeJurusan] = useState('url');
  const [newJurusan, setNewJurusan] = useState({ title: '', slug: '', desc: '', imageIcon: '', subjects: '', career: '' });

  // State Modal Program
  const [showModalProgram, setShowModalProgram] = useState(false);
  const [editIdProgram, setEditIdProgram] = useState(null);
  const [imageTypeProgram, setImageTypeProgram] = useState('url');
  const [newProgram, setNewProgram] = useState({ title: '', desc: '', badge: '', imageIcon: '' });

  const fetchData = async () => {
    try {
      const resJurusan = await axios.get(`${API_URL}/jurusan`);
      const resProgram = await axios.get(`${API_URL}/program`);
      setJurusanList(resJurusan.data.data);
      setProgramList(resProgram.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Gagal memuat data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileUpload = (e, setFormState, formState) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormState({ ...formState, imageIcon: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // ================= ACTION JURUSAN =================
  const openAddJurusan = () => {
    setEditIdJurusan(null);
    setNewJurusan({ title: '', slug: '', desc: '', imageIcon: '', subjects: '', career: '' });
    setImageTypeJurusan('url');
    setShowModalJurusan(true);
  };

  const openEditJurusan = (item) => {
    setEditIdJurusan(item.id);
    setNewJurusan({ ...item });
    setImageTypeJurusan(item.imageIcon && item.imageIcon.length > 200 ? 'file' : 'url'); 
    setShowModalJurusan(true);
  };

  const handleSubmitJurusan = async (e) => {
    e.preventDefault();
    try {
      if (editIdJurusan) {
        await axios.put(`${API_URL}/jurusan/${editIdJurusan}`, newJurusan);
      } else {
        await axios.post(`${API_URL}/jurusan`, newJurusan);
      }
      setShowModalJurusan(false);
      fetchData();
    } catch (error) {
      alert(`Gagal menyimpan jurusan: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDeleteJurusan = async (id) => {
    if (!window.confirm('Yakin ingin menghapus jurusan ini?')) return;
    try {
      await axios.delete(`${API_URL}/jurusan/${id}`);
      fetchData();
    } catch (error) {
      alert('Gagal menghapus jurusan');
    }
  };

  // ================= ACTION PROGRAM =================
  const openAddProgram = () => {
    setEditIdProgram(null);
    setNewProgram({ title: '', desc: '', badge: '', imageIcon: '' });
    setImageTypeProgram('url');
    setShowModalProgram(true);
  };

  const openEditProgram = (item) => {
    setEditIdProgram(item.id);
    setNewProgram({ ...item });
    setImageTypeProgram(item.imageIcon && item.imageIcon.length > 200 ? 'file' : 'url');
    setShowModalProgram(true);
  };

  const handleSubmitProgram = async (e) => {
    e.preventDefault();
    try {
      if (editIdProgram) {
        await axios.put(`${API_URL}/program/${editIdProgram}`, newProgram);
      } else {
        await axios.post(`${API_URL}/program`, newProgram);
      }
      setShowModalProgram(false);
      fetchData();
    } catch (error) {
      alert(`Gagal menyimpan program: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDeleteProgram = async (id) => {
    if (!window.confirm('Yakin ingin menghapus program ini?')) return;
    try {
      await axios.delete(`${API_URL}/program/${id}`);
      fetchData();
    } catch (error) {
      alert('Gagal menghapus program');
    }
  };

  if (loading) return <div className="section-container"><p>Memuat data...</p></div>;

  return (
    <div className="section-container">
      {/* ================= BAGIAN 1: JURUSAN ================= */}
      <div className="section-header">
        <span className="section-tag">Kompetensi Keahlian</span>
        <h2 className="section-title">Pilih Jurusan Masa Depan <span>Cemerlang Anda</span></h2>
        <p className="section-desc">Kurikulum dirancang berbasis industri untuk mencetak lulusan yang siap kerja, mandiri, dan kompeten.</p>
      </div>

      {(userRole === 'admin' || userRole === 'editor') && (
        <div className="admin-action-bar" style={{ justifyContent: 'flex-start', marginBottom: '30px' }}>
          <button className="btn-modern-primary" onClick={openAddJurusan}>
            <Plus size={18} /> Tambah Jurusan Baru
          </button>
        </div>
      )}

      <div className="cards-grid">
        {jurusanList.map((item) => {
          const subjectArray = item.subjects ? item.subjects.split(',') : [];
          return (
            <div className="modern-card" key={item.id}>
              <div>
                <img 
                  src={item.imageIcon || 'https://via.placeholder.com/60'} 
                  alt="Icon" 
                  style={{ width: '64px', height: '64px', objectFit: 'contain', padding: '8px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px' }} 
                />
                <h3 className="card-title">{item.title}</h3>
                <p className="card-text">{item.desc}</p>
                <ul className="card-list">
                  {subjectArray.map((sub, idx) => (
                    <li key={idx}>{sub.trim()}</li>
                  ))}
                </ul>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                <Link to={`/dashboard/kurikulum/${item.slug}`} className="card-link-btn">
                  DETAIL KURIKULUM <ArrowRight size={16} />
                </Link>
                {(userRole === 'admin' || userRole === 'editor') && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => openEditJurusan(item)} style={{ background: 'none', border: 'none', color: '#eab308', cursor: 'pointer' }} title="Edit Jurusan">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDeleteJurusan(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Hapus Jurusan">
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <hr className="section-divider" />

      {/* ================= BAGIAN 2: PROGRAM UNGGULAN ================= */}
      <div className="section-header">
        <span className="section-tag" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>Jalur Masa Depan</span>
        <h2 className="section-title">Program Unggulan <span>SMKN Compreng</span></h2>
        <p className="section-desc">Pilihan jalur karier komprehensif yang dirancang untuk mengantar setiap siswa menuju gerbang kesuksesan.</p>
      </div>

      {(userRole === 'admin' || userRole === 'editor') && (
        <div className="admin-action-bar" style={{ justifyContent: 'flex-start', marginBottom: '30px' }}>
          <button className="btn-modern-primary" onClick={openAddProgram}>
            <Plus size={18} /> Tambah Program Unggulan
          </button>
        </div>
      )}

      <div className="program-cards-grid">
        {programList.map((prog) => (
          <div className="program-card-minimal" key={prog.id}>
            {(userRole === 'admin' || userRole === 'editor') && (
              <div className="program-admin-actions-float">
                <button onClick={() => openEditProgram(prog)} title="Edit Program">
                  <Edit size={16} />
                </button>
                <button onClick={() => handleDeleteProgram(prog.id)} title="Hapus Program">
                  <Trash2 size={16} />
                </button>
              </div>
            )}

            <div className="program-icon-box">
              <img src={prog.imageIcon || 'https://via.placeholder.com/28'} alt="Icon" />
            </div>
            
            {/* 👇 ELEMEN BADGE KATEGORI YANG DITAMBAHKAN 👇 */}
            {prog.badge && (
              <span style={{ 
                fontSize: '10px', 
                fontWeight: '800', 
                color: '#2563eb', 
                backgroundColor: '#eff6ff', 
                padding: '4px 10px', 
                borderRadius: '6px', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em',
                marginBottom: '10px',
                display: 'inline-block'
              }}>
                {prog.badge}
              </span>
            )}

            <h3 className="program-title-minimal">{prog.title}</h3>
            <p className="program-desc-minimal">{prog.desc}</p>
          </div>
        ))}
      </div>

      {/* ================= MODAL JURUSAN MODERN ================= */}
      {showModalJurusan && (
        <div className="modal-overlay">
          <div className="modal-content modern-modal">
            <div className="modal-header-modern">
              <h3>{editIdJurusan ? 'Edit Jurusan' : 'Tambah Jurusan Baru'}</h3>
              <button onClick={() => setShowModalJurusan(false)} className="btn-close-modal" type="button"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmitJurusan} className="form-modern-layout">
              <div className="form-group-modern">
                <label>Nama Jurusan</label>
                <input type="text" placeholder="Contoh: Pengembangan Perangkat Lunak..." className="input-modern" value={newJurusan.title} onChange={e => setNewJurusan({...newJurusan, title: e.target.value})} required />
              </div>
              
              <div className="form-group-modern">
                <label>Slug (URL Pendek)</label>
                <input type="text" placeholder="Contoh: rpl, atph, tbsm" className="input-modern" value={newJurusan.slug} onChange={e => setNewJurusan({...newJurusan, slug: e.target.value})} required />
              </div>

              <div className="form-group-modern">
                <label>Deskripsi Singkat</label>
                <textarea placeholder="Tuliskan deskripsi menarik..." className="input-modern" value={newJurusan.desc} onChange={e => setNewJurusan({...newJurusan, desc: e.target.value})} rows={3} required />
              </div>

              <div className="form-group-modern">
                <label>Mata Pelajaran Unggulan</label>
                <input type="text" placeholder="Pisahkan dengan koma" className="input-modern" value={newJurusan.subjects} onChange={e => setNewJurusan({...newJurusan, subjects: e.target.value})} required />
              </div>

              <div className="form-group-modern">
                <label>Prospek Karir</label>
                <input type="text" placeholder="Pisahkan dengan koma" className="input-modern" value={newJurusan.career} onChange={e => setNewJurusan({...newJurusan, career: e.target.value})} required />
              </div>

              <div className="form-group-modern upload-section">
                <label>Ikon / Gambar Jurusan</label>
                <div className="radio-tabs">
                  <div className={`radio-tab ${imageTypeJurusan === 'url' ? 'active' : ''}`} onClick={() => setImageTypeJurusan('url')}>
                    <LinkIcon size={16}/> Link URL
                  </div>
                  <div className={`radio-tab ${imageTypeJurusan === 'file' ? 'active' : ''}`} onClick={() => setImageTypeJurusan('file')}>
                    <ImageIcon size={16}/> Upload Foto
                  </div>
                </div>
                
                {imageTypeJurusan === 'url' ? (
                  <input type="text" placeholder="https://contoh.com/ikon.png" className="input-modern" value={newJurusan.imageIcon} onChange={e => setNewJurusan({...newJurusan, imageIcon: e.target.value})} />
                ) : (
                  <input type="file" accept="image/*" className="input-modern file-style" onChange={e => handleFileUpload(e, setNewJurusan, newJurusan)} />
                )}
              </div>

              <div className="modal-actions-modern">
                <button type="button" onClick={() => setShowModalJurusan(false)} className="btn-modern-secondary">Batal</button>
                <button type="submit" className="btn-modern-primary">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL PROGRAM MODERN ================= */}
      {showModalProgram && (
        <div className="modal-overlay">
          <div className="modal-content modern-modal">
            <div className="modal-header-modern">
              <h3>{editIdProgram ? 'Edit Program Unggulan' : 'Tambah Program Unggulan'}</h3>
              <button onClick={() => setShowModalProgram(false)} className="btn-close-modal" type="button"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmitProgram} className="form-modern-layout">
              <div className="form-group-modern">
                <label>Nama Program</label>
                <input type="text" placeholder="Contoh: Melanjutkan Pendidikan" className="input-modern" value={newProgram.title} onChange={e => setNewProgram({...newProgram, title: e.target.value})} required />
              </div>

              <div className="form-group-modern">
                <label>Deskripsi Program</label>
                <textarea placeholder="Jelaskan detail program..." className="input-modern" value={newProgram.desc} onChange={e => setNewProgram({...newProgram, desc: e.target.value})} rows={3} required />
              </div>

              <div className="form-group-modern">
                <label>Badge / Label Kategori</label>
                <input type="text" placeholder="Contoh: Internasional, Akademik" className="input-modern" value={newProgram.badge} onChange={e => setNewProgram({...newProgram, badge: e.target.value})} required />
              </div>

              <div className="form-group-modern upload-section">
                <label>Ikon / Gambar Program</label>
                <div className="radio-tabs">
                  <div className={`radio-tab ${imageTypeProgram === 'url' ? 'active' : ''}`} onClick={() => setImageTypeProgram('url')}>
                    <LinkIcon size={16}/> Link URL
                  </div>
                  <div className={`radio-tab ${imageTypeProgram === 'file' ? 'active' : ''}`} onClick={() => setImageTypeProgram('file')}>
                    <ImageIcon size={16}/> Upload Foto
                  </div>
                </div>
                
                {imageTypeProgram === 'url' ? (
                  <input type="text" placeholder="https://contoh.com/ikon.png" className="input-modern" value={newProgram.imageIcon} onChange={e => setNewProgram({...newProgram, imageIcon: e.target.value})} />
                ) : (
                  <input type="file" accept="image/*" className="input-modern file-style" onChange={e => handleFileUpload(e, setNewProgram, newProgram)} />
                )}
              </div>

              <div className="modal-actions-modern">
                <button type="button" onClick={() => setShowModalProgram(false)} className="btn-modern-secondary">Batal</button>
                <button type="submit" className="btn-modern-primary">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}