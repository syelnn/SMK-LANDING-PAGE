import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, Trash2, Edit, Image as ImageIcon, Link as LinkIcon, X, MoreHorizontal, ExternalLink } from 'lucide-react';
import '../css/managejurusanprogram.css';
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

  // --- STATE DROPDOWN SMART POSITIONING ---
  // Mampu menangani tabel jurusan maupun program sekaligus
  const [dropdownConfig, setDropdownConfig] = useState({ id: null, type: null, right: null, top: null, bottom: null });

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

  useEffect(() => { fetchData(); }, []);

  // Tutup dropdown saat user melakukan scroll agar menu tidak melayang tertinggal
  useEffect(() => {
    const handleScroll = () => {
      if (dropdownConfig.id !== null) {
        setDropdownConfig({ id: null, type: null, right: null, top: null, bottom: null });
      }
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [dropdownConfig.id]);

  const handleFileUpload = (e, setFormState, formState) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setFormState({ ...formState, imageIcon: reader.result }); };
      reader.readAsDataURL(file);
    }
  };

  // --- SMART DROPDOWN LOGIC ---
  const handleDropdownClick = (e, itemId, itemType) => {
    e.stopPropagation();
    if (dropdownConfig.id === itemId && dropdownConfig.type === itemType) {
      setDropdownConfig({ id: null, type: null, right: null, top: null, bottom: null });
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const dropdownHeight = itemType === 'jurusan' ? 120 : 80; // Estimasi tinggi dropdown
    
    const spaceBelow = windowHeight - rect.bottom;
    const openUpwards = spaceBelow < dropdownHeight;

    setDropdownConfig({
      id: itemId,
      type: itemType,
      right: window.innerWidth - rect.right,
      top: openUpwards ? null : rect.bottom + 4,
      bottom: openUpwards ? windowHeight - rect.top + 4 : null
    });
  };

  // ================= ACTION JURUSAN =================
  const openAddJurusan = () => {
    setEditIdJurusan(null);
    setNewJurusan({ title: '', slug: '', desc: '', imageIcon: '', subjects: '', career: '' });
    setImageTypeJurusan('url');
    setShowModalJurusan(true);
  };

  const openEditJurusan = (item) => {
    setDropdownConfig({ id: null, type: null, right: null, top: null, bottom: null });
    setEditIdJurusan(item.id);
    setNewJurusan({ ...item });
    setImageTypeJurusan(item.imageIcon && item.imageIcon.length > 200 ? 'file' : 'url'); 
    setShowModalJurusan(true);
  };

  const handleSubmitJurusan = async (e) => {
    e.preventDefault();
    try {
      if (editIdJurusan) await axios.put(`${API_URL}/jurusan/${editIdJurusan}`, newJurusan);
      else await axios.post(`${API_URL}/jurusan`, newJurusan);
      setShowModalJurusan(false); fetchData();
    } catch (error) { alert(`Gagal menyimpan jurusan: ${error.response?.data?.message || error.message}`); }
  };

  const handleDeleteJurusan = async (id) => {
    setDropdownConfig({ id: null, type: null, right: null, top: null, bottom: null });
    if (!window.confirm('Yakin ingin menghapus jurusan ini?')) return;
    try { await axios.delete(`${API_URL}/jurusan/${id}`); fetchData(); } 
    catch (error) { alert('Gagal menghapus jurusan'); }
  };

  // ================= ACTION PROGRAM =================
  const openAddProgram = () => {
    setEditIdProgram(null);
    setNewProgram({ title: '', desc: '', badge: '', imageIcon: '' });
    setImageTypeProgram('url');
    setShowModalProgram(true);
  };

  const openEditProgram = (item) => {
    setDropdownConfig({ id: null, type: null, right: null, top: null, bottom: null });
    setEditIdProgram(item.id);
    setNewProgram({ ...item });
    setImageTypeProgram(item.imageIcon && item.imageIcon.length > 200 ? 'file' : 'url');
    setShowModalProgram(true);
  };

  const handleSubmitProgram = async (e) => {
    e.preventDefault();
    try {
      if (editIdProgram) await axios.put(`${API_URL}/program/${editIdProgram}`, newProgram);
      else await axios.post(`${API_URL}/program`, newProgram);
      setShowModalProgram(false); fetchData();
    } catch (error) { alert(`Gagal menyimpan program: ${error.response?.data?.message || error.message}`); }
  };

  const handleDeleteProgram = async (id) => {
    setDropdownConfig({ id: null, type: null, right: null, top: null, bottom: null });
    if (!window.confirm('Yakin ingin menghapus program ini?')) return;
    try { await axios.delete(`${API_URL}/program/${id}`); fetchData(); } 
    catch (error) { alert('Gagal menghapus program'); }
  };

  if (loading) return <div style={{ padding: '30px', color: 'var(--compreng-text-muted)', textAlign: 'center' }}>Memuat data program...</div>;

  return (
    <div className="mjp-wrapper">
      
      {/* ================= BAGIAN 1: JURUSAN ================= */}
      <div className="mjp-header-box">
        <div>
          <h2 className="mjp-title">Jurusan (Kompetensi Keahlian)</h2>
          <p className="mjp-subtitle">Kelola daftar jurusan dan mata pelajaran yang ditawarkan di sekolah.</p>
        </div>
        {(userRole === 'admin' || userRole === 'editor') && (
          <button className="mjp-btn-primary" onClick={openAddJurusan}>
            <Plus size={16} /> Tambah Jurusan
          </button>
        )}
      </div>

      <div className="mjp-table-card">
        <table className="mjp-table">
          <thead>
            <tr style={{ background: 'var(--compreng-surface-soft)' }}>
              <th className="mjp-th">Jurusan</th>
              <th className="mjp-th">Slug URL</th>
              <th className="mjp-th">Deskripsi Singkat</th>
              <th className="mjp-th">Mata Pelajaran</th>
              <th className="mjp-th" style={{ textAlign: 'center' }}></th>
            </tr>
          </thead>
          <tbody>
            {jurusanList.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--compreng-text-muted)', fontSize: '13px' }}>Belum ada data jurusan.</td></tr>
            ) : (
              jurusanList.map((item) => {
                const subjectArray = item.subjects ? item.subjects.split(',') : [];
                return (
                  <tr key={item.id} className="mjp-tr">
                    <td className="mjp-td">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={item.imageIcon || 'https://via.placeholder.com/40'} alt="Icon" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'contain', background: 'var(--compreng-bg)', padding: '4px', border: '1px solid var(--compreng-border)' }} />
                        <span style={{ fontWeight: '600' }}>{item.title}</span>
                      </div>
                    </td>
                    <td className="mjp-td" style={{ color: 'var(--compreng-text-secondary)' }}>/{item.slug}</td>
                    <td className="mjp-td mjp-truncate">{item.desc}</td>
                    <td className="mjp-td">
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxWidth: '240px' }}>
                        {subjectArray.slice(0, 2).map((sub, idx) => (
                          <span key={idx} className="mjp-badge-tag">{sub.trim()}</span>
                        ))}
                        {subjectArray.length > 2 && <span className="mjp-badge-tag">+{subjectArray.length - 2}</span>}
                      </div>
                    </td>
                    <td className="mjp-td" style={{ textAlign: 'center', position: 'relative' }}>
                      <button 
                        onClick={(e) => handleDropdownClick(e, item.id, 'jurusan')}
                        className="mjp-action-btn"
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ================= BAGIAN 2: PROGRAM UNGGULAN ================= */}
      <div className="mjp-header-box" style={{ marginTop: '50px' }}>
        <div>
          <h2 className="mjp-title">Program Unggulan</h2>
          <p className="mjp-subtitle">Pilihan jalur karier komprehensif (Akademik, Siap Kerja, dsb).</p>
        </div>
        {(userRole === 'admin' || userRole === 'editor') && (
          <button className="mjp-btn-primary" onClick={openAddProgram}>
            <Plus size={16} /> Tambah Program
          </button>
        )}
      </div>

      <div className="mjp-table-card">
        <table className="mjp-table">
          <thead>
            <tr style={{ background: 'var(--compreng-surface-soft)' }}>
              <th className="mjp-th">Nama Program</th>
              <th className="mjp-th">Label Kategori</th>
              <th className="mjp-th">Deskripsi Program</th>
              <th className="mjp-th" style={{ textAlign: 'center' }}></th>
            </tr>
          </thead>
          <tbody>
            {programList.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--compreng-text-muted)', fontSize: '13px' }}>Belum ada program unggulan.</td></tr>
            ) : (
              programList.map((prog) => (
                <tr key={prog.id} className="mjp-tr">
                  <td className="mjp-td">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={prog.imageIcon || 'https://via.placeholder.com/40'} alt="Icon" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'contain', background: 'var(--compreng-bg)', padding: '4px', border: '1px solid var(--compreng-border)' }} />
                      <span style={{ fontWeight: '600' }}>{prog.title}</span>
                    </div>
                  </td>
                  <td className="mjp-td">
                    {prog.badge && <span className="mjp-badge-blue">{prog.badge}</span>}
                  </td>
                  <td className="mjp-td mjp-truncate" style={{ maxWidth: '400px' }}>{prog.desc}</td>
                  <td className="mjp-td" style={{ textAlign: 'center', position: 'relative' }}>
                    
                    {(userRole === 'admin' || userRole === 'editor') && (
                      <button 
                        onClick={(e) => handleDropdownClick(e, prog.id, 'program')}
                        className="mjp-action-btn"
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MENAMPILKAN DROPDOWN SECARA FIXED (Di Luar Flow Tabel) */}
      {dropdownConfig.id && (
        <>
          <div 
            onClick={() => setDropdownConfig({ id: null, type: null, right: null, top: null, bottom: null })} 
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          ></div>
          
          <div 
            className="mjp-dropdown-menu" 
            style={{ 
              position: 'fixed', 
              right: dropdownConfig.right, 
              ...(dropdownConfig.top !== null ? { top: dropdownConfig.top } : {}),
              ...(dropdownConfig.bottom !== null ? { bottom: dropdownConfig.bottom } : {}),
              zIndex: 50 
            }}
          >
            {dropdownConfig.type === 'jurusan' ? (() => {
              const item = jurusanList.find(j => j.id === dropdownConfig.id);
              if (!item) return null;
              return (
                <>
                  <Link to={`/admin/kurikulum/${item.slug}`} className="mjp-dropdown-item">
                    <ExternalLink size={14} color="var(--compreng-text-secondary)" /> Detail Kurikulum
                  </Link>
                  {(userRole === 'admin' || userRole === 'editor') && (
                    <>
                      <button onClick={() => openEditJurusan(item)} className="mjp-dropdown-item">
                        <Edit size={14} color="var(--compreng-text-secondary)" /> Edit Data
                      </button>
                      <div style={{ margin: '2px 0', borderTop: '1px solid var(--compreng-border)' }}></div>
                      <button onClick={() => handleDeleteJurusan(item.id)} className="mjp-dropdown-item danger">
                        <Trash2 size={14} color="currentColor" /> Delete
                      </button>
                    </>
                  )}
                </>
              );
            })() : (() => {
              const item = programList.find(p => p.id === dropdownConfig.id);
              if (!item) return null;
              return (
                <>
                  <button onClick={() => openEditProgram(item)} className="mjp-dropdown-item">
                    <Edit size={14} color="var(--compreng-text-secondary)" /> Edit Data
                  </button>
                  <div style={{ margin: '2px 0', borderTop: '1px solid var(--compreng-border)' }}></div>
                  <button onClick={() => handleDeleteProgram(item.id)} className="mjp-dropdown-item danger">
                    <Trash2 size={14} color="currentColor" /> Delete
                  </button>
                </>
              );
            })()}
          </div>
        </>
      )}

      {/* ================= MODAL FORM JURUSAN ================= */}
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
                  <div className={`radio-tab ${imageTypeJurusan === 'url' ? 'active' : ''}`} onClick={() => setImageTypeJurusan('url')}><LinkIcon size={16}/> Link URL</div>
                  <div className={`radio-tab ${imageTypeJurusan === 'file' ? 'active' : ''}`} onClick={() => setImageTypeJurusan('file')}><ImageIcon size={16}/> Upload Foto</div>
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

      {/* ================= MODAL FORM PROGRAM ================= */}
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
                  <div className={`radio-tab ${imageTypeProgram === 'url' ? 'active' : ''}`} onClick={() => setImageTypeProgram('url')}><LinkIcon size={16}/> Link URL</div>
                  <div className={`radio-tab ${imageTypeProgram === 'file' ? 'active' : ''}`} onClick={() => setImageTypeProgram('file')}><ImageIcon size={16}/> Upload Foto</div>
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