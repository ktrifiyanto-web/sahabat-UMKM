-- ============================================================
-- SAHABAT UMKM — Skema Database Fase 1 (MVP)
-- Platform: Supabase (PostgreSQL + Row Level Security)
-- Prinsip: SATU database, isolasi data per-tenant via RLS
-- Jalankan file ini di: Supabase Dashboard > SQL Editor
-- ============================================================

-- ==================== 1. ENUM & TIPE ====================

create type user_role as enum ('super_admin', 'admin_program', 'mentor', 'umkm');
create type tx_type as enum ('masuk', 'keluar');
create type tx_status as enum ('draft', 'perlu_review', 'terverifikasi');
create type goal_status as enum ('aktif', 'tercapai', 'gagal', 'dibatalkan');

-- ==================== 2. TABEL INTI ====================

-- Profil pengguna (terhubung ke Supabase Auth)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  role user_role not null default 'umkm',
  no_hp text,
  created_at timestamptz not null default now()
);

-- Program inkubasi (dikelola Admin Program, mis. Disperindag / Rumah UKM)
create table programs (
  id uuid primary key default gen_random_uuid(),
  nama text not null,                        -- "Inkubasi Bisnis Kebumen 2026"
  lembaga text,                              -- "Disperindag Kebumen"
  admin_id uuid not null references profiles(id),
  mulai date,
  selesai date,
  created_at timestamptz not null default now()
);

-- Tenant = satu usaha UMKM (unit isolasi data)
create table tenants (
  id uuid primary key default gen_random_uuid(),
  nama_usaha text not null,
  jenis_usaha text,                          -- kuliner / fashion / craft / jasa
  owner_id uuid not null references profiles(id),
  program_id uuid references programs(id),   -- boleh null (UMKM mandiri di luar program)
  mentor_id uuid references profiles(id),    -- mentor pendamping
  created_at timestamptz not null default now()
);
create index idx_tenants_owner on tenants(owner_id);
create index idx_tenants_program on tenants(program_id);
create index idx_tenants_mentor on tenants(mentor_id);

-- ==================== 3. MODUL KEUANGAN (inti) ====================

-- Chart of Account per jenis usaha (master data, dikelola Super Admin)
create table coa (
  id serial primary key,
  kode text not null unique,                 -- "4-100"
  nama text not null,                        -- "Pendapatan Penjualan"
  kelompok text not null,                    -- pendapatan / beban / aset / kewajiban / ekuitas
  jenis_usaha text                           -- null = berlaku semua jenis usaha
);

-- Transaksi — jantung aplikasi
create table transactions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  teks_asli text not null,                   -- input santai: "beli gula 200rb"
  nominal bigint,                            -- rupiah utuh, tanpa desimal
  tipe tx_type not null,
  coa_id int references coa(id),
  ai_confidence numeric(3,2),                -- 0.00–1.00, keyakinan kategorisasi AI
  ai_dikoreksi boolean not null default false, -- true jika akuntan/mentor mengoreksi hasil AI (untuk tracking akurasi)
  status tx_status not null default 'draft',
  tanggal date not null default current_date,
  dibuat_oleh uuid not null references profiles(id),
  created_at timestamptz not null default now()
);
-- Index anti-lag: pola query paling sering = per tenant per periode
create index idx_tx_tenant_tanggal on transactions(tenant_id, tanggal desc);
create index idx_tx_status on transactions(tenant_id, status) where status = 'perlu_review';

-- Ringkasan bulanan (dihitung background, BUKAN real-time — prinsip anti-lag)
create table monthly_summaries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  periode date not null,                     -- selalu tanggal 1 bulan ybs
  total_masuk bigint not null default 0,
  total_keluar bigint not null default 0,
  laba bigint not null default 0,
  rincian_beban jsonb,                       -- {"Beban Utilitas": 85000, ...}
  health_score int,                          -- 0–100, mulai dari komponen keuangan saja di Fase 1
  ai_ringkasan text,                         -- narasi AI Financial Analyzer (malam hari)
  dihitung_pada timestamptz,
  unique (tenant_id, periode)
);
create index idx_summary_tenant on monthly_summaries(tenant_id, periode desc);

-- ==================== 4. GOAL & KPI ====================

create table goals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  judul text not null,                       -- "Omzet Juli 10 juta"
  jenis text not null,                       -- omzet / laba / pelanggan / produksi / lainnya
  target_nilai bigint not null,
  nilai_saat_ini bigint not null default 0,
  status goal_status not null default 'aktif',
  deadline date,
  dibuat_oleh uuid not null references profiles(id), -- bisa owner sendiri atau mentor
  created_at timestamptz not null default now()
);
create index idx_goals_tenant on goals(tenant_id, status);

-- ==================== 5. MENTORING ====================

