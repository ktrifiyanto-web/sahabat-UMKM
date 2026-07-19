"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STATUS = {
  rencana: { bg: "var(--violet-soft)", color: "var(--violet)", label: "RENCANA" },
  berjalan: { bg: "var(--cyan-soft)", color: "#0E7490", label: "BERJALAN" },
  selesai: { bg: "var(--green-soft)", color: "var(--green)", label: "SELESAI" },
};

export default function ProjectManager({ tenantId, projectsAwal }) {
  const supabase = createClient();
  const [projects, setProjects] = useState(projectsAwal);
  const [nama, setNama] = useState("");
  const [statusBaru, setStatusBaru] = useState("rencana");
  const [tanggal, setTanggal] = useState("");
  const [saving, setSaving] = useState(false);

  const tambah = async () => {
    if (!nama.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("projects")
      .insert({ tenant_id: tenantId, nama: nama.trim(), status: statusBaru, target_selesai: tanggal || null })
      .select("id, nama, status, target_selesai")
      .single();
    setSaving(false);
    if (error) { console.error(error); return; }
    setProjects((p) => [data, ...p]);
    setNama(""); setTanggal(""); setStatusBaru("rencana");
  };

  const ubahStatus = async (id, statusLama) => {
    const urutan = ["rencana", "berjalan", "selesai"];
    const baru = urutan[(urutan.indexOf(statusLama) + 1) % 3];
    setProjects((p) => p.map((x) => (x.id === id ? { ...x, status: baru } : x)));
    const { error } = await supabase.from("projects").update({ status: baru }).eq("id", id);
    if (error) {
      setProjects((p) => p.map((x) => (x.id === id ? { ...x, status: statusLama } : x)));
    }
  };

  return (
    <>
      <div className="glass p-2 mb-4">
        {projects.length === 0 && (
          <div className="text-xs text-ink-soft text-center py-6">Belum ada project. Tambahkan di bawah.</div>
        )}
        {projects.map((p) => {
          const s = STATUS[p.status] || STATUS.rencana;
          return (
            <div key={p.id} className="flex items-center gap-3 px-3 py-3 border-b border-dashed border-line last:border-0">
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-bold ${p.status === "selesai" ? "line-through text-ink-dim" : ""}`}>{p.nama}</div>
                {p.target_selesai && (
                  <div className="text-[9.5px] text-ink-soft mt-0.5">Target selesai: {p.target_selesai}</div>
                )}
              </div>
              <button
                onClick={() => ubahStatus(p.id, p.status)}
                title="Klik untuk ganti status"
                className="text-[8.5px] font-extrabold px-2.5 py-1.5 rounded-full"
                style={{ background: s.bg, color: s.color }}
              >
                {s.label}
              </button>
            </div>
          );
        })}
      </div>

      <div className="glass p-4">
        <div className="font-display font-bold text-[13px] mb-3">+ Tambah Project Baru</div>
        <div className="grid sm:grid-cols-2 gap-2.5">
          <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama project"
            className="sm:col-span-2 border border-line rounded-xl px-3.5 py-2.5 text-xs outline-none bg-white/70 focus:border-cyan" />
          <select value={statusBaru} onChange={(e) => setStatusBaru(e.target.value)}
            className="border border-line rounded-xl px-3.5 py-2.5 text-xs outline-none bg-white/70">
            <option value="rencana">Rencana</option>
            <option value="berjalan">Berjalan</option>
            <option value="selesai">Selesai</option>
          </select>
          <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)}
            className="border border-line rounded-xl px-3.5 py-2.5 text-xs outline-none bg-white/70" />
        </div>
        <button onClick={tambah} disabled={saving} className="btn-grad rounded-xl px-5 py-2.5 text-xs mt-3 disabled:opacity-60">
          {saving ? "Menyimpan..." : "Tambah Project"}
        </button>
        <p className="text-[9.5px] text-ink-dim mt-2">Tip: klik badge status di daftar untuk mengubah Rencana → Berjalan → Selesai.</p>
      </div>
    </>
  );
}
