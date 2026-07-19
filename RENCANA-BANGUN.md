# SobatUMKM — Status Pembangunan (Eksekusi Final Mockup)

## Sudah dibangun (sesuai mockup yang disetujui)

**Tenant** (`/dashboard`): Ringkasan (hero skor kesehatan + checklist tugas centang cepat + catat cepat 1 baris),
Target & Sektor, Project 90 Hari, Target Jangka Panjang, Strategi & Peluang,
Keuangan (otomatis, YTD + YoY), Profil Usaha (template inkubasi + upload foto), Chat Mentor.

**Mentor** (`/mentor`): daftar tenant + ring skor warna + KPI + pengingat cek berkala (>7 hari ditandai),
detail tenant memanjang (foto, riwayat arahan, set target sektor, form Arahan/Evaluasi/Tugas), chat per tenant.

**Super Admin** (`/admin`): ringkasan platform, Kelola Akun (buat akun mentor/tenant langsung
tanpa signup + atur mentor per tenant), Blast Pesan (notifikasi serentak), Export Data (CSV semua tabel).
Super admin bisa membuka dashboard mentor mana pun.

**Tema**: water bubble terang futuristik, responsif HP (bottom nav) & desktop (sidebar).

## LANGKAH DEPLOY (urut!)

1. **Supabase SQL Editor** → jalankan `supabase/003_laporan_chat_profil.sql` (sekali saja)
2. **Supabase Storage** → buat bucket baru bernama `foto-usaha`, set **Public** (untuk upload foto profil)
3. **Vercel → Settings → Environment Variables** → tambah `SUPABASE_SERVICE_ROLE_KEY`
   (ambil dari Supabase → Project Settings → API → `service_role` — RAHASIA, jangan dibagikan)
4. **Jadikan akunmu super admin** (sekali saja, di SQL Editor):
   ```sql
   select id, nama, role from profiles;  -- cari ID akunmu
   update profiles set role = 'super_admin' where id = 'ID_AKUNMU';
   ```
5. `git add .` → `git commit -m "eksekusi final"` → `git push` → tunggu Vercel Ready

## Belum dibangun (disepakati ditunda)
UMKM umum/publik (digarap setelah tenant-mentor-admin running), marketplace akuntan (+-3 bulan),
Fase 2-3 blueprint (Health Score AI, modul pembelajaran, business matching).
