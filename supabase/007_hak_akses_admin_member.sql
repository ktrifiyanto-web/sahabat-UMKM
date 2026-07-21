-- ============================================================
-- SAHABAT UMKM — Migrasi 007: Hak Akses Admin & Member per Usaha
-- TAHAP 2 dari restrukturisasi multi-bisnis (lanjutan migrasi 006).
--
-- Ringkasan aturan yang dipasang di sini:
--   OWNER   -> tetap akses penuh (tidak berubah dari sebelumnya)
--   ADMIN   -> transaksi & keuangan: boleh input & edit, TIDAK boleh hapus
--              boleh lihat ringkasan bulanan usaha
--              goal & catatan mentor: cuma lihat, tidak boleh ubah
--   MEMBER  -> transaksi: boleh input, tapi cuma bisa lihat transaksi
--              yang dia buat sendiri (bukan punya seluruh usaha)
--              tidak boleh edit/hapus transaksi apapun
--              goal & catatan mentor: cuma lihat
--              TIDAK dapat lihat ringkasan bulanan (itu punya level usaha,
--              bukan punya dia sendiri)
--
-- Jalankan SETELAH migrasi 006 dan sudah diverifikasi berhasil.
-- Aman dijalankan berkali-kali (DROP POLICY IF EXISTS dulu sebelum CREATE).
-- ============================================================

-- ==================== 1. FUNGSI BANTU: CEK PERAN SPESIFIK ====================

create or replace function has_tenant_role(t uuid, r tenant_member_role) returns boolean
language sql stable security definer as $$
  select exists (
    select 1 from tenant_members
    where tenant_id = t and user_id = auth.uid() and peran = r
  )
$$;

-- ==================== 2. TRANSAKSI ====================
-- Kebijakan lama (owner/mentor/admin-program/super-admin) TIDAK disentuh,
-- ini cuma menambahkan kebijakan baru untuk peran admin & member.

drop policy if exists "admin usaha lihat transaksi" on transactions;
create policy "admin usaha lihat transaksi" on transactions
  for select using (has_tenant_role(tenant_id, 'admin'));

drop policy if exists "admin usaha input transaksi" on transactions;
create policy "admin usaha input transaksi" on transactions
  for insert with check (has_tenant_role(tenant_id, 'admin'));

drop policy if exists "admin usaha edit transaksi" on transactions;
create policy "admin usaha edit transaksi" on transactions
  for update using (has_tenant_role(tenant_id, 'admin'));
-- (sengaja tidak ada kebijakan DELETE untuk admin -> otomatis tidak bisa hapus)

drop policy if exists "member usaha input transaksi" on transactions;
create policy "member usaha input transaksi" on transactions
  for insert with check (has_tenant_role(tenant_id, 'member'));

drop policy if exists "member usaha lihat transaksi sendiri" on transactions;
create policy "member usaha lihat transaksi sendiri" on transactions
  for select using (has_tenant_role(tenant_id, 'member') and dibuat_oleh = auth.uid());
-- (sengaja tidak ada kebijakan UPDATE/DELETE untuk member -> transaksi yang
--  sudah dikirim tidak bisa diubah sendiri, cuma owner/admin yang bisa koreksi)

-- ==================== 3. RINGKASAN BULANAN ====================

drop policy if exists "admin usaha lihat ringkasan" on monthly_summaries;
create policy "admin usaha lihat ringkasan" on monthly_summaries
  for select using (has_tenant_role(tenant_id, 'admin'));
-- (member sengaja TIDAK ditambahkan di sini -> tidak lihat ringkasan usaha)

-- ==================== 4. GOAL (LIHAT SAJA UNTUK ADMIN & MEMBER) ====================

drop policy if exists "anggota usaha lihat goal" on goals;
create policy "anggota usaha lihat goal" on goals
  for select using (is_tenant_member(tenant_id));
-- insert/update goal tetap cuma owner (kebijakan lama) & mentor (kebijakan lama)

-- ==================== 5. CATATAN MENTOR (LIHAT SAJA UNTUK ADMIN & MEMBER) ====================

drop policy if exists "anggota usaha lihat catatan mentor" on mentor_notes;
create policy "anggota usaha lihat catatan mentor" on mentor_notes
  for select using (is_tenant_member(tenant_id));
-- tandai tugas selesai & catatan baru tetap cuma owner/mentor (kebijakan lama)

-- ============================================================
-- VERIFIKASI SETELAH DIJALANKAN — coba dari akun uji:
--   1. Login sebagai user dengan peran 'admin' di satu usaha ->
--      coba input transaksi (harus berhasil), coba hapus transaksi (harus GAGAL)
--   2. Login sebagai user dengan peran 'member' ->
--      input transaksi (harus berhasil), lihat daftar transaksi
--      (harus CUMA muncul miliknya sendiri, bukan punya semua orang)
--   3. Cek ringkasan bulanan tidak muncul untuk akun 'member'
-- ============================================================
