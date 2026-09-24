// lib/supabaseClients.js
// Dua client Supabase dipakai di sini dengan tujuan BERBEDA:
//
// 1. supabaseAuth (anon key)
//    Dipakai HANYA untuk memverifikasi email+password saat login
//    (auth.signInWithPassword). Anon key aman dipakai di server karena
//    perilakunya sama seperti dipakai di browser: tidak bisa dipakai untuk
//    operasi admin apapun.
//
// 2. supabaseAdmin (service_role key)
//    Dipakai untuk operasi ADMIN: reset password user lain, hapus akun
//    Supabase saat admin menghapus user, update email tanpa perlu
//    verifikasi ulang, dsb. Kunci ini SANGAT RAHASIA — jangan pernah
//    dikirim ke frontend, hanya boleh ada di backend (.env, tidak di-commit).
//
// Kalau SUPABASE_SERVICE_ROLE_KEY belum diisi, server tetap bisa jalan
// (login/register/dll tetap berfungsi), tapi endpoint yang butuh admin
// client (reset password user lain, hapus akun Supabase, upload avatar,
// edit email) akan menolak dengan pesan yang jelas alih-alih crash.

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'SUPABASE_URL / SUPABASE_ANON_KEY belum diisi di .env auth-service. ' +
    'Ambil dari Supabase Dashboard > Project Settings > API.'
  );
}

// Client "biasa" — setara dengan yang dipakai di frontend, dipakai untuk login.
const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Client admin — null kalau service role key belum diisi, supaya jelas terdeteksi.
const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

// Client anon SEKALI PAKAI (tanpa state) — dipakai untuk verifikasi OTP supaya sesi
// sementara hasil verifyOtp tidak menempel di client bersama antar-request.
const createStatelessAuthClient = () =>
  createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });

const requireSupabaseAdmin = (res) => {
  if (!supabaseAdmin) {
    res.status(500).json({
      success: false,
      message: 'SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di server. Fitur ini butuh service role key dari Supabase Dashboard.',
    });
    return null;
  }
  return supabaseAdmin;
};

module.exports = { supabaseAuth, supabaseAdmin, requireSupabaseAdmin, createStatelessAuthClient };
