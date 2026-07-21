import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUsahaSaya } from "@/lib/usaha-aktif";
import { rupiah } from "@/lib/format";
import { hitungSkor, labelSkor } from "@/lib/skor";
import SetupUsaha from "@/components/SetupUsaha";
import ChecklistTugas from "@/components/ChecklistTugas";
import CatatCepat from "@/components/CatatCepat";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { usahaAktif } = await getUsahaSaya();
  const tenant = usahaAktif;

  if (!tenant) {
    return (
      <Suspense fallback={null}>
        <SetupUsaha userId={user.id} />
      </Suspense>
    );
  }

  const awalBulan = new Date();
  awalBulan.setDate(1);
  const tigaPuluhHari = new Date(Date.now() - 30 * 86400000);

  const [{ data: txBulan }, { data: tx30 }, { data: notes }, { data: sektor }, { data: coaList }] =
    await Promise.all([
      supabase
        .from("transactions")
        .select("nominal, tipe")
        .eq("tenant_id", tenant.id)
        .gte("tanggal", awalBulan.toISOString().slice(0, 10)),
      supabase
        .from("transactions")
        .select("tanggal")
        .eq("tenant_id", tenant.id)
        .gte("tanggal", tigaPuluhHari.toISOString().slice(0, 10)),
      supabase
        .from("mentor_notes")
        .select("id, jenis, isi, selesai")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false })
        .limit(15),
      supabase.from("sector_reports").select("*").eq("tenant_id", tenant.id).maybeSingle(),
      supabase.from("coa").select("id, nama"),
    ]);

  const rows = txBulan || [];
  const masuk = rows.filter((t) => t.tipe === "masuk").reduce((a, b) => a + (b.nominal || 0), 0);
  const keluar = rows.filter((t) => t.tipe === "keluar").reduce((a, b) => a + (b.nominal || 0), 0);
  const laba = masuk - keluar;
  const hariAktif30 = new Set((tx30 || []).map((t) => t.tanggal)).size;
  const daftarTugas = notes || [];
  const tugasSelesai = daftarTugas.filter((n) => n.selesai).length;

  const skor = hitungSkor({
    masuk,
    keluar,
    hariAktif30,
    tugasTotal: daftarTugas.length,
    tugasSelesai,
  });
  const { label, warna } = labelSkor(skor);

  const progressMitra =
    sektor && sektor.mitra_target > 0
      ? Math.min(100, Math.round((sektor.mitra_aktual / sektor.mitra_target) * 100))
      : null;

  const coaMap = {};
  (coaList || []).forEach((c) => (coaMap[c.nama] = c.id));

  return (
    <div className="mt-3">
      <h1 className="font-display font-bold text-lg">Halo 👋</h1>
      <p className="text-[11.5px] text-ink-soft mb-4">
        Ini kondisi <b>{tenant.nama_usaha}</b> hari ini — sekali lihat, langsung paham.
      </p>

      {/* Hero skor */}
      <div className="glass p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div
          className="w-[84px] h-[84px] rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: `conic-gradient(${warna} ${skor}%, rgba(15,35,64,0.07) 0)` }}
        >
          <div className="w-[66px] h-[66px] rounded-full bg-white flex flex-col items-center justify-center">
            <b className="font-display text-xl leading-none">{skor}</b>
            <span className="text-[7.5px] text-ink-dim font-bold mt-0.5">SKOR</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="font-display font-bold text-[15px]">
            <span style={{ color: warna }}>●</span> Kesehatan Bisnis: {label}
          </div>
          <p className="text-[11px] text-ink-soft mt-0.5">
            Dihitung dari keuangan, kedisiplinan mencatat, dan penyelesaian tugas.
          </p>
          <div className="flex flex-wrap gap-5 mt-3">
            <Angka v={rupiah(masuk)} l="Penjualan Bulan Ini" up={laba > 0} />
            <Angka v={rupiah(laba)} l="Laba Bulan Ini" up={laba > 0} />
            {progressMitra != null && <Angka v={`${progressMitra}%`} l="Progress Target Mitra" />}
            <Angka v={`${hariAktif30} hari`} l="Aktif Mencatat (30 hr)" />
          </div>
        </div>
      </div>

      <ChecklistTugas itemsAwal={daftarTugas} />
      <CatatCepat tenantId={tenant.id} userId={user.id} coaMap={coaMap} />

      <div className="flex flex-wrap gap-2 mt-5">
        <TautanKecil href="/dashboard/laporan" label="📈 Laporan Keuangan" />
        <TautanKecil href="/dashboard/sektor" label="🎯 Target & Sektor" />
        <TautanKecil href="/dashboard/chat" label="💬 Chat Mentor" />
        <TautanKecil href="/dashboard/pendamping-ai" label="🤖 Pendamping AI" />
      </div>
    </div>
  );
}

function Angka({ v, l, up }) {
  return (
    <div>
      <div className="font-display font-bold text-[15px]">
        {v}
        {up && <span className="text-green text-xs"> ↑</span>}
      </div>
      <div className="text-[9px] text-ink-soft font-bold">{l}</div>
    </div>
  );
}

function TautanKecil({ href, label }) {
  return (
    <Link
      href={href}
      className="text-[10.5px] font-bold text-ink-soft bg-white/60 border border-line rounded-full px-3.5 py-2"
    >
      {label}
    </Link>
  );
}
