require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5002; // Bedakan port-nya, misal 5002 untuk content-service

app.use(cors());
// Tambahkan limit 50mb agar gambar Base64 tidak error 413
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Cek status server content-service
app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'Content Service siap melayani!' });
});

// ==========================
// API JURUSAN CUSTOM
// ==========================
app.get('/api/jurusan', async (req, res) => {
  try {
    const data = await prisma.jurusanCustom.findMany({
      orderBy: {
        id: 'asc' // <--- Tambahkan ini agar urutannya mengunci pada ID awal
      }
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat jurusan' });
  }
});
// ===================================
// API EDIT (PUT) JURUSAN & PROGRAM
// ===================================

app.put('/api/jurusan/:id', async (req, res) => {
  try {
    const { title, slug, desc, imageIcon, subjects, career } = req.body;
    const updated = await prisma.jurusanCustom.update({
      where: { id: parseInt(req.params.id) },
      data: { title, slug, desc, imageIcon, subjects, career }
    });
    res.json({ success: true, message: 'Jurusan diupdate', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal update jurusan' });
  }
});

app.put('/api/program/:id', async (req, res) => {
  try {
    const { title, desc, badge, imageIcon } = req.body;
    const updated = await prisma.programUnggulanCustom.update({
      where: { id: parseInt(req.params.id) },
      data: { title, desc, badge, imageIcon }
    });
    res.json({ success: true, message: 'Program diupdate', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal update program' });
  }
});
app.post('/api/jurusan', async (req, res) => {
  try {
    const { title, slug, desc, imageIcon, subjects, career } = req.body;
    const newData = await prisma.jurusanCustom.create({
      data: { title, slug, desc, imageIcon, subjects, career }
    });
    res.json({ success: true, message: 'Jurusan berhasil ditambah', data: newData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menambah jurusan' });
  }
});

app.delete('/api/jurusan/:id', async (req, res) => {
  try {
    await prisma.jurusanCustom.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Jurusan dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menghapus jurusan' });
  }
});

// ==========================
// API PROGRAM UNGGULAN CUSTOM
// ==========================

app.get('/api/program', async (req, res) => {
  try {
    const data = await prisma.programUnggulanCustom.findMany({
      orderBy: {
        id: 'asc' // <--- Tambahkan ini juga
      }
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat program' });
  }
});

app.post('/api/program', async (req, res) => {
  try {
    const { title, desc, badge, imageIcon } = req.body;
    const newData = await prisma.programUnggulanCustom.create({
      data: { title, desc, badge, imageIcon }
    });
    res.json({ success: true, message: 'Program berhasil ditambah', data: newData });
  } catch (error) {
    console.error("Error Tambah Program:", error);
    res.status(500).json({ success: false, message: 'Gagal menambah program' });
  }
});

app.delete('/api/program/:id', async (req, res) => {
  try {
    await prisma.programUnggulanCustom.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Program dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menghapus program' });
  }
});
// ==========================
// API TENAGA PENGAJAR (GURU)
// ==========================

// 1. Ambil semua data guru (GET)
app.get('/api/teacher', async (req, res) => {
  try {
    const data = await prisma.teacher.findMany({
      orderBy: { sortOrder: 'asc' } // Gunakan camelCase sortOrder
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal memuat data guru' });
  }
});

// 2. Tambah guru baru (POST)
app.post('/api/teacher', async (req, res) => {
  try {
    const { name, role, photo, sort_order, show } = req.body;
    const newData = await prisma.teacher.create({
      data: { 
        name, 
        role, 
        photo, 
        sortOrder: Number(sort_order), // Gunakan camelCase sortOrder
        show: Number(show) 
      }
    });
    res.json({ success: true, message: 'Guru berhasil ditambah', data: newData });
  } catch (error) {
    console.error("Error Tambah Guru:", error);
    res.status(500).json({ success: false, message: 'Gagal menambah guru' });
  }
});

// 3. Edit / Update data guru (PUT)
app.put('/api/teacher/:id', async (req, res) => {
  try {
    const { name, role, photo, sort_order, show } = req.body;
    const updated = await prisma.teacher.update({
      where: { id: parseInt(req.params.id) },
      data: { 
        name, 
        role, 
        photo, 
        sortOrder: Number(sort_order), // Gunakan camelCase sortOrder
        show: Number(show) 
      }
    });
    res.json({ success: true, message: 'Data guru diupdate', data: updated });
  } catch (error) {
    console.error("Error Update Guru:", error);
    res.status(500).json({ success: false, message: 'Gagal update guru' });
  }
});

// 4. Hapus guru (DELETE)
app.delete('/api/teacher/:id', async (req, res) => {
  try {
    await prisma.teacher.delete({ 
      where: { id: parseInt(req.params.id) } 
    });
    res.json({ success: true, message: 'Guru dihapus' });
  } catch (error) {
    console.error("Error Hapus Guru:", error);
    res.status(500).json({ success: false, message: 'Gagal menghapus guru' });
  }
});
app.listen(PORT, () => {
  console.log(`🚀 Content Service berjalan di http://localhost:${PORT}`);
});