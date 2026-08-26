require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. Panggil library tambahan untuk koneksi database
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

// 2. Setup koneksi Pool PostgreSQL
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// 3. Masukkan adapter ke dalam PrismaClient
const prisma = new PrismaClient({ adapter });
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

    // 2. Cek kecocokan password (Bcrypt Node.js vs Bcrypt PHP)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    // Jika password salah
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Password yang dimasukkan salah!' });
    }

    // 3. Buat JWT Token (Berisi ID, Username, dan Role)
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '1d' } // Token otomatis hangus dalam 1 hari
    );

    // 4. Kirim respons sukses beserta token ke Frontend
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

    // 3. Simpan ke database (berdasarkan kolom di tabel users kamu)
    const newUser = await prisma.user.create({
      data: {
        full_name: full_name,
        username: username,
        email: email,
        password: hashedPassword,
        role: 'viewer', // Role standar untuk pendaftar baru
        is_active: 1
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
// Menyalakan server
app.listen(PORT, () => {
  console.log(`🚀 Auth Service berjalan di http://localhost:${PORT}`);
});