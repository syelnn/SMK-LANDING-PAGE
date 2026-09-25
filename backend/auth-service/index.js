require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { supabaseAuth, supabaseAdmin, requireSupabaseAdmin, createStatelessAuthClient } = require('./lib/supabaseClients');
const { uploadAvatarBuffer, uploadAvatarFromUrl, deleteAvatarByUrl, isOurStorageUrl } = require('./services/avatarStorage');
const { uploadAvatarSafe } = require('./middleware/avatarUpload');

const { verifyToken, checkRole } = require('./middleware/authMiddleware')(prisma);
const onlyAdmin = [verifyToken, checkRole(['admin'])];

const app = express();
const PORT = process.env.PORT || 5001;

const ROLES = ['admin', 'editor', 'viewer'];
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RULE = /^[a-zA-Z0-9_.-]{3,50}$/;
// Panjang OTP HARUS sama dengan Supabase Dashboard > Auth > Email > "Email OTP Length"
const OTP_LENGTH = Number(process.env.OTP_LENGTH || 6);
const RESET_OTP_COOLDOWN_MS = 30 * 1000;

// Field aman untuk dikirim ke client (TIDAK PERNAH kirim hash password)
const SAFE_USER = {
  id: true, username: true, email: true, fullName: true, avatar: true, role: true,
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

// Batasi permintaan kirim OTP reset password (cegah spam email ke user)
const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak permintaan kode. Coba lagi dalam 15 menit.' },
});
// Batasi pendaftaran per IP (semua permintaan dihitung, bukan cuma yang gagal), karena
// register sekarang bisa memicu unggah foto ke Cloudinary / unduh gambar dari link.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak pendaftaran dari perangkat ini. Coba lagi nanti.' },
});
const resetCooldown = new Map(); // targetUserId -> timestamp permintaan terakhir

const maskEmail = (email = '') => {
  const [name, domain] = String(email).split('@');
  if (!name || !domain) return '';
  const shown = name.slice(0, Math.min(2, name.length));
  return `${shown}${'*'.repeat(Math.max(2, name.length - shown.length))}@${domain}`;
};

const signToken = (user) =>
  jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: JWT_EXPIRES_IN,
  });

const toClientUser = (u) => ({
  id: u.id, username: u.username, fullName: u.fullName, email: u.email, avatar: u.avatar, role: u.role,
});

const parseId = (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) { res.status(400).json({ success: false, message: 'ID tidak valid' }); return null; }
  return id;
};

// Password acak yang TIDAK PERNAH dipakai untuk login (login selalu lewat Supabase Auth).
// Kolom `password` dipertahankan di skema lama supaya tidak perlu migrasi besar,
// tapi nilainya sekarang hanya placeholder yang tidak bisa ditebak siapapun.
const randomPlaceholderHash = async () => bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);

// Menerjemahkan pesan error Supabase Auth ke Bahasa Indonesia yang jelas untuk user
const mapSupabaseAuthError = (message = '') => {
  const m = message.toLowerCase();
  if (m.includes('already registered') || m.includes('already exists')) return 'Email ini sudah terdaftar. Silakan login atau gunakan "Lupa Password".';
  if (m.includes('password') && (m.includes('weak') || m.includes('at least') || m.includes('should be'))) return 'Password terlalu lemah. Gunakan minimal 8 karakter dengan huruf besar, huruf kecil, angka & simbol.';
  if (m.includes('invalid login credentials')) return 'Username atau password salah!';
  if (m.includes('email not confirmed')) return 'Email belum diverifikasi. Silakan cek inbox/spam email kamu.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.';
  if (m.includes('token') && m.includes('expired')) return 'Kode OTP sudah kedaluwarsa. Minta kode baru.';
  if (m.includes('token') && (m.includes('invalid') || m.includes('not found'))) return 'Kode OTP salah atau sudah tidak berlaku.';
  return message || 'Terjadi kesalahan pada layanan autentikasi.';
};

app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'Auth Service siap melayani!' });
});

// ===== CEK KETERSEDIAAN USERNAME (dipakai form register, realtime) =====
app.get('/api/auth/check-username/:username', async (req, res) => {
  const username = String(req.params.username || '').trim();
  if (!USERNAME_RULE.test(username)) {
    return res.json({ success: true, available: false, message: 'Username 3-50 karakter (huruf, angka, _ . -).' });
  }
  const existing = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  res.json({ success: true, available: !existing });
});

