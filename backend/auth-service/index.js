require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Cukup panggil PrismaClient standar
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
// Route dasar pengecekan server
app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'Auth Service siap melayani!' });
});

// Route Login Utama
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Cari user di database berdasarkan username
    const user = await prisma.user.findUnique({
      where: { username: username }
    });

    // Jika user tidak ditemukan
    if (!user) {
      return res.status(404).json({ message: 'Username tidak ditemukan!' });
    }

    // 2. CEK STATUS KEAKTIFAN AKUN (Tambah baris ini)
    if (user.isActive === 0 || user.isActive === false) {
      return res.status(403).json({ message: 'Akun Anda telah dinonaktifkan. Silakan hubungi Administrator.' });
    }

    // 3. Cek kecocokan password (Bcrypt Node.js vs Bcrypt PHP)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    // Jika password salah
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Password yang dimasukkan salah!' });
    }

    // 4. Buat JWT Token (Berisi ID, Username, dan Role)
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // 5. Kirim respons sukses beserta token ke Frontend
    res.json({
      status: 'success',
      message: 'Login berhasil!',
      data: {
        token: token,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('Error saat login:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
});
// Route Register Utama dengan Auto-Login
app.post('/api/auth/register', async (req, res) => {
  try {
    const { full_name, username, email, password } = req.body;

    // 1. Cek apakah username sudah dipakai
    const existingUser = await prisma.user.findUnique({ where: { username } });
    
    if (existingUser) return res.status(400).json({ message: 'Username sudah terdaftar!' });

    // 2. Hash password sebelum disimpan
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. Simpan ke database (Gunakan camelCase sesuai schema.prisma)
    const newUser = await prisma.user.create({
      data: {
        fullName: full_name,
        username: username,
        email: email,
        password: hashedPassword,
        role: 'viewer', 
        isActive: 1          
      }
    });

    // 4. AUTO LOGIN: Langsung buatkan Token JWT
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // 5. Kirim balasan sukses + token
    res.json({
      status: 'success',
      message: 'Registrasi dan Login berhasil!',
      data: { token, user: { role: newUser.role } }
    });

  } catch (error) {
    console.error('Error saat register:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
});

// API untuk mengambil semua daftar pengguna (Khusus Admin)
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,    // <--- WAJIB ADA AGAR STATUS MUNCUL
        lastLogin: true,   // <--- WAJIB ADA AGAR TERAKHIR LOGIN MUNCUL
        createdAt: true    // <--- Untuk tanggal pembuatan user jika lastLogin kosong
      }
    });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Gagal memuat users:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat data pengguna' });
  }
});

// API untuk mengubah role pengguna
app.put('/api/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role: role }
    });

    res.json({ success: true, message: 'Role berhasil diubah', data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengubah role' });
  }
});

// API untuk Admin mereset password pengguna
app.put('/api/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    // Enkripsi password baru sebelum disimpan ke database
    const hashedPassword = await bcrypt.hash(password, 12);

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { password: hashedPassword }
    });

    res.json({ success: true, message: 'Password pengguna berhasil direset!', data: updatedUser });
  } catch (error) {
    console.error('Error saat reset password:', error);
    res.status(500).json({ success: false, message: 'Gagal mereset password' });
  }
});

// API untuk Lupa Password (Langsung Ganti Tanpa OTP)
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { username, newPassword } = req.body;

    // 1. Cek apakah username terdaftar di database
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Username tidak ditemukan di database!' });
    }

    // 2. Enkripsi password baru
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 3. Update password user tersebut
    await prisma.user.update({
      where: { username },
      data: { password: hashedPassword }
    });

    res.json({ success: true, message: 'Password berhasil diubah! Silakan login kembali.' });
  } catch (error) {
    console.error('Error saat lupa password:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// API untuk menghapus pengguna berdasarkan ID
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });
    res.json({ success: true, message: 'Pengguna berhasil dihapus' });
  } catch (error) {
    console.error('Error saat menghapus user:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus pengguna' });
  }
});

// Endpoint untuk mengubah status keaktifan user (Aktif/Nonaktif)
app.put('/api/users/:id/status', async (req, res) => {
  try {
    const { is_active } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: Number(is_active) } // Ubah jadi 1 (aktif) atau 0 (nonaktif)
    });
    res.json({ success: true, message: 'Status keaktifan pengguna diperbarui', data: updatedUser });
  } catch (error) {
    console.error("Gagal update status:", error);
    res.status(500).json({ success: false, message: 'Gagal mengubah status pengguna' });
  }
});




// Menyalakan server
app.listen(PORT, () => {
  console.log(`🚀 Auth Service berjalan di http://localhost:${PORT}`);
});