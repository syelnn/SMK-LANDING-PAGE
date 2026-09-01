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


// 1. Ambil semua data ekstrakurikuler (GET)
app.get('/api/extracurriculars', async (req, res) => {
  try {
    const data = await prisma.extracurricular.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error("Error Memuat Ekstrakurikuler:", error);
    res.status(500).json({ success: false, message: 'Gagal memuat data ekstrakurikuler' });
  }
});

// 2. Tambah ekstrakurikuler baru (POST)
app.post('/api/extracurriculars', async (req, res) => {
  try {
    const { title, description, icon, show } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Judul ekstrakurikuler wajib diisi' });
    }

    const totalCount = await prisma.extracurricular.count();

    const newEkskul = await prisma.extracurricular.create({
      data: {
        title: title,
        description: description || '',
        icon: icon || '',
        show: show !== undefined ? Number(show) : 1,
        sortOrder: totalCount + 1
      }
    });

    return res.status(201).json({ success: true, data: newEkskul });
  } catch (error) {
    console.error("Error Tambah Ekstrakurikuler Detail:", error);
    return res.status(500).json({ 
      success: false, 
      message: 'Gagal menambah ekstrakurikuler',
      error: error.message 
    });
  }
});

// 3. Update ekstrakurikuler (PUT) - Dengan Auto-Shift Reorder
app.put('/api/extracurriculars/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, icon, show, sortOrder, sort_order } = req.body;

    const targetId = Number(id);
    const targetOrder = Number(sortOrder ?? sort_order);

    // Ambil data lama
    const currentItem = await prisma.extracurricular.findUnique({
      where: { id: targetId }
    });

    if (!currentItem) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }

    // Jika sortOrder diubah, lakukan penggeseran (re-order) otomatis
    if (targetOrder && targetOrder !== currentItem.sortOrder) {
      const oldOrder = currentItem.sortOrder;
      const newOrder = targetOrder;

      if (oldOrder < newOrder) {
        // Turun posisi (misal: 2 -> 4), data di antaranya (3, 4) geser naik (-1)
        await prisma.extracurricular.updateMany({
          where: {
            sortOrder: { gt: oldOrder, lte: newOrder },
            id: { not: targetId }
          },
          data: { sortOrder: { decrement: 1 } }
        });
      } else {
        // Naik posisi (misal: 4 -> 2), data di antaranya (2, 3) geser turun (+1)
        await prisma.extracurricular.updateMany({
          where: {
            sortOrder: { gte: newOrder, lt: oldOrder },
            id: { not: targetId }
          },
          data: { sortOrder: { increment: 1 } }
        });
      }
    }

    const updated = await prisma.extracurricular.update({
      where: { id: targetId },
      data: {
        title: title ?? currentItem.title,
        description: description ?? currentItem.description,
        icon: icon ?? currentItem.icon,
        show: show !== undefined ? Number(show) : currentItem.show,
        sortOrder: targetOrder || currentItem.sortOrder
      }
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error Update Ekstrakurikuler:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Hapus ekstrakurikuler (DELETE) - Auto-reorder setelah hapus
app.delete('/api/extracurriculars/:id', async (req, res) => {
  try {
    const targetId = Number(req.params.id);

    const targetItem = await prisma.extracurricular.findUnique({
      where: { id: targetId }
    });

    if (!targetItem) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }

    // Hapus data
    await prisma.extracurricular.delete({ 
      where: { id: targetId } 
    });

    // Geser urutan di atasnya agar tidak berlubang
    await prisma.extracurricular.updateMany({
      where: {
        sortOrder: { gt: targetItem.sortOrder }
      },
      data: { sortOrder: { decrement: 1 } }
    });

    res.json({ success: true, message: 'Ekstrakurikuler dihapus dan urutan diperbarui' });
  } catch (error) {
    console.error("Error Hapus Ekstrakurikuler:", error);
    res.status(500).json({ success: false, message: 'Gagal menghapus ekstrakurikuler' });
  }
});

// khusus testimoni 
// 1. KIRIM TESTIMONI (Khusus Viewer/User Login dengan batasan 1x kirim)
app.post('/api/testimonials', async (req, res) => {
  try {
    const { userId, name, photo, role, quote } = req.body;

    // Cek apakah user ini sudah pernah mengirim testimoni sebelumnya
    const existingTestimonial = await prisma.testimonial.findUnique({
      where: { userId: parseInt(userId) }
    });

    if (existingTestimonial) {
      return res.status(400).json({ success: false, message: 'Anda hanya dapat mengirim 1 testimoni saja!' });
    }

    // Simpan testimoni dengan status show = 0 (Menunggu moderasi Admin)
    const newTestimonial = await prisma.testimonial.create({
      data: {
        userId: parseInt(userId),
        name,
        photo: photo || '',
        role,
        quote,
        show: 0 
      }
    });

    res.json({ success: true, message: 'Testimoni berhasil dikirim dan menunggu persetujuan admin!', data: newTestimonial });
  } catch (error) {
    console.error('Error kirim testimoni:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// 2. AMBIL TESTIMONI UNTUK LANDING PAGE (Hanya yang show = 1)
app.get('/api/testimonials/public', async (req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { show: 1 },
      orderBy: { sortOrder: 'asc' }
    });
    res.json({ success: true, data: testimonials });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat testimoni' });
  }
});

// 3. AMBIL SEMUA TESTIMONI UNTUK ADMIN/EDITOR (Manage Dashboard)
app.get('/api/testimonials', async (req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: testimonials });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat data testimoni' });
  }
});

