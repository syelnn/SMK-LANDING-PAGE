import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, ShieldCheck, ShieldAlert, MoreHorizontal, Edit, 
  KeyRound, Trash2, X, UserCog, Search, ListFilter,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import '../css/manageusers.css';
import '../App.css';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // --- STATE FILTER & PENCARIAN ---
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- STATE DROPDOWN SMART POSITIONING ---
  // Menggunakan top atau bottom secara dinamis
  const [dropdownConfig, setDropdownConfig] = useState({ id: null, right: null, top: null, bottom: null });

  // --- STATE MODAL ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const API_URL = 'http://localhost:5001/api';

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`);
      const rolePriority = { admin: 1, editor: 2, viewer: 3 };

      const sortedUsers = (response.data.data || []).sort((a, b) => {
        const statusA = (a.isActive ?? a.is_active) ? 1 : 0;
        const statusB = (b.isActive ?? b.is_active) ? 1 : 0;
        if (statusA !== statusB) return statusB - statusA; 
        return (rolePriority[a.role] || 99) - (rolePriority[b.role] || 99);
      });

      setUsers(sortedUsers);
      setLoading(false);
    } catch (error) {
      console.error('Gagal mengambil data user:', error);
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // Tutup dropdown saat user melakukan scroll agar menu tidak melayang tertinggal
  useEffect(() => {
    const handleScroll = () => {
      if (dropdownConfig.id !== null) {
        setDropdownConfig({ id: null, right: null, top: null, bottom: null });
      }
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [dropdownConfig.id]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, roleFilter, itemsPerPage]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.fullName?.toLowerCase() || user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  const goToPage = (page) => setCurrentPage(page);

  // --- SMART DROPDOWN LOGIC ---
  const handleDropdownClick = (e, userId) => {
    e.stopPropagation();
    if (dropdownConfig.id === userId) {
      setDropdownConfig({ id: null, right: null, top: null, bottom: null });
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const dropdownHeight = 130; // Estimasi tinggi menu dropdown (3 tombol)
    
    // Cek sisa ruang di bawah tombol. Jika terlalu sempit, buka ke atas.
    const spaceBelow = windowHeight - rect.bottom;
    const openUpwards = spaceBelow < dropdownHeight;

    setDropdownConfig({
      id: userId,
      right: window.innerWidth - rect.right,
      top: openUpwards ? null : rect.bottom + 4,
      bottom: openUpwards ? windowHeight - rect.top + 4 : null
    });
  };

  // --- ACTIONS ---
  const handleResetPassword = async (userId, username) => {
    setDropdownConfig({ id: null, right: null, top: null, bottom: null });
    const newPassword = prompt(`Masukkan password baru untuk user "${username}":`);
    if (!newPassword) return;

    try {
      await axios.put(`${API_URL}/users/${userId}/reset-password`, { password: newPassword });
      alert(`Password untuk ${username} berhasil direset!`);
    } catch (error) { alert('Gagal mereset password.'); }
  };

  const handleDeleteUser = async (userId, username) => {
    setDropdownConfig({ id: null, right: null, top: null, bottom: null });
    if (!window.confirm(`Yakin ingin menghapus secara permanen akun "${username}"?`)) return;

    try {
      await axios.delete(`${API_URL}/users/${userId}`);
      setUsers(users.filter(user => user.id !== userId));
      setMessage('Akun pengguna berhasil dihapus!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) { alert('Gagal menghapus pengguna.'); }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/users/${editData.id}/role`, { role: editData.role });
      await axios.put(`${API_URL}/users/${editData.id}/status`, { is_active: editData.isActive });
      setIsEditModalOpen(false); fetchUsers(); 
      setMessage('Data pengguna berhasil diperbarui!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) { alert('Gagal menyimpan perubahan.'); }
  };

  const openEditModal = (user) => {
    setDropdownConfig({ id: null, right: null, top: null, bottom: null });
    setEditData({
      id: user.id, fullName: user.fullName || user.full_name, username: user.username,
      role: user.role, isActive: (user.isActive ?? user.is_active) ? 1 : 0
    });
    setIsEditModalOpen(true);
  };

  const formatDateTime = (dateString, fallbackDate) => {
    const targetDate = dateString || fallbackDate;
    if (!targetDate) return 'Belum pernah login';
    const date = new Date(targetDate);
    if (isNaN(date.getTime())) return 'Belum pernah login';
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="mu-wrapper">
      <div className="mu-header">
        <h2 className="mu-title">User List</h2>
        <p className="mu-subtitle">Manage your users, their roles, and status here.</p>
      </div>

      {message && <div className="mu-alert">{message}</div>}

      {/* TOOLBAR: SEARCH & FILTER */}
      <div className="mu-toolbar">
        <div className="mu-search-wrapper">
          <Search size={16} className="mu-search-icon" />
          <input 
            type="text" 
            placeholder="Filter users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mu-search-input"
          />
        </div>
        <div className="mu-toolbar-group">
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)} 
            className="mu-filter-select"
          >
            <option value="all">All Role</option>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--compreng-text-muted)', fontSize: '14px' }}>Memuat data...</p>
      ) : (
        <>
          {/* TABEL DATA */}
          <div className="mu-table-card">
            <table className="mu-table">
              <thead>
                <tr>
                  <th className="mu-th">Username</th>
                  <th className="mu-th">Name</th>
                  <th className="mu-th">Email</th>
                  <th className="mu-th">Last Login</th>
                  <th className="mu-th">Status</th>
                  <th className="mu-th">Role</th>
                  <th className="mu-th" style={{ textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--compreng-text-muted)', fontSize: '13px' }}>
                      Tidak ada pengguna yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((user) => {
                    const activeStatus = user.isActive ?? user.is_active;
                    const loginTime = user.lastLogin ?? user.last_login;
                    const registerTime = user.createdAt ?? user.created_at; 

                    return (
                      <tr key={user.id} className="mu-tr">
                        <td className="mu-td" style={{ fontWeight: '600' }}>{user.username}</td>
                        <td className="mu-td">{user.fullName || user.full_name || '-'}</td>
                        <td className="mu-td">{user.email || '-'}</td>
                        <td className="mu-td" style={{ color: 'var(--compreng-text-secondary)' }}>
                          {loginTime ? formatDateTime(loginTime) : (registerTime ? `Terdaftar: ${formatDateTime(registerTime)}` : '-')}
                        </td>
                        <td className="mu-td">
                          <span className={(activeStatus === 1 || activeStatus === true) ? 'mu-badge-active' : 'mu-badge-inactive'}>
                            {(activeStatus === 1 || activeStatus === true) ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="mu-td">
                          <div className="mu-role-icon">
                            {user.role === 'admin' ? <ShieldCheck size={14} color="var(--compreng-text-muted)" /> : 
                             user.role === 'editor' ? <UserCog size={14} color="var(--compreng-text-muted)" /> : 
                             <Users size={14} color="var(--compreng-text-muted)" />}
                            <span>{user.role || 'Viewer'}</span>
                          </div>
                        </td>
                        <td className="mu-td" style={{ textAlign: 'center', position: 'relative' }}>
                          <button 
                            onClick={(e) => handleDropdownClick(e, user.id)}
                            className="mu-action-btn"
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

          {/* DROPDOWN MENU BERADA DI LUAR FLOW TABEL */}
          {dropdownConfig.id && (
            <>
              {/* Overlay untuk menutup saat diklik di luar */}
              <div 
                onClick={() => setDropdownConfig({ id: null, right: null, top: null, bottom: null })} 
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
              ></div>
              
              <div 
                className="mu-dropdown-menu" 
                style={{ 
                  position: 'fixed', 
                  right: dropdownConfig.right, 
                  ...(dropdownConfig.top !== null ? { top: dropdownConfig.top } : {}),
                  ...(dropdownConfig.bottom !== null ? { bottom: dropdownConfig.bottom } : {}),
                  zIndex: 50 
                }}
              >
                {(() => {
                  const targetUser = users.find(u => u.id === dropdownConfig.id);
                  return (
                    <>
                      <button onClick={() => openEditModal(targetUser)} className="mu-dropdown-item">
                        <Edit size={14} color="var(--compreng-text-secondary)" /> Edit Data
                      </button>
                      <button onClick={() => handleResetPassword(targetUser.id, targetUser.username)} className="mu-dropdown-item">
                        <KeyRound size={14} color="var(--compreng-text-secondary)" /> Reset Password
                      </button>
                      <div style={{ margin: '4px 0', borderTop: '1px solid var(--compreng-border)' }}></div>
                      <button onClick={() => handleDeleteUser(targetUser.id, targetUser.username)} className="mu-dropdown-item danger">
                        <Trash2 size={14} color="currentColor" /> Delete Account
                      </button>
                    </>
                  );
                })()}
              </div>
            </>
          )}

          {/* FOOTER PAGINATION */}
          <div className="mu-pagination-wrapper">
            <div className="mu-page-select-box">
              Rows per page
              <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="mu-page-select">
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            
            <div className="mu-page-info">
              <span>Page {currentPage} of {totalPages}</span>
              <div className="mu-page-btn-group">
                <button onClick={() => goToPage(1)} disabled={currentPage === 1} className="mu-page-btn"><ChevronsLeft size={16} /></button>
                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="mu-page-btn"><ChevronLeft size={16} /></button>
                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="mu-page-btn"><ChevronRight size={16} /></button>
                <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} className="mu-page-btn"><ChevronsRight size={16} /></button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* MODAL EDIT DATA */}
      {isEditModalOpen && editData && (
        <div className="mu-modal-overlay">
          <div className="mu-modal-content">
            <div className="mu-modal-header">
              <div>
                <h3 className="mu-modal-title">Edit User</h3>
                <p className="mu-modal-subtitle">Update account role and status.</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="mu-modal-close"><X size={18} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="mu-form">
              <div className="mu-form-group">
                <label className="mu-form-label">Username</label>
                <input type="text" value={editData.username} disabled className="mu-form-input" />
              </div>
              <div className="mu-form-group">
                <label className="mu-form-label">Role</label>
                <select value={editData.role} onChange={(e) => setEditData({...editData, role: e.target.value})} className="mu-form-select">
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="mu-form-group">
                <label className="mu-form-label">Status</label>
                <select value={editData.isActive} onChange={(e) => setEditData({...editData, isActive: Number(e.target.value)})} className="mu-form-select">
                  <option value={1}>Active</option>
                  <option value={0}>Suspended</option>
                </select>
              </div>
              <div className="mu-modal-actions">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-modern-secondary">Cancel</button>
                <button type="submit" className="btn-modern-primary">Save changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}