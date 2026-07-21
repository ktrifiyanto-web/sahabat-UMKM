"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const LEGALITAS = [
  "Belum ada",
  "NIB proses",
  "NIB selesai",
  "NIB selesai, PIRT proses",
  "Lengkap (NIB + PIRT/Halal)",
];

export default function FormSektor({ tenantId, dataAwal, mode, bisaEdit = true }) {
  const supabase = createClient();
  const d = dataAwal || {};
  const [form, setForm] = useState({
    pelanggan_aktual: d.pelanggan_aktual ?? "",
    pelanggan_target: d.pelanggan_target ?? "",
    tim_aktual: d.tim_aktual ?? "",
    tim_target: d.tim_target ?? "",
    mitra_aktual: d.mitra_aktual ?? "",
    mitra_target: d.mitra_target ?? "",
    legalitas_status: d.legalitas_status ?? LEGALITAS[0],
    legalitas_catatan: d.legalitas_catatan ?? "",
  });
  const [status, setStatus] = useState("idle");

  const isTenant = mode === "tenant";

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const simpan = async () => {
    setStatus("saving");
    const payload = { tenant_id: tenantId };
    const angka = (v) => (v === "" || v == null ? 0 : Number(v));
    if (isTenant) {
      payload.pelanggan_aktual = angka(form.pelanggan_aktual);
      payload.tim_aktual = angka(form.tim_aktual);
      payload.mitra_aktual = angka(form.mitra_aktual);
      payload.legalitas_status = form.legalitas_status;
      payload.legalitas_catatan = form.legalitas_catatan;
      // pertahankan target yang sudah ada agar upsert tidak menimpanya dengan 0
      payload.pelanggan_target = angka(form.pelanggan_target);
      payload.tim_target = angka(form.tim_target);
      payload.mitra_target = angka(form.mitra_target);
    } else {
      payload.pelanggan_target = angka(form.pelanggan_target);
      payload.tim_target = angka(form.tim_target);
      payload.mitra_target = angka(form.mitra_target);
      payload.pelanggan_aktual = angka(form.pelanggan_aktual);
      payload.tim_aktual = angka(form.tim_aktual);
      payload.mitra_aktual = angka(form.mitra_aktual);
      payload.legalitas_status = form.legalitas_status;
      payload.legalitas_catatan = form.legalitas_catatan;
    }
    payload.updated_at = new Date().toISOString();

    const { error } = await supabase.from("sector_reports").upsert(payload);
    if (error) {
      console.error("Gagal simpan sektor:", error);
      setStatus("idle");
      return;
    }
    setStatus("ok");
    setTimeout(() => setStatus("idle"), 2000);
  };

  const Baris = ({ label, ikon, kAktual, kTarget }) => (
    <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-2.5 items-center py-2">
      <span className="text-xs font-bold">
        {ikon} {label}
      </span>
      <input
        inputMode="numeric"
        value={form[kAktual]}
        onChange={set(kAktual)}
        disabled={!isTenant || !bisaEdit}
        placeholder="Aktual"
        className="border border-line rounded-lg px-2.5 py-2 text-xs outline-none bg-white/70 focus:border-cyan disabled:opacity-50 text-center"
      />
      <input
        inputMode="numeric"
        value={form[kTarget]}
        onChange={set(kTarget)}
        disabled={isTenant || !bisaEdit}
        placeholder="Target"
        className="border border-line rounded-lg px-2.5 py-2 text-xs outline-none bg-white/70 focus:border-cyan disabled:opacity-50 text-center"
      />
    </div>
  );

  return (
    <div className="glass p-5">
      {!bisaEdit && (
        <div className="text-[10.5px] font-bold text-ink-soft bg-white/60 border border-line rounded-lg px-3 py-2 mb-3">
          👁️ Kamu cuma bisa lihat data ini — cuma pemilik usaha yang bisa mengubah.
        </div>
      )}
      <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-2.5 text-[9px] font-extrabold text-ink-dim uppercase pb-1.5 border-b border-line">
        <span>Sektor</span>
        <span className="text-center">Aktual {isTenant && "(isi kamu)"}</span>
        <span className="text-center">Target {!isTenant && "(isi kamu)"}</span>
      </div>
      <Baris label="Pelanggan" ikon="👥" kAktual="pelanggan_aktual" kTarget="pelanggan_target" />
      <Baris label="Tim" ikon="🧑‍🤝‍🧑" kAktual="tim_aktual" kTarget="tim_target" />
      <Baris label="Mitra" ikon="🤝" kAktual="mitra_aktual" kTarget="mitra_target" />

      <div className="grid sm:grid-cols-2 gap-3 mt-3">
        <div>
          <label className="text-[10px] font-bold text-ink-soft block mb-1">📜 Status Legalitas</label>
          <select
            value={form.legalitas_status}
            onChange={set("legalitas_status")}
            disabled={!bisaEdit}
            className="w-full border border-line rounded-lg px-2.5 py-2 text-xs outline-none bg-white/70 disabled:opacity-50"
          >
            {LEGALITAS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-ink-soft block mb-1">Catatan Legalitas</label>
          <input
            value={form.legalitas_catatan}
            onChange={set("legalitas_catatan")}
            disabled={!bisaEdit}
            placeholder="mis. PIRT diajukan Juli 2026"
            className="w-full border border-line rounded-lg px-2.5 py-2 text-xs outline-none bg-white/70 focus:border-cyan disabled:opacity-50"
          />
        </div>
      </div>

      {bisaEdit && (
        <button onClick={simpan} disabled={status === "saving"} className="btn-grad rounded-xl px-5 py-2.5 text-xs mt-4 disabled:opacity-60">
          {status === "saving" ? "Menyimpan..." : status === "ok" ? "✓ Tersimpan" : "Simpan"}
        </button>
      )}
    </div>
  );
}