// ===== LOGIN =====
// Password TIDAK dicek lokal lagi -> selalu diverifikasi lewat Supabase Auth
// (supabase.auth.signInWithPassword), supaya "Confirm email" & "Forgot password OTP"
// dari Supabase benar-benar berlaku. JWT internal tetap dipakai setelahnya supaya
// content-service & core-service tidak perlu diubah sama sekali.
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');
    if (!username || !password) return res.status(400).json({ message: 'Username dan password wajib diisi!' });

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ message: 'Username atau password salah!' });

    if (user.isActive === 0 || user.isActive === false) {
      return res.status(403).json({ message: 'Akun Anda telah dinonaktifkan. Silakan hubungi Administrator.' });
    }

    const { data, error } = await supabaseAuth.auth.signInWithPassword({ email: user.email, password });

    if (error) {
      const msg = String(error.message || '');
      if (msg.toLowerCase().includes('email not confirmed')) {
        return res.status(403).json({
          message: 'Email kamu belum diverifikasi. Silakan cek inbox/folder spam untuk link verifikasi.',
          code: 'EMAIL_NOT_CONFIRMED',
          email: user.email,
        });
      }
      return res.status(401).json({ message: 'Username atau password salah!' });
    }

    if (data?.user && !data.user.email_confirmed_at) {
      return res.status(403).json({
        message: 'Email kamu belum diverifikasi. Silakan cek inbox/folder spam untuk link verifikasi.',
        code: 'EMAIL_NOT_CONFIRMED',
        email: user.email,
      });
    }

    // Sinkronkan supabaseId kalau kosong (jaga-jaga akun lama)
    const updates = { lastLogin: new Date() };
    if (!user.supabaseId && data?.user?.id) updates.supabaseId = data.user.id;
    const updatedUser = await prisma.user.update({ where: { id: user.id }, data: updates });

    res.json({
      status: 'success',
      message: 'Login berhasil!',
      data: { token: signToken(updatedUser), user: toClientUser(updatedUser) },
    });
  } catch (error) {
    console.error('Error saat login:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
});

// Kirim ulang email verifikasi (dipakai saat login gagal karena EMAIL_NOT_CONFIRMED)
app.post('/api/auth/resend-verification', authLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!EMAIL_RULE.test(email)) return res.status(400).json({ success: false, message: 'Format email tidak valid!' });

    const { error } = await supabaseAuth.auth.resend({ type: 'signup', email });
    if (error) return res.status(400).json({ success: false, message: mapSupabaseAuthError(error.message) });

    res.json({ success: true, message: 'Email verifikasi baru sudah dikirim. Silakan cek inbox/spam.' });
  } catch (error) {
    console.error('Error resend verification:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// ===== CEK SESI (dipakai frontend untuk memvalidasi token ke server) =====
app.get('/api/auth/me', verifyToken, (req, res) => {
  res.json({ success: true, data: toClientUser(req.user) });
});

// ===== REGISTER (profil lokal) =====
// PENTING: pendaftaran sesungguhnya (supabase.auth.signUp + kirim email verifikasi)
// dilakukan LANGSUNG dari frontend (React) ke Supabase, karena verifikasi email
// hanya berjalan benar kalau signUp dipanggil dari context yang sama dengan yang
// akan melakukan konfirmasi (client-side). Endpoint ini dipanggil SETELAH
// supabase.auth.signUp() berhasil, untuk membuat baris profil di database kita
// sendiri (dipakai ManageUsers, role, status aktif, dsb).
app.post('/api/auth/register', registerLimiter, authLimiter, uploadAvatarSafe('avatar'), async (req, res) => {
  try {
    const fullName = String(req.body.full_name || '').trim();
    const username = String(req.body.username || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const supabaseId = String(req.body.supabase_id || '').trim();

    if (!fullName || !username || !email) return res.status(400).json({ message: 'Semua data wajib diisi!' });
    if (!USERNAME_RULE.test(username)) return res.status(400).json({ message: 'Username 3-50 karakter (huruf, angka, _ . -).' });
    if (!EMAIL_RULE.test(email)) return res.status(400).json({ message: 'Format email tidak valid!' });
    if (!/^[0-9a-f-]{36}$/i.test(supabaseId)) return res.status(400).json({ message: 'Data pendaftaran tidak valid. Ulangi proses registrasi.' });

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }, { supabaseId }] },
      select: { username: true },
    });
    if (existing) return res.status(400).json({ message: 'Username atau email sudah terdaftar!' });

    // Foto profil (opsional): file (multipart field "avatar") ATAU link (field "avatar_url").
    // Link divalidasi dulu sebelum profil dibuat.
    const avatarLink = String(req.body.avatar_url || '').trim();
    if (!req.file && avatarLink && !/^https?:\/\/[^\s]+$/i.test(avatarLink)) {
      return res.status(400).json({ message: 'Link foto tidak valid (harus diawali http:// atau https://).' });
    }

    let newUser = await prisma.user.create({
      data: {
        fullName, username, email, supabaseId,
        password: await randomPlaceholderHash(), // tidak pernah dipakai untuk login
        role: 'viewer', // register publik SELALU viewer
        isActive: 1,
      },
    });

    // Unggah foto SETELAH profil berhasil dibuat -> tidak ada file yatim di Cloudinary kalau
    // pembuatan profil gagal. Kegagalan foto TIDAK membatalkan pendaftaran (cukup diberi peringatan).
    let avatarWarning = null;
    if (req.file || avatarLink) {
      try {
        const avatarUrl = req.file
          ? await uploadAvatarBuffer(req.file.buffer, req.file.mimetype)
          : await uploadAvatarFromUrl(avatarLink);
        newUser = await prisma.user.update({ where: { id: newUser.id }, data: { avatar: avatarUrl } });
      } catch (avatarErr) {
        console.warn('Foto profil saat register gagal disimpan:', avatarErr.message);
        avatarWarning = avatarErr.message || 'gagal memproses foto';
      }
    }

    res.json({
      status: 'success',
      message: 'Profil berhasil dibuat! Silakan cek email untuk verifikasi sebelum login.',
      ...(avatarWarning ? { avatarWarning } : {}),
      data: { user: toClientUser(newUser) },
    });
  } catch (error) {
    console.error('Error saat register:', error);
    if (error.code === 'P2002') return res.status(400).json({ message: 'Username atau email sudah terdaftar!' });
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
});

