-- ============================================================
-- SAHABAT UMKM — Migrasi 011: Pendamping AI (Chat Advisor)
--
-- Tabel baru buat obrolan dengan AI (terpisah dari chat_messages yang
-- dipakai buat chat manusia ke mentor). Cuma Owner & Admin yang boleh
-- akses -- Member (staf cabang) belum dikasih dulu.
-- ============================================================

create table if not exists ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  sender_id uuid references profiles(id), -- null kalau baris ini balasan AI
  peran text not null check (peran in ('user','assistant')),
  isi text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_ai_chat_tenant on ai_chat_messages(tenant_id, created_at);

alter table ai_chat_messages enable row level security;

drop policy if exists "owner admin lihat chat ai" on ai_chat_messages;
create policy "owner admin lihat chat ai" on ai_chat_messages
  for select using (
    has_tenant_role(tenant_id, 'owner') or has_tenant_role(tenant_id, 'admin')
    or my_role() = 'super_admin'
  );

drop policy if exists "owner admin kirim chat ai" on ai_chat_messages;
create policy "owner admin kirim chat ai" on ai_chat_messages
  for insert with check (
    has_tenant_role(tenant_id, 'owner') or has_tenant_role(tenant_id, 'admin')
  );
