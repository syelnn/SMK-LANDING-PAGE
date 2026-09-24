// src/utils/auth.js
// Helper sesi login (dipakai Login, Register, tombol CTA testimoni, dan form testimoni)

import axios from 'axios';

const KEYS = ['token', 'role', 'userId', 'username', 'fullName', 'email', 'avatar'];
const LEGACY_KEYS = ['user', 'name', 'email', 'userEmail']; // sisa key lama

export const decodeToken = (token) => {
  if (!token || token.split('.').length !== 3) return null;
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      window.atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
};

// Mengembalikan null jika belum login / token rusak / token kadaluarsa
export const getSession = () => {
  const token = localStorage.getItem('token');
  const payload = decodeToken(token);
  if (!payload) return null;
  if (payload.exp && payload.exp * 1000 < Date.now()) return null;

  return {
    token,
    id: payload.id,
    username: payload.username || localStorage.getItem('username') || '',
    email: localStorage.getItem('email') || '',
    role: String(payload.role || localStorage.getItem('role') || '').toLowerCase(),
    name: localStorage.getItem('fullName') || payload.username || '',
    avatar: localStorage.getItem('avatar') || '',
  };
};

export const saveSession = ({ token, user = {} }) => {
  const payload = decodeToken(token) || {};
  KEYS.forEach((k) => localStorage.removeItem(k)); // buang sisa sesi akun sebelumnya

  localStorage.setItem('token', token);
  localStorage.setItem('role', user.role || payload.role || 'viewer');

  const id = user.id ?? payload.id;
  if (id != null) localStorage.setItem('userId', String(id));

  // Data ASLI dari server (bukan hasil rekayasa/tebakan) -> dipakai di semua tampilan profil
  const username = user.username || payload.username;
  if (username) localStorage.setItem('username', username);

  const fullName = user.fullName || user.full_name;
  if (fullName) localStorage.setItem('fullName', fullName);

  const email = user.email;
  if (email) localStorage.setItem('email', email);

  // Foto profil (URL publik dari storage). Sebelumnya TIDAK pernah disimpan -> sidebar,
  // topbar & navbar viewer selalu jatuh ke huruf inisial walau foto sudah terpasang.
  if (user.avatar) localStorage.setItem('avatar', user.avatar);
};

// Kabari semua komponen profil (sidebar, topbar, navbar viewer) supaya render ulang
export const notifyProfileUpdated = () => window.dispatchEvent(new Event('auth:profile-updated'));

export const clearSession = () => [...KEYS, ...LEGACY_KEYS].forEach((k) => localStorage.removeItem(k));

export const isStaff = (role) => ['admin', 'editor'].includes(String(role || '').toLowerCase());

// Tujuan default setelah login jika tidak ada halaman asal
export const homeFor = (role) => (isStaff(role) ? '/admin' : '/');


// =====================================================================
// KEAMANAN SESI
// Frontend TIDAK BISA memverifikasi tanda tangan JWT, jadi token selalu
// dicek ke server (GET /api/auth/me). Token palsu / diedit / secret diganti
// / akun dinonaktifkan  ->  server balas 401  ->  otomatis ditendang ke login.
// =====================================================================
const API_ORIGINS = ['http://localhost:5001', 'http://localhost:5002', 'http://localhost:5003'];
const PUBLIC_AUTH_PATHS = ['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password'];
export const AUTH_API = 'http://localhost:5001/api/auth';

const isApiUrl = (url) => API_ORIGINS.some((o) => String(url || '').startsWith(o));
const isPublicAuthUrl = (url) => PUBLIC_AUTH_PATHS.some((p) => String(url || '').includes(p));

// axios polos tanpa interceptor (supaya cek sesi tidak looping)
const rawAxios = axios.create();

// Cek token ke server. Hasil: { ok, user } atau { ok:false, reason: 'NO_SESSION'|'INVALID'|'NETWORK' }
export const verifySession = async () => {
  const session = getSession(); // cek format + expired lokal dulu
  if (!session) return { ok: false, reason: 'NO_SESSION' };

  try {
    const res = await rawAxios.get(`${AUTH_API}/me`, {
      headers: { Authorization: `Bearer ${session.token}` },
      timeout: 8000,
    });
    const user = res.data?.data;
    if (!user) return { ok: false, reason: 'INVALID' };

    // Sinkronkan dengan data terbaru dari server (role/foto/nama bisa berubah di DB)
    const before = ['role', 'username', 'fullName', 'email', 'avatar'].map((k) => localStorage.getItem(k) || '').join('|');
    localStorage.setItem('role', String(user.role || 'viewer').toLowerCase());
    localStorage.setItem('userId', String(user.id));
    if (user.username) localStorage.setItem('username', user.username);
    if (user.fullName) localStorage.setItem('fullName', user.fullName);
    if (user.email) localStorage.setItem('email', user.email);
    if (user.avatar) localStorage.setItem('avatar', user.avatar); else localStorage.removeItem('avatar');
    const after = ['role', 'username', 'fullName', 'email', 'avatar'].map((k) => localStorage.getItem(k) || '').join('|');
    if (before !== after) notifyProfileUpdated();

    return { ok: true, user: { ...user, role: String(user.role || 'viewer').toLowerCase() } };
  } catch (err) {
    const status = err.response?.status;
    if (status === 401 || status === 403) return { ok: false, reason: 'INVALID' };
    return { ok: false, reason: 'NETWORK' };
  }
};

let redirecting = false;
export const forceLogout = () => {
  const hadToken = !!localStorage.getItem('token');
  clearSession();
  if (redirecting) return;
  if (window.location.pathname.startsWith('/admin')) {
    redirecting = true;
    window.location.replace('/login?expired=1');
  } else if (hadToken) {
    window.dispatchEvent(new Event('auth:expired'));
  }
};

// Dipasang SEKALI di main.jsx:
//  - otomatis kirim "Authorization: Bearer <token>" ke semua API kita (axios & fetch)
//  - respons 401 dari API  ->  sesi dihapus & user ditendang ke halaman login
let interceptorsInstalled = false;
export const installAuthInterceptors = () => {
  if (interceptorsInstalled) return;
  interceptorsInstalled = true;

  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && isApiUrl(config.url) && !config.headers?.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  axios.interceptors.response.use(
    (res) => res,
    (err) => {
      const url = err.config?.url;
      if (err.response?.status === 401 && isApiUrl(url) && !isPublicAuthUrl(url)) forceLogout();
      return Promise.reject(err);
    }
  );

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url;
    if (!isApiUrl(url)) return nativeFetch(input, init);

    const headers = new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined));
    const token = localStorage.getItem('token');
    if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);

    const res = await nativeFetch(input, { ...init, headers });
    if (res.status === 401 && !isPublicAuthUrl(url)) forceLogout();
    return res;
  };
};