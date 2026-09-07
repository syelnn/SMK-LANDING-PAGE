import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Eye, EyeOff, Plus, X, Link as LinkIcon, UploadCloud } from 'lucide-react';

const TestimonialPage = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [viewerFormData, setViewerFormData] = useState({ name: '', role: '', quote: '', photo: '' });
  const [viewerPhotoMode, setViewerPhotoMode] = useState('url'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editId, setEditId] = useState(null);
  const [adminFormData, setAdminFormData] = useState({ name: '', role: '', quote: '', show: 1, photo: '' });
  const [adminPhotoMode, setAdminPhotoMode] = useState('url');
  
  const userRole = localStorage.getItem('role') || 'viewer';
  const userId = localStorage.getItem('userId');

  useEffect(() => { fetchData(); }, [userRole]);

  const fetchData = async () => {
    try {
      const endpoint = userRole === 'admin' || userRole === 'editor' 
        ? 'http://localhost:5002/api/testimonials' 
        : 'http://localhost:5002/api/testimonials/public';
      const res = await axios.get(endpoint);
      setTestimonials(res.data.data);

      if (userRole === 'viewer' && userId) {
        const checkAll = await axios.get('http://localhost:5002/api/testimonials');
        const submitted = checkAll.data.data.find(t => t.userId === Number(userId));
        if (submitted) setHasSubmitted(true);
      }
    } catch (error) { console.error("Gagal memuat testimoni", error); }
  };

  const handleFileUpload = (e, formType) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (formType === 'viewer') setViewerFormData(prev => ({ ...prev, photo: reader.result }));
      else setAdminFormData(prev => ({ ...prev, photo: reader.result }));
    };
  };

  const handleViewerSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5002/api/testimonials', { ...viewerFormData, userId });
      alert('Testimoni terkirim!'); setHasSubmitted(true); fetchData();
    } catch (error) { alert('Gagal mengirim'); }
  };

  const openAddModal = () => {
    setModalMode('add'); setAdminFormData({ name: '', role: '', quote: '', show: 1, photo: '' });
    setAdminPhotoMode('url'); setIsModalOpen(true);
  };

  const openEditModal = (t) => {
    setModalMode('edit'); setEditId(t.id);
    setAdminFormData({ name: t.name, role: t.role, quote: t.quote, show: t.show, photo: t.photo || '' });
    setAdminPhotoMode(t.photo && t.photo.startsWith('data:image') ? 'upload' : 'url'); setIsModalOpen(true);
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') await axios.post('http://localhost:5002/api/testimonials/admin', adminFormData);
      else await axios.put(`http://localhost:5002/api/testimonials/${editId}`, adminFormData);
      setIsModalOpen(false); fetchData();
    } catch (error) { alert('Terjadi kesalahan.'); }
  };

  const handleToggleShow = async (id, currentShow) => {
    try {
      await axios.put(`http://localhost:5002/api/testimonials/${id}/toggle-show`, { show: currentShow === 1 ? 0 : 1 });
      fetchData();
    } catch (error) { alert('Gagal merubah status'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus testimoni ini?")) return;
    try { await axios.delete(`http://localhost:5002/api/testimonials/${id}`); fetchData(); } catch (error) { alert('Gagal menghapus'); }
  };

  const displayCards = testimonials.filter(t => t.show === 1).reverse();

  return (
    <div className="modern-testi-wrapper" style={{ backgroundColor: 'var(--compreng-bg)', color: 'var(--compreng-text)' }}>
      
      {/* PREVIEW KARTU */}
      <div className="modern-testi-public">
        <div className="modern-testi-header">
          <span style={{ backgroundColor: 'var(--compreng-surface-soft)', color: 'var(--compreng-green)', padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px' }}>Testimoni</span>
          <h2 style={{ color: 'var(--compreng-text)', margin: '10px 0' }}>Testimoni <span style={{ color: 'var(--compreng-green)' }}>SMK Negeri Compreng</span></h2>
          <p style={{ color: 'var(--compreng-text-secondary)' }}>Apa kata siswa, alumni, dan orang tua tentang pengalaman mereka.</p>
        </div>

        <div className="modern-testi-grid">
          {displayCards.map(t => (
            <div key={t.id} style={{ backgroundColor: 'var(--compreng-surface)', border: '1px solid var(--compreng-border)', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '40px', color: 'var(--compreng-text-muted)', lineHeight: '1', marginBottom: '10px', fontFamily: 'serif' }}>&ldquo;</div>
              <p style={{ color: 'var(--compreng-text)', fontStyle: 'italic', flexGrow: 1, marginBottom: '20px' }}>{t.quote}</p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {t.photo ? (
                  <img src={t.photo} alt={t.name} style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--compreng-border)' }} />
                ) : (
                  <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: 'var(--compreng-green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>{t.name.charAt(0).toUpperCase()}</div>
                )}
                <div>
                  <h4 style={{ margin: 0, color: 'var(--compreng-text)', fontSize: '15px' }}>{t.name}</h4>
                  <p style={{ margin: 0, color: 'var(--compreng-text-muted)', fontSize: '12px' }}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FORM UNTUK PENGUNJUNG */}
      {userRole === 'viewer' && (
        <div style={{ maxWidth: '600px', margin: '40px auto', backgroundColor: 'var(--compreng-surface)', padding: '30px', borderRadius: '16px', border: '1px solid var(--compreng-border)' }}>
          <h3 style={{ textAlign: 'center', color: 'var(--compreng-text)', marginBottom: '20px' }}>Bagikan Pengalamanmu</h3>
          {!userId ? (
             <div style={{ padding: '15px', backgroundColor: 'var(--compreng-surface-soft)', color: 'var(--compreng-text-muted)', textAlign: 'center', borderRadius: '8px' }}>Silakan login untuk mengirim testimoni.</div>
          ) : hasSubmitted ? (
             <div style={{ padding: '15px', backgroundColor: 'var(--compreng-surface-soft)', color: 'var(--compreng-green)', textAlign: 'center', borderRadius: '8px', border: '1px solid var(--compreng-green-dark)' }}>Terima kasih! Testimoni kamu menunggu moderasi.</div>
          ) : (
            <form onSubmit={handleViewerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--compreng-text-muted)' }}>Nama Lengkap</label>
                <input type="text" required value={viewerFormData.name} onChange={e => setViewerFormData({...viewerFormData, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--compreng-border)', backgroundColor: 'var(--compreng-bg)', color: 'var(--compreng-text)' }} />
              </div>
              <button type="submit" style={{ backgroundColor: 'var(--compreng-green)', color: '#fff', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Kirim Testimoni</button>
            </form>
          )}
        </div>
      )}

      {/* TABEL ADMIN */}
      {(userRole === 'admin' || userRole === 'editor') && (
        <div style={{ maxWidth: '1200px', margin: '40px auto', paddingTop: '40px', borderTop: '1px dashed var(--compreng-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ margin: 0, color: 'var(--compreng-text)' }}>Manajemen Testimoni</h2>
              <p style={{ margin: 0, color: 'var(--compreng-text-muted)' }}>Kelola data kutipan di halaman depan.</p>
            </div>
            <button onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--compreng-green)', color: '#fff', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
              <Plus size={16} /> Tambah Data
            </button>
          </div>

          <div style={{ overflowX: 'auto', backgroundColor: 'var(--compreng-surface)', borderRadius: '12px', border: '1px solid var(--compreng-border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--compreng-surface-soft)' }}>
                  <th style={{ padding: '15px', color: 'var(--compreng-text-muted)', fontSize: '13px' }}>Nama & Foto</th>
                  <th style={{ padding: '15px', color: 'var(--compreng-text-muted)', fontSize: '13px' }}>Role</th>
                  <th style={{ padding: '15px', color: 'var(--compreng-text-muted)', fontSize: '13px' }}>Kutipan</th>
                  <th style={{ padding: '15px', color: 'var(--compreng-text-muted)', fontSize: '13px' }}>Status</th>
                  <th style={{ padding: '15px', color: 'var(--compreng-text-muted)', fontSize: '13px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {testimonials.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--compreng-border)' }}>
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {t.photo ? <img src={t.photo} alt="pic" style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: 'var(--compreng-surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--compreng-text)' }}>{t.name.charAt(0)}</div>}
                        <span style={{ color: 'var(--compreng-text)', fontWeight: 'bold' }}>{t.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '15px', color: 'var(--compreng-text-secondary)' }}>{t.role}</td>
                    <td style={{ padding: '15px', color: 'var(--compreng-text-secondary)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.quote}</td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', backgroundColor: t.show ? 'var(--compreng-surface-soft)' : 'var(--compreng-bg)', color: t.show ? 'var(--compreng-green)' : 'var(--compreng-text-muted)' }}>
                        {t.show ? 'Ditampilkan' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button onClick={() => handleToggleShow(t.id, t.show)} style={{ padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: t.show ? 'var(--compreng-surface-soft)' : 'var(--compreng-bg)', color: t.show ? 'var(--compreng-green)' : 'var(--compreng-text-muted)' }}>{t.show ? <Eye size={16}/> : <EyeOff size={16}/>}</button>
                        <button onClick={() => openEditModal(t)} style={{ padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: 'var(--compreng-surface-soft)', color: '#2563eb' }}><Pencil size={16}/></button>
                        <button onClick={() => handleDelete(t.id)} style={{ padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: '#fef2f2', color: '#dc2626' }}><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestimonialPage;