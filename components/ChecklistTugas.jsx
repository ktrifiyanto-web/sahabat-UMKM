"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const TAG = {
  tugas: { bg: "var(--cyan-soft)", color: "#0E7490", label: "Tugas" },
  arahan: { bg: "var(--violet-soft)", color: "var(--violet)", label: "Arahan" },
  evaluasi: { bg: "var(--pink-soft)", color: "var(--pink)", label: "Evaluasi" },
  komentar: { bg: "var(--amber-soft)", color: "#92600A", label: "Catatan" },
};

export default function ChecklistTugas({ itemsAwal }) {
  const supabase = createClient();
  const [items, setItems] = useState(itemsAwal);

  const toggle = async (id) => {
    const item = items.find((i) => i.id === id);
    const baru = !item.selesai;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, selesai: baru } : i)));
    const { error } = await supabase.from("mentor_notes").update({ selesai: baru }).eq("id", id);
    if (error) {
      console.error("Gagal update:", error);
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, selesai: !baru } : i)));
    }
  };

  const belum = items.filter((i) => !i.selesai).length;

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display font-bold text-sm">✅ Perlu Kamu Lakukan</h2>
        {belum > 0 && (
          <span className="text-[10px] font-extrabold text-cyan bg-cyan-soft px-2.5 py-1 rounded-full">
            {belum} belum selesai
          </span>
        )}
      </div>
      <p className="text-[10.5px] text-ink-soft mb-2.5">
        Arahan & tugas dari mentormu — centang kalau sudah dikerjakan.
      </p>

      <div className="glass p-1.5">
        {items.length === 0 && (
          <div className="text-xs text-ink-soft text-center py-6">
            Belum ada tugas atau arahan. Nanti muncul di sini kalau mentormu mengirim.
          </div>
        )}
        {items.map((item) => {
          const tag = TAG[item.jenis] || TAG.komentar;
          return (
            <div key={item.id} className="flex items-center gap-2.5 px-3 py-3 border-b border-dashed border-line last:border-0">
              <button
                onClick={() => toggle(item.id)}
                aria-label="Tandai selesai"
                className="w-[21px] h-[21px] rounded-lg border-2 flex-shrink-0 flex items-center justify-center text-white text-xs"
                style={
                  item.selesai
                    ? { background: "linear-gradient(135deg,var(--cyan),var(--violet))", borderColor: "transparent" }
                    : { borderColor: "var(--line)" }
                }
              >
                {item.selesai ? "✓" : ""}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-bold ${item.selesai ? "line-through text-ink-dim" : ""}`}>
                  {item.isi}
                </div>
              </div>
              <span
                className="text-[8.5px] font-extrabold px-2 py-1 rounded-full whitespace-nowrap"
                style={{ background: tag.bg, color: tag.color }}
              >
                {tag.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
