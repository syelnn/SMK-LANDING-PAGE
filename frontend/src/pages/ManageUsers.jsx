import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  Users, ShieldCheck, MoreHorizontal, Edit,
  KeyRound, Trash2, X, UserCog, Search, Camera, UserRound, Lock,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Mail, Eye, EyeOff, Check, CheckCircle2, AlertCircle, Loader2, ShieldAlert, Upload, Link2
} from 'lucide-react';
import { verifySession } from '../utils/auth';
import '../css/manageusers.css';
import '../App.css';

const API_URL = 'http://localhost:5001/api';

// Harus sama dengan "Email OTP Length" di Supabase Dashboard (backend juga mengirim nilainya).
const DEFAULT_OTP_LENGTH = 8;

const PW_RULES = [
  { key: 'lower', label: 'Huruf kecil', test: (p) => /[a-z]/.test(p) },
  { key: 'upper', label: 'Huruf besar', test: (p) => /[A-Z]/.test(p) },
  { key: 'number', label: 'Angka', test: (p) => /\d/.test(p) },
  { key: 'symbol', label: 'Simbol', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
  { key: 'length', label: '8+ karakter', test: (p) => p.length >= 8 },
];
const isPwStrong = (p) => PW_RULES.every((r) => r.test(p));

const maskEmail = (email = '') => {
  const [name, domain] = String(email).split('@');
  if (!name || !domain) return email || '-';
  const shown = name.slice(0, Math.min(2, name.length));
  return `${shown}${'*'.repeat(Math.max(2, name.length - shown.length))}@${domain}`;
};

const isValidUrl = (v) => /^https?:\/\/[^\s]+$/i.test(v);
const initialOf = (name) => (name || '?').trim().charAt(0).toUpperCase();
const CLOSED_DROPDOWN = { id: null, right: null, top: null, bottom: null };

function Pic({ src, name, size = 38 }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => { setBroken(false); }, [src]);
  const style = { width: size, height: size, flex: `0 0 ${size}px` };
  if (src && !broken) {
    return <img src={src} alt={name} className="mu-pic" style={style} referrerPolicy="no-referrer" onError={() => setBroken(true)} />;
  }
  return <div className="mu-pic-init" style={{ ...style, fontSize: Math.round(size * 0.4) }}>{initialOf(name)}</div>;
}

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null); // { type: 'success' | 'error', text }

  // --- FILTER & PENCARIAN ---
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // --- PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- DROPDOWN AKSI ---
  const [dropdownConfig, setDropdownConfig] = useState(CLOSED_DROPDOWN);

  // --- MODAL EDIT ---
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarMode, setAvatarMode] = useState('upload'); // upload | link
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const fileInputRef = useRef(null);

  // --- MODAL RESET PASSWORD (OTP EMAIL) ---
  const [resetUser, setResetUser] = useState(null);
  const [resetStep, setResetStep] = useState('send'); // send | verify | done
  const [otp, setOtp] = useState('');
  const [otpLength, setOtpLength] = useState(DEFAULT_OTP_LENGTH);
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const myId = Number(localStorage.getItem('userId') || 0);

  const notify = useCallback((type, text) => {
    setNotice({ type, text });
    setTimeout(() => setNotice((n) => (n && n.text === text ? null : n)), 3800);
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`);
      const rolePriority = { admin: 1, editor: 2, viewer: 3 };
      const sorted = (response.data.data || []).sort((a, b) => {
        const sa = (a.isActive ?? a.is_active) ? 1 : 0;
        const sb = (b.isActive ?? b.is_active) ? 1 : 0;
        if (sa !== sb) return sb - sa;
        return (rolePriority[a.role] || 99) - (rolePriority[b.role] || 99);
      });
      setUsers(sorted);

      // Cadangan: samakan foto/nama akun yang sedang login dengan data terbaru dari daftar ini
      const me = sorted.find((u) => u.id === myId);
      if (me) {
        const before = `${localStorage.getItem('avatar') || ''}|${localStorage.getItem('fullName') || ''}`;
        if (me.avatar) localStorage.setItem('avatar', me.avatar); else localStorage.removeItem('avatar');
        if (me.fullName) localStorage.setItem('fullName', me.fullName);
        const after = `${localStorage.getItem('avatar') || ''}|${localStorage.getItem('fullName') || ''}`;
        if (before !== after) window.dispatchEvent(new Event('auth:profile-updated'));
      }
    } catch (error) {
      console.error('Gagal mengambil data user:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // Tutup dropdown saat scroll
  useEffect(() => {
    const onScroll = () => { if (dropdownConfig.id !== null) setDropdownConfig(CLOSED_DROPDOWN); };
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [dropdownConfig.id]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, roleFilter, itemsPerPage]);

  // Cooldown kirim ulang OTP
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Kunci scroll halaman + tombol Esc selama ada modal
  const anyModalOpen = isEditOpen || !!resetUser;
  useEffect(() => {
    if (!anyModalOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (isEditOpen && !saving) closeEdit();
      else if (resetUser && !resetBusy) closeReset();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anyModalOpen, isEditOpen, saving, resetUser, resetBusy]);

  const q = searchTerm.toLowerCase();
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.username?.toLowerCase() || '').includes(q) ||
      (user.fullName?.toLowerCase() || user.full_name?.toLowerCase() || '').includes(q) ||
      (user.email?.toLowerCase() || '').includes(q);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  const goToPage = (page) => setCurrentPage(page);

  const handleDropdownClick = (e, userId) => {
    e.stopPropagation();
    if (dropdownConfig.id === userId) { setDropdownConfig(CLOSED_DROPDOWN); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < 150;
    setDropdownConfig({
      id: userId,
      right: Math.max(8, window.innerWidth - rect.right),
      top: openUpwards ? null : rect.bottom + 4,
      bottom: openUpwards ? window.innerHeight - rect.top + 4 : null,
    });
  };

  const getName = (u) => u.fullName || u.full_name || u.username;
  const isActiveUser = (u) => (u.isActive ?? u.is_active) === 1 || (u.isActive ?? u.is_active) === true;

  const formatDateTime = (value) => {
    if (!value) return 'Belum pernah login';
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Belum pernah login';
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  const lastSeenText = (u) => {
    const login = u.lastLogin ?? u.last_login;
    const created = u.createdAt ?? u.created_at;
    if (login) return formatDateTime(login);
    return created ? `Terdaftar: ${formatDateTime(created)}` : '-';
  };

  const RoleIcon = ({ role }) => (
    role === 'admin' ? <ShieldCheck size={14} /> : role === 'editor' ? <UserCog size={14} /> : <Users size={14} />
  );

  // ================= DELETE =================
  const handleDeleteUser = async (userId, username) => {
    setDropdownConfig(CLOSED_DROPDOWN);
    if (!window.confirm(`Yakin ingin menghapus secara permanen akun "${username}"?`)) return;
    try {
      await axios.delete(`${API_URL}/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      notify('success', 'Akun pengguna berhasil dihapus!');
    } catch (error) {
      notify('error', error.response?.data?.message || 'Gagal menghapus pengguna.');
    }
  };

  // ================= EDIT =================
  const closeEdit = () => {
    setIsEditOpen(false);
    setAvatarFile(null);
    setAvatarUrl('');
    setAvatarMode('upload');
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview('');
    setEditError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openEdit = (user) => {
    setDropdownConfig(CLOSED_DROPDOWN);
    setAvatarFile(null);
    setAvatarPreview('');
    setAvatarUrl('');
    setAvatarMode('upload');
    setEditError('');
    setEditData({
      id: user.id,
      fullName: user.fullName || user.full_name || '',
      username: user.username,
      email: user.email || '',
      avatar: user.avatar || '',
      role: user.role,
      isActive: isActiveUser(user) ? 1 : 0,
    });
    setIsEditOpen(true);
  };

  const handleAvatarPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setEditError('File harus berupa gambar.'); return; }
    if (file.size > 2 * 1024 * 1024) { setEditError('Ukuran gambar maksimal 2MB.'); return; }
    setEditError('');
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    const linkValue = avatarMode === 'link' ? avatarUrl.trim() : '';
    if (avatarMode === 'link' && linkValue && !isValidUrl(linkValue)) {
      setEditError('Link foto harus diawali http:// atau https://');
      return;
    }
    setSaving(true);
    try {
      // Email TIDAK dikirim: admin tidak boleh mengganti email pengguna (aturan keamanan backend).
      await axios.put(`${API_URL}/users/${editData.id}`, {
        fullName: editData.fullName,
        username: editData.username,
        ...(linkValue ? { avatarUrl: linkValue } : {}),
      });
      await axios.put(`${API_URL}/users/${editData.id}/role`, { role: editData.role });
      await axios.put(`${API_URL}/users/${editData.id}/status`, { is_active: editData.isActive });

      if (avatarMode === 'upload' && avatarFile) {
        const fd = new FormData();
        fd.append('avatar', avatarFile);
        await axios.post(`${API_URL}/users/${editData.id}/avatar`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      const editedId = editData.id;
      closeEdit();
      await fetchUsers();
      notify('success', 'Data pengguna berhasil diperbarui!');

      // Kalau yang diedit akun sendiri -> segarkan foto/nama di sidebar, topbar & navbar
      if (editedId === myId) verifySession();
    } catch (error) {
      setEditError(error.response?.data?.message || 'Gagal menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  };

  // ================= RESET PASSWORD (OTP EMAIL) =================
  const openReset = (user) => {
    setDropdownConfig(CLOSED_DROPDOWN);
    setResetUser({ id: user.id, username: user.username, name: getName(user), email: user.email || '', avatar: user.avatar || '' });
    setResetStep('send');
    setOtp(''); setNewPw(''); setConfirmPw('');
    setShowPw(false); setResetError(''); setCooldown(0);
    setOtpLength(DEFAULT_OTP_LENGTH);
  };

  const closeReset = () => {
    setResetUser(null);
    setResetError('');
    setOtp(''); setNewPw(''); setConfirmPw('');
  };

  const requestOtp = async () => {
    if (!resetUser || resetBusy || cooldown > 0) return;
    setResetBusy(true);
    setResetError('');
    try {
      const { data } = await axios.post(`${API_URL}/users/${resetUser.id}/reset-password/request`);
      setOtpLength(data?.data?.otpLength || DEFAULT_OTP_LENGTH);
      setCooldown(data?.data?.cooldownSeconds || 30);
      setOtp('');
      setResetStep('verify');
    } catch (error) {
      const retry = error.response?.data?.retryAfter;
      if (retry) setCooldown(retry);
      setResetError(error.response?.data?.message || 'Gagal mengirim kode verifikasi.');
    } finally {
      setResetBusy(false);
    }
  };

  const confirmReset = async (e) => {
    e.preventDefault();
    if (resetBusy) return;
    setResetError('');
    if (otp.length < otpLength) return setResetError(`Masukkan ${otpLength} digit kode OTP dari email pengguna.`);
    if (!isPwStrong(newPw)) return setResetError('Password belum memenuhi semua syarat keamanan.');
    if (newPw !== confirmPw) return setResetError('Konfirmasi password tidak cocok.');

    setResetBusy(true);
    try {
      await axios.post(`${API_URL}/users/${resetUser.id}/reset-password/confirm`, { otp, password: newPw });
      setNewPw(''); setConfirmPw(''); setOtp('');
      setResetStep('done');
    } catch (error) {
      setResetError(error.response?.data?.message || 'Gagal mereset password.');
    } finally {
      setResetBusy(false);
    }
  };

  const pwScore = PW_RULES.filter((r) => r.test(newPw)).length;
  const pwColor = pwScore <= 2 ? '#ef4444' : pwScore <= 4 ? '#f59e0b' : '#22c55e';

  const targetUser = dropdownConfig.id ? users.find((u) => u.id === dropdownConfig.id) : null;
  const editingSelf = editData && editData.id === myId;

  return (
    <div className="mu-wrapper">
      <div className="mu-header">
        <h2 className="mu-title">User List</h2>
        <p className="mu-subtitle">Manage your users, their roles, and status here.</p>
      </div>

      {notice && (
        <div className={`mu-alert ${notice.type === 'error' ? 'is-error' : ''}`} role="status">
          {notice.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <div>{notice.text}</div>
        </div>
      )}

      {/* TOOLBAR */}
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
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="mu-filter-select">
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
          {/* TABEL (desktop / tablet) */}
          <div className="mu-table-card">
            <table className="mu-table">
              <thead>
                <tr>
                  <th className="mu-th"></th>
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
                    <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--compreng-text-muted)', fontSize: '13px' }}>
                      Tidak ada pengguna yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((user) => (
                    <tr key={user.id} className="mu-tr">
                      <td className="mu-td"><Pic src={user.avatar} name={getName(user)} /></td>
                      <td className="mu-td" style={{ fontWeight: 600 }}>{user.username}</td>
                      <td className="mu-td">{user.fullName || user.full_name || '-'}</td>
                      <td className="mu-td">{user.email || '-'}</td>
                      <td className="mu-td" style={{ color: 'var(--compreng-text-secondary)' }}>{lastSeenText(user)}</td>
                      <td className="mu-td">
                        <span className={isActiveUser(user) ? 'mu-badge-active' : 'mu-badge-inactive'}>
                          {isActiveUser(user) ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="mu-td">
                        <div className="mu-role-icon"><RoleIcon role={user.role} /><b>{user.role || 'Viewer'}</b></div>
                      </td>
                      <td className="mu-td" style={{ textAlign: 'center' }}>
                        <button onClick={(e) => handleDropdownClick(e, user.id)} className="mu-action-btn" aria-label="Aksi pengguna">
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* DAFTAR KARTU (mobile) */}
          <div className="mu-ulist">
            {currentUsers.length === 0 ? (
              <div className="mu-uempty">Tidak ada pengguna yang cocok dengan pencarian.</div>
            ) : (
              currentUsers.map((user) => (
                <div key={user.id} className="mu-urow">
                  <div className="mu-urow-main">
                    <Pic src={user.avatar} name={getName(user)} size={44} />
                    <div className="mu-urow-text">
                      <div className="mu-uname">{getName(user)}</div>
                      <div className="mu-umail">@{user.username} · {user.email || '-'}</div>
                    </div>
                    <button onClick={(e) => handleDropdownClick(e, user.id)} className="mu-action-btn" aria-label="Aksi pengguna">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                  <div className="mu-urow-foot">
                    <span className={isActiveUser(user) ? 'mu-badge-active' : 'mu-badge-inactive'}>
                      {isActiveUser(user) ? 'Active' : 'Suspended'}
                    </span>
                    <div className="mu-role-icon"><RoleIcon role={user.role} /><b>{user.role || 'Viewer'}</b></div>
                    <div className="mu-urow-time">{lastSeenText(user)}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* DROPDOWN AKSI */}
          {targetUser && (
            <>
              <div onClick={() => setDropdownConfig(CLOSED_DROPDOWN)} style={{ position: 'fixed', inset: 0, zIndex: 40 }}></div>
              <div
                className="mu-dropdown-menu"
                style={{
                  position: 'fixed',
                  right: dropdownConfig.right,
                  ...(dropdownConfig.top !== null ? { top: dropdownConfig.top } : {}),
                  ...(dropdownConfig.bottom !== null ? { bottom: dropdownConfig.bottom } : {}),
                  zIndex: 50,
                }}
              >
                <button onClick={() => openEdit(targetUser)} className="mu-dropdown-item">
                  <Edit size={14} /> Edit Data
                </button>
                <button onClick={() => openReset(targetUser)} className="mu-dropdown-item">
                  <KeyRound size={14} /> Reset Password
                </button>
                <div style={{ margin: '4px 0', borderTop: '1px solid var(--compreng-border)' }}></div>
                <button onClick={() => handleDeleteUser(targetUser.id, targetUser.username)} className="mu-dropdown-item danger">
                  <Trash2 size={14} /> Delete Account
                </button>
              </div>
            </>
          )}

          {/* PAGINATION */}
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

      {/* ================= DIALOG EDIT USER ================= */}
      {isEditOpen && editData && (
        <div className="um-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) closeEdit(); }}>
          <form className="um-dialog" onSubmit={handleEditSubmit} role="dialog" aria-modal="true" aria-label="Edit pengguna">
            <div className="um-dialog-head">
              <div>
                <h3 className="um-title">Edit Pengguna</h3>
                <p className="um-sub">Perbarui profil, role, dan status akun.</p>
              </div>
              <button type="button" onClick={closeEdit} className="um-close" aria-label="Tutup" disabled={saving}><X size={18} /></button>
            </div>

            <div className="um-dialog-body">
              {editError && <div className="um-error"><AlertCircle size={16} /><div>{editError}</div></div>}

              {/* Profil + foto (SATU kontrol upload + opsi Link URL) */}
              <div className="um-profile">
                <div className="um-profile-top">
                  <button type="button" className="um-photo" onClick={() => { setAvatarMode('upload'); fileInputRef.current?.click(); }} aria-label="Pilih foto">
                    {(avatarMode === 'link' && isValidUrl(avatarUrl.trim()))
                      ? <img key={avatarUrl} src={avatarUrl.trim()} alt="Foto profil" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                      : (avatarPreview || editData.avatar)
                        ? <img src={avatarPreview || editData.avatar} alt="Foto profil" referrerPolicy="no-referrer" />
                        : <UserRound size={34} />}
                    <div className="um-photo-cam"><Camera size={15} /></div>
                  </button>
                  <div className="um-profile-text">
                    <div className="um-profile-name">{editData.fullName || editData.username}</div>
                    <div className="um-profile-user">@{editData.username}</div>
                  </div>
                </div>

                <div className="um-seg-row" role="group" aria-label="Sumber foto">
                  <button type="button" className={`um-seg ${avatarMode === 'upload' ? 'um-seg-on' : ''}`} onClick={() => setAvatarMode('upload')}>
                    <Upload size={15} /> Upload Foto
                  </button>
                  <button type="button" className={`um-seg ${avatarMode === 'link' ? 'um-seg-on' : ''}`} onClick={() => setAvatarMode('link')}>
                    <Link2 size={15} /> Link URL
                  </button>
                </div>

                {avatarMode === 'upload' ? (
                  <button type="button" className="um-drop" onClick={() => fileInputRef.current?.click()}>
                    <div className="um-drop-title">{avatarFile ? avatarFile.name : 'Pilih foto dari perangkat'}</div>
                    <div className="um-drop-hint">JPG / PNG / WEBP, maks 2MB</div>
                  </button>
                ) : (
                  <div className="um-field">
                    <input
                      type="url"
                      className="um-control"
                      placeholder="https://contoh.com/foto.jpg"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                    />
                    <div className="um-hint">Tempel link gambar langsung (http/https). Pratinjau tampil di lingkaran foto.</div>
                  </div>
                )}

                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarPick} className="um-file-off" tabIndex={-1} aria-hidden="true" />
              </div>

              <div className="um-grid">
                <div className="um-field">
                  <label>Nama Lengkap</label>
                  <input type="text" className="um-control" value={editData.fullName}
                    onChange={(e) => setEditData({ ...editData, fullName: e.target.value })} required />
                </div>
                <div className="um-field">
                  <label>Username</label>
                  <input type="text" className="um-control" value={editData.username}
                    onChange={(e) => setEditData({ ...editData, username: e.target.value })} required />
                </div>
              </div>

              <div className="um-field">
                <label>Email</label>
                <div className="um-lockwrap">
                  <input type="email" className="um-control" value={editData.email} readOnly disabled />
                  <Lock size={15} className="um-lock" />
                </div>
                <div className="um-hint">Email tidak dapat diubah oleh admin. Password diganti lewat kode OTP ke email ini.</div>
              </div>

              <div className="um-grid">
                <div className="um-field">
                  <label>Role</label>
                  <select className="um-control" value={editData.role} disabled={editingSelf}
                    onChange={(e) => setEditData({ ...editData, role: e.target.value })}>
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <div className="um-field">
                  <label>Status</label>
                  <select className="um-control" value={editData.isActive} disabled={editingSelf}
                    onChange={(e) => setEditData({ ...editData, isActive: Number(e.target.value) })}>
                    <option value={1}>Active</option>
                    <option value={0}>Suspended</option>
                  </select>
                </div>
              </div>
              {editingSelf && <div className="um-hint">Role dan status akun sendiri tidak dapat diubah.</div>}
            </div>

            <div className="um-dialog-foot">
              <button type="button" onClick={closeEdit} className="um-ghost" disabled={saving}>Batal</button>
              <button type="submit" className="um-go" disabled={saving}>
                {saving ? <><Loader2 size={16} className="um-spin" /> Menyimpan...</> : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= DIALOG RESET PASSWORD (OTP) ================= */}
      {resetUser && (
        <div className="um-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && !resetBusy) closeReset(); }}>
          <form className="um-dialog um-narrow" onSubmit={confirmReset} role="dialog" aria-modal="true" aria-label="Reset password">
            <div className="um-dialog-head">
              <div>
                <h3 className="um-title">Reset Password</h3>
                <p className="um-sub">Diverifikasi dengan kode OTP lewat email pengguna.</p>
              </div>
              <button type="button" onClick={closeReset} className="um-close" aria-label="Tutup" disabled={resetBusy}><X size={18} /></button>
            </div>

            <div className="um-dialog-body">
              <div className="um-who">
                <Pic src={resetUser.avatar} name={resetUser.name} size={42} />
                <div className="um-who-text">
                  <div className="um-profile-name">{resetUser.name}</div>
                  <div className="um-profile-user">{maskEmail(resetUser.email)}</div>
                </div>
              </div>

              {resetError && <div className="um-error"><AlertCircle size={16} /><div>{resetError}</div></div>}

              {resetStep === 'send' && (
                <>
                  <div className="um-callout">
                    <ShieldAlert size={18} />
                    <p>
                      Demi keamanan, admin tidak bisa mengganti password secara langsung. Kami akan mengirim
                      kode OTP ke email <b>{maskEmail(resetUser.email)}</b>. Minta pengguna membacakan kode tersebut,
                      lalu masukkan di langkah berikutnya.
                    </p>
                  </div>
                </>
              )}

              {resetStep === 'verify' && (
                <>
                  <div className="um-callout is-ok">
                    <Mail size={18} />
                    <p>Kode {otpLength} digit sudah dikirim ke <b>{maskEmail(resetUser.email)}</b>. Cek inbox / folder spam pengguna.</p>
                  </div>

                  <div className="um-field">
                    <label>Kode OTP</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      autoFocus
                      className="um-control um-otp"
                      placeholder={'•'.repeat(otpLength)}
                      maxLength={otpLength}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, otpLength))}
                    />
                    <button type="button" className="um-linkish" onClick={requestOtp} disabled={cooldown > 0 || resetBusy}>
                      {cooldown > 0 ? `Kirim ulang kode dalam ${cooldown}d` : 'Kirim ulang kode'}
                    </button>
                  </div>

                  <div className="um-field">
                    <label>Password Baru</label>
                    <div className="um-lockwrap">
                      <input type={showPw ? 'text' : 'password'} className="um-control" value={newPw}
                        onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" placeholder="Password baru" />
                      <button type="button" className="um-eye" onClick={() => setShowPw((s) => !s)} aria-label="Tampilkan password">
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className="um-meter"><div className="um-meter-fill" style={{ width: `${(pwScore / PW_RULES.length) * 100}%`, background: pwColor }} /></div>
                    <div className="um-rules">
                      {PW_RULES.map((r) => (
                        <div key={r.key} className={`um-rule ${r.test(newPw) ? 'ok' : ''}`}>
                          <Check size={12} /> {r.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="um-field">
                    <label>Konfirmasi Password</label>
                    <input type={showPw ? 'text' : 'password'} className="um-control" value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)} autoComplete="new-password" placeholder="Ulangi password baru" />
                  </div>
                </>
              )}

              {resetStep === 'done' && (
                <div className="um-done">
                  <div className="um-done-mark"><CheckCircle2 size={34} /></div>
                  <h4>Password berhasil direset</h4>
                  <p>{resetUser.name} sekarang bisa login dengan password baru.</p>
                </div>
              )}
            </div>

            <div className="um-dialog-foot">
              {resetStep === 'send' && (
                <>
                  <button type="button" onClick={closeReset} className="um-ghost" disabled={resetBusy}>Batal</button>
                  <button type="button" onClick={requestOtp} className="um-go" disabled={resetBusy || cooldown > 0}>
                    {resetBusy ? <><Loader2 size={16} className="um-spin" /> Mengirim...</> : <><Mail size={16} /> Kirim Kode OTP</>}
                  </button>
                </>
              )}
              {resetStep === 'verify' && (
                <>
                  <button type="button" onClick={closeReset} className="um-ghost" disabled={resetBusy}>Batal</button>
                  <button type="submit" className="um-go" disabled={resetBusy}>
                    {resetBusy ? <><Loader2 size={16} className="um-spin" /> Memproses...</> : 'Reset Password'}
                  </button>
                </>
              )}
              {resetStep === 'done' && (
                <button type="button" onClick={() => { closeReset(); notify('success', `Password ${resetUser.username} berhasil direset!`); }} className="um-go">
                  Selesai
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
