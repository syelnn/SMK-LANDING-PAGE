import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserCheck, KeyRound, Trash2, ShieldCheck, ShieldAlert } from 'lucide-react';
import '../App.css';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const API_URL = 'http://localhost:5001/api';

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`);
      const rolePriority = { admin: 1, editor: 2, viewer: 3 };
      const sortedUsers = (response.data.data || []).sort((a, b) => {
        return (rolePriority[a.role] || 99) - (rolePriority[b.role] || 99);
      });

      setUsers(sortedUsers);
      setLoading(false);
    } catch (error) {
      console.error('Gagal mengambil data user:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`${API_URL}/users/${userId}/role`, { role: newRole });
      fetchUsers(); 
      setMessage('Role pengguna berhasil diperbarui!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      alert('Gagal mengubah role pengguna.');
    }
  };

  // Fungsi interaktif untuk mengubah status aktif / nonaktif langsung
  const handleStatusChange = async (userId, currentStatus) => {
    // Jika nilainya 1 atau true, ubah jadi 0. Jika 0 atau false/null, ubah jadi 1.
    const newStatus = (currentStatus === 1 || currentStatus === true) ? 0 : 1;
    try {
      await axios.put(`${API_URL}/users/${userId}/status`, { is_active: newStatus });
      fetchUsers();
      setMessage('Status keaktifan berhasil diperbarui!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      alert('Gagal mengubah status akun.');
    }
  };

  const handleResetPassword = async (userId, username) => {
    const newPassword = prompt(`Masukkan password baru untuk user "${username}":`);
    if (!newPassword) return;

    try {
      await axios.put(`${API_URL}/users/${userId}/reset-password`, { password: newPassword });
      alert(`Password untuk ${username} berhasil direset!`);
    } catch (error) {
      alert('Gagal mereset password.');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Yakin ingin menghapus akun "${username}"?`)) return;

    try {
      await axios.delete(`${API_URL}/users/${userId}`);
      setUsers(users.filter(user => user.id !== userId));
      setMessage('Akun pengguna berhasil dihapus!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      alert('Gagal menghapus pengguna.');
    }
  };

  // Format Tanggal: Jika belum login, tampilkan tanggal buat akun (createdAt)
  const formatDateTime = (dateString, fallbackDate) => {
    const targetDate = dateString || fallbackDate;
    if (!targetDate) return 'Belum pernah login';
    const date = new Date(targetDate);
    if (isNaN(date.getTime())) return 'Belum pernah login';
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="content-card">
      <div className="manage-users-header">
        <Users size={28} className="manage-header-icon" />
        <div>
          <h2 className="manage-users-title">Kelola Pengguna Sistem</h2>
          <p className="manage-users-subtitle">Atur hak akses, status keaktifan sekolah, dan keamanan akun terdaftar.</p>
        </div>
      </div>

      {message && <div className="manage-users-alert">{message}</div>}

      {loading ? (
        <p>Memuat data pengguna dari database...</p>
      ) : (
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '13px' }}>
                <th style={{ padding: '15px' }}>Nama Lengkap</th>
                <th style={{ padding: '15px' }}>Username & Email</th>
                <th style={{ padding: '15px' }}>Status Keaktifan</th>
                <th style={{ padding: '15px' }}>Terakhir Login</th>
                <th style={{ padding: '15px' }}>Role Akun</th>
                <th className="table-center" style={{ padding: '15px' }}>Aksi & Pengaturan</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const activeStatus = user.isActive ?? user.is_active;
                const loginTime = user.lastLogin ?? user.last_login;
                const registerTime = user.createdAt ?? user.created_at;

                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '15px' }}>
                      <strong>{user.fullName || user.full_name || 'Tidak ada nama'}</strong>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>{user.username}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{user.email}</div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <button 
                        onClick={() => handleStatusChange(user.id, activeStatus)}
                        title="Klik untuk mengubah status keaktifan"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: (activeStatus === 1 || activeStatus === true) ? '#dcfce7' : '#fee2e2',
                          color: (activeStatus === 1 || activeStatus === true) ? '#166534' : '#991b1b',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          transition: '0.2s'
                        }}
                      >
                        {(activeStatus === 1 || activeStatus === true) ? (
                          <> <ShieldCheck size={14} /> Aktif di Sekolah </>
                        ) : (
                          <> <ShieldAlert size={14} /> Nonaktif </>
                        )}
                      </button>
                    </td>
                    <td style={{ padding: '15px', fontSize: '12px', color: '#475569' }}>
                      {/* Menampilkan waktu login, jika kosong menampilkan waktu pembuatan akun */}
                      {loginTime ? formatDateTime(loginTime) : `Dibuat: ${formatDateTime(registerTime)}`}
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span className={`role-badge ${user.role === 'admin' ? 'badge-admin' : user.role === 'editor' ? 'badge-editor' : 'badge-viewer'}`}>
                        {user.role ? user.role.toUpperCase() : 'VIEWER'}
                      </span>
                    </td>
                    <td style={{ padding: '15px' }} className="table-center">
                      <div className="action-button-group" style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                        <div className="select-wrapper-inline">
                          <UserCheck size={16} className="select-check-icon" />
                          <select 
                            value={user.role} 
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="role-select-dropdown"
                          >
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Pengunjung (Viewer)</option>
                          </select>
                        </div>

                        <button 
                          onClick={() => handleResetPassword(user.id, user.username)}
                          title="Reset Password"
                          className="btn-action-reset"
                        >
                          <KeyRound size={13} /> Reset
                        </button>

                        <button 
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          title="Hapus Akun"
                          className="btn-action-delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}