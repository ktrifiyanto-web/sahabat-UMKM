-- ============================================================
-- MIGRASI 005 — Perbaiki infinite recursion RLS (tenants <-> programs)
-- Jalankan TAMBAHAN di Supabase SQL Editor (setelah 001-004)
--
-- Akar masalah: kebijakan SELECT tabel "tenants" mengecek ke tabel
-- "programs", dan kebijakan SELECT tabel "programs" balik mengecek
-- ke tabel "tenants" -> saling memanggil tanpa henti.
--
-- Perbaikan: ganti pengecekan langsung ke tabel programs dengan
-- fungsi SECURITY DEFINER (fungsi ini "melompati" RLS saat dipanggil
-- dari policy lain, jadi lingkarannya putus).
-- ============================================================

create or replace function is_program_admin(prog_id uuid) returns boolean
language sql stable security definer as $$
  select exists (select 1 from programs where id = prog_id and admin_id = auth.uid())
$$;

drop policy if exists "akses tenant sesuai peran" on tenants;
create policy "akses tenant sesuai peran" on tenants
  for select using (
    owner_id = auth.uid()
    or mentor_id = auth.uid()
    or my_role() = 'super_admin'
    or (program_id is not null and is_program_admin(program_id))
  );
