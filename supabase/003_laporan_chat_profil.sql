-- ============================================================
-- MIGRASI 003 — Laporan Tenant, Chat, Profil, Cek Berkala
-- Jalankan TAMBAHAN di Supabase SQL Editor (setelah 001 & 002)
-- ============================================================

-- ---- 1. Kolom profil tambahan di tenants ----
alter table tenants add column if not exists angkatan text;
alter table tenants add column if not exists nomor_stand text;
alter table tenants add column if not exists tahun_berdiri text;
alter table tenants add column if not exists alamat text;
alter table tenants add column if not exists jumlah_tim text;
alter table tenants add column if not exists kontak text;
alter table tenants add column if not exists media_sosial text;
alter table tenants add column if not exists marketplace text;
alter table tenants add column if not exists produk_utama text;
alter table tenants add column if not exists foto_owner_url text;
alter table tenants add column if not exists foto_produk_url text;
alter table tenants add column if not exists logo_url text;
alter table tenants add column if not exists last_mentor_check timestamptz;

-- ---- 2. Target & aktual per sektor (1 baris per tenant) ----
create table if not exists sector_reports (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  pelanggan_aktual int default 0,
  pelanggan_target int default 0,
  tim_aktual int default 0,
  tim_target int default 0,
  mitra_aktual int default 0,
  mitra_target int default 0,
  legalitas_status text,
  legalitas_catatan text,
  updated_at timestamptz default now()
);

-- ---- 3. Project 90 hari ----
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  nama text not null,
  status text not null default 'rencana', -- rencana | berjalan | selesai
  target_selesai date,
  created_at timestamptz default now()
);
create index if not exists idx_projects_tenant on projects(tenant_id);

-- ---- 4. Roadmap jangka panjang (1 baris per tenant) ----
create table if not exists roadmaps (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  target_2026 text,
  target_2027 text,
  target_2028 text,
  updated_at timestamptz default now()
);

-- ---- 5. Strategi & peluang (1 baris per tenant) ----
create table if not exists strategies (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  strategi_utama text,
  prioritas_pengembangan text,
  bottleneck text,
  peluang text,
  updated_at timestamptz default now()
);

-- ---- 6. Chat tenant <-> mentor ----
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  isi text not null,
  dibaca boolean not null default false,
  created_at timestamptz default now()
);
create index if not exists idx_chat_tenant on chat_messages(tenant_id, created_at);

-- ---- 7. RLS ----
alter table sector_reports enable row level security;
alter table projects enable row level security;
alter table roadmaps enable row level security;
alter table strategies enable row level security;
alter table chat_messages enable row level security;

-- sector_reports: owner isi AKTUAL, mentor isi TARGET — dua-duanya boleh upsert
create policy "akses sector sesuai peran" on sector_reports for select
  using (is_tenant_owner(tenant_id) or is_tenant_mentor(tenant_id) or is_tenant_admin(tenant_id) or my_role() = 'super_admin');
create policy "owner tulis sector" on sector_reports for insert
  with check (is_tenant_owner(tenant_id) or is_tenant_mentor(tenant_id) or my_role() = 'super_admin');
create policy "owner ubah sector" on sector_reports for update
  using (is_tenant_owner(tenant_id) or is_tenant_mentor(tenant_id) or my_role() = 'super_admin');

-- projects: owner penuh, mentor & admin baca
create policy "owner kelola project" on projects for all using (is_tenant_owner(tenant_id));
create policy "mentor admin baca project" on projects for select
  using (is_tenant_mentor(tenant_id) or is_tenant_admin(tenant_id) or my_role() = 'super_admin');
create policy "super admin kelola project" on projects for all using (my_role() = 'super_admin');

-- roadmaps & strategies: owner penuh, mentor & admin baca
create policy "owner kelola roadmap" on roadmaps for all using (is_tenant_owner(tenant_id));
create policy "mentor admin baca roadmap" on roadmaps for select
  using (is_tenant_mentor(tenant_id) or is_tenant_admin(tenant_id) or my_role() = 'super_admin');
create policy "super admin kelola roadmap" on roadmaps for all using (my_role() = 'super_admin');

create policy "owner kelola strategi" on strategies for all using (is_tenant_owner(tenant_id));
create policy "mentor admin baca strategi" on strategies for select
  using (is_tenant_mentor(tenant_id) or is_tenant_admin(tenant_id) or my_role() = 'super_admin');
create policy "super admin kelola strategi" on strategies for all using (my_role() = 'super_admin');

-- chat: owner & mentor tenant terkait bisa baca-tulis; admin & super_admin bisa semua
create policy "chat baca sesuai peran" on chat_messages for select
  using (is_tenant_owner(tenant_id) or is_tenant_mentor(tenant_id) or is_tenant_admin(tenant_id) or my_role() = 'super_admin');
create policy "chat kirim sesuai peran" on chat_messages for insert
  with check (
    sender_id = auth.uid()
    and (is_tenant_owner(tenant_id) or is_tenant_mentor(tenant_id) or my_role() = 'super_admin')
  );
create policy "chat tandai dibaca" on chat_messages for update
  using (is_tenant_owner(tenant_id) or is_tenant_mentor(tenant_id) or my_role() = 'super_admin');

-- ---- 8. Notifikasi otomatis saat ada chat baru ----
create or replace function fn_notify_on_chat() returns trigger
language plpgsql security definer as $$
declare
  v_owner uuid; v_mentor uuid; v_sender_nama text; v_target uuid;
begin
  select owner_id, mentor_id into v_owner, v_mentor from tenants where id = new.tenant_id;
  select nama into v_sender_nama from profiles where id = new.sender_id;
  -- kirim notif ke lawan bicara
  if new.sender_id = v_owner then v_target := v_mentor; else v_target := v_owner; end if;
  if v_target is not null then
    insert into notifications (user_id, judul, isi, jenis)
    values (v_target, 'Pesan baru dari ' || coalesce(v_sender_nama,'—'), left(new.isi, 120), 'mentor');
  end if;
  return new;
end $$;

drop trigger if exists trg_notify_chat on chat_messages;
create trigger trg_notify_chat after insert on chat_messages
for each row execute function fn_notify_on_chat();

-- ---- 9. Update last_mentor_check otomatis saat mentor memberi catatan ----
create or replace function fn_update_mentor_check() returns trigger
language plpgsql security definer as $$
begin
  update tenants set last_mentor_check = now() where id = new.tenant_id;
  return new;
end $$;

drop trigger if exists trg_mentor_check on mentor_notes;
create trigger trg_mentor_check after insert on mentor_notes
for each row execute function fn_update_mentor_check();
