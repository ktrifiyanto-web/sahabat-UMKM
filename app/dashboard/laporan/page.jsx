import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { rupiah } from "@/lib/format";

export default async function LaporanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, nama_usaha")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  const { data: transaksi } = await supabase
    .from("transactions")
    .select("nominal, tipe, coa:coa_id(nama, kelompok)")
    .eq("tenant_id", tenant.id);

  const rows = transaksi || [];
  const pendapatan = rows.filter((t) => t.tipe === "masuk").reduce((a, b) => a + (b.nominal || 0), 0);

  const bebanMap = {};
  let belumDikategori = 0;
  rows
    .filter((t) => t.tipe === "keluar")
    .forEach((t) => {
      const nama = t.coa?.nama || "Belum Terkategori";
      if (nama === "Belum Terkategori") {
        belumDikategori += t.nominal || 0;
      } else {
        bebanMap[nama] = (bebanMap[nama] || 0) + (t.nominal || 0);
      }
    });
  const totalBeban = Object.values(bebanMap).reduce((a, b) => a + b, 0);
  const laba = pendapatan - totalBeban - belumDikategori;

  return (
    <div className="mt-6">
      <Link href="/dashboard" className="text-sm text-green font-semibold">
        ← Kembali
      </Link>

      <div className="bg-card border border-line rounded-2xl p-6 mt-4">
        <div className="text-xs text-ink-soft uppercase tracking-wider font-bold">
          Laporan Laba Rugi · {tenant?.nama_usaha} · basis SAK EMKM (draf)
        </div>

        <div className="mt-5 text-sm space-y-1">
          <Baris label="Pendapatan Penjualan" nilai={rupiah(pendapatan)} />
          <div className="mt-3 mb-1 font-bold text-xs text-ink-soft">Beban-beban:</div>
          {Object.entries(bebanMap).map(([akun, n]) => (
            <Baris key={akun} label={`  ${akun}`} nilai={"(" + rupiah(n) + ")"} muted />
          ))}
          {belumDikategori > 0 && (
            <Baris label="  Belum Dikategorikan (cek dulu)" nilai={"(" + rupiah(belumDikategori) + ")"} muted highlight />
          )}
          <div className="border-t-2 border-foreground mt-3 pt-2.5">
            <Baris label="Laba Bersih" nilai={rupiah(laba)} bold />
          </div>
        </div>

        <div className="mt-4 text-xs text-ink-soft bg-background rounded-xl px-3 py-2">
          Ini masih draf otomatis dari catatanmu — cek dulu transaksi bertanda "cek lagi?" sebelum dipakai resmi (mis. untuk bank).
        </div>
      </div>
    </div>
  );
}

function Baris({ label, nilai, bold, muted, highlight }) {
  return (
    <div
      className="flex justify-between py-1"
      style={{
        fontWeight: bold ? 800 : 500,
        color: highlight ? "var(--honey)" : muted ? "var(--ink-soft)" : "var(--foreground)",
        fontSize: bold ? 15.5 : 14,
      }}
    >
      <span className="whitespace-pre">{label}</span>
      <span>{nilai}</span>
    </div>
  );
}
