"use client";

import { useState } from "react";

export default function BlastPage() {
  const [judul, setJudul] = useState("");
  const [isi, setIsi] = useState("");
  const [target, setTarget] = useState("semua");
  const [status, setStatus] = useState({ state: "idle", msg: "" });

  const kirim = async () => {
    if (!judul.trim() || !isi.trim()) {
      setStatus({ state: "err", msg: "Judul dan isi wajib diisi." });
      return;
    }
    setStatus({ state: "saving", msg: "" });
    const res = await fetch("/api/admin/blast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ judul, isi, target }),
    });
    const data = await res.json();
    if (!res.ok) { setStatus({ state: "err", msg: data.error || "Gagal mengirim." }); return; }
    setStatus({ state: "ok", msg: `Terkirim ke ${data.terkirim} pengguna (muncul di lonceng notifikasi mereka).` });
    setJudul(""); setIsi("");
  };

  return (
    <div className="mt-4 max-w-xl">
      <h1 className="font-display font-bold text-lg mb-1">Blast Pesan</h1>
      <p className="text-[11.5px] text-ink-soft mb-4">
        Kirim pengumuman serentak — masuk ke notifikasi 🔔 semua pengguna terpilih.
      </p>

      <div className="glass p-5">
        <div className="flex gap-1.5 mb-3">
          {[["semua", "Semua"], ["umkm", "Tenant/UMKM"], ["mentor", "Mentor"]].map(([v, l]) => (
            <button key={v} onClick={() => setTarget(v)}
              className="flex-1 py-2 rounded-xl text-[10.5px] font-extrabold"
              style={target === v
                ? { background: "linear-gradient(90deg,var(--cyan),var(--violet))", color: "#fff" }
                : { background: "rgba(15,35,64,0.05)", color: "var(--ink-soft)" }}>
              {l}
            </button>
          ))}
        </div>
        <input value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Judul pengumuman"
          className="w-full border border-line rounded-xl px-3.5 py-2.5 text-xs outline-none bg-white/70 focus:border-cyan mb-2.5" />
        <textarea rows={5} value={isi} onChange={(e) => setIsi(e.target.value)}
          placeholder="Isi pengumuman... (mis. jadwal pelatihan, pengingat laporan bulanan)"
          className="w-full border border-line rounded-xl px-3.5 py-3 text-xs outline-none bg-white/70 focus:border-cyan resize-y" />
        {status.state === "err" && <div className="text-xs text-pink bg-pink-soft rounded-xl px-3 py-2 mt-2">{status.msg}</div>}
        {status.state === "ok" && <div className="text-xs text-green bg-green-soft rounded-xl px-3 py-2 mt-2">{status.msg}</div>}
        <button onClick={kirim} disabled={status.state === "saving"}
          className="btn-grad rounded-xl px-5 py-2.5 text-xs mt-3 disabled:opacity-60">
          {status.state === "saving" ? "Mengirim..." : "📣 Kirim Blast"}
        </button>
      </div>
    </div>
  );
}
