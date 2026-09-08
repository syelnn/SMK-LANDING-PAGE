import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, ShieldCheck, ShieldAlert, MoreHorizontal, Edit, 
  KeyRound, Trash2, X, UserCog, Clock, Search, ListFilter,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
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

  // --- STATE DROPDOWN & MODAL ---
  const [openDropdownId, setOpenDropdownId] = useState(null);
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

  // Reset ke halaman 1 setiap kali filter atau pencarian berubah
  useEffect(() => { setCurrentPage(1); }, [searchTerm, roleFilter, itemsPerPage]);

  // --- LOGIKA FILTER & PAGINATION ---
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

  // --- ACTIONS ---
  const handleResetPassword = async (userId, username) => {
    setOpenDropdownId(null);
    const newPassword = prompt(`Masukkan password baru untuk user "${username}":`);
    if (!newPassword) return;

    try {
      await axios.put(`${API_URL}/users/${userId}/reset-password`, { password: newPassword });
      alert(`Password untuk ${username} berhasil direset!`);
    } catch (error) { alert('Gagal mereset password.'); }
  };

  const handleDeleteUser = async (userId, username) => {
    setOpenDropdownId(null);
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
    setOpenDropdownId(null);
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

  // --- STYLES ---
  const styles = {
    wrapper: { width: '100%', maxWidth: '1200px', margin: '0 auto' },
    header: { marginBottom: '24px' },
    title: { fontSize: '24px', fontWeight: '800', color: 'var(--compreng-text)', margin: '0 0 6px 0' },
    subtitle: { fontSize: '14px', color: 'var(--compreng-text-secondary)', margin: 0 },
    alert: { backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#16a34a', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', fontWeight: '600', border: '1px solid rgba(34, 197, 94, 0.3)' },
    
    // Toolbar (Search & Filter)
    toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '16px' },
    toolbarGroup: { display: 'flex', alignItems: 'center', gap: '10px' },
    searchInputWrapper: { position: 'relative', width: '280px' },
    searchInput: { width: '100%', padding: '8px 12px 8px 36px', borderRadius: '6px', border: '1px solid var(--compreng-border)', background: 'var(--compreng-surface)', color: 'var(--compreng-text)', fontSize: '13px', outline: 'none' },
    searchIcon: { position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--compreng-text-muted)' },
    filterSelect: { padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--compreng-border)', borderStyle: 'dashed', background: 'var(--compreng-surface)', color: 'var(--compreng-text)', fontSize: '13px', outline: 'none', cursor: 'pointer' },

    // Table
    tableCard: { backgroundColor: 'var(--compreng-surface)', borderRadius: '8px', border: '1px solid var(--compreng-border)', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' },
    th: { padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--compreng-text-secondary)', borderBottom: '1px solid var(--compreng-border)', whiteSpace: 'nowrap' },
    td: { padding: '14px 16px', borderBottom: '1px solid var(--compreng-border)', verticalAlign: 'middle', color: 'var(--compreng-text)', fontSize: '13px' },
    
    // Pagination
    paginationWrapper: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '15px', padding: '0 5px' },
    pageSelectBox: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--compreng-text-secondary)' },
    pageSelect: { padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--compreng-border)', background: 'var(--compreng-surface)', color: 'var(--compreng-text)', fontSize: '13px', cursor: 'pointer', outline: 'none' },
    pageInfo: { display: 'flex', alignItems: 'center', gap: '20px', fontSize: '13px', color: 'var(--compreng-text)' },
    pageBtnGroup: { display: 'flex', alignItems: 'center', gap: '4px' },
    pageBtn: (disabled) => ({ padding: '6px', borderRadius: '6px', border: '1px solid var(--compreng-border)', background: 'var(--compreng-surface)', color: disabled ? 'var(--compreng-text-muted)' : 'var(--compreng-text)', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.5 : 1 }),

    // Badges & Icons
    badgeActive: { display: 'inline-flex', background: 'rgba(34, 197, 94, 0.15)', color: '#16a34a', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },
    badgeInactive: { display: 'inline-flex', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },
    roleIcon: { display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '500' },
    
    // Dropdown Action
    actionBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', color: 'var(--compreng-text-secondary)' },
    dropdownMenu: { position: 'absolute', right: '15px', top: '70%', background: 'var(--compreng-surface)', border: '1px solid var(--compreng-border)', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '160px', padding: '4px', zIndex: 50 },
    dropdownItem: { display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 10px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', borderRadius: '4px', fontSize: '12px', fontWeight: '500', color: 'var(--compreng-text)', transition: 'background 0.2s' },
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <h2 style={styles.title}>User List</h2>
        <p style={styles.subtitle}>Manage your users, their roles, and status here.</p>
      </div>

      {message && <div style={styles.alert}>{message}</div>}

      {/* TOOLBAR: SEARCH & FILTER */}
      <div style={styles.toolbar}>
        <div style={styles.searchInputWrapper}>
          <Search size={16} style={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Filter users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.toolbarGroup}>
          <div style={{ position: 'relative' }}>
            <select 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)} 
              style={styles.filterSelect}
            >
              <option value="all">All Role</option>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--compreng-text-muted)', fontSize: '14px' }}>Memuat data...</p>
      ) : (
        <>
          {/* TABEL DATA */}
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr style={{ background: 'var(--compreng-surface-soft)' }}>
                  <th style={styles.th}>Username</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Last Login</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Role</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}></th>
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
                    // Tambahkan baris ini kembali:
                    const registerTime = user.createdAt ?? user.created_at; 

                    return (
                      <tr key={user.id} style={{ transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--compreng-surface-soft)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                        
                        <td style={{ ...styles.td, fontWeight: '600' }}>{user.username}</td>
                        <td style={styles.td}>{user.fullName || user.full_name || '-'}</td>
                        <td style={styles.td}>{user.email || '-'}</td>
                        <td style={{ ...styles.td, color: 'var(--compreng-text-secondary)' }}>
                          {/* Sekarang registerTime sudah ada, jadi tidak akan error lagi */}
                          {loginTime ? formatDateTime(loginTime) : (registerTime ? `Terdaftar: ${formatDateTime(registerTime)}` : '-')}
                        </td>
                        
                        <td style={styles.td}>
                          <span style={(activeStatus === 1 || activeStatus === true) ? styles.badgeActive : styles.badgeInactive}>
                            {(activeStatus === 1 || activeStatus === true) ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        
                        <td style={styles.td}>
                          <div style={styles.roleIcon}>
                            {user.role === 'admin' ? <ShieldCheck size={14} color="var(--compreng-text-muted)" /> : 
                             user.role === 'editor' ? <UserCog size={14} color="var(--compreng-text-muted)" /> : 
                             <Users size={14} color="var(--compreng-text-muted)" />}
                            <span style={{ textTransform: 'capitalize' }}>{user.role || 'Viewer'}</span>
                          </div>
                        </td>
                        
                        <td style={{ ...styles.td, textAlign: 'center', position: 'relative' }}>
                          <button 
                            onClick={() => setOpenDropdownId(openDropdownId === user.id ? null : user.id)}
                            style={styles.actionBtn}
                            onMouseOver={(e) => e.currentTarget.style.background = 'var(--compreng-surface-soft)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          {openDropdownId === user.id && (
                            <>
                              <div onClick={() => setOpenDropdownId(null)} style={{ position: 'fixed', inset: 0, zIndex: 40 }}></div>
                              <div style={styles.dropdownMenu}>
                                <button onClick={() => openEditModal(user)} style={styles.dropdownItem} onMouseOver={(e) => e.currentTarget.style.background = 'var(--compreng-surface-soft)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                  <Edit size={14} /> Edit Data
                                </button>
                                <button onClick={() => handleResetPassword(user.id, user.username)} style={styles.dropdownItem} onMouseOver={(e) => e.currentTarget.style.background = 'var(--compreng-surface-soft)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                  <KeyRound size={14} /> Reset Password
                                </button>
                                <div style={{ margin: '2px 0', borderTop: '1px solid var(--compreng-border)' }}></div>
                                <button onClick={() => handleDeleteUser(user.id, user.username)} style={{ ...styles.dropdownItem, color: '#dc2626' }} onMouseOver={(e) => e.currentTarget.style.background = '#fef2f2'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                  <Trash2 size={14} color="#dc2626" /> Delete
                                </button>
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

          {/* FOOTER PAGINATION */}
          <div style={styles.paginationWrapper}>
            <div style={styles.pageSelectBox}>
              Rows per page
              <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} style={styles.pageSelect}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            
            <div style={styles.pageInfo}>
              <span>Page {currentPage} of {totalPages}</span>
              <div style={styles.pageBtnGroup}>
                <button onClick={() => goToPage(1)} disabled={currentPage === 1} style={styles.pageBtn(currentPage === 1)}><ChevronsLeft size={16} /></button>
                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} style={styles.pageBtn(currentPage === 1)}><ChevronLeft size={16} /></button>
                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} style={styles.pageBtn(currentPage === totalPages)}><ChevronRight size={16} /></button>
                <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} style={styles.pageBtn(currentPage === totalPages)}><ChevronsRight size={16} /></button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* MODAL EDIT DATA */}
      {isEditModalOpen && editData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--compreng-surface)', width: '100%', maxWidth: '420px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid var(--compreng-border)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--compreng-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--compreng-text)' }}>Edit User</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--compreng-text-muted)' }}>Update account role and status.</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--compreng-text-muted)', cursor: 'pointer', padding: '4px' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--compreng-text)' }}>Username</label>
                <input type="text" value={editData.username} disabled style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--compreng-border)', background: 'var(--compreng-surface-soft)', color: 'var(--compreng-text-muted)', fontSize: '13px', cursor: 'not-allowed' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--compreng-text)' }}>Role</label>
                <select value={editData.role} onChange={(e) => setEditData({...editData, role: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--compreng-border)', background: 'var(--compreng-bg)', color: 'var(--compreng-text)', fontSize: '13px', outline: 'none' }}>
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--compreng-text)' }}>Status</label>
                <select value={editData.isActive} onChange={(e) => setEditData({...editData, isActive: Number(e.target.value)})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--compreng-border)', background: 'var(--compreng-bg)', color: 'var(--compreng-text)', fontSize: '13px', outline: 'none' }}>
                  <option value={1}>Active</option>
                  <option value={0}>Suspended</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--compreng-border)', background: 'transparent', color: 'var(--compreng-text-secondary)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'var(--compreng-green)', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Save changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}