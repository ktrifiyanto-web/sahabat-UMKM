import { createClient } from "@/lib/supabase/server";
import KelolaAkun from "@/components/KelolaAkun";

export default async function AkunPage() {
  const supabase = await createClient();

  const [{ data: profiles }, { data: tenants }] = await Promise.all([
    supabase.from("profiles").select("id, nama, role").order("nama"),
    supabase.from("tenants").select("id, nama_usaha, mentor_id, owner_id"),
  ]);

  return (
    <div className="mt-4">
      <h1 className="font-display font-bold text-lg mb-1">Kelola Akun</h1>
      <p className="text-[11.5px] text-ink-soft mb-4">
        Buat akun mentor &amp; tenant langsung (email + kata sandi) — mereka tidak perlu daftar sendiri.
      </p>
      <KelolaAkun profiles={profiles || []} tenants={tenants || []} />
    </div>
  );
}
