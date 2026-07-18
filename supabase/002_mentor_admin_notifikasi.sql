-- ============================================================
-- MIGRASI 002 — Notifikasi otomatis untuk catatan mentor
-- Jalankan file ini TAMBAHAN di Supabase SQL Editor
-- (setelah schema.sql utama sudah pernah dijalankan)
-- ============================================================

-- Notifications tidak boleh di-insert langsung oleh client (supaya tidak
-- disalahgunakan spam notifikasi ke user lain). Insert hanya lewat trigger
-- terpercaya ini (security definer), dipicu saat mentor menambah catatan.

create or replace function fn_notify_owner_on_mentor_note() returns trigger
language plpgsql security definer as $$
declare
  v_owner uuid;
  v_mentor_nama text;
  v_judul text;
begin
  select owner_id into v_owner from tenants where id = new.tenant_id;
  select nama into v_mentor_nama from profiles where id = new.mentor_id;

  v_judul := case new.jenis
    when 'tugas' then 'Tugas baru dari mentor'
    when 'evaluasi' then 'Evaluasi baru dari mentor'
    else 'Catatan baru dari mentor'
  end;

  if v_owner is not null then
    insert into notifications (user_id, judul, isi, jenis)
    values (
      v_owner,
      v_judul,
      coalesce(v_mentor_nama, 'Mentor') || ': ' || left(new.isi, 140),
      'mentor'
    );
  end if;

  return new;
end $$;

drop trigger if exists trg_notify_mentor_note on mentor_notes;
create trigger trg_notify_mentor_note
after insert on mentor_notes
for each row execute function fn_notify_owner_on_mentor_note();

-- ============================================================
-- BANTUAN TESTING — jalankan manual untuk membuat akun uji coba
-- mentor & admin program (belum ada UI Super Admin untuk ini)
-- ============================================================

-- 1. Lihat semua user & tenant yang ada, untuk ambil ID-nya:
--    select id, nama, role from profiles;
--    select id, nama_usaha, owner_id from tenants;

-- 2. Jadikan sebuah akun sebagai MENTOR, lalu tugaskan mendampingi satu UMKM:
--    update profiles set role = 'mentor' where id = 'ISI_USER_ID_MENTOR';
--    update tenants set mentor_id = 'ISI_USER_ID_MENTOR' where id = 'ISI_TENANT_ID';

-- 3. Jadikan sebuah akun sebagai ADMIN PROGRAM, buat program, sambungkan UMKM:
--    update profiles set role = 'admin_program' where id = 'ISI_USER_ID_ADMIN';
--    insert into programs (nama, lembaga, admin_id)
--      values ('Inkubasi Bisnis Kebumen 2026', 'Disperindag Kebumen', 'ISI_USER_ID_ADMIN')
--      returning id;
--    update tenants set program_id = 'ISI_PROGRAM_ID' where id = 'ISI_TENANT_ID';
