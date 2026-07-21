-- ============================================================
-- SAHABAT UMKM — Migrasi 010: Batas Usaha & Hapus Usaha
--
--   - Kolom baru profiles.batas_usaha (default 3) -> berapa usaha
--     maksimal yang boleh dipunya 1 akun sebagai Owner. Bisa diubah
--     manual sama super admin lewat Table Editor Supabase per user
--     (belum ada tombolnya di halaman admin, menyusul kalau perlu).
--   - Izin baru: Owner boleh hapus usahanya sendiri (sebelumnya cuma
--     super admin yang bisa). PENTING: hapus usaha otomatis ikut
--     menghapus semua transaksi/goal/catatan mentor di usaha itu
--     (sudah diatur "on delete cascade" sejak skema awal) - makanya
--     di UI nanti wajib ketik ulang nama usaha buat konfirmasi.
-- ============================================================

alter table profiles add column if not exists batas_usaha int not null default 3;

drop policy if exists "owner hapus usahanya" on tenants;
create policy "owner hapus usahanya" on tenants
  for delete using (has_tenant_role(id, 'owner'));
