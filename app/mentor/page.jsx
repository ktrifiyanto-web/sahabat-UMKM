import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { rupiah } from "@/lib/format";
import { hitungSkor, labelSkor } from "@/lib/skor";

export default async function MentorDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, nama_usaha, jenis_usaha, last_mentor_check")
    .eq("mentor_id", user.id)
    .order("nama_usaha");
  const daftar = tenants || [];

  const awalBulan = new Date(); awalBulan.setDate(1);
  const t30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const kartu = [];
  let totalSkor = 0, butuhPerhatian = 0, chatBelum = 0, telat = [];

  for (const t of daftar) {
    const [{ data: tx }, { data: tx30 }, { data: notes }, { count: cb }] = await Promise.all([
      supabase.from("transactions").select("nominal, tipe").eq("tenant_id", t.id)
        .gte("tanggal", awalBulan.toISOString().slice(0, 10)),
      supabase.from("transactions").select("tanggal").eq("tenant_id", t.id).gte("tanggal", t30),
      supabase.from("mentor_notes").select("selesai").eq("tenant_id", t.id),
      supabase.from("chat_messages").select("id", { count: "exact", head: true })
        .eq("tenant_id", t.id).eq("dibaca", false).neq("sender_id", user.id),
    ]);
    const rows = tx || [];
    const masuk = rows.filter((r) => r.tipe === "masuk").reduce((a, b) => a + (b.nominal || 0), 0);
    const keluar = rows.filter((r) => r.tipe === "keluar").reduce((a, b) => a + (b.nominal || 0), 0);
    const nAll = notes || [];
    const skor = hitungSkor({
      masuk, keluar,
      hariAktif30: new Set((tx30 || []).map((x) => x.tanggal)).size,
      tugasTotal: nAll.length,
      tugasSelesai: nAll.filter((n) => n.selesai).length,
    });
    const { label, warna } = labelSkor(skor);
    totalSkor += skor;
    if (skor < 70) butuhPerhatian++;
    chatBelum += cb || 0;

    const hariSejakCek = t.last_mentor_check
      ? Math.floor((Date.now() - new Date(t.last_mentor_check).getTime()) / 86400000)
      : null;
    if (hariSejakCek === null || hariSejakCek > 7) telat.push({ nama: t.nama_usaha, hari: hariSejakCek });

    kartu.push({ ...t, skor, label, warna, laba: masuk - keluar, hariSejakCek, chatTenant: cb || 0 });
  }

  const rataSkor = daftar.length ? Math.round(totalSkor / daftar.length) : 0;

  return (
    <div className="mt-3">
      <h1 className="font-display font-bold text-lg">Halo, Mentor 👋</h1>
      <p className="text-[11.5px] text-ink-soft mb-4">Pantau &amp; dampingi tenant binaanmu di sini.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
        <Kpi label="Total Dampingan" v={`${daftar.length} Tenant`} />
        <Kpi label="Rata-rata Skor" v={rataSkor} />
        <Kpi label="Butuh Perhatian" v={`${butuhPerhatian} Tenant`} warna={butuhPerhatian > 0 ? "var(--pink)" : undefined} />
        <Kpi label="Chat Belum Dibaca" v={chatBelum} warna={chatBelum > 0 ? "var(--pink)" : undefined} />
      </div>

      {telat.length > 0 && (
        <div className="glass p-3.5 mb-4 flex gap-3 items-start" style={{ borderLeft: "3px solid var(--amber)" }}>
          <span className="text-lg">⏰</span>
          <div className="text-[11px] text-ink-soft leading-relaxed">
            <b className="text-foreground">Pengingat cek berkala:</b> {telat.length} tenant belum kamu cek lebih
            dari 7 hari (target minimal 1x seminggu per tenant).
            <span className="block mt-0.5 text-[10px] font-bold text-amber">
              {telat.map((x) => `${x.nama}${x.hari != null ? ` (${x.hari} hari)` : " (belum pernah)"}`).join(" · ")}
            </span>
          </div>
        </div>
      )}

      {daftar.length === 0 ? (
        <div className="glass p-6 text-sm text-ink-soft text-center">
          Belum ada tenant yang ditugaskan untukmu. Hubungi Admin.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {kartu.map((t) => (
            <Link key={t.id} href={`/mentor/${t.id}`}
              className="glass p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-transform">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: `conic-gradient(${t.warna} ${t.skor}%, rgba(15,35,64,0.08) 0)` }}>
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center font-display font-bold text-xs">
                  {t.skor}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-[12.5px] truncate">{t.nama_usaha}</div>
                <div className="text-[9.5px] mt-0.5"
                  style={{ color: t.hariSejakCek === null || t.hariSejakCek > 7 ? "var(--pink)" : "var(--ink-soft)", fontWeight: t.hariSejakCek === null || t.hariSejakCek > 7 ? 700 : 500 }}>
                  {t.jenis_usaha || "—"} ·{" "}
                  {t.hariSejakCek === null ? "⏰ belum pernah dicek" : t.hariSejakCek > 7 ? `⏰ ${t.hariSejakCek} hari belum dicek` : `dicek ${t.hariSejakCek} hari lalu`}
                </div>
                <span className="inline-block text-[8.5px] font-extrabold px-2 py-0.5 rounded-full mt-1"
                  style={{ background: `color-mix(in srgb, ${t.warna} 14%, white)`, color: t.warna }}>
                  {t.label}
                </span>
                {t.chatTenant > 0 && (
                  <span className="inline-block text-[8.5px] font-extrabold px-2 py-0.5 rounded-full mt-1 ml-1 bg-pink-soft text-pink">
                    💬 {t.chatTenant} chat baru
                  </span>
                )}
              </div>
              <span className="text-ink-dim">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Kpi({ label, v, warna }) {
  return (
    <div className="glass p-3.5">
      <div className="text-[9.5px] text-ink-soft font-bold">{label}</div>
      <div className="font-display font-bold text-lg mt-0.5" style={warna ? { color: warna } : undefined}>{v}</div>
    </div>
  );
}
