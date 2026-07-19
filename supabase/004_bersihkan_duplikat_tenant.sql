-- ============================================================
-- MIGRASI 004 — Bersihkan tenant duplikat & cegah terulang
-- Jalankan TAMBAHAN di Supabase SQL Editor (setelah 001, 002, 003)
-- ============================================================

-- 1. Hapus duplikat: untuk tiap owner_id, simpan baris PALING AWAL
--    (created_at paling kecil), hapus sisanya.
--    Transaksi/goals/dsb yang sudah nyangkut di baris duplikat ikut
--    dipindah ke baris yang dipertahankan dulu supaya tidak hilang.

do $$
declare
  r record;
  v_keep uuid;
begin
  for r in (select owner_id from tenants group by owner_id having count(*) > 1) loop
    select id into v_keep from tenants
      where owner_id = r.owner_id order by created_at asc limit 1;

    update transactions set tenant_id = v_keep
      where tenant_id in (select id from tenants where owner_id = r.owner_id and id <> v_keep);
    update goals set tenant_id = v_keep
      where tenant_id in (select id from tenants where owner_id = r.owner_id and id <> v_keep);
    update mentor_notes set tenant_id = v_keep
      where tenant_id in (select id from tenants where owner_id = r.owner_id and id <> v_keep);
    update projects set tenant_id = v_keep
      where tenant_id in (select id from tenants where owner_id = r.owner_id and id <> v_keep);
    update chat_messages set tenant_id = v_keep
      where tenant_id in (select id from tenants where owner_id = r.owner_id and id <> v_keep);
    delete from sector_reports
      where tenant_id in (select id from tenants where owner_id = r.owner_id and id <> v_keep);
    delete from roadmaps
      where tenant_id in (select id from tenants where owner_id = r.owner_id and id <> v_keep);
    delete from strategies
      where tenant_id in (select id from tenants where owner_id = r.owner_id and id <> v_keep);

    delete from tenants where owner_id = r.owner_id and id <> v_keep;
  end loop;
end $$;

-- 2. Kunci di level database: satu owner cuma boleh punya SATU usaha.
--    Ini yang mencegah bug duplikat terulang untuk akun manapun,
--    apapun penyebabnya di sisi aplikasi.
alter table tenants add constraint tenants_owner_id_unique unique (owner_id);
