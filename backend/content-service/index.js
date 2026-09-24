require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { PrismaClient } = require('@prisma/client');
const { deleteFromStorageByUrl, detectRemoteFileSize, uploadFromExternalUrl } = require('./services/cloudinaryStorage');
const { generateDatabaseDump, getDatabaseSummary } = require('./services/dbExport');

const prisma = new PrismaClient();
const { verifyToken, optionalAuth, checkRole } = require('./middleware/authMiddleware')(prisma);
const { uploadSingleSafe, resolveImage } = require('./middleware/imageUpload'); // <== BARU (Fase 2)
const { uploadSingleSafeFile, resolveDownloadFile } = require('./middleware/fileUpload'); // <== khusus berkas Downloads (bukan gambar)
const requireStaff = [verifyToken, checkRole(['admin', 'editor'])]; // khusus admin/editor
const requireAdmin = [verifyToken, checkRole(['admin'])];           // khusus admin (footer, menu, settings)

// ?admin=true hanya boleh untuk staff (data FAQ yang disembunyikan tidak bocor ke publik)
const staffIfAdminQuery = (req, res, next) =>
  req.query.admin === 'true'
    ? verifyToken(req, res, (err) => (err ? next(err) : checkRole(['admin', 'editor'])(req, res, next)))
    : next();

const app = express();
const PORT = process.env.PORT || 5002; // Bedakan port-nya, misal 5002 untuk content-service

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map((x) => x.trim()),
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Limit 50mb ini sekarang jarang kepakai (gambar sudah lewat multer/multipart),
// tapi dibiarkan sebagai jaring pengaman untuk payload JSON teks yang besar (mis. content berita panjang)
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
      orderBy: { id: 'asc' }
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat jurusan' });
  }
});
// ===================================
// API EDIT (PUT) JURUSAN & PROGRAM
// ===================================

