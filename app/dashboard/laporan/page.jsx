import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rupiah } from "@/lib/format";

export default async function LaporanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, nama_usaha")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!tenant) redirect("/dashboard");

  const tahunIni = new Date().getFullYear();
  const { data: transaksi } = await supabase
    .from("transactions")
    .select("nominal, tipe, tanggal, coa:coa_id(nama, kelompok)")
    .eq("tenant_id", tenant.id);

  const rows = transaksi || [];
  const rowsYtd = rows.filter((t) => t.tanggal?.startsWith(String(tahunIni)));
  const rowsYtdLalu = rows.filter((t) => t.tanggal?.startsWith(String(tahunIni - 1)));

  const total = (arr, tipe) => arr.filter((t) => t.tipe === tipe).reduce((a, b) => a + (b.nominal || 0), 0);

  const pendapatanYtd = total(rowsYtd, "masuk");
  const bebanYtd = total(rowsYtd, "keluar");
  const labaYtd = pendapatanYtd - bebanYtd;
  const pendapatanLalu = total(rowsYtdLalu, "masuk");
  const yoy = pendapatanLalu > 0 ? Math.round(((pendapatanYtd - pendapatanLalu) / pendapatanLalu) * 100) : null;
  const margin = pendapatanYtd > 0 ? Math.round((labaYtd / pendapatanYtd) * 100) : 0;

  // Rincian beban per akun
  const bebanMap = {};
  rowsYtd
    .filter((t) => t.tipe === "keluar")
    .forEach((t) => {
      const nama = t.coa?.nama || "Belum Dikategorikan";
      bebanMap[nama] = (bebanMap[nama] || 0) + (t.nominal || 0);
    });

  return (
    <div className="mt-3">
      <h1 className="font-display font-bold text-lg">Laporan Keuangan</h1>
      <p className="text-[11.5px] text-ink-soft mb-4">
        Otomatis dari catatan transaksi harianmu — tidak perlu diisi manual.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5">
        <Kpi label={`Pendapatan YTD ${tahunIni}`} v={rupiah(pendapatanYtd)} sub={yoy != null ? `${yoy >= 0 ? "↑" : "↓"} ${Math.abs(yoy)}% YoY` : null} subWarna={yoy >= 0 ? "var(--green)" : "var(--pink)"} />
        <Kpi label={`Laba YTD ${tahunIni}`} v={rupiah(labaYtd)} />
        <Kpi label="Margin Laba" v={`${margin}%`} />
        <Kpi label="Total Transaksi" v={`${rowsYtd.length}`} />
      </div>

      <div className="glass p-5">
        <div className="font-display font-bold text-[13px] mb-3">Laba Rugi {tahunIni}</div>
        <Baris label="Pendapatan" nilai={rupiah(pendapatanYtd)} tebal />
        {Object.entries(bebanMap).map(([nama, jumlah]) => (
          <Baris key={nama} label={nama} nilai={`(${rupiah(jumlah)})`} muted highlight={nama === "Belum Dikategorikan"} />
        ))}
        <div className="border-t border-line mt-2 pt-2">
          <Baris label="Laba / Rugi Bersih" nilai={rupiah(labaYtd)} tebal warna={labaYtd >= 0 ? "var(--green)" : "var(--pink)"} />
        </div>
      </div>

      <Link href="/dashboard" className="inline-block text-xs text-cyan font-bold mt-4">← Kembali ke Ringkasan</Link>
    </div>
  );
}

function Kpi({ label, v, sub, subWarna }) {
  return (
    <div className="glass p-3.5">
      <div className="text-[9.5px] text-ink-soft font-bold">{label}</div>
      <div className="font-display font-bold text-base mt-0.5">{v}</div>
      {sub && <div className="text-[9px] font-bold mt-0.5" style={{ color: subWarna }}>{sub}</div>}
    </div>
  );
}

function Baris({ label, nilai, tebal, muted, warna, highlight }) {
  return (
    <div className="flex justify-between py-1.5 text-xs" style={{
      fontWeight: tebal ? 800 : 600,
      color: warna || (highlight ? "#B8860B" : muted ? "var(--ink-soft)" : "var(--foreground)"),
    }}>
      <span>{label}</span>
      <span>{nilai}</span>
    </div>
  );
}