-- Komentar/catatan/tugas mentor (mentor TIDAK mengubah data — hanya menambah catatan)
create table mentor_notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  mentor_id uuid not null references profiles(id),
  jenis text not null default 'komentar',    -- komentar / catatan / tugas / evaluasi
  isi text not null,
  selesai boolean default false,             -- untuk jenis 'tugas'
  created_at timestamptz not null default now()
);
create index idx_notes_tenant on mentor_notes(tenant_id, created_at desc);

-- ==================== 6. NOTIFIKASI ====================

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  judul text not null,
  isi text,
  jenis text not null default 'info',        -- info / warning / mentor / ai
  dibaca boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_notif_user on notifications(user_id, dibaca, created_at desc);

-- ==================== 7. AUDIT TRAIL (anti bocor: jejak semua perubahan) ====================

create table audit_logs (
  id bigserial primary key,
  user_id uuid,
  tenant_id uuid,
  aksi text not null,                        -- insert / update / delete
  tabel text not null,
  record_id text,
  perubahan jsonb,                           -- snapshot sebelum-sesudah
  created_at timestamptz not null default now()
);
create index idx_audit_tenant on audit_logs(tenant_id, created_at desc);

-- Trigger audit otomatis untuk tabel transaksi
create or replace function fn_audit_tx() returns trigger
language plpgsql security definer as $$
begin
  insert into audit_logs (user_id, tenant_id, aksi, tabel, record_id, perubahan)
  values (
    auth.uid(),
    coalesce(new.tenant_id, old.tenant_id),
    lower(tg_op),
    'transactions',
    coalesce(new.id, old.id)::text,
    jsonb_build_object('lama', to_jsonb(old), 'baru', to_jsonb(new))
  );
  return coalesce(new, old);
end $$;

create trigger trg_audit_tx
after insert or update or delete on transactions
for each row execute function fn_audit_tx();

-- ==================== 8. FUNGSI BANTU ROLE ====================

create or replace function my_role() returns user_role
language sql stable security definer as $$
  select role from profiles where id = auth.uid()
$$;

-- Apakah user adalah owner tenant ini?
create or replace function is_tenant_owner(t uuid) returns boolean
language sql stable security definer as $$
  select exists (select 1 from tenants where id = t and owner_id = auth.uid())
$$;

-- Apakah user adalah mentor pendamping tenant ini?
create or replace function is_tenant_mentor(t uuid) returns boolean
language sql stable security definer as $$
  select exists (select 1 from tenants where id = t and mentor_id = auth.uid())
$$;

-- Apakah user adalah admin dari program tertentu? (security definer supaya
-- tidak memicu rekursi saat dipanggil dari kebijakan tabel lain)
create or replace function is_program_admin(prog_id uuid) returns boolean
language sql stable security definer as $$
  select exists (select 1 from programs where id = prog_id and admin_id = auth.uid())
$$;

-- Apakah user adalah admin program yang menaungi tenant ini?
create or replace function is_tenant_admin(t uuid) returns boolean
language sql stable security definer as $$
  select exists (
    select 1 from tenants tn
    join programs p on p.id = tn.program_id
    where tn.id = t and p.admin_id = auth.uid()
  )
$$;

-- ==================== 9. ROW LEVEL SECURITY (jantung "anti bocor") ====================

alter table profiles enable row level security;
alter table programs enable row level security;
alter table tenants enable row level security;
alter table transactions enable row level security;
alter table monthly_summaries enable row level security;
alter table goals enable row level security;
alter table mentor_notes enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;
alter table coa enable row level security;

-- ---- profiles ----
create policy "lihat profil sendiri" on profiles
  for select using (id = auth.uid() or my_role() in ('super_admin', 'admin_program'));
create policy "user buat profil sendiri" on profiles
  for insert with check (id = auth.uid());
create policy "ubah profil sendiri" on profiles
  for update using (id = auth.uid());
create policy "super admin kelola profil" on profiles
  for all using (my_role() = 'super_admin');

-- ---- coa (master data: semua boleh baca, hanya super admin ubah) ----
create policy "semua baca coa" on coa for select using (true);
create policy "super admin kelola coa" on coa
  for all using (my_role() = 'super_admin');

-- ---- programs ----
create policy "admin lihat programnya" on programs
  for select using (admin_id = auth.uid() or my_role() = 'super_admin');
create policy "peserta lihat programnya" on programs
  for select using (exists (
    select 1 from tenants where tenants.program_id = programs.id and tenants.owner_id = auth.uid()
  ));
create policy "super admin kelola program" on programs
  for all using (my_role() = 'super_admin');
create policy "admin kelola programnya" on programs
  for update using (admin_id = auth.uid());

-- ---- tenants ----
create policy "akses tenant sesuai peran" on tenants
  for select using (
    owner_id = auth.uid()
    or mentor_id = auth.uid()
    or my_role() = 'super_admin'
    or (program_id is not null and is_program_admin(program_id))
  );
create policy "owner ubah tenantnya" on tenants
  for update using (owner_id = auth.uid());
