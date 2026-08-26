const jwt = require('jsonwebtoken');

// Fungsi 1: Mengecek apakah pengunjung membawa token yang sah
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Mengambil token dari header "Bearer <token>"

  if (!token) return res.status(401).json({ message: 'Akses ditolak. Token tidak ada!' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Token tidak valid atau sudah kadaluarsa!' });
    req.user = decoded; // Menyimpan data user (id, username, role) ke request
    next(); // Lanjut ke proses berikutnya
  });
};

// Fungsi 2: Mengecek apakah role sesuai (Khusus Admin atau Editor)
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Akses ditolak. Anda tidak memiliki izin untuk halaman ini!' });
    }
    next();
  };
};

module.exports = { verifyToken, checkRole };