// ===== LUPA PASSWORD =====
// Alur OTP (kirim kode, verifikasi kode, ganti password) SEPENUHNYA ditangani oleh
// Supabase Auth langsung dari frontend (resetPasswordForEmail -> verifyOtp -> updateUser),
// karena proses ini butuh session sementara dari Supabase yang tidak praktis dilewatkan
// bolak-balik ke backend. Endpoint di bawah ini murni untuk menyinkronkan status akun kita.
app.post('/api/auth/sync-after-reset', authLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!EMAIL_RULE.test(email)) return res.status(400).json({ success: false, message: 'Format email tidak valid!' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ success: false, message: 'Akun tidak ditemukan.' });

    res.json({ success: true, message: 'Password berhasil diperbarui. Silakan login dengan password baru.', data: { username: user.username } });
  } catch (error) {
    console.error('Error sync-after-reset:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// ===== PROFIL SENDIRI (avatar + data diri) — dipakai halaman manapun yang butuh profile =====
app.put('/api/auth/profile', verifyToken, async (req, res) => {
  try {
    const fullName = req.body.full_name !== undefined ? String(req.body.full_name).trim() : undefined;
    const data = {};
    if (fullName !== undefined) {
      if (!fullName) return res.status(400).json({ success: false, message: 'Nama lengkap tidak boleh kosong.' });
      data.fullName = fullName;
    }
    if (Object.keys(data).length === 0) return res.status(400).json({ success: false, message: 'Tidak ada data untuk diperbarui.' });

    const updated = await prisma.user.update({ where: { id: req.user.id }, data, select: SAFE_USER });
    res.json({ success: true, message: 'Profil berhasil diperbarui', data: updated });
  } catch (error) {
    console.error('Gagal update profil:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui profil' });
  }
});

app.post('/api/auth/profile/avatar', verifyToken, uploadAvatarSafe('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'File avatar wajib diupload.' });

    const current = await prisma.user.findUnique({ where: { id: req.user.id }, select: { avatar: true } });
    const url = await uploadAvatarBuffer(req.file.buffer, req.file.mimetype);
    const updated = await prisma.user.update({ where: { id: req.user.id }, data: { avatar: url }, select: SAFE_USER });

    if (current?.avatar) deleteAvatarByUrl(current.avatar).catch(() => {});
    res.json({ success: true, message: 'Avatar berhasil diperbarui', data: updated });
  } catch (error) {
    console.error('Gagal upload avatar:', error);
    res.status(400).json({ success: false, message: error.message || 'Gagal upload avatar' });
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

// Edit data pengguna (nama, username, email) oleh admin
app.put('/api/users/:id', ...onlyAdmin, async (req, res) => {
  let uploadedNew = null; // URL Cloudinary baru (untuk dibersihkan kalau simpan ke DB gagal)
  try {
    const id = parseId(req, res); if (id === null) return;
    const fullName = req.body.fullName !== undefined ? String(req.body.fullName).trim() : undefined;
    const username = req.body.username !== undefined ? String(req.body.username).trim() : undefined;
    const email = req.body.email !== undefined ? String(req.body.email).trim().toLowerCase() : undefined;
    const avatarUrl = req.body.avatarUrl !== undefined ? String(req.body.avatarUrl).trim() : undefined;

    const data = {};
    if (avatarUrl !== undefined) {
      // Opsi "Link URL": hanya http(s), tanpa spasi, muat di kolom avatar (255 karakter)
      if (!/^https?:\/\/[^\s]+$/i.test(avatarUrl) || avatarUrl.length > 255) {
        return res.status(400).json({ success: false, message: 'Link foto tidak valid (harus diawali http:// atau https://, maks 255 karakter).' });
      }
    }
    if (fullName !== undefined) {
      if (!fullName) return res.status(400).json({ success: false, message: 'Nama lengkap tidak boleh kosong.' });
      data.fullName = fullName;
    }
    if (username !== undefined) {
      if (!USERNAME_RULE.test(username)) return res.status(400).json({ success: false, message: 'Username 3-50 karakter (huruf, angka, _ . -).' });
      data.username = username;
    }
    if (Object.keys(data).length === 0 && email === undefined && avatarUrl === undefined) return res.status(400).json({ success: false, message: 'Tidak ada data untuk diperbarui.' });

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });

    // KEAMANAN: email adalah identitas login + tujuan kode OTP reset password.
    // Admin TIDAK boleh mengganti email pengguna lain (kalau bisa, admin bisa membajak
    // akun lewat "reset password"). Pengguna mengubah emailnya sendiri lewat Supabase.
    if (email !== undefined && email !== String(target.email || '').toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Email pengguna tidak dapat diubah oleh admin.' });
    }
    // Opsi "Link URL": backend mengunduh gambarnya lalu menyimpannya ke Cloudinary.
    // Database hanya menyimpan URL Cloudinary milik kita.
    if (avatarUrl !== undefined && avatarUrl !== target.avatar && !(isOurStorageUrl(avatarUrl) && avatarUrl === target.avatar)) {
      try {
        uploadedNew = isOurStorageUrl(avatarUrl) ? avatarUrl : await uploadAvatarFromUrl(avatarUrl);
      } catch (e) {
        return res.status(400).json({ success: false, message: e.message || 'Gagal mengunduh gambar dari link.' });
      }
      data.avatar = uploadedNew;
    }
    if (Object.keys(data).length === 0) return res.json({ success: true, message: 'Tidak ada perubahan data.', data: await prisma.user.findUnique({ where: { id }, select: SAFE_USER }) });

    const updated = await prisma.user.update({ where: { id }, data, select: SAFE_USER });
    uploadedNew = null; // sudah tersimpan, jangan dibersihkan
    // Foto lama dihapus dari Cloudinary (link luar/bukan milik kita otomatis diabaikan)
    if (data.avatar && target.avatar && target.avatar !== data.avatar) deleteAvatarByUrl(target.avatar).catch(() => {});
    res.json({ success: true, message: 'Data pengguna berhasil diperbarui', data: updated });
  } catch (error) {
    if (uploadedNew) deleteAvatarByUrl(uploadedNew).catch(() => {});
    if (error.code === 'P2025') return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    if (error.code === 'P2002') return res.status(400).json({ success: false, message: 'Username atau email sudah dipakai pengguna lain.' });
    console.error('Gagal update data user:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui data pengguna' });
  }
});

