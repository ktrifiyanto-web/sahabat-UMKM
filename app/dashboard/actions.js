"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { COOKIE_USAHA_AKTIF } from "@/lib/usaha-aktif";

// Dipanggil pas user pilih usaha lain di dropdown "PilihUsaha"
export async function pilihUsahaAktif(tenantId) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_USAHA_AKTIF, tenantId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

// Dipanggil dari tombol "+ Tambah usaha baru" di halaman Bisnis Saya
export async function buatUsahaBaru(nama_usaha, jenis_usaha) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!nama_usaha || !nama_usaha.trim()) {
    return { error: "Nama usaha wajib diisi" };
  }

  // Cek batas jumlah usaha yang boleh dipunya user ini (diatur super admin
  // lewat kolom profiles.batas_usaha di Supabase, default 3)
  const { data: profil } = await supabase
    .from("profiles")
    .select("batas_usaha")
    .eq("id", user.id)
    .maybeSingle();
  const batas = profil?.batas_usaha ?? 3;

  const { count } = await supabase
    .from("tenant_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("peran", "owner");

  if ((count || 0) >= batas) {
    return {
      error: `Usahamu sudah mencapai batas maksimal (${batas} usaha). Hubungi admin kalau butuh lebih.`,
    };
  }

  const { data: baru, error } = await supabase
    .from("tenants")
    .insert({
      nama_usaha: nama_usaha.trim(),
      jenis_usaha: jenis_usaha || null,
      owner_id: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Langsung jadikan usaha baru ini yang aktif
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_USAHA_AKTIF, baru.id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return { ok: true };
}