app.put('/api/jurusan/:id', ...requireStaff, uploadSingleSafe('imageIcon'), resolveImage('imageIcon', 'jurusan'), async (req, res) => {
  try {
    const { title, slug, desc, imageIcon, subjects, career } = req.body;

    // Ambil gambar LAMA dulu sebelum ditimpa, supaya nanti bisa dihapus dari Cloudinary
    const current = await prisma.jurusanCustom.findUnique({ where: { id: parseInt(req.params.id) } });
    const oldImageIcon = current?.imageIcon;

    const updated = await prisma.jurusanCustom.update({
      where: { id: parseInt(req.params.id) },
      data: { title, slug, desc, imageIcon, subjects, career }
    });

    // Gambar diganti (URL baru beda dari lama) -> hapus file lama di Cloudinary
    if (oldImageIcon && oldImageIcon !== imageIcon) {
      await deleteFromStorageByUrl(oldImageIcon);
    }

    res.json({ success: true, message: 'Jurusan diupdate', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal update jurusan' });
  }
});

app.put('/api/program/:id', ...requireStaff, uploadSingleSafe('imageIcon'), resolveImage('imageIcon', 'programs'), async (req, res) => {
  try {
    const { title, desc, badge, imageIcon } = req.body;

    // Ambil gambar LAMA dulu sebelum ditimpa, supaya nanti bisa dihapus dari Cloudinary
    const current = await prisma.programUnggulanCustom.findUnique({ where: { id: parseInt(req.params.id) } });
    const oldImageIcon = current?.imageIcon;

    const updated = await prisma.programUnggulanCustom.update({
      where: { id: parseInt(req.params.id) },
      data: { title, desc, badge, imageIcon }
    });

    // Gambar diganti (URL baru beda dari lama) -> hapus file lama di Cloudinary
    if (oldImageIcon && oldImageIcon !== imageIcon) {
      await deleteFromStorageByUrl(oldImageIcon);
    }

    res.json({ success: true, message: 'Program diupdate', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal update program' });
  }
});
app.post('/api/jurusan', ...requireStaff, uploadSingleSafe('imageIcon'), resolveImage('imageIcon', 'jurusan'), async (req, res) => {
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

app.delete('/api/jurusan/:id', ...requireStaff, async (req, res) => {
  try {
    const deleted = await prisma.jurusanCustom.delete({ where: { id: parseInt(req.params.id) } });

    // Data di database sudah hilang, sekarang bersihkan file fisiknya juga di Cloudinary
    if (deleted?.imageIcon) {
      await deleteFromStorageByUrl(deleted.imageIcon);
    }

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
      orderBy: { id: 'asc' }
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat program' });
  }
});

app.post('/api/program', ...requireStaff, uploadSingleSafe('imageIcon'), resolveImage('imageIcon', 'programs'), async (req, res) => {
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

app.delete('/api/program/:id', ...requireStaff, async (req, res) => {
  try {
    const deleted = await prisma.programUnggulanCustom.delete({ where: { id: parseInt(req.params.id) } });

    // Data di database sudah hilang, sekarang bersihkan file fisiknya juga di Cloudinary
    if (deleted?.imageIcon) {
      await deleteFromStorageByUrl(deleted.imageIcon);
    }

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
      orderBy: { sortOrder: 'asc' }
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal memuat data guru' });
  }
});

// 2. Tambah guru baru (POST)
app.post('/api/teacher', ...requireStaff, uploadSingleSafe('photo'), resolveImage('photo', 'teachers'), async (req, res) => {
  try {
    const { name, role, photo, sort_order, show } = req.body;
    const newData = await prisma.teacher.create({
      data: {
        name,
        role,
        photo,
        sortOrder: Number(sort_order),
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
app.put('/api/teacher/:id', ...requireStaff, uploadSingleSafe('photo'), resolveImage('photo', 'teachers'), async (req, res) => {
  try {
    const { name, role, photo, sort_order, show } = req.body;

    // Ambil foto LAMA dulu sebelum ditimpa, supaya nanti bisa dihapus dari Cloudinary
    const current = await prisma.teacher.findUnique({ where: { id: parseInt(req.params.id) } });
    const oldPhoto = current?.photo;

    const updated = await prisma.teacher.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        role,
        photo,
        sortOrder: Number(sort_order),
        show: Number(show)
      }
    });

    // Foto diganti (URL baru beda dari lama) -> hapus file lama di Cloudinary
    if (oldPhoto && oldPhoto !== photo) {
      await deleteFromStorageByUrl(oldPhoto);
    }

    res.json({ success: true, message: 'Data guru diupdate', data: updated });
  } catch (error) {
    console.error("Error Update Guru:", error);
    res.status(500).json({ success: false, message: 'Gagal update guru' });
  }
});

// 4. Hapus guru (DELETE)
app.delete('/api/teacher/:id', ...requireStaff, async (req, res) => {
  try {
    const deleted = await prisma.teacher.delete({
      where: { id: parseInt(req.params.id) }
    });

    // Data di database sudah hilang, sekarang bersihkan file fisiknya juga di Cloudinary
    if (deleted?.photo) {
      await deleteFromStorageByUrl(deleted.photo);
    }

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
app.post('/api/extracurriculars', ...requireStaff, uploadSingleSafe('icon'), resolveImage('icon', 'extracurriculars'), async (req, res) => {
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
app.put('/api/extracurriculars/:id', ...requireStaff, uploadSingleSafe('icon'), resolveImage('icon', 'extracurriculars'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, icon, show, sortOrder, sort_order } = req.body;

    const targetId = Number(id);
    const targetOrder = Number(sortOrder ?? sort_order);

    const currentItem = await prisma.extracurricular.findUnique({
      where: { id: targetId }
    });

    if (!currentItem) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }

    // Ambil icon LAMA dulu sebelum ditimpa, supaya nanti bisa dihapus dari Cloudinary
    const oldIcon = currentItem.icon;

    if (targetOrder && targetOrder !== currentItem.sortOrder) {
      const oldOrder = currentItem.sortOrder;
      const newOrder = targetOrder;

      if (oldOrder < newOrder) {
        await prisma.extracurricular.updateMany({
          where: {
            sortOrder: { gt: oldOrder, lte: newOrder },
            id: { not: targetId }
          },
          data: { sortOrder: { decrement: 1 } }
        });
      } else {
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

    // Icon diganti (URL/nilai baru beda dari lama) -> hapus file lama di Cloudinary biar tidak numpuk kuota
    if (oldIcon && oldIcon !== updated.icon) {
      await deleteFromStorageByUrl(oldIcon);
    }

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error Update Ekstrakurikuler:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Hapus ekstrakurikuler (DELETE) - Auto-reorder setelah hapus
app.delete('/api/extracurriculars/:id', ...requireStaff, async (req, res) => {
  try {
    const targetId = Number(req.params.id);

    const targetItem = await prisma.extracurricular.findUnique({
      where: { id: targetId }
    });

    if (!targetItem) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }

    await prisma.extracurricular.delete({
      where: { id: targetId }
    });

    // Data di database sudah hilang, sekarang bersihkan file fisiknya juga di Cloudinary
    if (targetItem.icon) {
      await deleteFromStorageByUrl(targetItem.icon);
    }

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
// 1. KIRIM TESTIMONI (Viewer yang sudah login, maksimal 2x kirim, jeda 24 jam antar kirim)
const MAX_TESTIMONIAL_PER_USER = 2;
const TESTIMONIAL_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 jam

// Foto testimoni = foto profil user (dikirim frontend lewat flag use_profile_photo=1).
// Foto profil SENGAJA DISALIN ke folder "testimonials" (bukan dipakai bersama URL-nya), karena kalau
// dipakai bersama: ganti foto profil => foto lama dihapus dari Cloudinary => foto testimoni ikut
// rusak; atau admin hapus testimoni => foto profil user ikut terhapus.
// Kalau penyalinan gagal, testimoni tetap dikirim tanpa foto (kartu memakai huruf inisial).
const useProfilePhoto = async (req, res, next) => {
  try {
    if (req.file || String(req.body?.use_profile_photo || '') !== '1') return next();
    const me = await prisma.user.findUnique({ where: { id: parseInt(req.user.id) }, select: { avatar: true } });
    if (me?.avatar) req.body.photo = await uploadFromExternalUrl(me.avatar, 'testimonials');
  } catch (err) {
    console.warn('Gagal menyalin foto profil untuk testimoni (diabaikan):', err.message);
  }
  next();
};

app.post('/api/testimonials', verifyToken, uploadSingleSafe('photo'), useProfilePhoto, resolveImage('photo', 'testimonials'), async (req, res) => {
  try {
    const userId = parseInt(req.user.id);
    const name = String(req.body.name || '').trim();
    const role = String(req.body.role || '').trim();
    const quote = String(req.body.quote || '').trim();
    const photo = typeof req.body.photo === 'string' ? req.body.photo.trim() : '';

    if (!name || !role || !quote) {
      return res.status(400).json({ success: false, message: 'Nama, status, dan cerita wajib diisi.' });
    }
    if (quote.length < 20) {
      return res.status(400).json({ success: false, message: 'Cerita terlalu singkat (minimal 20 karakter).' });
    }
    if (quote.length > 500 || name.length > 100 || role.length > 200) {
      return res.status(400).json({ success: false, message: 'Teks terlalu panjang.' });
    }
    // Catatan: photo sekarang berupa URL storage (pendek), jadi cek ukuran ini praktis tidak akan pernah kena lagi.
    if (photo.length > 400 * 1024) {
      return res.status(400).json({ success: false, message: 'Ukuran foto terlalu besar.' });
    }

    const myTestimonials = await prisma.testimonial.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    if (myTestimonials.length >= MAX_TESTIMONIAL_PER_USER) {
      return res.status(400).json({
        success: false,
        limitReached: true,
        message: 'Kamu sudah mencapai batas mengirim testimoni',
        data: myTestimonials
      });
    }

    const last = myTestimonials[0];
    if (last) {
      const nextAllowedAt = new Date(new Date(last.createdAt).getTime() + TESTIMONIAL_COOLDOWN_MS);
      const now = new Date();
      if (now < nextAllowedAt) {
        return res.status(429).json({
          success: false,
          cooldown: true,
          message: 'Kamu baru bisa mengirim testimoni lagi setelah 24 jam dari pengiriman terakhir.',
          nextAllowedAt,
          data: myTestimonials
        });
      }
    }

    const newTestimonial = await prisma.testimonial.create({
      data: { userId, name, photo: photo || '', role, quote, show: 0 }
    });

    res.json({ success: true, message: 'Testimoni berhasil dikirim dan menunggu persetujuan admin!', data: newTestimonial });
  } catch (error) {
    console.error('Error kirim testimoni:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// 1b. CEK TESTIMONI MILIK SAYA
app.get('/api/testimonials/mine', verifyToken, async (req, res) => {
  try {
    const userId = parseInt(req.user.id);
    const items = await prisma.testimonial.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const count = items.length;
    const limitReached = count >= MAX_TESTIMONIAL_PER_USER;

    let nextAllowedAt = null;
    if (items[0]) {
      nextAllowedAt = new Date(new Date(items[0].createdAt).getTime() + TESTIMONIAL_COOLDOWN_MS);
    }
    const cooldownActive = !limitReached && !!nextAllowedAt && new Date() < nextAllowedAt;
    const canSubmit = !limitReached && !cooldownActive;

    res.json({
      success: true,
      data: {
        items,
        count,
        maxAllowed: MAX_TESTIMONIAL_PER_USER,
        remaining: Math.max(0, MAX_TESTIMONIAL_PER_USER - count),
        limitReached,
        cooldownActive,
        nextAllowedAt,
        canSubmit
      }
    });
  } catch (error) {
    console.error('Error cek testimoni saya:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat testimoni Anda' });
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
app.get('/api/testimonials', ...requireStaff, async (req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: testimonials });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat data testimoni' });
  }
});

// 4. TOGGLE STATUS SHOW
app.put('/api/testimonials/:id/toggle-show', ...requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const { show } = req.body;

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
app.delete('/api/testimonials/:id', ...requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await prisma.testimonial.delete({ where: { id: parseInt(id) } });

    if (deleted?.photo) {
      await deleteFromStorageByUrl(deleted.photo);
    }

    res.json({ success: true, message: 'Testimoni berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menghapus testimoni' });
  }
});

// TAMBAH TESTIMONI KHUSUS ADMIN
app.post('/api/testimonials/admin', ...requireStaff, uploadSingleSafe('photo'), resolveImage('photo', 'testimonials'), async (req, res) => {
  try {
    const { name, role, quote, show, photo } = req.body;

    const newTestimonial = await prisma.testimonial.create({
      data: {
        name,
        role,
        quote,
        show: parseInt(show),
        photo: photo || ''
      }
    });
    res.json({ success: true, message: 'Testimoni berhasil ditambahkan', data: newTestimonial });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal menambah testimoni' });
  }
});

// EDIT / UPDATE TESTIMONI (Full Update)
app.put('/api/testimonials/:id', ...requireStaff, uploadSingleSafe('photo'), resolveImage('photo', 'testimonials'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, quote, show, photo } = req.body;

    // Ambil foto lama dulu sebelum ditimpa
    const current = await prisma.testimonial.findUnique({ where: { id: parseInt(id) } });
    const oldPhoto = current?.photo;

    const updated = await prisma.testimonial.update({
      where: { id: parseInt(id) },
      data: { name, role, quote, show: parseInt(show), photo: photo || null }
    });

    if (oldPhoto && oldPhoto !== photo) {
      await deleteFromStorageByUrl(oldPhoto);
    }

    res.json({ success: true, message: 'Testimoni diperbarui', data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal mengedit testimoni' });
  }
});


// API FAQ (PERTANYAAN)

app.get('/api/faqs', staffIfAdminQuery, async (req, res) => {
  try {
    const isAdmin = req.query.admin === 'true';
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


app.post('/api/faqs', ...requireStaff, async (req, res) => {
  try {
    const { question, answer, category, show } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ success: false, message: 'Pertanyaan dan jawaban wajib diisi' });
    }

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
    console.error("Error Detail Tambah FAQ:", error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menambah FAQ',
      error: error.message
    });
  }
});
app.put('/api/faqs/:id', ...requireStaff, async (req, res) => {
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

app.delete('/api/faqs/:id', ...requireStaff, async (req, res) => {
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
// ==========================================
// CRUD GALERI SEKOLAH
// ==========================================

app.get('/api/galleries', async (req, res) => {
  try {
    const galleries = await prisma.gallery.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    res.json({ success: true, data: galleries });
  } catch (error) {
    console.error('Error GET Galleries:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data galeri' });
  }
});

app.post('/api/galleries', ...requireStaff, uploadSingleSafe('image'), resolveImage('image', 'galleries'), async (req, res) => {
  try {
    const { category, image, caption, is_featured, sort_order, show } = req.body;
    const newGallery = await prisma.gallery.create({
      data: {
        category,
        image,
        caption,
        isFeatured: Number(is_featured),
        sortOrder: Number(sort_order),
        show: Number(show)
      }
    });
    res.json({ success: true, message: 'Foto berhasil ditambahkan', data: newGallery });
  } catch (error) {
    console.error('Error POST Galleries:', error);
    res.status(500).json({ success: false, message: 'Gagal menambah foto' });
  }
});

app.put('/api/galleries/:id', ...requireStaff, uploadSingleSafe('image'), resolveImage('image', 'galleries'), async (req, res) => {
  try {
    const { id } = req.params;
    const { category, image, caption, is_featured, sort_order, show } = req.body;

    // Ambil URL gambar LAMA dulu sebelum ditimpa, supaya nanti bisa dihapus dari Cloudinary
    const current = await prisma.gallery.findUnique({ where: { id: Number(id) } });
    const oldImageUrl = current?.image;

    const updatedGallery = await prisma.gallery.update({
      where: { id: Number(id) },
      data: { category, image, caption, isFeatured: Number(is_featured), sortOrder: Number(sort_order), show: Number(show) }
    });

    // Gambar diganti (URL baru beda dari lama) -> hapus file lama di Cloudinary biar tidak numpuk kuota
    if (oldImageUrl && oldImageUrl !== image) {
      await deleteFromStorageByUrl(oldImageUrl);
    }

    res.json({ success: true, message: 'Foto berhasil diperbarui', data: updatedGallery });
  } catch (error) {
    console.error('Error PUT Galleries:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui foto' });
  }
});

app.delete('/api/galleries/:id', ...requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await prisma.gallery.delete({ where: { id: Number(id) } });

    // Data di database sudah hilang, sekarang bersihkan file fisiknya juga di Cloudinary
    if (deleted?.image) {
      await deleteFromStorageByUrl(deleted.image);
    }

    res.json({ success: true, message: 'Foto berhasil dihapus' });
  } catch (error) {
    console.error('Error DELETE Galleries:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus foto' });
  }
});

// ==========================
// API BERITA (NEWS)
// ==========================

app.get('/api/news', async (req, res) => {
  try {
    const data = await prisma.news.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error GET News:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat berita', error: error.message });
  }
});

app.get('/api/news/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const isNumber = !isNaN(slug);

    const news = await prisma.news.findUnique({
      where: isNumber ? { id: Number(slug) } : { slug: slug }
    });

    if (!news) {
      return res.status(404).json({ success: false, message: 'Berita tidak ditemukan' });
    }

    res.json({ success: true, data: news });
  } catch (error) {
    console.error('Error GET Detail News:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat detail berita' });
  }
});

app.post('/api/news', ...requireStaff, uploadSingleSafe('image'), resolveImage('image', 'news'), async (req, res) => {
  try {
    const { title, slug, category, tags, excerpt, content, image, author, status } = req.body;

    const generatedSlug = slug || title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const formattedTags = Array.isArray(tags)
      ? tags
      : (typeof tags === 'string' && tags ? tags.split(',').map(t => t.trim()) : []);

    const newNews = await prisma.news.create({
      data: {
        title: title || 'Tanpa Judul',
        slug: generatedSlug || `berita-${Date.now()}`,
        category: category || 'Umum',
        tags: formattedTags,
        excerpt: excerpt || '',
        content: content || '',
        image: image || '',
        author: author || 'Admin',
        status: status || 'draft',
        publishedAt: status === 'published' ? new Date() : null
      }
    });

    res.status(201).json({ success: true, message: 'Berita berhasil ditambahkan', data: newNews });
  } catch (error) {
    console.error('Error POST News:', error);
    res.status(500).json({ success: false, message: 'Gagal menambah berita', error: error.message });
  }
});

app.put('/api/news/:id', ...requireStaff, uploadSingleSafe('image'), resolveImage('image', 'news'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, category, tags, excerpt, content, image, author, status } = req.body;

    const generatedSlug = slug || title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const formattedTags = Array.isArray(tags)
      ? tags
      : (typeof tags === 'string' && tags ? tags.split(',').map(t => t.trim()) : []);

    // Ambil gambar LAMA dulu sebelum ditimpa, supaya nanti bisa dihapus dari Cloudinary
    const current = await prisma.news.findUnique({ where: { id: Number(id) } });
    const oldImage = current?.image;

    const updated = await prisma.news.update({
      where: { id: Number(id) },
      data: {
        title,
        slug: generatedSlug,
        category,
        tags: formattedTags,
        excerpt,
        content,
        image,
        author,
        status,
        publishedAt: status === 'published' ? new Date() : undefined
      }
    });

    // Gambar diganti (URL baru beda dari lama) -> hapus file lama di Cloudinary
    if (oldImage && oldImage !== image) {
      await deleteFromStorageByUrl(oldImage);
    }

    res.json({ success: true, message: 'Berita berhasil diperbarui', data: updated });
  } catch (error) {
    console.error('Error PUT News:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui berita', error: error.message });
  }
});

app.delete('/api/news/:id', ...requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await prisma.news.delete({
      where: { id: Number(id) }
    });

    // Data di database sudah hilang, sekarang bersihkan file fisiknya juga di Cloudinary
    if (deleted?.image) {
      await deleteFromStorageByUrl(deleted.image);
    }

    res.json({ success: true, message: 'Berita berhasil dihapus' });
  } catch (error) {
    console.error('Error DELETE News:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus berita' });
  }
});


// ==========================
// API FOOTER SETTING
// ==========================

app.get('/api/footer', async (req, res) => {
  try {
    const footer = await prisma.footerSetting.findFirst();
    res.json({ success: true, data: footer });
  } catch (error) {
    console.error('Error GET Footer:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat data footer' });
  }
});

app.put('/api/footer', ...requireAdmin, async (req, res) => {
  try {
    const {
      schoolName,
      description,
      address,
      phone,
      email,
      facebookUrl,
      instagramUrl,
      mapsEmbedUrl
    } = req.body;

    const existingFooter = await prisma.footerSetting.findFirst();

    let updatedFooter;
    if (existingFooter) {
      updatedFooter = await prisma.footerSetting.update({
        where: { id: existingFooter.id },
        data: { schoolName, description, address, phone, email, facebookUrl, instagramUrl, mapsEmbedUrl }
      });
    } else {
      updatedFooter = await prisma.footerSetting.create({
        data: { schoolName, description, address, phone, email, facebookUrl, instagramUrl, mapsEmbedUrl }
      });
    }

    res.json({ success: true, message: 'Footer berhasil diperbarui', data: updatedFooter });
  } catch (error) {
    console.error('Error PUT Footer:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui footer' });
  }
});

// ==========================================
// API MENU ITEMS (Untuk Navigasi & Sidebar)
// ==========================================

app.get('/api/menu-items', async (req, res) => {
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: { status: 1 },
      orderBy: { sortOrder: 'asc' },
      include: { page: true }
    });
    res.json({ success: true, data: menuItems });
  } catch (error) {
    console.error('Error GET Menu Items:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat menu' });
  }
});

app.post('/api/menu-items', ...requireAdmin, async (req, res) => {
  try {
    const { title, url, target, icon, sectionKey, sortOrder, status, type, pageId, parentId } = req.body;

    const newMenuItem = await prisma.menuItem.create({
      data: {
        title,
        url: url || null,
        target: target || '_self',
        icon: icon || 'dashboard',
        sectionKey: sectionKey || null,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
        status: status !== undefined ? Number(status) : 1,
        type: type || 'section',
        pageId: pageId ? Number(pageId) : null,
        parentId: parentId ? Number(parentId) : null
      }
    });

    res.status(201).json({ success: true, message: 'Menu berhasil ditambahkan', data: newMenuItem });
  } catch (error) {
    console.error('Error POST Menu Item:', error);
    res.status(500).json({ success: false, message: 'Gagal menambah menu' });
  }
});

app.put('/api/menu-items/:id', ...requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, url, target, icon, sectionKey, sortOrder, status, type, pageId, parentId } = req.body;

    const updatedMenuItem = await prisma.menuItem.update({
      where: { id: Number(id) },
      data: {
        title,
        url,
        target,
        icon,
        sectionKey,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
        status: status !== undefined ? Number(status) : undefined,
        type,
        pageId: pageId ? Number(pageId) : null,
        parentId: parentId ? Number(parentId) : null
      }
    });

    res.json({ success: true, message: 'Menu berhasil diupdate', data: updatedMenuItem });
  } catch (error) {
    console.error('Error PUT Menu Item:', error);
    res.status(500).json({ success: false, message: 'Gagal mengedit menu' });
  }
});

app.delete('/api/menu-items/:id', ...requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.menuItem.delete({ where: { id: Number(id) } });
    res.json({ success: true, message: 'Menu berhasil dihapus' });
  } catch (error) {
    console.error('Error DELETE Menu Item:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus menu' });
  }
});


