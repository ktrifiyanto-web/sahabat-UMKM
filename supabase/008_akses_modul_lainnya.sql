-- ============================================================
-- SAHABAT UMKM — Migrasi 008: Akses Admin & Member ke Modul Lain
-- Lanjutan migrasi 006 & 007.
--
-- Waktu nulis migrasi 007, saya belum tahu ada 5 tabel ini (baru
-- ketahuan setelah lihat migrasi 003 di project asli): sector_reports,
-- projects, roadmaps, strategies, chat_messages. Migrasi ini menambah
-- akses admin & member ke situ juga, biar konsisten.
--
-- Aturan yang dipasang:
--   Target/Aktual Sektor, Project 90 Hari, Roadmap, Strategi
--     -> Admin & Member: CUMA LIHAT (owner tetap satu-satunya yang ubah,
--        konsisten dengan goal & catatan mentor)
--   Chat Mentor
--     -> Admin: boleh lihat & kirim pesan ke mentor (bantu owner)
--     -> Member: TIDAK dapat akses (obrolan pendampingan levelnya
--        pemilik usaha, bukan staf cabang)
--
-- Aman dijalankan berkali-kali. Jalankan SETELAH migrasi 006 & 007.
-- ============================================================

-- ==================== SEKTOR, PROJECT, ROADMAP, STRATEGI (lihat saja) ====================

drop policy if exists "anggota usaha lihat sektor" on sector_reports;
create policy "anggota usaha lihat sektor" on sector_reports
  for select using (is_tenant_member(tenant_id));

drop policy if exists "anggota usaha lihat project" on projects;
create policy "anggota usaha lihat project" on projects
  for select using (is_tenant_member(tenant_id));

drop policy if exists "anggota usaha lihat roadmap" on roadmaps;
create policy "anggota usaha lihat roadmap" on roadmaps
  for select using (is_tenant_member(tenant_id));

drop policy if exists "anggota usaha lihat strategi" on strategies;
create policy "anggota usaha lihat strategi" on strategies
  for select using (is_tenant_member(tenant_id));

-- ==================== CHAT MENTOR (admin boleh ikut, member tidak) ====================

drop policy if exists "admin usaha lihat chat" on chat_messages;
create policy "admin usaha lihat chat" on chat_messages
  for select using (has_tenant_role(tenant_id, 'admin'));

drop policy if exists "admin usaha kirim chat" on chat_messages;
create policy "admin usaha kirim chat" on chat_messages
  for insert with check (
    sender_id = auth.uid() and has_tenant_role(tenant_id, 'admin')
  );

-- ============================================================
-- VERIFIKASI: login sebagai akun 'admin' di satu usaha, buka halaman
-- Target & Sektor / Project 90 Hari / Roadmap / Strategi -> harus bisa
-- lihat isinya tapi tombol simpan/ubah sebaiknya disembunyikan di UI
-- (RLS di database sudah menolak perubahan dari admin/member, tapi
-- tampilan tombolnya masih ikut kode lama — akan dirapikan pas
-- halaman-halaman ini disentuh lagi).
-- ============================================================