create policy "owner buat tenant sendiri" on tenants
  for insert with check (owner_id = auth.uid());
create policy "super admin kelola tenant" on tenants
  for all using (my_role() = 'super_admin');

-- ---- transactions (isolasi paling kritis) ----
-- Owner: penuh atas transaksinya sendiri
create policy "owner kelola transaksinya" on transactions
  for all using (is_tenant_owner(tenant_id));
-- Mentor: HANYA BACA (sesuai blueprint: mentor tidak mengubah database)
create policy "mentor baca transaksi dampingan" on transactions
  for select using (is_tenant_mentor(tenant_id));
-- Admin program: hanya baca UMKM di programnya
create policy "admin baca transaksi programnya" on transactions
  for select using (is_tenant_admin(tenant_id));
-- Super admin: penuh
create policy "super admin kelola transaksi" on transactions
  for all using (my_role() = 'super_admin');

-- ---- monthly_summaries ----
create policy "baca ringkasan sesuai peran" on monthly_summaries
  for select using (
    is_tenant_owner(tenant_id) or is_tenant_mentor(tenant_id)
    or is_tenant_admin(tenant_id) or my_role() = 'super_admin'
  );
-- insert/update ringkasan hanya lewat service role (background job), bukan dari client

-- ---- goals ----
create policy "owner kelola goal" on goals
  for all using (is_tenant_owner(tenant_id));
create policy "mentor lihat & buat goal dampingan" on goals
  for select using (is_tenant_mentor(tenant_id));
create policy "mentor tambah goal dampingan" on goals
  for insert with check (is_tenant_mentor(tenant_id) and dibuat_oleh = auth.uid());
create policy "admin & super lihat goal" on goals
  for select using (is_tenant_admin(tenant_id) or my_role() = 'super_admin');

-- ---- mentor_notes ----
create policy "owner baca catatan mentornya" on mentor_notes
  for select using (is_tenant_owner(tenant_id));
create policy "owner tandai tugas selesai" on mentor_notes
  for update using (is_tenant_owner(tenant_id));
create policy "mentor kelola catatannya" on mentor_notes
  for all using (mentor_id = auth.uid() and is_tenant_mentor(tenant_id));
create policy "admin & super baca catatan" on mentor_notes
  for select using (is_tenant_admin(tenant_id) or my_role() = 'super_admin');

-- ---- notifications ----
create policy "notifikasi milik sendiri" on notifications
  for select using (user_id = auth.uid());
create policy "tandai dibaca" on notifications
  for update using (user_id = auth.uid());

-- ---- audit_logs (hanya super admin & admin program terkait yang bisa baca) ----
create policy "super admin baca audit" on audit_logs
  for select using (my_role() = 'super_admin');
create policy "admin baca audit programnya" on audit_logs
  for select using (tenant_id is not null and is_tenant_admin(tenant_id));

-- ==================== 11. AUTO-BUAT PROFIL SAAT DAFTAR ====================
-- Supaya UMKM bisa daftar mandiri tanpa perlu Admin Program membuatkan akun dulu.

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nama, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'nama', 'Pengguna Baru'), 'umkm')
  on conflict (id) do nothing;
  return new;
end $$;

create trigger trg_new_user
after insert on auth.users
for each row execute function handle_new_user();

-- ==================== 12. SEED CHART OF ACCOUNT (SAK EMKM ringkas) ====================

insert into coa (kode, nama, kelompok, jenis_usaha) values
  ('4-100', 'Pendapatan Penjualan',        'pendapatan', null),
  ('4-110', 'Pendapatan Penjualan Online', 'pendapatan', null),
  ('4-200', 'Pendapatan Lain-lain',        'pendapatan', null),
  ('2-300', 'Uang Muka Pelanggan',         'kewajiban',  null),
  ('5-100', 'Beban Bahan Baku',            'beban', null),
  ('5-110', 'Beban Kemasan',               'beban', null),
  ('5-200', 'Beban Gaji',                  'beban', null),
  ('5-300', 'Beban Utilitas',              'beban', null),
  ('5-310', 'Beban Sewa',                  'beban', null),
  ('5-400', 'Beban Transportasi',          'beban', null),
  ('5-500', 'Beban Pemasaran',             'beban', null),
  ('5-900', 'Beban Operasional Lainnya',   'beban', null),
  ('9-000', 'Belum Terkategori',           'lainnya', null),
  ('1-100', 'Kas',                         'aset', null),
  ('1-200', 'Piutang Usaha',               'aset', null),
  ('1-300', 'Persediaan',                  'aset', null),
  ('2-100', 'Utang Usaha',                 'kewajiban', null);

-- ============================================================
-- SELESAI. Verifikasi cepat setelah menjalankan:
--   select tablename, policyname from pg_policies order by tablename;
-- Semua tabel harus punya policy — tabel ber-RLS tanpa policy = tidak bisa diakses siapa pun.
-- ============================================================
