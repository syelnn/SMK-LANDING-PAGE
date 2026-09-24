-- Jalankan SATU KALI di Supabase Dashboard > SQL Editor (project bozeegbvhkhyxyekybma)
-- SEBELUM menjalankan backend versi baru ini.
-- Menambahkan kolom penghubung antara tabel public.users (Prisma) dengan auth.users (Supabase Auth).

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS supabase_id UUID UNIQUE;

-- (Opsional tapi disarankan) Kalau kamu SUDAH punya user lama di public.users yang
-- emailnya SAMA dengan salah satu akun di auth.users, baris ini otomatis menghubungkan mereka:
UPDATE public.users u
SET supabase_id = a.id
FROM auth.users a
WHERE u.email = a.email
  AND u.supabase_id IS NULL;
