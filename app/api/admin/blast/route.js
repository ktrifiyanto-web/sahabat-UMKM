import { NextResponse } from "next/server";
import { createAdminClient, verifySuperAdmin } from "@/lib/supabase/admin";

// POST { judul, isi, target: 'semua'|'umkm'|'mentor' }
export async function POST(request) {
  const admin = await verifySuperAdmin();
  if (!admin) return NextResponse.json({ error: "Bukan super admin" }, { status: 403 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Body tidak valid" }, { status: 400 }); }
  const { judul, isi, target } = body || {};
  if (!judul || !isi) return NextResponse.json({ error: "Judul dan isi wajib" }, { status: 400 });

  const sb = createAdminClient();
  let q = sb.from("profiles").select("id, role");
  if (target === "umkm") q = q.eq("role", "umkm");
  else if (target === "mentor") q = q.eq("role", "mentor");
  else q = q.in("role", ["umkm", "mentor"]);

  const { data: users, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (users || []).map((u) => ({
    user_id: u.id, judul, isi, jenis: "sistem",
  }));
  if (rows.length === 0) return NextResponse.json({ ok: true, terkirim: 0 });

  const { error: insErr } = await sb.from("notifications").insert(rows);
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, terkirim: rows.length });
}
