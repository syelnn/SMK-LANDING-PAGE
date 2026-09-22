require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const { verifyToken, checkRole } = require('./middleware/authMiddleware')(prisma);

const app = express();
const PORT = process.env.PORT || 5003;

app.disable('x-powered-by');
app.use(cors({
  origin: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map((x) => x.trim()),
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Tes rute utama core-service
app.get('/', (req, res) => {
  res.json({ message: 'Core Service berjalan di Port 5003!' });
});

// ==========================================
// RUTE API (HANYA BISA DIAKSES ADMIN)
// ==========================================
const onlyAdmin = ['admin']; // Kunci rahasia: Hanya role admin yang lolos

// 1. API Manajemen Profil
app.post('/api/profil', verifyToken, checkRole(onlyAdmin), async (req, res) => {
  res.json({ message: 'Sukses: Akses Admin ke Manajemen Profil', user: req.user });
});

// 2. API Tenaga Pengajar
app.post('/api/pengajar', verifyToken, checkRole(onlyAdmin), async (req, res) => {
  res.json({ message: 'Sukses: Akses Admin ke Tenaga Pengajar' });
});

// 3. API Karya & Prestasi
app.post('/api/prestasi', verifyToken, checkRole(onlyAdmin), async (req, res) => {
  res.json({ message: 'Sukses: Akses Admin ke Karya & Prestasi' });
});

// 4. API FAQ
app.post('/api/faq', verifyToken, checkRole(onlyAdmin), async (req, res) => {
  res.json({ message: 'Sukses: Akses Admin ke FAQ' });
});

// 5. API Kontak
app.post('/api/kontak', verifyToken, checkRole(onlyAdmin), async (req, res) => {
  res.json({ message: 'Sukses: Akses Admin ke Kontak' });
});

app.listen(PORT, () => {
  console.log(`🚀 Core Service berjalan di http://localhost:${PORT}`);
});