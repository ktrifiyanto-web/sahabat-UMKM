import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rupiah } from "@/lib/format";
import { hitungSkor, labelSkor } from "@/lib/skor";
import FormSektor from "@/components/FormSektor";
import FormArahan from "@/components/FormArahan";

export default async function DetailTenantMentor({ params }) {
  const { tenantId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, nama_usaha, jenis_usaha, mentor_id, angkatan, foto_owner_url, foto_produk_url, owner_id")
    .eq("id", tenantId)
    .maybeSingle();

  if (!tenant || (tenant.mentor_id !== user.id && profile?.role !== "super_admin")) redirect("/mentor");

  const awalBulan = new Date(); awalBulan.setDate(1);
  const t30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const [{ data: tx }, { data: tx30 }, { data: notes }, { data: sektor }, { data: owner }] =
    await Promise.all([
      supabase.from("transactions").select("nominal, tipe").eq("tenant_id", tenantId)
        .gte("tanggal", awalBulan.toISOString().slice(0, 10)),
      supabase.from("transactions").select("tanggal").eq("tenant_id", tenantId).gte("tanggal", t30),
      supabase.from("mentor_notes").select("id, jenis, isi, selesai, created_at")
        .eq("tenant_id", tenantId).order("created_at", { ascending: false }),
      supabase.from("sector_reports").select("*").eq("tenant_id", tenantId).maybeSingle(),
      supabase.from("profiles").select("nama").eq("id", tenant.owner_id).maybeSingle(),
    ]);

  const rows = tx || [];
  const masuk = rows.filter((r) => r.tipe === "masuk").reduce((a, b) => a + (b.nominal || 0), 0);
  const keluar = rows.filter((r) => r.tipe === "keluar").reduce((a, b) => a + (b.nominal || 0), 0);
  const nAll = notes || [];
  const selesai = nAll.filter((n) => n.selesai).length;
  const skor = hitungSkor({
    masuk, keluar,
    hariAktif30: new Set((tx30 || []).map((x) => x.tanggal)).size,
    tugasTotal: nAll.length, tugasSelesai: selesai,
  });
  const { warna } = labelSkor(skor);

  const TAG = { tugas: "Tugas", arahan: "Arahan", evaluasi: "Evaluasi", komentar: "Catatan" };

  return (
    <div className="mt-3">
      <Link href="/mentor" className="text-xs text-cyan font-bold">← Semua Tenant</Link>

      <div className="glass p-5 mt-3 mb-4 flex flex-wrap items-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: `conic-gradient(${warna} ${skor}%, rgba(15,35,64,0.08) 0)` }}>
          <div className="w-[50px] h-[50px] rounded-full bg-white flex flex-col items-center justify-center">
            <b className="font-display text-[15px] leading-none">{skor}</b>
            <span className="text-[6.5px] text-ink-dim font-bold">SKOR</span>
          </div>
        </div>
        <div className="flex-1 min-w-[180px]">
          <div className="font-display font-bold text-[15px]">{tenant.nama_usaha}</div>
          <div className="text-[10.5px] text-ink-soft mt-0.5">
            {tenant.jenis_usaha || "—"}{tenant.angkatan ? ` · Angkatan ${tenant.angkatan}` : ""} · Owner: {owner?.nama || "—"}
          </div>
          <div className="flex gap-5 mt-2">
            <MiniAngka v={rupiah(masuk)} l="Penjualan Bulan Ini" />
            <MiniAngka v={rupiah(masuk - keluar)} l="Laba Bulan Ini" />
            <MiniAngka v={`${selesai}/${nAll.length}`} l="Tugas Selesai" />
          </div>
        </div>
        <div className="flex gap-2">
          <FotoSlot url={tenant.foto_owner_url} label="Owner" ikon="🧑" />
          <FotoSlot url={tenant.foto_produk_url} label="Produk" ikon="📦" />
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <h2 className="font-display font-bold text-sm mb-2">Tugas &amp; Arahan yang Sudah Diberikan</h2>
          <div className="glass p-2">
            {nAll.length === 0 && (
              <div className="text-xs text-ink-soft text-center py-5">Belum ada. Kirim arahan pertamamu di bawah.</div>
            )}
            {nAll.map((n) => (
              <div key={n.id} className="flex items-center gap-2.5 px-3 py-2.5 border-b border-dashed border-line last:border-0">
                <span className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: n.selesai ? "var(--green)" : "var(--amber)" }} />
                <div className={`flex-1 text-xs font-bold ${n.selesai ? "line-through text-ink-dim" : ""}`}>{n.isi}</div>
                <span className="text-[8.5px] font-extrabold px-2 py-1 rounded-full bg-cyan-soft" style={{ color: "#0E7490" }}>
                  {TAG[n.jenis] || "Catatan"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-display font-bold text-sm mb-2">Target Sektor (kamu yang tetapkan)</h2>
          <FormSektor tenantId={tenantId} dataAwal={sektor} mode="mentor" />
        </div>

        <div>
          <h2 className="font-display font-bold text-sm mb-2">✍️ Beri Evaluasi / Arahan / Tugas Baru</h2>
          <FormArahan tenantId={tenantId} mentorId={user.id} />
        </div>

        <Link href={`/mentor/${tenantId}/chat`}
          className="glass p-4 flex items-center justify-between text-xs font-bold hover:-translate-y-0.5 transition-transform">
          <span>💬 Buka Chat dengan {tenant.nama_usaha}</span>
          <span className="text-ink-dim">→</span>
        </Link>
      </div>
    </div>
  );
}

function MiniAngka({ v, l }) {
  return (
    <div>
      <div className="font-display font-bold text-[13px]">{v}</div>
      <div className="text-[8.5px] text-ink-soft font-bold">{l}</div>
    </div>
  );
}

function FotoSlot({ url, label, ikon }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={label} className="w-14 h-14 rounded-xl object-cover border border-line" />
  ) : (
    <div className="w-14 h-14 rounded-xl border-2 border-dashed border-line bg-white/40 flex flex-col items-center justify-center">
      <span className="text-sm">{ikon}</span>
      <span className="text-[7px] font-bold text-ink-dim">{label}</span>
    </div>
  );
}