// API KARYA PRESTASI
app.get('/api/achievements', async (req, res) => {
  try {
    const data = await prisma.achievements.findMany({
      where: { show: 1 },
      orderBy: [
        { sort_order: 'asc' },
        { id: 'desc' },
      ],
    });

    res.json({ success: true, data: data });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data karya dan prestasi',
      error: error.message,
    });
  }
});

app.post('/api/achievements', ...requireStaff, uploadSingleSafe('photo'), resolveImage('photo', 'achievements'), async (req, res) => {
  try {
    const { student_name, class_name, achievement, level, year, photo, sort_order } = req.body;

    const newAchievement = await prisma.achievements.create({
      data: {
        student_name: String(student_name),
        class_name: String(class_name),
        achievement: String(achievement),
        level: String(level || 'Nasional'),
        year: parseInt(year, 10) || new Date().getFullYear(),
        photo: photo ? String(photo) : null,
        show: 1,
        sort_order: parseInt(sort_order, 10) || 0
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Berhasil menambahkan data prestasi',
      data: newAchievement,
    });
  } catch (error) {
    console.error('Error POST /api/achievements:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menambahkan data prestasi',
      error: error.message,
    });
  }
});

app.put('/api/achievements/:id', ...requireStaff, uploadSingleSafe('photo'), resolveImage('photo', 'achievements'), async (req, res) => {
  try {
    const { id } = req.params;
    const { student_name, class_name, achievement, level, year, sort_order, photo } = req.body;

    const targetId = parseInt(id, 10);
    const newOrder = parseInt(sort_order, 10) || 1;

    const currentItem = await prisma.achievements.findUnique({
      where: { id: targetId },
    });

    if (!currentItem) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }

    const oldOrder = currentItem.sort_order || 1;

    if (oldOrder !== newOrder) {
      if (oldOrder < newOrder) {
        await prisma.achievements.updateMany({
          where: { sort_order: { gt: oldOrder, lte: newOrder }, id: { not: targetId } },
          data: { sort_order: { decrement: 1 } },
        });
      } else {
        await prisma.achievements.updateMany({
          where: { sort_order: { gte: newOrder, lt: oldOrder }, id: { not: targetId } },
          data: { sort_order: { increment: 1 } },
        });
      }
    }

    const updatedAchievement = await prisma.achievements.update({
      where: { id: targetId },
      data: {
        student_name: String(student_name),
        class_name: String(class_name),
        achievement: String(achievement),
        level: String(level),
        year: parseInt(year, 10),
        photo: photo ? String(photo) : null,
        sort_order: newOrder,
      },
    });

        // currentItem sudah diambil di atas (untuk logika sort_order) -> tinggal dipakai ulang di sini
    if (currentItem.photo && currentItem.photo !== photo) {
      await deleteFromStorageByUrl(currentItem.photo);
    }

    res.json({
      success: true,
      message: 'Berhasil memperbarui data prestasi',
      data: updatedAchievement,
    });
  } catch (error) {
    console.error('Error PUT achievement:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui data prestasi',
      error: error.message,
    });
  }
});

