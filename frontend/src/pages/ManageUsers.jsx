import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserCheck, KeyRound, Trash2 } from 'lucide-react';
import '../App.css';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/users');
      
      const rolePriority = { admin: 1, editor: 2, viewer: 3 };
      const sortedUsers = response.data.data.sort((a, b) => {
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
      await axios.put(`http://localhost:5001/api/users/${userId}/role`, { role: newRole });
      fetchUsers(); 
      setMessage('Role pengguna berhasil diperbarui!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      alert('Gagal mengubah role pengguna.');
    }
  };

  const handleResetPassword = async (userId, username) => {
    const newPassword = prompt(`Masukkan password baru untuk user "${username}":`);
    if (!newPassword) return;

    try {
      await axios.put(`http://localhost:5001/api/users/${userId}/reset-password`, { password: newPassword });
      alert(`Password untuk ${username} berhasil direset!`);
    } catch (error) {
      alert('Gagal mereset password.');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Yakin ingin menghapus akun "${username}"?`)) return;

    try {
      await axios.delete(`http://localhost:5001/api/users/${userId}`);
      setUsers(users.filter(user => user.id !== userId));
      setMessage('Akun pengguna berhasil dihapus!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      alert('Gagal menghapus pengguna.');
    }
  };

  return (
    <div className="content-card">
      <div className="manage-users-header">
        <Users size={28} className="manage-header-icon" />
        <div>
          <h2 className="manage-users-title">Kelola Pengguna Sistem</h2>
          <p className="manage-users-subtitle">Atur hak akses, reset password, dan hapus akun terdaftar (Khusus Admin).</p>
        </div>
      </div>

      {message && <div className="manage-users-alert">{message}</div>}

      {loading ? (
        <p>Memuat data pengguna dari database...</p>
      ) : (
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Nama Lengkap</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role Saat Ini</th>
                <th className="table-center">Ubah Role & Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="user-name-cell">{user.fullName || 'Tidak ada nama'}</td>
                  <td>{user.username}</td>
                  <td className="user-email-cell">{user.email}</td>
                  <td>
                    <span className={`role-badge ${user.role === 'admin' ? 'badge-admin' : user.role === 'editor' ? 'badge-editor' : 'badge-viewer'}`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="table-center">
                    <div className="action-button-group">
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}