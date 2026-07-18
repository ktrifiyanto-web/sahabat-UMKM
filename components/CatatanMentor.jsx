"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const JENIS_CATATAN = [
  { v: "komentar", label: "Komentar" },
  { v: "tugas", label: "Tugas" },
  { v: "evaluasi", label: "Evaluasi" },
];

export default function CatatanMentor({ tenantId, mentorId, catatanAwal }) {
  const supabase = createClient();
  const [catatan, setCatatan] = useState(catatanAwal);
  const [isi, setIsi] = useState("");
  const [jenis, setJenis] = useState("komentar");
  const [saving, setSaving] = useState(false);

  const kirim = async (e) => {
    e.preventDefault();
    if (!isi.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("mentor_notes")
      .insert({
        tenant_id: tenantId,
        mentor_id: mentorId,
        jenis,
        isi: isi.trim(),
      })
      .select("id, jenis, isi, selesai, created_at")
      .single();
    setSaving(false);
    if (error) {
      console.error("Gagal mengirim catatan:", error);
      return;
    }
    setCatatan((prev) => [data, ...prev]);
    setIsi("");
  };

  return (
    <div>
      <h2 className="font-display font-bold text-sm mb-2">Catatan & Tugas</h2>

      <form onSubmit={kirim} className="bg-card border border-line rounded-2xl p-4 mb-4 space-y-3">
        <div className="flex gap-2">
          {JENIS_CATATAN.map((j) => (
            <button
              type="button"
              key={j.v}
              onClick={() => setJenis(j.v)}
              className="px-3 py-1.5 rounded-full text-xs font-bold"
              style={{
                background: jenis === j.v ? "var(--violet)" : "var(--background)",
                color: jenis === j.v ? "#fff" : "var(--ink-soft)",
              }}
            >
              {j.label}
            </button>
          ))}
        </div>
        <textarea
          value={isi}
          onChange={(e) => setIsi(e.target.value)}
          rows={3}
          placeholder="Tulis komentar, tugas, atau evaluasi untuk UMKM ini..."
          className="w-full border border-line rounded-xl px-3 py-2.5 text-sm outline-none bg-background resize-none"
        />
        <button
          type="submit"
          disabled={saving}
          className="bg-violet text-white rounded-xl px-5 py-2 text-xs font-bold disabled:opacity-60"
        >
          {saving ? "Mengirim..." : "Kirim ke UMKM"}
        </button>
      </form>

      <div className="space-y-2">
        {catatan.length === 0 && (
          <div className="text-xs text-ink-soft text-center py-4">Belum ada catatan.</div>
        )}
        {catatan.map((c) => (
          <div key={c.id} className="bg-card border border-line rounded-xl p-3">
            <span
              className="text-[9px] font-extrabold px-2 py-0.5 rounded-full"
              style={{ background: "var(--yellow-soft)", color: "#8A6A05" }}
            >
              {c.jenis.toUpperCase()}
            </span>
            <div className="text-sm mt-1.5">{c.isi}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