app.delete('/api/achievements/:id', ...requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await prisma.achievements.delete({ where: { id: parseInt(id) } });

    if (deleted?.photo) {
      await deleteFromStorageByUrl(deleted.photo);
    }

    res.json({ success: true, message: 'Berhasil menghapus data prestasi' });
  } catch (error) {
    console.error('Error deleting achievement:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus data prestasi', error: error.message });
  }
});

// ==========================
// API PENGATURAN WEBSITE (SETTINGS)
// ==========================

app.get('/api/settings', async (req, res) => {
  try {
    const data = await prisma.setting.findMany();
    res.json({ success: true, data });
  } catch (error) {
    console.error("Error GET Settings:", error);
    res.status(500).json({ success: false, message: 'Gagal memuat pengaturan' });
  }
});

app.put('/api/settings/bulk-update', ...requireAdmin, async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      const existing = await prisma.setting.findFirst({ where: { key: key } });

      if (existing) {
        await prisma.setting.update({
          where: { id: existing.id },
          data: { value: String(value) }
        });
      } else {
        await prisma.setting.create({
          data: { key: key, value: String(value) }
        });
      }
    }
    res.json({ success: true, message: 'Pengaturan berhasil diperbarui' });
  } catch (error) {
    console.error("Error UPDATE Settings:", error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui pengaturan' });
  }
});

