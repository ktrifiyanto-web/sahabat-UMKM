"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Form generik untuk tabel 1-baris-per-tenant (roadmaps, strategies)
export default function FormUpsert({ tabel, tenantId, fields, dataAwal }) {
  const supabase = createClient();
  const d = dataAwal || {};
  const [form, setForm] = useState(
    Object.fromEntries(fields.map((f) => [f.key, d[f.key] ?? ""]))
  );
  const [status, setStatus] = useState("idle");

  const simpan = async () => {
    setStatus("saving");
    const { error } = await supabase
      .from(tabel)
      .upsert({ tenant_id: tenantId, ...form, updated_at: new Date().toISOString() });
    if (error) { console.error(error); setStatus("idle"); return; }
    setStatus("ok");
    setTimeout(() => setStatus("idle"), 2000);
  };

  return (
    <div className="glass p-5 space-y-4">
      {fields.map((f) => (
        <div key={f.key}>
          <label className="text-[10.5px] font-bold text-ink-soft block mb-1.5">{f.label}</label>
          <textarea
            rows={f.rows || 3}
            value={form[f.key]}
            onChange={(e) => setForm((x) => ({ ...x, [f.key]: e.target.value }))}
            placeholder={f.placeholder}
            className="w-full border border-line rounded-xl px-3.5 py-2.5 text-xs outline-none bg-white/70 focus:border-cyan resize-y"
          />
        </div>
      ))}
      <button onClick={simpan} disabled={status === "saving"} className="btn-grad rounded-xl px-5 py-2.5 text-xs disabled:opacity-60">
        {status === "saving" ? "Menyimpan..." : status === "ok" ? "✓ Tersimpan" : "Simpan"}
      </button>
    </div>
  );
}
