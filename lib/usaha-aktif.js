import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const COOKIE_USAHA_AKTIF = "usaha_aktif";

/**
 * Ambil semua usaha yang bisa diakses user (lewat tabel tenant_members),
 * lalu tentukan usaha mana yang lagi "aktif" dipakai:
 *  - kalau user pernah pilih (tersimpan di cookie) dan usaha itu masih
 *    ada di daftarnya -> pakai itu
 *  - kalau belum pernah pilih -> pakai usaha pertama di daftar
 *  - kalau user belum punya usaha sama sekali -> usahaAktif null
 *
 * Dipakai di semua halaman dashboard, gantinya query langsung
 * `.eq("owner_id", user.id)` yang lama (yang cuma dukung 1 usaha per user).
 */
export async function getUsahaSaya() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, daftarUsaha: [], usahaAktif: null };
  }

  const { data: rows } = await supabase
    .from("tenant_members")
    .select("peran, tenants:tenant_id (id, nama_usaha, jenis_usaha)")
    .eq("user_id", user.id);

  const daftarUsaha = (rows || [])
    .filter((r) => r.tenants)
    .map((r) => ({
      id: r.tenants.id,
      nama_usaha: r.tenants.nama_usaha,
      jenis_usaha: r.tenants.jenis_usaha,
      peran: r.peran,
    }))
    .sort((a, b) => (a.peran === "owner" ? -1 : b.peran === "owner" ? 1 : 0));

  const cookieStore = await cookies();
  const idPilihan = cookieStore.get(COOKIE_USAHA_AKTIF)?.value;
  const usahaAktif = daftarUsaha.find((u) => u.id === idPilihan) || daftarUsaha[0] || null;

  return { user, daftarUsaha, usahaAktif };
}
