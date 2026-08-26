import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Plus, Trash2, Edit, Image as ImageIcon, Link as LinkIcon, Database } from 'lucide-react';
import '../App.css';

export default function ManageJurusanProgram() {
  const [jurusanList, setJurusanList] = useState([]);
  const [programList, setProgramList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const userRole = localStorage.getItem('role');

  // GANTI PORT INI KE 5001 JIKA 5002 MENGHASILKAN ERROR 404
  const API_URL = 'http://localhost:5002/api'; 

  const [showModalJurusan, setShowModalJurusan] = useState(false);
  const [editIdJurusan, setEditIdJurusan] = useState(null);
  const [imageTypeJurusan, setImageTypeJurusan] = useState('url');
  const [newJurusan, setNewJurusan] = useState({ title: '', slug: '', desc: '', imageIcon: '', subjects: '', career: '' });

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
        <div className="admin-action-bar">
          <button className="btn-add-new" onClick={openAddJurusan}>
            <Plus size={16} /> Tambah Jurusan Baru
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
        <div className="admin-action-bar">
          <button className="btn-add-new" onClick={openAddProgram}>
            <Plus size={16} /> Tambah Program Unggulan
          </button>
        </div>
      )}

      {/* INI ADALAH GRID MINIMALIS YANG BARU */}
      {/* Grid Minimalis Khusus Program (Persis CMS Sekolahku v3) */}
      <div className="program-cards-grid">
        {programList.map((prog) => (
          <div className="program-card-minimal" key={prog.id}>
            
            {/* Tombol Edit/Hapus Admin (Melayang & Tersembunyi) */}
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

            {/* Ikon Khas CMS Sekolahku */}
            <div className="program-icon-box">
              <img src={prog.imageIcon || 'https://via.placeholder.com/28'} alt="Icon" />
            </div>
            
            {/* Judul dan Deskripsi */}
            <h3 className="program-title-minimal">{prog.title}</h3>
            <p className="program-desc-minimal">{prog.desc}</p>
            
          </div>
        ))}
      </div>
      {/* ================= MODAL JURUSAN ================= */}
      {showModalJurusan && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editIdJurusan ? 'Edit Jurusan' : 'Tambah Jurusan Baru'}</h3>
            <form onSubmit={handleSubmitJurusan} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" placeholder="Nama Jurusan" className="setting-input" value={newJurusan.title} onChange={e => setNewJurusan({...newJurusan, title: e.target.value})} required />
              <input type="text" placeholder="Slug (contoh: rpl, atph, tbsm)" className="setting-input" value={newJurusan.slug} onChange={e => setNewJurusan({...newJurusan, slug: e.target.value})} required />
              <textarea placeholder="Deskripsi Singkat" className="setting-input" value={newJurusan.desc} onChange={e => setNewJurusan({...newJurusan, desc: e.target.value})} required />
              <input type="text" placeholder="Mata Pelajaran (pisahkan dengan koma)" className="setting-input" value={newJurusan.subjects} onChange={e => setNewJurusan({...newJurusan, subjects: e.target.value})} required />
              <input type="text" placeholder="Prospek Karir (pisahkan dengan koma)" className="setting-input" value={newJurusan.career} onChange={e => setNewJurusan({...newJurusan, career: e.target.value})} required />
              
              <div style={{ border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px' }}>
                <div className="image-upload-toggle">
                  <label><input type="radio" checked={imageTypeJurusan === 'url'} onChange={() => setImageTypeJurusan('url')} /> <LinkIcon size={14}/> URL Gambar</label>
                  <label><input type="radio" checked={imageTypeJurusan === 'file'} onChange={() => setImageTypeJurusan('file')} /> <ImageIcon size={14}/> Upload File</label>
                </div>
                {imageTypeJurusan === 'url' ? (
                  <input type="text" placeholder="Masukkan Link/URL Gambar" className="setting-input" value={newJurusan.imageIcon} onChange={e => setNewJurusan({...newJurusan, imageIcon: e.target.value})} />
                ) : (
                  <input type="file" accept="image/*" className="setting-input" onChange={(e) => handleFileUpload(e, setNewJurusan, newJurusan)} />
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="gold-btn">Simpan Data</button>
                <button type="button" onClick={() => setShowModalJurusan(false)} style={{ padding: '10px 20px', background: '#cbd5e1', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL PROGRAM ================= */}
      {showModalProgram && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editIdProgram ? 'Edit Program' : 'Tambah Program Unggulan'}</h3>
            <form onSubmit={handleSubmitProgram} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" placeholder="Nama Program" className="setting-input" value={newProgram.title} onChange={e => setNewProgram({...newProgram, title: e.target.value})} required />
              <textarea placeholder="Deskripsi Program" className="setting-input" value={newProgram.desc} onChange={e => setNewProgram({...newProgram, desc: e.target.value})} required />
              <input type="text" placeholder="Badge (contoh: Internasional, Akademik)" className="setting-input" value={newProgram.badge} onChange={e => setNewProgram({...newProgram, badge: e.target.value})} required />
              
              <div style={{ border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px' }}>
                <div className="image-upload-toggle">
                  <label><input type="radio" checked={imageTypeProgram === 'url'} onChange={() => setImageTypeProgram('url')} /> <LinkIcon size={14}/> URL Gambar</label>
                  <label><input type="radio" checked={imageTypeProgram === 'file'} onChange={() => setImageTypeProgram('file')} /> <ImageIcon size={14}/> Upload File</label>
                </div>
                {imageTypeProgram === 'url' ? (
                  <input type="text" placeholder="Masukkan Link/URL Gambar" className="setting-input" value={newProgram.imageIcon} onChange={e => setNewProgram({...newProgram, imageIcon: e.target.value})} />
                ) : (
                  <input type="file" accept="image/*" className="setting-input" onChange={(e) => handleFileUpload(e, setNewProgram, newProgram)} />
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="gold-btn">Simpan Data</button>
                <button type="button" onClick={() => setShowModalProgram(false)} style={{ padding: '10px 20px', background: '#cbd5e1', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}