// 4. TOGGLE STATUS SHOW (Admin/Editor menyetujui atau menyembunyikan testimoni)
app.put('/api/testimonials/:id/toggle-show', async (req, res) => {
  try {
    const { id } = req.params;
    const { show } = req.body; // Nilai 0 atau 1

    const updated = await prisma.testimonial.update({
      where: { id: parseInt(id) },
      data: { show: parseInt(show) }
    });

    res.json({ success: true, message: 'Status tampil testimoni diperbarui', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengubah status testimoni' });
  }
});

// 5. HAPUS TESTIMONI
app.delete('/api/testimonials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.testimonial.delete({
      where: { id: parseInt(id) }
    });
    res.json({ success: true, message: 'Testimoni berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menghapus testimoni' });
  }
});

// TAMBAH TESTIMONI KHUSUS ADMIN
app.post('/api/testimonials/admin', async (req, res) => {
  try {
    // PASTIKAN 'photo' ADA DI DALAM KURUNG KURAWAL INI
    const { name, role, quote, show, photo } = req.body; 
    
    const newTestimonial = await prisma.testimonial.create({
      data: { 
        name, 
        role, 
        quote, 
        show: parseInt(show),
        photo: photo || '' // PASTIKAN BARIS INI ADA UNTUK MENYIMPAN FOTO
      }
    });
    res.json({ success: true, message: 'Testimoni berhasil ditambahkan', data: newTestimonial });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal menambah testimoni' });
  }
});

// EDIT / UPDATE TESTIMONI (Full Update)
app.put('/api/testimonials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, quote, show, photo } = req.body; // <-- photo ditambahkan di sini
    
    const updated = await prisma.testimonial.update({
      where: { id: parseInt(id) },
      data: { 
        name, 
        role, 
        quote, 
        show: parseInt(show),
        photo: photo || null // <-- simpan photo ke database
      }
    });
    res.json({ success: true, message: 'Testimoni diperbarui', data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal mengedit testimoni' });
  }
});


// API FAQ (PERTANYAAN)

