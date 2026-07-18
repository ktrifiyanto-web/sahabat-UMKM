# SobatUMKM — Panduan Deploy

Aplikasi pembukuan santai untuk UMKM. Fase 1 MVP: login, smart input transaksi
(AI Gemini), dashboard keuangan, laporan Laba Rugi, dan target/KPI.

Stack: Next.js 16 · Supabase (database + auth + keamanan multi-tenant) · Gemini API (AI)

---

## Langkah 1 — Siapkan Database (Supabase)

1. Buat akun gratis di **[supabase.com](https://supabase.com)** → New Project
2. Tunggu project selesai dibuat (±2 menit), lalu buka menu **SQL Editor**
3. Buka file `supabase/schema.sql` di folder ini, salin semua isinya, tempel di SQL Editor, lalu klik **Run**
4. Verifikasi berhasil dengan menjalankan query ini di SQL Editor:
   ```sql
   select tablename, policyname from pg_policies order by tablename;
   ```
   Harus muncul banyak baris (kebijakan keamanan tiap tabel).
5. Buka menu **Project Settings > API**, catat dua nilai ini untuk langkah berikutnya:
   - **Project URL**
   - **anon public key**

## Langkah 2 — Siapkan Kunci AI (Gemini, gratis)

1. Buka **[aistudio.google.com/apikey](https://aistudio.google.com/apikey)**
2. Login pakai akun Google → **Create API Key**
3. Catat kunci ini untuk langkah berikutnya

## Langkah 3 — Coba di Komputer Sendiri (opsional tapi disarankan)

Butuh [Node.js](https://nodejs.org) versi 18 ke atas sudah terpasang.

```bash
npm install
cp .env.example .env.local
```

Buka file `.env.local`, isi tiga nilai dari Langkah 1 & 2:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...
```

Lalu jalankan:
```bash
npm run dev
```

Buka `http://localhost:3000` — coba daftar akun & catat transaksi pertama.

## Langkah 4 — Deploy ke Internet (Vercel)

**Opsi A — Lewat GitHub (disarankan, lebih mudah update selanjutnya)**

1. Buat repo baru di [github.com](https://github.com) (kosong, tanpa README)
2. Di folder project ini, jalankan:
   ```bash
   git init
   git add .
   git commit -m "SobatUMKM MVP"
   git branch -M main
   git remote add origin <URL_REPO_GITHUB_KAMU>
   git push -u origin main
   ```
3. Buat akun gratis di **[vercel.com](https://vercel.com)** (bisa langsung pakai akun GitHub)
4. Klik **Add New > Project**, pilih repo yang baru di-push
5. Sebelum klik Deploy, buka bagian **Environment Variables**, isi tiga nilai yang sama seperti `.env.local` (Langkah 1 & 2)
6. Klik **Deploy** — tunggu ±2 menit, aplikasi sudah online dengan alamat `.vercel.app`

**Opsi B — Langsung dari komputer (tanpa GitHub)**

```bash
npx vercel login
npx vercel --prod
```
Ikuti instruksi di layar (login lewat browser pakai akun kamu sendiri), lalu saat ditanya
Environment Variables, isi tiga nilai dari Langkah 1 & 2.

## Langkah 5 — Sambungkan Domain Sendiri (nanti, kalau sudah siap)

Di dashboard Vercel project kamu → menu **Domains** → tambahkan domain yang sudah dibeli
(mis. dari Niagahoster/Rumahweb) → ikuti instruksi DNS yang muncul.

---

## Struktur Project

```
app/
  login/, register/        — halaman masuk & daftar
  dashboard/                — dashboard utama UMKM (ringkasan, input, daftar transaksi)
  dashboard/laporan/        — Laporan Laba Rugi otomatis
  dashboard/goals/          — Target & KPI
  api/kategorisasi/         — endpoint AI kategorisasi teks (Gemini Flash-Lite)
  api/ocr-struk/            — endpoint AI baca foto struk (Gemini Flash)
lib/supabase/               — koneksi database & sesi login
lib/kategorisasi-lokal.js   — aturan kategorisasi instan (gratis, jalan sebelum AI)
supabase/schema.sql         — skema database lengkap + keamanan multi-tenant
```

## Catatan Penting

- **Kunci Gemini aman**: hanya dipakai di server (`api/kategorisasi`, `api/ocr-struk`),
  tidak pernah terkirim ke browser pengguna.
- **Keamanan data antar UMKM**: diatur lewat Row Level Security di `schema.sql` —
  setiap pemilik usaha hanya bisa melihat datanya sendiri, walau satu database dipakai bersama.
- **Belum ada Panel Akuntan/Mentor** — sengaja ditunda dulu sesuai kesepakatan, gampang
  ditambahkan kembali kapan saja.
- Biaya berjalan: Supabase & Vercel gratis untuk skala puluhan UMKM pertama; Gemini API
  dibayar per pemakaian (sangat kecil untuk volume transaksi UMKM harian).
