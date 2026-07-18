import { createClient } from "@/lib/supabase/server";
import { rupiah } from "@/lib/format";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

  const programQuery = supabase.from("programs").select("id, nama, lembaga");
  const { data: programs } =
    profile?.role === "super_admin" ? await programQuery : await programQuery.eq("admin_id", user.id);

  const daftarProgram = programs || [];
  const programIds = daftarProgram.map((p) => p.id);

  let tenants = [];
  if (programIds.length > 0) {
    const { data } = await supabase
      .from("tenants")
      .select("id, nama_usaha, jenis_usaha, mentor_id, program_id")
      .in("program_id", programIds);
    tenants = data || [];
  }

  const ringkasanPerTenant = {};
  for (const t of tenants) {
    const { data: tx } = await supabase
      .from("transactions")
      .select("nominal, tipe, created_at")
      .eq("tenant_id", t.id)
      .order("created_at", { ascending: false })
      .limit(100);
    const rows = tx || [];
    const masuk = rows.filter((r) => r.tipe === "masuk").reduce((a, b) => a + (b.nominal || 0), 0);
    const keluar = rows.filter((r) => r.tipe === "keluar").reduce((a, b) => a + (b.nominal || 0), 0);
    ringkasanPerTenant[t.id] = {
      laba: masuk - keluar,
      jumlahTx: rows.length,
      terakhirAktif: rows[0]?.created_at || null,
    };
  }

  return (
    <div className="mt-4">
      <h1 className="font-display text-lg font-extrabold mb-1">Monitoring Program</h1>
      <p className="text-sm text-ink-soft mb-5">
        {daftarProgram.length > 0
          ? daftarProgram.map((p) => p.nama).join(", ")
          : "Belum ada program yang terhubung ke akunmu."}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Total UMKM" value={tenants.length} />
        <StatCard
          label="Sudah Ada Mentor"
          value={tenants.filter((t) => t.mentor_id).length}
        />
        <StatCard
          label="Belum Ada Mentor"
          value={tenants.filter((t) => !t.mentor_id).length}
        />
      </div>

      {tenants.length === 0 ? (
        <div className="bg-card border border-line rounded-2xl p-6 text-sm text-ink-soft text-center">
          Belum ada UMKM terdaftar di program ini.
        </div>
      ) : (
        <div className="bg-card border border-line rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-3 border-b border-line text-[11px] font-bold text-ink-soft uppercase">
            <span>Usaha</span>
            <span>Laba</span>
            <span>Mentor</span>
          </div>
          {tenants.map((t) => {
            const r = ringkasanPerTenant[t.id] || { laba: 0, jumlahTx: 0 };
            return (
              <div
                key={t.id}
                className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-3 border-b border-line last:border-0 items-center"
              >
                <div>
                  <div className="font-semibold text-sm">{t.nama_usaha}</div>
                  <div className="text-[11px] text-ink-soft">
                    {t.jenis_usaha || "—"} · {r.jumlahTx} transaksi
                  </div>
                </div>
                <div className={`font-display font-bold text-sm text-right ${r.laba >= 0 ? "text-mint" : "text-pink"}`}>
                  {rupiah(r.laba)}
                </div>
                <div className="text-xs">
                  {t.mentor_id ? (
                    <span className="px-2 py-1 rounded-full font-bold" style={{ background: "var(--mint-soft)", color: "#0F8F45" }}>
                      Ada
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full font-bold" style={{ background: "var(--yellow-soft)", color: "#8A6A05" }}>
                      Belum
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-card border border-line rounded-2xl p-4">
      <div className="text-xs text-ink-soft font-semibold">{label}</div>
      <div className="font-display text-2xl font-extrabold mt-1">{value}</div>
    </div>
  );
}
