require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

// Panggil "Satpam" kita
const { verifyToken, checkRole } = require('./middleware/authMiddleware');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

// Tes rute utama content-service
app.get('/', (req, res) => {
  res.json({ message: 'Content Service berjalan di Port 5002!' });
});

// ==========================================
// RUTE API (Hanya bisa diakses Admin & Editor)
// ==========================================
const allowedRoles = ['admin', 'editor'];

// 1. API Berita
app.post('/api/berita', verifyToken, checkRole(allowedRoles), async (req, res) => {
  res.json({ message: 'Berhasil mengakses API Tambah Berita', user: req.user });
  // Nanti logika Prisma.news.create taruh di sini
});

// 2. API Testimoni
app.get('/api/testimoni', verifyToken, checkRole(allowedRoles), async (req, res) => {
  res.json({ message: 'Berhasil mengakses API Lihat Testimoni', user: req.user });
});

// 3. API Jurusan & Program Keahlian
app.post('/api/jurusan', verifyToken, checkRole(allowedRoles), async (req, res) => {
  res.json({ message: 'Berhasil mengakses API Tambah Jurusan' });
});

// 4. API Ekstrakurikuler
app.post('/api/ekskul', verifyToken, checkRole(allowedRoles), async (req, res) => {
  res.json({ message: 'Berhasil mengakses API Tambah Ekskul' });
});

app.listen(PORT, () => {
  console.log(`🚀 Content Service berjalan di http://localhost:${PORT}`);
});