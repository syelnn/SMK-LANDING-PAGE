import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, Trash2, Edit, Image as ImageIcon, Link as LinkIcon, X, MoreHorizontal, ExternalLink } from 'lucide-react';
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

  // State Dropdown Action (Shadcn Style)
  const [openDropdownJurusan, setOpenDropdownJurusan] = useState(null);
  const [openDropdownProgram, setOpenDropdownProgram] = useState(null);

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

  const handleFileUpload = (e, setFormState, formState) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setFormState({ ...formState, imageIcon: reader.result }); };
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
    setOpenDropdownJurusan(null);
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
    setOpenDropdownJurusan(null);
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
    setOpenDropdownProgram(null);
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
    setOpenDropdownProgram(null);
    if (!window.confirm('Yakin ingin menghapus program ini?')) return;
    try { await axios.delete(`${API_URL}/program/${id}`); fetchData(); } 
    catch (error) { alert('Gagal menghapus program'); }
  };

  // --- STYLES (RESPONSIVE SHADCN ADMIN LOOK) ---
  const styles = {
    // Tambahkan padding dan boxSizing agar tidak "zoom banget" / menyentuh ujung layar
    wrapper: { width: '100%', maxWidth: '1150px', margin: '0 auto', padding: '30px 24px', boxSizing: 'border-box' },
    headerBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' },
    title: { fontSize: '22px', fontWeight: '700', color: 'var(--compreng-text)', margin: '0 0 4px 0', letterSpacing: '-0.02em' },
    subtitle: { fontSize: '13px', color: 'var(--compreng-text-secondary)', margin: 0 },
    
    // Buttons
    btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'var(--compreng-text)', color: 'var(--compreng-bg)', borderRadius: '6px', border: 'none', fontWeight: '500', cursor: 'pointer', fontSize: '13px', transition: 'opacity 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', whiteSpace: 'nowrap' },
    
    // Table Styles
    tableCard: { backgroundColor: 'var(--compreng-surface)', borderRadius: '8px', border: '1px solid var(--compreng-border)', overflowX: 'auto', overflowY: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '40px', width: '100%' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' },
    th: { padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: 'var(--compreng-text-secondary)', borderBottom: '1px solid var(--compreng-border)', whiteSpace: 'nowrap' },
    td: { padding: '14px 16px', borderBottom: '1px solid var(--compreng-border)', verticalAlign: 'middle', color: 'var(--compreng-text)', fontSize: '13px' },
    
    // Helpers
    badgeTag: { display: 'inline-block', background: 'var(--compreng-surface-soft)', color: 'var(--compreng-text)', border: '1px solid var(--compreng-border)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '500', whiteSpace: 'nowrap' },
    badgeBlue: { display: 'inline-block', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' },
    truncate: { maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    
    // Dropdown Action
    actionBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', color: 'var(--compreng-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    dropdownMenu: { position: 'absolute', right: '15px', top: '70%', background: 'var(--compreng-surface)', border: '1px solid var(--compreng-border)', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '170px', padding: '4px', zIndex: 50 },
    dropdownItem: { display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 10px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', borderRadius: '4px', fontSize: '12px', fontWeight: '500', color: 'var(--compreng-text)', textDecoration: 'none', transition: 'background 0.2s' },
  };

  if (loading) return <div style={{ padding: '30px', color: 'var(--compreng-text-muted)', textAlign: 'center' }}>Memuat data program...</div>;

  return (
    <div style={styles.wrapper}>
      
      {/* ================= BAGIAN 1: JURUSAN ================= */}
      <div style={styles.headerBox}>
        <div>
          <h2 style={styles.title}>Jurusan (Kompetensi Keahlian)</h2>
          <p style={styles.subtitle}>Kelola daftar jurusan dan mata pelajaran yang ditawarkan di sekolah.</p>
        </div>
        {(userRole === 'admin' || userRole === 'editor') && (
          <button style={styles.btnPrimary} onClick={openAddJurusan}>
            <Plus size={16} /> Tambah Jurusan
          </button>
        )}
      </div>

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr style={{ background: 'var(--compreng-surface-soft)' }}>
              <th style={styles.th}>Jurusan</th>
              <th style={styles.th}>Slug URL</th>
              <th style={styles.th}>Deskripsi Singkat</th>
              <th style={styles.th}>Mata Pelajaran</th>
              <th style={{ ...styles.th, textAlign: 'center' }}></th>
            </tr>
          </thead>
          <tbody>
            {jurusanList.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--compreng-text-muted)', fontSize: '13px' }}>Belum ada data jurusan.</td></tr>
            ) : (
              jurusanList.map((item) => {
                const subjectArray = item.subjects ? item.subjects.split(',') : [];
                return (
                  <tr key={item.id} style={{ transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--compreng-surface-soft)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={item.imageIcon || 'https://via.placeholder.com/40'} alt="Icon" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'contain', background: 'var(--compreng-bg)', padding: '4px', border: '1px solid var(--compreng-border)' }} />
                        <span style={{ fontWeight: '600' }}>{item.title}</span>
                      </div>
                    </td>
                    <td style={{ ...styles.td, color: 'var(--compreng-text-secondary)' }}>/{item.slug}</td>
                    <td style={{ ...styles.td, ...styles.truncate }}>{item.desc}</td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxWidth: '240px' }}>
                        {subjectArray.slice(0, 2).map((sub, idx) => (
                          <span key={idx} style={styles.badgeTag}>{sub.trim()}</span>
                        ))}
                        {subjectArray.length > 2 && <span style={styles.badgeTag}>+{subjectArray.length - 2}</span>}
                      </div>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center', position: 'relative' }}>
                      <button 
                        onClick={() => setOpenDropdownJurusan(openDropdownJurusan === item.id ? null : item.id)}
                        style={styles.actionBtn}
                        onMouseOver={(e) => e.currentTarget.style.background = 'var(--compreng-surface-soft)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {openDropdownJurusan === item.id && (
                        <>
                          <div onClick={() => setOpenDropdownJurusan(null)} style={{ position: 'fixed', inset: 0, zIndex: 40 }}></div>
                          <div style={styles.dropdownMenu}>
                            <Link to={`/admin/kurikulum/${item.slug}`} style={styles.dropdownItem} onMouseOver={(e) => e.currentTarget.style.background = 'var(--compreng-surface-soft)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                              <ExternalLink size={14} color="var(--compreng-text-secondary)" /> Detail Kurikulum
                            </Link>
                            {(userRole === 'admin' || userRole === 'editor') && (
                              <>
                                <button onClick={() => openEditJurusan(item)} style={styles.dropdownItem} onMouseOver={(e) => e.currentTarget.style.background = 'var(--compreng-surface-soft)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                  <Edit size={14} color="var(--compreng-text-secondary)" /> Edit Data
                                </button>
                                <div style={{ margin: '2px 0', borderTop: '1px solid var(--compreng-border)' }}></div>
                                <button onClick={() => handleDeleteJurusan(item.id)} style={{ ...styles.dropdownItem, color: '#dc2626' }} onMouseOver={(e) => e.currentTarget.style.background = '#fef2f2'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                  <Trash2 size={14} color="#dc2626" /> Delete
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ================= BAGIAN 2: PROGRAM UNGGULAN ================= */}
      <div style={{ ...styles.headerBox, marginTop: '50px' }}>
        <div>
          <h2 style={styles.title}>Program Unggulan</h2>
          <p style={styles.subtitle}>Pilihan jalur karier komprehensif (Akademik, Siap Kerja, dsb).</p>
        </div>
        {(userRole === 'admin' || userRole === 'editor') && (
          <button style={styles.btnPrimary} onClick={openAddProgram}>
            <Plus size={16} /> Tambah Program
          </button>
        )}
      </div>

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr style={{ background: 'var(--compreng-surface-soft)' }}>
              <th style={styles.th}>Nama Program</th>
              <th style={styles.th}>Label Kategori</th>
              <th style={styles.th}>Deskripsi Program</th>
              <th style={{ ...styles.th, textAlign: 'center' }}></th>
            </tr>
          </thead>
          <tbody>
            {programList.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--compreng-text-muted)', fontSize: '13px' }}>Belum ada program unggulan.</td></tr>
            ) : (
              programList.map((prog) => (
                <tr key={prog.id} style={{ transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--compreng-surface-soft)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={prog.imageIcon || 'https://via.placeholder.com/40'} alt="Icon" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'contain', background: 'var(--compreng-bg)', padding: '4px', border: '1px solid var(--compreng-border)' }} />
                      <span style={{ fontWeight: '600' }}>{prog.title}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    {prog.badge && <span style={styles.badgeBlue}>{prog.badge}</span>}
                  </td>
                  <td style={{ ...styles.td, ...styles.truncate, maxWidth: '400px' }}>{prog.desc}</td>
                  <td style={{ ...styles.td, textAlign: 'center', position: 'relative' }}>
                    
                    {(userRole === 'admin' || userRole === 'editor') && (
                      <>
                        <button 
                          onClick={() => setOpenDropdownProgram(openDropdownProgram === prog.id ? null : prog.id)}
                          style={styles.actionBtn}
                          onMouseOver={(e) => e.currentTarget.style.background = 'var(--compreng-surface-soft)'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {openDropdownProgram === prog.id && (
                          <>
                            <div onClick={() => setOpenDropdownProgram(null)} style={{ position: 'fixed', inset: 0, zIndex: 40 }}></div>
                            <div style={styles.dropdownMenu}>
                              <button onClick={() => openEditProgram(prog)} style={styles.dropdownItem} onMouseOver={(e) => e.currentTarget.style.background = 'var(--compreng-surface-soft)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                <Edit size={14} color="var(--compreng-text-secondary)" /> Edit Data
                              </button>
                              <div style={{ margin: '2px 0', borderTop: '1px solid var(--compreng-border)' }}></div>
                              <button onClick={() => handleDeleteProgram(prog.id)} style={{ ...styles.dropdownItem, color: '#dc2626' }} onMouseOver={(e) => e.currentTarget.style.background = '#fef2f2'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                <Trash2 size={14} color="#dc2626" /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ================= MODAL FORM JURUSAN & PROGRAM ================= */}
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