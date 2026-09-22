const jwt = require('jsonwebtoken');

// Middleware ini IDENTIK untuk auth-service, content-service, dan core-service.
// Pemakaian:  const { verifyToken, checkRole, optionalAuth } = require('./middleware/authMiddleware')(prisma);
module.exports = (prisma) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET belum diisi di .env — server dihentikan demi keamanan.');
  }

  const fail = (status, code, message) => Object.assign(new Error(message), { status, code });

  const readToken = (req) => {
    const [scheme, token] = String(req.headers.authorization || '').split(' ');
    return scheme === 'Bearer' && token ? token : null;
  };

  // Verifikasi tanda tangan JWT + cek ke DB (user masih ada, masih aktif, role terbaru)
  const authenticate = async (token) => {
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch (e) {
      throw fail(401, e.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
        'Sesi tidak valid atau sudah berakhir. Silakan login ulang.');
    }

    const id = Number(decoded.id);
    if (!Number.isInteger(id)) throw fail(401, 'TOKEN_INVALID', 'Sesi tidak valid. Silakan login ulang.');

    // core-service tidak punya model User -> cukup verifikasi JWT
    if (!prisma || !prisma.user) {
      return { id, username: decoded.username, role: String(decoded.role || 'viewer').toLowerCase() };
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, email: true, fullName: true, role: true, isActive: true },
    });
    if (!user) throw fail(401, 'USER_NOT_FOUND', 'Akun tidak ditemukan. Silakan login ulang.');
    if (user.isActive === 0 || user.isActive === false) {
      throw fail(401, 'USER_INACTIVE', 'Akun Anda dinonaktifkan. Hubungi Administrator.');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: String(user.role || 'viewer').toLowerCase(), // role SELALU dari DB, bukan dari token
    };
  };

  // Wajib login
  const verifyToken = async (req, res, next) => {
    const token = readToken(req);
    if (!token) return res.status(401).json({ success: false, code: 'NO_TOKEN', message: 'Akses ditolak. Silakan login.' });
    try {
      req.user = await authenticate(token);
      return next();
    } catch (err) {
      if (err.status) return res.status(err.status).json({ success: false, code: err.code, message: err.message });
      console.error('Auth error:', err);
      return res.status(500).json({ success: false, message: 'Gagal memverifikasi sesi.' });
    }
  };

  // Login opsional: kalau token valid -> req.user terisi, kalau tidak -> lanjut sebagai tamu
  const optionalAuth = async (req, res, next) => {
    const token = readToken(req);
    if (token) {
      try { req.user = await authenticate(token); } catch { /* dianggap tamu */ }
    }
    next();
  };

  // Batasi role (dipasang SETELAH verifyToken)
  const checkRole = (roles) => {
    const allowed = roles.map((r) => String(r).toLowerCase());
    return (req, res, next) => {
      if (!req.user || !allowed.includes(req.user.role)) {
        return res.status(403).json({ success: false, code: 'FORBIDDEN_ROLE', message: 'Akses ditolak. Anda tidak memiliki izin.' });
      }
      next();
    };
  };

  return { verifyToken, optionalAuth, checkRole };
};