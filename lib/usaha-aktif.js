import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const COOKIE_USAHA_AKTIF = "usaha_aktif";

export async function getUsahaSaya() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, daftarUsaha: [], usahaAktif: null };
  }

  const { data: rows, error } = await supabase
    .from("tenant_members")
    .select("peran, tenants (id, nama_usaha, jenis_usaha)")
    .eq("user_id", user.id);

  if (error) {
    console.error("Gagal ambil daftar usaha:", error);
  }

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
}import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const COOKIE_USAHA_AKTIF = "usaha_aktif";

export async function getUsahaSaya() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, daftarUsaha: [], usahaAktif: null };
  }

  const { data: rows, error } = await supabase
    .from("tenant_members")
    .select("peran, tenants (id, nama_usaha, jenis_usaha)")
    .eq("user_id", user.id);

  if (error) {
    console.error("Gagal ambil daftar usaha:", error);
  }

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