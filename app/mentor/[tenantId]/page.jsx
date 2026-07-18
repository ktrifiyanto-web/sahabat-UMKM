import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rupiah } from "@/lib/format";
import CatatanMentor from "@/components/CatatanMentor";

export default async function DetailUmkmMentor({ params }) {
  const { tenantId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, nama_usaha, jenis_usaha, mentor_id")
    .eq("id", tenantId)
    .maybeSingle();

  if (!tenant || tenant.mentor_id !== user.id) {
    redirect("/mentor");
  }

  const { data: tx } = await supabase
    .from("transactions")
    .select("nominal, tipe")
    .eq("tenant_id", tenantId)
    .limit(200);
  const rows = tx || [];
  const masuk = rows.filter((r) => r.tipe === "masuk").reduce((a, b) => a + (b.nominal || 0), 0);
  const keluar = rows.filter((r) => r.tipe === "keluar").reduce((a, b) => a + (b.nominal || 0), 0);

  const { data: goals } = await supabase
    .from("goals")
    .select("id, judul, target_nilai, nilai_saat_ini, status")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  const { data: catatan } = await supabase
    .from("mentor_notes")
    .select("id, jenis, isi, selesai, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  return (
    <div className="mt-4">
      <Link href="/mentor" className="text-sm text-violet font-semibold">
        ← Semua Dampingan
      </Link>

      <h1 className="font-display text-lg font-extrabold mt-3">{tenant.nama_usaha}</h1>
      <p className="text-xs text-ink-soft mb-4">{tenant.jenis_usaha || "—"}</p>

      <div className="grid grid-cols-3 gap-2 mb-5">
        <MiniCard label="Masuk" value={rupiah(masuk)} tone="mint" />
        <MiniCard label="Keluar" value={rupiah(keluar)} tone="pink" />
        <MiniCard label="Laba" value={rupiah(masuk - keluar)} tone={masuk - keluar >= 0 ? "mint" : "pink"} />
      </div>

      <h2 className="font-display font-bold text-sm mb-2">Target UMKM</h2>
      <div className="bg-card border border-line rounded-2xl p-4 mb-6 space-y-3">
        {(!goals || goals.length === 0) && (
          <div className="text-xs text-ink-soft">Belum ada target yang dibuat.</div>
        )}
        {(goals || []).map((g) => {
          const persen = Math.min(100, Math.round(((g.nilai_saat_ini || 0) / g.target_nilai) * 100));
          return (
            <div key={g.id}>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>{g.judul}</span>
                <span className="text-ink-soft">{persen}%</span>
              </div>
              <div className="h-1.5 bg-background rounded-full overflow-hidden">
                <div
                  className={`h-full ${g.status === "tercapai" ? "bg-mint" : "bg-yellow"}`}
                  style={{ width: `${persen}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <CatatanMentor tenantId={tenantId} mentorId={user.id} catatanAwal={catatan || []} />
    </div>
  );
}

function MiniCard({ label, value, tone }) {
  const bg = tone === "mint" ? "bg-mint-soft" : "bg-pink-soft";
  const text = tone === "mint" ? "text-mint" : "text-pink";
  return (
    <div className={`${bg} rounded-2xl p-3`}>
      <div className="text-[10px] font-semibold text-ink-soft">{label}</div>
      <div className={`font-display font-bold text-sm ${text} mt-0.5`}>{value}</div>
    </div>
  );
}
