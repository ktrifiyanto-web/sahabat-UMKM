"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Cek: apakah user yang sedang login adalah OWNER dari tenantId ini?
// Cuma owner yang boleh undang/ubah peran/hapus anggota (sesuai kebijakan RLS
// "owner kelola keanggotaan usahanya" di migrasi 006).
async function pastikanOwner(tenantId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Belum login" };

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("peran")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership?.peran !== "owner") {
    return { ok: false, error: "Cuma pemilik usaha yang boleh mengelola anggota" };
  }
  return { ok: true, user };
}

// Undang anggota baru lewat email. Kalau emailnya belum punya akun
// SobatUMKM, akun baru dibuat otomatis (belum ada password — anggota
// baru login lewat "lupa password" / magic link pertama kali).
export async function undangAnggota(tenantId, email, peran) {
  const cek = await pastikanOwner(tenantId);
  if (!cek.ok) return { error: cek.error };

  if (!email || !email.includes("@")) return { error: "Email tidak valid" };
  if (!["admin", "member"].includes(peran)) return { error: "Peran tidak valid" };

  const admin = createAdminClient();
  const emailBersih = email.trim().toLowerCase();

  // Coba buat akun baru sekaligus kirim email undangan.
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(emailBersih);

  let userId = invited?.user?.id;

  if (!userId) {
    // Kemungkinan besar email ini SUDAH punya akun. Cari di daftar user.
    const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (listError) return { error: "Gagal mencari akun: " + listError.message };
    const existing = list.users.find((u) => u.email?.toLowerCase() === emailBersih);
    if (!existing) {
      return { error: inviteError?.message || "Gagal mengundang — coba lagi" };
    }
    userId = existing.id;
  }

  const supabase = await createClient();
  const { error: memberError } = await supabase
    .from("tenant_members")
    .insert({ tenant_id: tenantId, user_id: userId, peran, diundang_oleh: cek.user.id });

  if (memberError) {
    if (memberError.code === "23505") {
      return { error: "Orang ini sudah jadi anggota usaha ini" };
    }
    return { error: memberError.message };
  }

  revalidatePath("/dashboard/bisnis-saya");
  return { ok: true };
}

export async function ubahPeranAnggota(tenantId, userId, peranBaru) {
  const cek = await pastikanOwner(tenantId);
  if (!cek.ok) return { error: cek.error };
  if (!["admin", "member"].includes(peranBaru)) return { error: "Peran tidak valid" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenant_members")
    .update({ peran: peranBaru })
    .eq("tenant_id", tenantId)
    .eq("user_id", userId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/bisnis-saya");
  return { ok: true };
}

// Hapus usaha permanen. Wajib ketik ulang nama usaha persis buat
// konfirmasi (dicek juga di server, bukan cuma di tampilan) -- soalnya
// ini bakal ikut menghapus SEMUA transaksi/goal/catatan mentor di
// usaha itu (on delete cascade), tidak bisa dibatalkan.
export async function hapusUsaha(tenantId, namaKetik) {
  const cek = await pastikanOwner(tenantId);
  if (!cek.ok) return { error: cek.error };

  const supabase = await createClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("nama_usaha")
    .eq("id", tenantId)
    .maybeSingle();

  if (!tenant) return { error: "Usaha tidak ditemukan" };
  if (tenant.nama_usaha.trim().toLowerCase() !== (namaKetik || "").trim().toLowerCase()) {
    return { error: "Nama yang diketik tidak cocok, coba lagi" };
  }

  const { error } = await supabase.from("tenants").delete().eq("id", tenantId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/bisnis-saya");
  return { ok: true };
}

export async function hapusAnggota(tenantId, userId) {
  const cek = await pastikanOwner(tenantId);
  if (!cek.ok) return { error: cek.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenant_members")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("user_id", userId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/bisnis-saya");
  return { ok: true };
}
