import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, Trash2, Edit, X, MoreHorizontal, ExternalLink } from 'lucide-react';
import ImageUploader from '../components/ImageUploader';
import { getImageUrl } from '../utils/media';
import '../css/managejurusanprogram.css';
import '../App.css';

export default function ManageJurusanProgram() {
  const [jurusanList, setJurusanList] = useState([]);
  const [programList, setProgramList] = useState([]);
  const [loading, setLoading] = useState(true);
  const userRole = localStorage.getItem('role');

  const API_URL = 'https://smkn-compreng-api-pi.vercel.app/api'; 

  // State Modal Jurusan
  const [showModalJurusan, setShowModalJurusan] = useState(false);
  const [editIdJurusan, setEditIdJurusan] = useState(null);
  const [imageTypeJurusan, setImageTypeJurusan] = useState('url');
  const [selectedFileJurusan, setSelectedFileJurusan] = useState(null);
  const [newJurusan, setNewJurusan] = useState({ title: '', slug: '', desc: '', imageIcon: '', subjects: '', career: '' });

  // State Modal Program
  const [showModalProgram, setShowModalProgram] = useState(false);
  const [editIdProgram, setEditIdProgram] = useState(null);
  const [imageTypeProgram, setImageTypeProgram] = useState('url');
  const [selectedFileProgram, setSelectedFileProgram] = useState(null);
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

  // Callback dari <ImageUploader>: file asli/hasil edit disimpan di state (dikirim ke backend),
  // URL-nya dipakai untuk pratinjau.
  const handleJurusanImageChange = ({ file, url }) => {
    setSelectedFileJurusan(file);
    setImageTypeJurusan(file ? 'file' : 'url');
    setNewJurusan((prev) => ({ ...prev, imageIcon: url }));
  };

  const handleProgramImageChange = ({ file, url }) => {
    setSelectedFileProgram(file);
    setImageTypeProgram(file ? 'file' : 'url');
    setNewProgram((prev) => ({ ...prev, imageIcon: url }));
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
    setSelectedFileJurusan(null);
    setShowModalJurusan(true);
  };

  const openEditJurusan = (item) => {
    setDropdownConfig({ id: null, type: null, right: null, top: null, bottom: null });
    setEditIdJurusan(item.id);
    // Path relatif dari database digabung dulu jadi URL utuh, supaya pratinjau di ImageUploader tampil.
    // Kalau admin simpan tanpa ganti gambar, backend akan mengembalikannya lagi ke path relatif.
    setNewJurusan({ ...item, imageIcon: getImageUrl(item.imageIcon) });
    setImageTypeJurusan(item.imageIcon && item.imageIcon.length > 200 ? 'file' : 'url'); 
    setSelectedFileJurusan(null);
    setShowModalJurusan(true);
  };

  const handleSubmitJurusan = async (e) => {
    e.preventDefault();
    try {
      // File asli dikirim via FormData -> backend upload ke Cloudinary,
      // hanya URL hasilnya yang disimpan ke database (bukan base64).
      const fd = new FormData();
      fd.append('title', newJurusan.title || '');
      fd.append('slug', newJurusan.slug || '');
      fd.append('desc', newJurusan.desc || '');
      fd.append('subjects', newJurusan.subjects || '');
      fd.append('career', newJurusan.career || '');
      fd.append('imageIcon', imageTypeJurusan === 'file' && selectedFileJurusan ? selectedFileJurusan : (newJurusan.imageIcon || ''));

      if (editIdJurusan) await axios.put(`${API_URL}/jurusan/${editIdJurusan}`, fd);
      else await axios.post(`${API_URL}/jurusan`, fd);
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
    setSelectedFileProgram(null);
    setShowModalProgram(true);
  };

  const openEditProgram = (item) => {
    setDropdownConfig({ id: null, type: null, right: null, top: null, bottom: null });
    setEditIdProgram(item.id);
    // Sama seperti jurusan: path relatif -> URL utuh untuk pratinjau ImageUploader.
    setNewProgram({ ...item, imageIcon: getImageUrl(item.imageIcon) });
    setImageTypeProgram(item.imageIcon && item.imageIcon.length > 200 ? 'file' : 'url');
    setSelectedFileProgram(null);
    setShowModalProgram(true);
  };

  const handleSubmitProgram = async (e) => {
    e.preventDefault();
    try {
      // File asli dikirim via FormData -> backend upload ke Cloudinary,
      // hanya URL hasilnya yang disimpan ke database (bukan base64).
      const fd = new FormData();
      fd.append('title', newProgram.title || '');
      fd.append('desc', newProgram.desc || '');
      fd.append('badge', newProgram.badge || '');
      fd.append('imageIcon', imageTypeProgram === 'file' && selectedFileProgram ? selectedFileProgram : (newProgram.imageIcon || ''));

      if (editIdProgram) await axios.put(`${API_URL}/program/${editIdProgram}`, fd);
      else await axios.post(`${API_URL}/program`, fd);
      setShowModalProgram(false); fetchData();
    } catch (error) { alert(`Gagal menyimpan program: ${error.response?.data?.message || error.message}`); }
  };

  const handleDeleteProgram = async (id) => {
    setDropdownConfig({ id: null, type: null, right: null, top: null, bottom: null });
    if (!window.confirm('Yakin ingin menghapus program ini?')) return;
    try { await axios.delete(`${API_URL}/program/${id}`); fetchData(); } 
    catch (error) { alert('Gagal menghapus program'); }
  };

  if (loading) return <div style={{ padding: '30px', color: 'var(--compreng-text-muted)', textAlign: 'center' }}>Memuat data...</div>;

  return (
    <div className="mjp-wrapper" id="admin-jurusan">
      
      {/* ================= BAGIAN 1: JURUSAN ================= */}
      <div className="mjp-head">
        <div className="mjp-head-row">
          <h2 className="mjp-title">Jurusan <span className="mjp-count">{jurusanList.length}</span></h2>
          {(userRole === 'admin' || userRole === 'editor') && (
            <button className="mjp-cta" onClick={openAddJurusan} aria-label="Tambah Jurusan" data-tip="Tambah Jurusan">
              <Plus size={18} strokeWidth={2.75} />
            </button>
          )}
        </div>
        <p className="mjp-subtitle">Kelola daftar jurusan (kompetensi keahlian) dan mata pelajaran yang ditawarkan di sekolah.</p>
      </div>

      {jurusanList.length === 0 ? (
        <div className="mjp-empty">Belum ada data jurusan. Klik "Tambah Jurusan" untuk mulai.</div>
      ) : (
        <>
          {/* TABEL (desktop/laptop) */}
          <div className="mjp-sheet">
            <table className="mjp-data">
              <colgroup>
                <col style={{ width: '27%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '32%' }} />
                <col style={{ width: '24%' }} />
                <col style={{ width: '56px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="mjp-th">Jurusan</th>
                  <th className="mjp-th">Slug URL</th>
                  <th className="mjp-th">Deskripsi singkat</th>
                  <th className="mjp-th">Mata pelajaran</th>
                  <th className="mjp-th mjp-th-act"><span className="mjp-sr">Aksi</span></th>
                </tr>
              </thead>
              <tbody>
                {jurusanList.map((item) => {
                  const subjectArray = item.subjects ? item.subjects.split(',').filter((x) => x.trim()) : [];
                  return (
                    <tr key={item.id} className="mjp-row">
                      <td className="mjp-cell">
                        <div className="mjp-who">
                          <img className="mjp-pic mjp-pic-sm" src={getImageUrl(item.imageIcon) || 'https://via.placeholder.com/44'} alt="" />
                          <div className="mjp-name">{item.title}</div>
                        </div>
                      </td>
                      <td className="mjp-cell"><div><span className="mjp-slug">/{item.slug}</span></div></td>
                      <td className="mjp-cell"><div className="mjp-text mjp-text-2">{item.desc}</div></td>
                      <td className="mjp-cell">
                        <div className="mjp-chips">
                          {subjectArray.slice(0, 2).map((sub, idx) => (
                            <span key={idx} className="mjp-chip">{sub.trim()}</span>
                          ))}
                          {subjectArray.length > 2 && <span className="mjp-chip mjp-chip-more">+{subjectArray.length - 2}</span>}
                        </div>
                      </td>
                      <td className="mjp-cell mjp-cell-act">
                        <button onClick={(e) => handleDropdownClick(e, item.id, 'jurusan')} className="mjp-action-btn" aria-label="Menu aksi">
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* KARTU (HP/tablet kecil) */}
        <div className="mjp-grid">
          {jurusanList.map((item) => {
            const subjectArray = item.subjects ? item.subjects.split(',').filter((x) => x.trim()) : [];
            return (
              <article key={item.id} className="mjp-tile">
                <div className="mjp-top">
                  <img className="mjp-pic" src={getImageUrl(item.imageIcon) || 'https://via.placeholder.com/56'} alt="" />
                  <div className="mjp-main">
                    <h3 className="mjp-name">{item.title}</h3>
                    <span className="mjp-slug">/{item.slug}</span>
                  </div>
                  <button onClick={(e) => handleDropdownClick(e, item.id, 'jurusan')} className="mjp-action-btn" aria-label="Menu aksi">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
                {item.desc && <p className="mjp-text">{item.desc}</p>}
                {subjectArray.length > 0 && (
                  <div className="mjp-chips">
                    {subjectArray.slice(0, 3).map((sub, idx) => (
                      <span key={idx} className="mjp-chip">{sub.trim()}</span>
                    ))}
                    {subjectArray.length > 3 && <span className="mjp-chip mjp-chip-more">+{subjectArray.length - 3}</span>}
                  </div>
                )}
              </article>
            );
          })}
        </div>
        </>
      )}

      {/* ================= BAGIAN 2: PROGRAM UNGGULAN ================= */}
      <div className="mjp-head mjp-head-second">
        <div className="mjp-head-row">
          <h2 className="mjp-title">Program Unggulan <span className="mjp-count">{programList.length}</span></h2>
          {(userRole === 'admin' || userRole === 'editor') && (
            <button className="mjp-cta" onClick={openAddProgram} aria-label="Tambah Program" data-tip="Tambah Program">
              <Plus size={18} strokeWidth={2.75} />
            </button>
          )}
        </div>
        <p className="mjp-subtitle">Pilihan jalur karier komprehensif (Akademik, Siap Kerja, dsb).</p>
      </div>

      {programList.length === 0 ? (
        <div className="mjp-empty">Belum ada program unggulan. Klik "Tambah Program" untuk mulai.</div>
      ) : (
        <>
          {/* TABEL (desktop/laptop) */}
          <div className="mjp-sheet">
            <table className="mjp-data">
              <colgroup>
                <col style={{ width: '30%' }} />
                <col style={{ width: '20%' }} />
                <col />
                <col style={{ width: '56px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="mjp-th">Nama program</th>
                  <th className="mjp-th">Kategori</th>
                  <th className="mjp-th">Deskripsi program</th>
                  <th className="mjp-th mjp-th-act"><span className="mjp-sr">Aksi</span></th>
                </tr>
              </thead>
              <tbody>
                {programList.map((prog) => (
                  <tr key={prog.id} className="mjp-row">
                    <td className="mjp-cell">
                      <div className="mjp-who">
                        <img className="mjp-pic mjp-pic-sm" src={getImageUrl(prog.imageIcon) || 'https://via.placeholder.com/44'} alt="" />
                        <div className="mjp-name">{prog.title}</div>
                      </div>
                    </td>
                    <td className="mjp-cell"><div>{prog.badge && <span className="mjp-pill">{prog.badge}</span>}</div></td>
                    <td className="mjp-cell"><div className="mjp-text mjp-text-2">{prog.desc}</div></td>
                    <td className="mjp-cell mjp-cell-act">
                      {(userRole === 'admin' || userRole === 'editor') && (
                        <button onClick={(e) => handleDropdownClick(e, prog.id, 'program')} className="mjp-action-btn" aria-label="Menu aksi">
                          <MoreHorizontal size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* KARTU (HP/tablet kecil) */}
        <div className="mjp-grid">
          {programList.map((prog) => (
            <article key={prog.id} className="mjp-tile">
              <div className="mjp-top">
                <img className="mjp-pic" src={getImageUrl(prog.imageIcon) || 'https://via.placeholder.com/56'} alt="" />
                <div className="mjp-main">
                  <h3 className="mjp-name">{prog.title}</h3>
                  {prog.badge && <span className="mjp-pill">{prog.badge}</span>}
                </div>
                {(userRole === 'admin' || userRole === 'editor') && (
                  <button onClick={(e) => handleDropdownClick(e, prog.id, 'program')} className="mjp-action-btn" aria-label="Menu aksi">
                    <MoreHorizontal size={18} />
                  </button>
                )}
              </div>
              {prog.desc && <p className="mjp-text">{prog.desc}</p>}
            </article>
          ))}
        </div>
        </>
      )}

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
                <ImageUploader
                  value={newJurusan.imageIcon}
                  onChange={handleJurusanImageChange}
                  aspect={1}
                  maxSizeMB={2}
                  previewLabel="PRATINJAU IKON"
                  urlPlaceholder="https://contoh.com/ikon.png"
                  editorTitle="Edit Ikon Jurusan"
                />
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
                <ImageUploader
                  value={newProgram.imageIcon}
                  onChange={handleProgramImageChange}
                  aspect={1}
                  maxSizeMB={2}
                  previewLabel="PRATINJAU IKON"
                  urlPlaceholder="https://contoh.com/foto.jpg"
                  editorTitle="Edit Ikon Program"
                />
              </div>
              
              <div className="modal-actions-modern" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
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