// GET ALL FAQ (Disesuaikan agar Admin dapat melihat semua data)
app.get('/api/faqs', async (req, res) => {
  try {
    const isAdmin = req.query.admin === 'true';
    
    // Jika admin, tampilkan semua. Jika publik, hanya yang show: 1
    const whereCondition = isAdmin ? {} : { show: 1 };

    const data = await prisma.faq.findMany({
      where: whereCondition,
      orderBy: { sortOrder: 'asc' } 
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error("Error Memuat FAQ:", error);
    res.status(500).json({ success: false, message: 'Gagal memuat data FAQ' });
  }
});


// 2. Tambah FAQ baru (POST)
app.post('/api/faqs', async (req, res) => {
  try {
    const { question, answer, category, show } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ success: false, message: 'Pertanyaan dan jawaban wajib diisi' });
    }

    // Ambil total data untuk menentukan urutan terakhir
    const totalCount = await prisma.faq.count();

    const newFaq = await prisma.faq.create({
      data: {
        question: String(question),
        answer: String(answer),
        category: category ? String(category) : 'Umum',
        show: show !== undefined ? Number(show) : 1,
        sortOrder: totalCount + 1
      }
    });

    return res.status(201).json({ success: true, data: newFaq, message: 'FAQ berhasil ditambahkan' });
  } catch (error) {
    // Menampilkan detail error Prisma di terminal VS Code backend
    console.error("Error Detail Tambah FAQ:", error);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Gagal menambah FAQ', 
      error: error.message 
    });
  }
});
// 3. Update FAQ (PUT) - Mengikuti pola re-order Ekstrakurikuler Anda
app.put('/api/faqs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, category, show, sortOrder, sort_order } = req.body;

    const targetId = Number(id);
    const targetOrder = Number(sortOrder ?? sort_order);

    const currentItem = await prisma.faq.findUnique({
      where: { id: targetId }
    });

    if (!currentItem) {
      return res.status(404).json({ success: false, message: 'FAQ tidak ditemukan' });
    }

    // Auto-shift reorder jika posisi diubah
    if (targetOrder && targetOrder !== currentItem.sortOrder) {
      const oldOrder = currentItem.sortOrder;
      const newOrder = targetOrder;

      if (oldOrder < newOrder) {
        await prisma.faq.updateMany({
          where: {
            sortOrder: { gt: oldOrder, lte: newOrder },
            id: { not: targetId }
          },
          data: { sortOrder: { decrement: 1 } }
        });
      } else {
        await prisma.faq.updateMany({
          where: {
            sortOrder: { gte: newOrder, lt: oldOrder },
            id: { not: targetId }
          },
          data: { sortOrder: { increment: 1 } }
        });
      }
    }

    const updated = await prisma.faq.update({
      where: { id: targetId },
      data: {
        question: question ?? currentItem.question,
        answer: answer ?? currentItem.answer,
        category: category ?? currentItem.category,
        show: show !== undefined ? Number(show) : currentItem.show,
        sortOrder: targetOrder || currentItem.sortOrder
      }
    });

    return res.json({ success: true, data: updated, message: 'FAQ berhasil diperbarui' });
  } catch (error) {
    console.error("Error Update FAQ:", error);
    return res.status(500).json({ success: false, message: 'Gagal mengedit FAQ' });
  }
});

// 4. Hapus FAQ (DELETE) - Auto-reorder setelah hapus
app.delete('/api/faqs/:id', async (req, res) => {
  try {
    const targetId = Number(req.params.id);

    const targetItem = await prisma.faq.findUnique({
      where: { id: targetId }
    });

    if (!targetItem) {
      return res.status(404).json({ success: false, message: 'FAQ tidak ditemukan' });
    }

    await prisma.faq.delete({
      where: { id: targetId }
    });

    await prisma.faq.updateMany({
      where: {
        sortOrder: { gt: targetItem.sortOrder }
      },
      data: { sortOrder: { decrement: 1 } }
    });

    res.json({ success: true, message: 'FAQ dihapus dan urutan diperbarui' });
  } catch (error) {
    console.error("Error Hapus FAQ:", error);
    res.status(500).json({ success: false, message: 'Gagal menghapus FAQ' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Content Service berjalan di http://localhost:${PORT}`);
});