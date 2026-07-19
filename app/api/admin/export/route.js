import { NextResponse } from "next/server";
import { createAdminClient, verifySuperAdmin } from "@/lib/supabase/admin";

// GET ?tabel=transactions|tenants|profiles|mentor_notes|chat_messages|sector_reports|projects
const TABEL_BOLEH = ["transactions", "tenants", "profiles", "mentor_notes", "chat_messages", "sector_reports", "projects", "roadmaps", "strategies", "goals"];

export async function GET(request) {
  const admin = await verifySuperAdmin();
  if (!admin) return NextResponse.json({ error: "Bukan super admin" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const tabel = searchParams.get("tabel");
  if (!TABEL_BOLEH.includes(tabel)) {
    return NextResponse.json({ error: "Tabel tidak dikenal" }, { status: 400 });
  }

  const sb = createAdminClient();
  const { data, error } = await sb.from(tabel).select("*").limit(10000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data || [];
  if (rows.length === 0) {
    return new NextResponse("tidak ada data", {
      headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="${tabel}.csv"` },
    });
  }

  const kolom = Object.keys(rows[0]);
  const esc = (v) => {
    if (v == null) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [kolom.join(","), ...rows.map((r) => kolom.map((k) => esc(r[k])).join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${tabel}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
