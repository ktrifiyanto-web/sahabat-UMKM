"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const JENIS_USAHA = ["Kuliner", "Fashion", "Craft/Kerajinan", "Jasa", "Lainnya"];

export default function SetupUsaha({ userId }) {
  const params = useSearchParams();
  const [namaUsaha, setNamaUsaha] = useState(params.get("nama_usaha") || "");
  const [jenisUsaha, setJenisUsaha] = useState(params.get("jenis_usaha") || JENIS_USAHA[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const simpan = async (e) => {
    e.preventDefault();
    if (!namaUsaha.trim()) return;
    setLoading(true);
    setError("");
    const supabase = createClient();

    // Dulu pakai upsert(onConflict: "owner_id") karena 1 owner cuma boleh
    // 1 usaha. Sejak migrasi 006 (multi-bisnis), owner boleh punya banyak
    // usaha, jadi ini sekarang INSERT biasa — bikin baris usaha baru.
    const { error: insertError } = await supabase
      .from("tenants")
      .insert({ nama_usaha: namaUsaha.trim(), jenis_usaha: jenisUsaha, owner_id: userId });

    setLoading(false);
    if (insertError) {
      console.error("Gagal membuat tenant:", insertError);
      setError("Gagal menyimpan, coba lagi ya.");
      return;
    }

    window.location.href = "/dashboard";
  };

  return (
    <div className="mt-10 max-w-sm mx-auto">
      <div className="text-center mb-6">
        <div className="font-display text-xl font-extrabold">Lengkapi Data Usahamu</div>
        <div className="text-sm text-ink-soft mt-1">
          Tinggal satu langkah lagi sebelum mulai catat transaksi.
        </div>
      </div>
      <form onSubmit={simpan} className="bg-card border border-line rounded-2xl p-6 space-y-4">
        <div>
          <label className="text-xs font-semibold text-ink-soft">Nama Usaha</label>
          <input
            required
            value={namaUsaha}
            onChange={(e) => setNamaUsaha(e.target.value)}
            className="w-full mt-1 border border-line rounded-xl px-4 py-2.5 text-sm outline-none bg-background"
            placeholder="mis. Keripik Bu Yanti"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-soft">Jenis Usaha</label>
          <select
            value={jenisUsaha}
            onChange={(e) => setJenisUsaha(e.target.value)}
            className="w-full mt-1 border border-line rounded-xl px-4 py-2.5 text-sm outline-none bg-background"
          >
            {JENIS_USAHA.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
        </div>
        {error && <div className="text-sm text-pink bg-pink-soft rounded-xl px-3 py-2">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-violet text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-60"
        >
          {loading ? "Menyimpan..." : "Mulai Catat"}
        </button>
      </form>
    </div>
  );
}
