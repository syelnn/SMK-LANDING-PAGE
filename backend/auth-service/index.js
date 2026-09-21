require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { verifyToken, checkRole } = require('./middleware/authMiddleware')(prisma);
const onlyAdmin = [verifyToken, checkRole(['admin'])];

const app = express();
const PORT = process.env.PORT || 5001;

const ROLES = ['admin', 'editor', 'viewer'];
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 12); // anti timing-attack saat user tidak ada

// Field aman untuk dikirim ke client (TIDAK PERNAH kirim hash password)
const SAFE_USER = {
  id: true, username: true, email: true, fullName: true, role: true,
  isActive: true, lastLogin: true, createdAt: true,
};

// ===== Middleware global =====
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map((s) => s.trim()),
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '100kb' }));

// Batasi percobaan brute-force (hanya percobaan GAGAL yang dihitung)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' },
});

const signToken = (user) =>
  jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: JWT_EXPIRES_IN,
  });

const toClientUser = (u) => ({ id: u.id, username: u.username, fullName: u.fullName, email: u.email, role: u.role });

const parseId = (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) { res.status(400).json({ success: false, message: 'ID tidak valid' }); return null; }
  return id;
};

app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'Auth Service siap melayani!' });
});

// ===== LOGIN =====
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');
    if (!username || !password) return res.status(400).json({ message: 'Username dan password wajib diisi!' });

    const user = await prisma.user.findUnique({ where: { username } });

    // Selalu jalankan bcrypt supaya waktu respon sama (tidak bisa menebak username)
    const isPasswordValid = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
    if (!user || !isPasswordValid) {
      return res.status(401).json({ message: 'Username atau password salah!' });
    }

    if (user.isActive === 0 || user.isActive === false) {
      return res.status(403).json({ message: 'Akun Anda telah dinonaktifkan. Silakan hubungi Administrator.' });
    }

    prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } }).catch(() => {});

    res.json({
      status: 'success',
      message: 'Login berhasil!',
      data: { token: signToken(user), user: toClientUser(user) },
    });
  } catch (error) {
    console.error('Error saat login:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
});

// ===== CEK SESI (dipakai frontend untuk memvalidasi token ke server) =====
app.get('/api/auth/me', verifyToken, (req, res) => {
  res.json({ success: true, data: toClientUser(req.user) });
});

// ===== REGISTER =====
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const fullName = String(req.body.full_name || '').trim();
    const username = String(req.body.username || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!fullName || !username || !email) return res.status(400).json({ message: 'Semua data wajib diisi!' });
    if (!/^[a-zA-Z0-9_.-]{3,50}$/.test(username)) return res.status(400).json({ message: 'Username 3-50 karakter (huruf, angka, _ . -).' });
    if (!EMAIL_RULE.test(email)) return res.status(400).json({ message: 'Format email tidak valid!' });
    if (!PASSWORD_RULE.test(password)) return res.status(400).json({ message: 'Password minimal 8 karakter, wajib huruf besar, angka & simbol!' });

    const existing = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] }, select: { username: true } });
    if (existing) return res.status(400).json({ message: 'Username atau email sudah terdaftar!' });

    const newUser = await prisma.user.create({
      data: {
        fullName, username, email,
        password: await bcrypt.hash(password, 12),
        role: 'viewer', // register publik SELALU viewer
        isActive: 1,
      },
    });

    res.json({
      status: 'success',
      message: 'Registrasi dan Login berhasil!',
      data: { token: signToken(newUser), user: toClientUser(newUser) },
    });
  } catch (error) {
    console.error('Error saat register:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
});

// ===== LUPA PASSWORD =====
// Wajib username + email cocok. Akun admin/editor TIDAK boleh reset mandiri (harus lewat Admin).
// Catatan: untuk keamanan penuh, ganti dengan OTP/link reset via email.
app.post('/api/auth/forgot-password', authLimiter, async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const newPassword = String(req.body.newPassword || '');

    if (!PASSWORD_RULE.test(newPassword)) {
      return res.status(400).json({ success: false, message: 'Password minimal 8 karakter, wajib huruf besar, angka & simbol!' });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    const ok = user && user.email.toLowerCase() === email && String(user.role).toLowerCase() === 'viewer';
    if (!ok) {
      return res.status(400).json({ success: false, message: 'Data tidak cocok, atau akun ini harus direset oleh Administrator.' });
    }

    await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(newPassword, 12) } });
    res.json({ success: true, message: 'Password berhasil diubah! Silakan login kembali.' });
  } catch (error) {
    console.error('Error saat lupa password:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// ===== MANAJEMEN USER (KHUSUS ADMIN) =====
app.get('/api/users', ...onlyAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({ select: SAFE_USER, orderBy: { id: 'asc' } });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Gagal memuat users:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat data pengguna' });
  }
});

app.put('/api/users/:id/role', ...onlyAdmin, async (req, res) => {
  try {
    const id = parseId(req, res); if (id === null) return;
    const role = String(req.body.role || '').toLowerCase();
    if (!ROLES.includes(role)) return res.status(400).json({ success: false, message: 'Role tidak valid' });
    if (id === req.user.id && role !== req.user.role) return res.status(400).json({ success: false, message: 'Tidak dapat mengubah role akun sendiri' });

    const data = await prisma.user.update({ where: { id }, data: { role }, select: SAFE_USER });
    res.json({ success: true, message: 'Role berhasil diubah', data });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    res.status(500).json({ success: false, message: 'Gagal mengubah role' });
  }
});

app.put('/api/users/:id/reset-password', ...onlyAdmin, async (req, res) => {
  try {
    const id = parseId(req, res); if (id === null) return;
    const password = String(req.body.password || '');
    if (!PASSWORD_RULE.test(password)) return res.status(400).json({ success: false, message: 'Password minimal 8 karakter, wajib huruf besar, angka & simbol!' });

    await prisma.user.update({ where: { id }, data: { password: await bcrypt.hash(password, 12) } });
    res.json({ success: true, message: 'Password pengguna berhasil direset!' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    console.error('Error saat reset password:', error);
    res.status(500).json({ success: false, message: 'Gagal mereset password' });
  }
});

app.put('/api/users/:id/status', ...onlyAdmin, async (req, res) => {
  try {
    const id = parseId(req, res); if (id === null) return;
    const isActive = Number(req.body.is_active) === 1 ? 1 : 0;
    if (id === req.user.id && isActive === 0) return res.status(400).json({ success: false, message: 'Tidak dapat menonaktifkan akun sendiri' });

    const data = await prisma.user.update({ where: { id }, data: { isActive }, select: SAFE_USER });
    res.json({ success: true, message: 'Status keaktifan pengguna diperbarui', data });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    console.error('Gagal update status:', error);
    res.status(500).json({ success: false, message: 'Gagal mengubah status pengguna' });
  }
});

app.delete('/api/users/:id', ...onlyAdmin, async (req, res) => {
  try {
    const id = parseId(req, res); if (id === null) return;
    if (id === req.user.id) return res.status(400).json({ success: false, message: 'Tidak dapat menghapus akun sendiri' });

    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'Pengguna berhasil dihapus' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    console.error('Error saat menghapus user:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus pengguna' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Auth Service berjalan di http://localhost:${PORT}`);
});