// BARU (Fase 3.4): upload gambar khusus untuk setting bertipe gambar (mis. logo, favicon)
// Frontend kirim FormData field 'image' (file ATAU url teks) ke /api/settings/upload-image/<key>
app.post('/api/settings/upload-image/:key', ...requireAdmin, uploadSingleSafe('image'), resolveImage('image', 'settings'), async (req, res) => {
  try {
    const { key } = req.params;
    const { image } = req.body;
    const existing = await prisma.setting.findFirst({ where: { key } });
    const oldImageUrl = existing?.value;

    const saved = existing
      ? await prisma.setting.update({ where: { id: existing.id }, data: { value: image } })
      : await prisma.setting.create({ data: { key, value: image } });

    // Hapus gambar lama (mis. logo/favicon versi sebelumnya) kalau memang diganti
    if (oldImageUrl && oldImageUrl !== image) {
      await deleteFromStorageByUrl(oldImageUrl);
    }

    res.json({ success: true, message: 'Gambar pengaturan diperbarui', data: saved });
  } catch (error) {
    console.error('Error upload settings image:', error);
    res.status(500).json({ success: false, message: 'Gagal upload gambar pengaturan' });
  }
});

// ==========================================
// API DOWNLOADS (PRISMA ORM)
// ==========================================