// Upload/ganti avatar user lain (oleh admin)
app.post('/api/users/:id/avatar', ...onlyAdmin, uploadAvatarSafe('avatar'), async (req, res) => {
  try {
    const id = parseId(req, res); if (id === null) return;
    if (!req.file) return res.status(400).json({ success: false, message: 'File avatar wajib diupload.' });

    const target = await prisma.user.findUnique({ where: { id }, select: { avatar: true } });
    if (!target) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });

    const url = await uploadAvatarBuffer(req.file.buffer, req.file.mimetype);
    const updated = await prisma.user.update({ where: { id }, data: { avatar: url }, select: SAFE_USER });

    if (target.avatar) deleteAvatarByUrl(target.avatar).catch(() => {});
    res.json({ success: true, message: 'Avatar pengguna berhasil diperbarui', data: updated });
  } catch (error) {
    console.error('Gagal upload avatar user:', error);
    res.status(400).json({ success: false, message: error.message || 'Gagal upload avatar' });
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

// ===== RESET PASSWORD USER LAIN (ADMIN) — WAJIB KODE OTP EMAIL =====
// Admin TIDAK bisa langsung mengganti password. Alurnya sama seperti "Lupa Password":
//   1) /request  -> Supabase mengirim kode OTP ke EMAIL MILIK USER TARGET (bukan admin)
//   2) /confirm  -> admin memasukkan kode yang dibacakan user + password baru.
//                   Kode diverifikasi ke Supabase; kalau valid baru password diganti.
// Tanpa akses ke inbox user, admin tidak bisa mereset password siapa pun.
app.post('/api/users/:id/reset-password/request', ...onlyAdmin, otpRequestLimiter, async (req, res) => {
  try {
    const id = parseId(req, res); if (id === null) return;
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    if (!target.supabaseId) return res.status(400).json({ success: false, message: 'Akun ini belum terhubung ke Supabase Auth. Minta pengguna mendaftar ulang.' });
    if (!requireSupabaseAdmin(res)) return;

    const last = resetCooldown.get(id) || 0;
    const wait = Math.ceil((last + RESET_OTP_COOLDOWN_MS - Date.now()) / 1000);
    if (wait > 0) return res.status(429).json({ success: false, message: `Tunggu ${wait} detik sebelum meminta kode lagi.`, retryAfter: wait });

    const { error } = await supabaseAuth.auth.resetPasswordForEmail(target.email);
    if (error) return res.status(400).json({ success: false, message: mapSupabaseAuthError(error.message) });

    resetCooldown.set(id, Date.now());
    res.json({
      success: true,
      message: `Kode verifikasi dikirim ke ${maskEmail(target.email)}.`,
      data: { maskedEmail: maskEmail(target.email), cooldownSeconds: RESET_OTP_COOLDOWN_MS / 1000, otpLength: OTP_LENGTH },
    });
  } catch (error) {
    console.error('Error request OTP reset password:', error);
    res.status(500).json({ success: false, message: 'Gagal mengirim kode verifikasi' });
  }
});

app.post('/api/users/:id/reset-password/confirm', ...onlyAdmin, authLimiter, async (req, res) => {
  try {
    const id = parseId(req, res); if (id === null) return;
    const otp = String(req.body.otp || '').replace(/\s+/g, '');
    const password = String(req.body.password || '');
    if (!/^\d{4,10}$/.test(otp)) return res.status(400).json({ success: false, message: 'Kode OTP harus berupa angka.' });
    if (!PASSWORD_RULE.test(password)) return res.status(400).json({ success: false, message: 'Password minimal 8 karakter, wajib huruf besar, huruf kecil, angka & simbol!' });

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    if (!target.supabaseId) return res.status(400).json({ success: false, message: 'Akun ini belum terhubung ke Supabase Auth.' });

    const admin = requireSupabaseAdmin(res); if (!admin) return;

    // 1) Verifikasi OTP yang dikirim ke email user target
    const verifier = createStatelessAuthClient();
    const { data, error } = await verifier.auth.verifyOtp({ email: target.email, token: otp, type: 'recovery' });
    if (error) return res.status(400).json({ success: false, message: mapSupabaseAuthError(error.message) });
    if (!data?.user || data.user.id !== target.supabaseId) {
      return res.status(400).json({ success: false, message: 'Kode tidak cocok dengan akun ini.' });
    }

    // 2) Kode valid -> baru password diganti
    const { error: updateError } = await admin.auth.admin.updateUserById(target.supabaseId, { password });
    if (updateError) return res.status(400).json({ success: false, message: mapSupabaseAuthError(updateError.message) });

    // Cabut sesi pemulihan sementara (best-effort)
    if (data.session?.access_token) admin.auth.admin.signOut(data.session.access_token, 'global').catch(() => {});
    resetCooldown.delete(id);

    console.log(`[AUDIT] admin#${req.user.id} mereset password user#${id} lewat OTP email`);
    res.json({ success: true, message: 'Password pengguna berhasil direset!' });
  } catch (error) {
    console.error('Error konfirmasi reset password:', error);
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

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });

    await prisma.user.delete({ where: { id } });

    // Hapus juga akun Supabase Auth-nya (best-effort, tidak boleh gagalkan penghapusan lokal)
    if (target.supabaseId && supabaseAdmin) {
      supabaseAdmin.auth.admin.deleteUser(target.supabaseId).catch((e) => console.warn('Gagal hapus user Supabase:', e.message));
    }
    if (target.avatar) deleteAvatarByUrl(target.avatar).catch(() => {});

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