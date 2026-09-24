import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit, Image as ImageIcon, X, MoreHorizontal, Search } from 'lucide-react';
import ImageUploader from '../components/ImageUploader';
import '../css/manageindustrypartners.css';
import '../App.css';

export default function ManageIndustryPartners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const userRole = localStorage.getItem('role');

  const API_URL = 'http://localhost:5002/api';

  // State Modal Form
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [imageType, setImageType] = useState('url');
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({ name: '', logo_url: '', is_active: true });

  // State Dropdown Action & Search
  const [dropdownConfig, setDropdownConfig] = useState({ id: null, right: null, top: null, bottom: null });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/industry-partners`);
      setPartners(res.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Gagal memuat data mitra industri:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (dropdownConfig.id !== null) {
        setDropdownConfig({ id: null, right: null, top: null, bottom: null });
      }
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [dropdownConfig.id]);

  // Callback dari <ImageUploader>: file asli/hasil edit disimpan di state (dikirim ke backend),
  // URL-nya dipakai untuk pratinjau.
  const handleLogoChange = ({ file, url }) => {
    setSelectedFile(file);
    setImageType(file ? 'file' : 'url');
    setFormData((prev) => ({ ...prev, logo_url: url }));
  };

  const handleDropdownClick = (e, partnerId) => {
    e.stopPropagation();
    if (dropdownConfig.id === partnerId) {
      setDropdownConfig({ id: null, right: null, top: null, bottom: null });
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const dropdownHeight = 90;

    const spaceBelow = windowHeight - rect.bottom;
    const openUpwards = spaceBelow < dropdownHeight;

    setDropdownConfig({
      id: partnerId,
      right: window.innerWidth - rect.right,
      top: openUpwards ? null : rect.bottom + 4,
      bottom: openUpwards ? windowHeight - rect.top + 4 : null
    });
  };

  const openAdd = () => {
    setEditId(null);
    setFormData({ name: '', logo_url: '', is_active: true });
    setImageType('url');
    setSelectedFile(null);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setDropdownConfig({ id: null, right: null, top: null, bottom: null });
    setEditId(item.id);
    setFormData({ name: item.name, logo_url: item.logoUrl ?? item.logo_url ?? '', is_active: item.isActive ?? item.is_active ?? true });
    setImageType((item.logoUrl ?? item.logo_url ?? '').length > 200 ? 'file' : 'url');
    setSelectedFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // File asli dikirim via FormData -> backend upload ke Cloudinary,
      // hanya URL hasilnya yang disimpan ke database (bukan base64).
      const fd = new FormData();
      fd.append('name', formData.name || '');
      fd.append('is_active', formData.is_active);
      fd.append('logo_url', imageType === 'file' && selectedFile ? selectedFile : (formData.logo_url || ''));

      if (editId) {
        await axios.put(`${API_URL}/industry-partners/${editId}`, fd);
      } else {
        await axios.post(`${API_URL}/industry-partners`, fd);
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      alert(`Gagal menyimpan data: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDelete = async (id, name) => {
    setDropdownConfig({ id: null, right: null, top: null, bottom: null });
    if (!window.confirm(`Yakin ingin menghapus mitra industri "${name}"?`)) return;
    try {
      await axios.delete(`${API_URL}/industry-partners/${id}`);
      fetchData();
    } catch (error) {
      alert('Gagal menghapus data');
    }
  };

  const filteredPartners = partners.filter((p) =>
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div style={{ padding: '30px', color: 'var(--compreng-text-muted)', textAlign: 'center' }}>Memuat data mitra industri...</div>;

  return (
    <div className="ip-wrapper">

      <div className="ip-header-box">
        <div>
          <h2 className="ip-title">Mitra Industri</h2>
          <p className="ip-subtitle">Kelola logo perusahaan/industri yang tampil di atas Footer website.</p>
        </div>
        {(userRole === 'admin' || userRole === 'editor') && (
          <button className="btn-modern-primary" onClick={openAdd}>
            <Plus size={16} /> Tambah Mitra
          </button>
        )}
      </div>

      <div className="ip-toolbar">
        <div className="ip-search-wrapper">
          <Search size={16} className="ip-search-icon" />
          <input
            type="text"
            placeholder="Cari nama mitra industri..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ip-search-input"
          />
        </div>
      </div>

      <div className="ip-table-card">
        <table className="ip-table">
          <thead>
            <tr>
              <th className="ip-th">Logo</th>
              <th className="ip-th">Nama Mitra</th>
              <th className="ip-th">Status Tampil</th>
              <th className="ip-th" style={{ textAlign: 'center' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredPartners.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--compreng-text-muted)', fontSize: '13px' }}>
                  {searchTerm ? 'Tidak ditemukan data yang sesuai kriteria pencarian.' : 'Belum ada data mitra industri.'}
                </td>
              </tr>
            ) : (
              filteredPartners.map((item) => {
                const logoUrl = item.logoUrl ?? item.logo_url;
                const isActive = item.isActive ?? item.is_active;
                return (
                  <tr key={item.id} className="ip-tr">
                    <td className="ip-td">
                      {logoUrl ? (
                        <div className="ip-logo-box">
                          <img src={logoUrl} alt={item.name} />
                        </div>
                      ) : (
                        <div className="ip-logo-box ip-logo-empty">
                          <ImageIcon size={18} />
                        </div>
                      )}
                    </td>

                    <td className="ip-td" style={{ fontWeight: '600' }}>{item.name}</td>

                    <td className="ip-td">
                      <span className={isActive ? 'ip-badge-active' : 'ip-badge-inactive'}>
                        {isActive ? 'Ditampilkan' : 'Disembunyikan'}
                      </span>
                    </td>

                    <td className="ip-td" style={{ textAlign: 'center', position: 'relative' }}>
                      {(userRole === 'admin' || userRole === 'editor') && (
                        <button
                          onClick={(e) => handleDropdownClick(e, item.id)}
                          className="ip-action-btn"
                          style={{ margin: '0 auto' }}
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {dropdownConfig.id && (
        <>
          <div
            onClick={() => setDropdownConfig({ id: null, right: null, top: null, bottom: null })}
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          ></div>

          <div
            className="ip-dropdown-menu"
            style={{
              position: 'fixed',
              right: dropdownConfig.right,
              ...(dropdownConfig.top !== null ? { top: dropdownConfig.top } : {}),
              ...(dropdownConfig.bottom !== null ? { bottom: dropdownConfig.bottom } : {}),
              zIndex: 50
            }}
          >
            {(() => {
              const targetItem = partners.find(p => p.id === dropdownConfig.id);
              if (!targetItem) return null;
              return (
                <>
                  <button onClick={() => openEdit(targetItem)} className="ip-dropdown-item">
                    <Edit size={14} color="var(--compreng-text-secondary)" /> Edit Data
                  </button>
                  <div style={{ margin: '2px 0', borderTop: '1px solid var(--compreng-border)' }}></div>
                  <button onClick={() => handleDelete(targetItem.id, targetItem.name)} className="ip-dropdown-item danger">
                    <Trash2 size={14} color="currentColor" /> Delete
                  </button>
                </>
              );
            })()}
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content modern-modal">
            <div className="modal-header-modern">
              <h3>{editId ? 'Edit Mitra Industri' : 'Tambah Mitra Industri Baru'}</h3>
              <button onClick={() => setShowModal(false)} className="btn-close-modal"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="form-modern-layout">
              <div className="form-group-modern">
                <label>NAMA PERUSAHAAN / INDUSTRI</label>
                <input type="text" placeholder="Contoh: PT Telkom Indonesia" className="input-modern" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>

              <div className="form-group-modern">
                <label>STATUS TAMPIL</label>
                <select className="input-modern" value={formData.is_active ? 1 : 0} onChange={e => setFormData({ ...formData, is_active: e.target.value === '1' })}>
                  <option value={1}>Ditampilkan</option>
                  <option value={0}>Disembunyikan</option>
                </select>
              </div>

              <div className="form-group-modern upload-section">
                <label>LOGO MITRA</label>
                <ImageUploader
                  value={formData.logo_url}
                  onChange={handleLogoChange}
                  aspect={3 / 2}
                  maxSizeMB={2}
                  previewLabel="PRATINJAU LOGO"
                  urlPlaceholder="https://contoh.com/logo.png"
                  editorTitle="Edit Logo Mitra"
                  uploadText="Pilih atau tarik logo ke sini"
                />
              </div>

              <div className="modal-actions-modern" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-modern-secondary">Batal</button>
                <button type="submit" className="btn-modern-primary">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
