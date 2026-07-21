-- ============================================================
-- SAHABAT UMKM — Migrasi 006: Multi-Bisnis (Keanggotaan Usaha)
-- TAHAP 1 dari restrukturisasi multi-bisnis:
--   - Tabel baru tenant_members (siapa terhubung ke usaha mana, peran apa)
--   - Backfill: pemilik usaha yang sudah ada otomatis jadi 'owner'
--   - Trigger: usaha baru ke depannya otomatis dapat baris owner juga
--   - Lepas kunci lama "1 usaha per pemilik" (dari migrasi 004)
--   - Perluas kebijakan lihat usaha, supaya admin/member baru ikut bisa lihat
--
-- BELUM termasuk di migrasi ini (menyusul di 007 setelah ini diuji):
--   - Perizinan detail transaksi/goal/laporan per peran (owner/admin/member)
--   - UI "Bisnis Saya" & alur undang anggota
--
-- Aman dijalankan berkali-kali (semua langkah pakai IF NOT EXISTS /
-- ON CONFLICT / DROP ... IF EXISTS). Jalankan SETELAH migrasi 001-005.
-- Ini TAMBAHAN, bukan pengganti file sebelumnya.
-- ============================================================

-- ==================== 1. TIPE PERAN KEANGGOTAAN ====================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'tenant_member_role') then
    create type tenant_member_role as enum ('owner', 'admin', 'member');
  end if;
end $$;

-- ==================== 2. TABEL KEANGGOTAAN ====================

create table if not exists tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  peran tenant_member_role not null default 'member',
  diundang_oleh uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);
create index if not exists idx_tenant_members_tenant on tenant_members(tenant_id);
create index if not exists idx_tenant_members_user on tenant_members(user_id);

-- ==================== 3. BACKFILL: PEMILIK LAMA JADI 'owner' ====================

insert into tenant_members (tenant_id, user_id, peran)
select id, owner_id, 'owner' from tenants
on conflict (tenant_id, user_id) do nothing;

-- ==================== 4. TRIGGER: USAHA BARU OTOMATIS DAPAT OWNER ====================
-- Supaya usaha yang dibuat SETELAH migrasi ini juga otomatis tercatat,
-- tidak cuma usaha lama yang di-backfill di atas.

create or replace function fn_auto_owner_membership() returns trigger
language plpgsql security definer as $$
begin
  insert into tenant_members (tenant_id, user_id, peran)
  values (new.id, new.owner_id, 'owner')
  on conflict (tenant_id, user_id) do nothing;
  return new;
end $$;

drop trigger if exists trg_auto_owner_membership on tenants;
create trigger trg_auto_owner_membership
after insert on tenants
for each row execute function fn_auto_owner_membership();

-- ==================== 5. LEPAS KUNCI "1 USAHA PER PEMILIK" (dari migrasi 004) ====================
-- Dicari otomatis lewat katalog Postgres (bukan hardcode nama constraint),
-- supaya tetap aman walau nama aslinya beda dari dugaan. Kalau tidak ketemu
-- apa-apa, blok ini tidak melakukan apa-apa (aman, tidak error).

do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'tenants'::regclass and contype = 'u'
      and pg_get_constraintdef(oid) ilike '%owner_id%'
  loop
    execute format('alter table tenants drop constraint %I', r.conname);
    raise notice 'Constraint % dihapus dari tenants', r.conname;
  end loop;

  for r in
    select indexname from pg_indexes
    where tablename = 'tenants' and indexdef ilike '%unique%' and indexdef ilike '%owner_id%'
  loop
    execute format('drop index if exists %I', r.indexname);
    raise notice 'Index % dihapus dari tenants', r.indexname;
  end loop;
end $$;

-- ==================== 6. FUNGSI BANTU BARU (security definer, anti-rekursi) ====================

create or replace function is_tenant_member(t uuid) returns boolean
language sql stable security definer as $$
  select exists (select 1 from tenant_members where tenant_id = t and user_id = auth.uid())
$$;

create or replace function is_tenant_admin_or_owner(t uuid) returns boolean
language sql stable security definer as $$
  select exists (
    select 1 from tenant_members
    where tenant_id = t and user_id = auth.uid() and peran in ('owner','admin')
  )
$$;

-- ==================== 7. RLS UNTUK TABEL BARU ====================

alter table tenant_members enable row level security;

drop policy if exists "anggota lihat sesama anggota usahanya" on tenant_members;
create policy "anggota lihat sesama anggota usahanya" on tenant_members
  for select using (is_tenant_member(tenant_id) or my_role() = 'super_admin');

drop policy if exists "owner kelola keanggotaan usahanya" on tenant_members;
create policy "owner kelola keanggotaan usahanya" on tenant_members
  for all using (
    exists (
      select 1 from tenant_members m
      where m.tenant_id = tenant_members.tenant_id
        and m.user_id = auth.uid() and m.peran = 'owner'
    )
    or my_role() = 'super_admin'
  );

-- ==================== 8. PERLUAS KEBIJAKAN "LIHAT USAHA" ====================
-- Kebijakan lama cuma cek owner_id/mentor_id/admin program, belum tahu soal
-- tenant_members. Ini perlu diperluas supaya admin/member baru bisa lihat
-- usaha yang mereka ikuti.

drop policy if exists "akses tenant sesuai peran" on tenants;
create policy "akses tenant sesuai peran" on tenants
  for select using (
    owner_id = auth.uid()
    or mentor_id = auth.uid()
    or is_tenant_member(id)
    or my_role() = 'super_admin'
    or (program_id is not null and is_program_admin(program_id))
  );

-- ============================================================
-- VERIFIKASI SETELAH DIJALANKAN — jalankan query ini di SQL Editor:
--
--   select t.nama_usaha, tm.peran, p.nama
--   from tenant_members tm
--   join tenants t on t.id = tm.tenant_id
--   join profiles p on p.id = tm.user_id
--   order by t.nama_usaha;
--
-- Semua usaha yang sudah ada harus muncul di sini dengan peran 'owner'.
-- Kalau ada usaha yang TIDAK muncul, jangan lanjut ke tahap berikutnya —
-- laporkan dulu supaya dicek.
-- ============================================================
