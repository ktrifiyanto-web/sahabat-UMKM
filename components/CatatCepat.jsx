"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { parseSantai } from "@/lib/kategorisasi-lokal";

export default function CatatCepat({ tenantId, userId, coaMap }) {
  const supabase = createClient();
  const router = useRouter();
  const [tipe, setTipe] = useState("masuk");
  const [nominal, setNominal] = useState("");
  const [catatan, setCatatan] = useState("");
  const [status, setStatus] = useState("idle"); // idle | saving | ok

  const simpan = async () => {
    const n = Number(String(nominal).replace(/\D/g, ""));
    if (!n) return;
    setStatus("saving");

    const teks = `${tipe === "masuk" ? "jual" : "beli"} ${catatan || "-"} ${n}`;
    const hasil = parseSantai(teks);
    const akun = tipe === "masuk" ? "Pendapatan Penjualan" : hasil.tipe === "keluar" ? hasil.akun : "Beban Operasional Lainnya";
    const coa_id = coaMap[akun] || coaMap["Belum Terkategori"] || null;

    const { error } = await supabase.from("transactions").insert({
      tenant_id: tenantId,
      teks_asli: catatan ? `${catatan}` : tipe === "masuk" ? "Penjualan" : "Pengeluaran",
      nominal: n,
      tipe,
      coa_id,
      ai_confidence: 0.9,
      status: "terverifikasi",
      dibuat_oleh: userId,
    });

    if (error) {
      console.error("Gagal simpan:", error);
      setStatus("idle");
      return;
    }
    setNominal("");
    setCatatan("");
    setStatus("ok");
    setTimeout(() => setStatus("idle"), 2000);
    router.refresh();
  };

  return (
    <div className="mt-5">
      <h2 className="font-display font-bold text-sm mb-2">⚡ Catat Transaksi Cepat</h2>
      <div className="glass p-3.5">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex bg-background rounded-xl p-0.5 flex-shrink-0 self-start sm:self-auto">
            {["masuk", "keluar"].map((t) => (
              <button
                key={t}
                onClick={() => setTipe(t)}
                className="px-3.5 py-2 rounded-lg text-[10px] font-extrabold"
                style={
                  tipe === t
                    ? { background: "linear-gradient(90deg,var(--cyan),var(--violet))", color: "#fff" }
                    : { color: "var(--ink-soft)" }
                }
              >
                {t === "masuk" ? "Jual" : "Beli"}
              </button>
            ))}
          </div>
          <input
            inputMode="numeric"
            value={nominal}
            onChange={(e) => setNominal(e.target.value)}
            placeholder="Nominal (Rp)"
            className="flex-1 min-w-0 border border-line rounded-xl px-3.5 py-2.5 text-xs outline-none bg-white/70 focus:border-cyan"
          />
          <input
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && simpan()}
            placeholder="Catatan singkat (opsional)"
            className="flex-1 min-w-0 border border-line rounded-xl px-3.5 py-2.5 text-xs outline-none bg-white/70 focus:border-cyan"
          />
          <button
            onClick={simpan}
            disabled={status === "saving"}
            className="btn-grad rounded-xl px-5 py-2.5 text-xs disabled:opacity-60 flex-shrink-0"
          >
            {status === "saving" ? "..." : status === "ok" ? "✓ Tersimpan" : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
