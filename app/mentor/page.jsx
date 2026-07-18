import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { rupiah } from "@/lib/format";

export default async function MentorDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, nama_usaha, jenis_usaha")
    .eq("mentor_id", user.id)
    .order("nama_usaha");

  const daftar = tenants || [];

  // Ambil ringkasan laba sederhana per tenant (30 transaksi terakhir cukup untuk gambaran cepat)
  const ringkasanPerTenant = {};
  for (const t of daftar) {
    const { data: tx } = await supabase
      .from("transactions")
      .select("nominal, tipe")
      .eq("tenant_id", t.id)
      .limit(100);
    const rows = tx || [];
    const masuk = rows.filter((r) => r.tipe === "masuk").reduce((a, b) => a + (b.nominal || 0), 0);
    const keluar = rows.filter((r) => r.tipe === "keluar").reduce((a, b) => a + (b.nominal || 0), 0);
    ringkasanPerTenant[t.id] = { laba: masuk - keluar, jumlahTx: rows.length };
  }

  return (
    <div className="mt-4">
      <h1 className="font-display text-lg font-extrabold mb-1">UMKM Dampinganmu</h1>
      <p className="text-sm text-ink-soft mb-5">
        Kamu hanya bisa melihat & memberi catatan — tidak bisa mengubah data transaksi mereka.
      </p>

      {daftar.length === 0 && (
        <div className="bg-card border border-line rounded-2xl p-6 text-sm text-ink-soft text-center">
          Belum ada UMKM yang ditugaskan untukmu. Hubungi Admin Program.
        </div>
      )}

      <div className="space-y-3">
        {daftar.map((t) => {
          const r = ringkasanPerTenant[t.id] || { laba: 0, jumlahTx: 0 };
          return (
            <Link
              key={t.id}
              href={`/mentor/${t.id}`}
              className="block bg-card border border-line rounded-2xl p-4 hover:border-violet transition-colors"
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-bold text-sm">{t.nama_usaha}</div>
                  <div className="text-xs text-ink-soft mt-0.5">{t.jenis_usaha || "—"}</div>
                </div>
                <div className="text-right">
                  <div className={`font-display font-bold text-base ${r.laba >= 0 ? "text-mint" : "text-pink"}`}>
                    {rupiah(r.laba)}
                  </div>
                  <div className="text-[11px] text-ink-soft">{r.jumlahTx} transaksi tercatat</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
