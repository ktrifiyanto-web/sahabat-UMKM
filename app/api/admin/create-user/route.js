import { NextResponse } from "next/server";
import { createAdminClient, verifySuperAdmin } from "@/lib/supabase/admin";

// POST { nama, email, password, role: 'mentor'|'umkm', nama_usaha?, jenis_usaha?, mentor_id? }
export async function POST(request) {
  const admin = await verifySuperAdmin();
  if (!admin) return NextResponse.json({ error: "Bukan super admin" }, { status: 403 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Body tidak valid" }, { status: 400 }); }

  const { nama, email, password, role, nama_usaha, jenis_usaha, mentor_id } = body || {};
  if (!nama || !email || !password || !["mentor", "umkm"].includes(role)) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Kata sandi minimal 6 karakter" }, { status: 400 });
  }

  const sb = createAdminClient();

  // 1. Buat user (email langsung terkonfirmasi — tanpa proses signup)
  const { data: created, error: userError } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nama },
  });
  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 400 });
  }
  const userId = created.user.id;

  // 2. Set role di profiles (trigger sudah membuat baris profil)
  const { error: roleError } = await sb.from("profiles")
    .update({ role, nama }).eq("id", userId);
  if (roleError) {
    return NextResponse.json({ error: "User dibuat tapi gagal set role: " + roleError.message }, { status: 500 });
  }

  // 3. Kalau UMKM/tenant: buat tenant sekalian, sambungkan mentor bila dipilih
  if (role === "umkm") {
    const { error: tenantError } = await sb.from("tenants").insert({
      nama_usaha: nama_usaha || nama,
      jenis_usaha: jenis_usaha || "Lainnya",
      owner_id: userId,
      mentor_id: mentor_id || null,
    });
    if (tenantError) {
      return NextResponse.json({ error: "User dibuat tapi gagal buat usaha: " + tenantError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, userId });
}