// Downloads TIDAK lewat Cloudinary (bukan gambar, berupa dokumen/berkas) -> link disimpan apa adanya,
// termasuk boleh dari Google Drive. Yang dilakukan cuma menormalkan link "view" Drive
// menjadi link direct-download, supaya tombol "Unduh" di frontend langsung mengunduh filenya.
function normalizeDriveUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?(?:export=[a-z]+&)?id=([a-zA-Z0-9_-]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m && m[1]) {
      return `https://drive.google.com/uc?export=download&id=${m[1]}`;
    }
  }
  return url;
}

app.get('/api/downloads', optionalAuth, async (req, res) => {
  try {
    const isStaff = ['admin', 'editor'].includes(req.user?.role);
    const downloads = await prisma.download.findMany({
      where: isStaff ? {} : { show: 1 },
      orderBy: [
        { sortOrder: 'asc' },
        { id: 'desc' }
      ]
    });

    res.status(200).json({ success: true, data: downloads });
  } catch (error) {
    console.error("Error GET Downloads:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/downloads', ...requireStaff, uploadSingleSafeFile('file'), resolveDownloadFile('downloads'), async (req, res) => {
  const { title, category, description, url, file_size, fileSize, sort_order, sortOrder, show } = req.body;

  if (!title || !url) {
    return res.status(400).json({ success: false, message: 'Judul dan URL wajib diisi!' });
  }

  try {
    const finalUrl = normalizeDriveUrl(url);

    // Kalau admin isi Link URL manual (bukan upload file, yang sudah otomatis dapat fileSize
    // dari resolveDownloadFile) dan belum isi ukuran -> coba deteksi otomatis dari header berkas,
    // termasuk link Google Drive.
    let finalFileSize = fileSize || file_size || '';
    if (!finalFileSize) {
      finalFileSize = await detectRemoteFileSize(finalUrl);
    }

    const newDownload = await prisma.download.create({
      data: {
        title,
        category: category || 'Lainnya',
        description: description || '',
        url: finalUrl,
        fileSize: finalFileSize,
        sortOrder: Number(sortOrder ?? sort_order ?? 1),
        show: Number(show ?? 1)
      }
    });

    res.status(201).json({ success: true, message: 'Berkas berhasil ditambahkan', data: newDownload });
  } catch (err) {
    console.error('Error POST download:', err.message);
    res.status(500).json({ success: false, message: 'Gagal menambah data: ' + err.message });
  }
});

app.put('/api/downloads/:id', ...requireStaff, uploadSingleSafeFile('file'), resolveDownloadFile('downloads'), async (req, res) => {
  const { id } = req.params;
  const { title, category, description, url, file_size, fileSize, sort_order, sortOrder, show } = req.body;

  try {
    // Ambil URL berkas LAMA dulu sebelum ditimpa, supaya nanti bisa dihapus dari Cloudinary
    // kalau memang berkasnya diganti (link Google Drive lama tidak ikut terhapus, aman).
    const current = await prisma.download.findUnique({ where: { id: Number(id) } });
    const oldUrl = current?.url;

    const finalUrl = normalizeDriveUrl(url);

    let finalFileSize = fileSize || file_size || '';
    if (!finalFileSize) {
      finalFileSize = await detectRemoteFileSize(finalUrl);
    }

    const updatedDownload = await prisma.download.update({
      where: { id: Number(id) },
      data: {
        title,
        category,
        description,
        url: finalUrl,
        fileSize: finalFileSize,
        sortOrder: Number(sortOrder ?? sort_order ?? 1),
        show: Number(show ?? 1)
      }
    });

    if (oldUrl && oldUrl !== finalUrl) {
      await deleteFromStorageByUrl(oldUrl);
    }

    res.json({ success: true, message: 'Berkas berhasil diperbarui', data: updatedDownload });
  } catch (err) {
    console.error('Error PUT download:', err.message);
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }
    res.status(500).json({ success: false, message: 'Gagal memperbarui data: ' + err.message });
  }
});

app.delete('/api/downloads/:id', ...requireStaff, async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await prisma.download.delete({ where: { id: Number(id) } });

    // Data di database sudah hilang, sekarang bersihkan file fisiknya juga di Cloudinary
    // (kalau memang berkas hasil upload kita; link Google Drive dibiarkan, bukan milik kita)
    if (deleted?.url) {
      await deleteFromStorageByUrl(deleted.url);
    }

    res.json({ success: true, message: 'Berkas berhasil dihapus' });
  } catch (err) {
    console.error('Error DELETE download:', err.message);
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }
    res.status(500).json({ success: false, message: 'Gagal menghapus data: ' + err.message });
  }
});


// ==========================================
// DATABASE BACKUP / EXPORT (KHUSUS ADMIN)
// ==========================================
app.get('/api/database/summary', ...requireAdmin, async (req, res) => {
  try {
    const summary = await getDatabaseSummary(prisma);
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error GET Database Summary:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil ringkasan database' });
  }
});

app.get('/api/database/export', ...requireAdmin, async (req, res) => {
  try {
    const sql = await generateDatabaseDump(prisma);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-database-${stamp}.sql`;
    res.setHeader('Content-Type', 'application/sql; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(sql);
  } catch (error) {
    console.error('Error GET Database Export:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat file backup database' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Content Service berjalan di http://localhost:${PORT}`);
});