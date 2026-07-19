"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function KelolaAkun({ profiles, tenants }) {
  const router = useRouter();
  const supabase = createClient();
  const mentors = profiles.filter((p) => p.role === "mentor");

  const [form, setForm] = useState({
    role: "umkm", nama: "", email: "", password: "",
    nama_usaha: "", jenis_usaha: "Kuliner", mentor_id: "",
  });
  const [status, setStatus] = useState({ state: "idle", msg: "" });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const buat = async () => {
    if (!form.nama || !form.email || !form.password) {
      setStatus({ state: "err", msg: "Nama, email, dan kata sandi wajib diisi." });
      return;
    }
    setStatus({ state: "saving", msg: "" });
    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus({ state: "err", msg: data.error || "Gagal membuat akun." });
      return;
    }
    setStatus({ state: "ok", msg: `Akun ${form.role} "${form.nama}" berhasil dibuat!` });
    setForm({ role: form.role, nama: "", email: "", password: "", nama_usaha: "", jenis_usaha: "Kuliner", mentor_id: "" });
    router.refresh();
  };

  const gantiMentor = async (tenantId, mentorId) => {
    const { error } = await supabase.from("tenants")
      .update({ mentor_id: mentorId || null }).eq("id", tenantId);
    if (error) { alert("Gagal mengubah mentor: " + error.message); return; }
    router.refresh();
  };

  const inputCls = "w-full border border-line rounded-xl px-3.5 py-2.5 text-xs outline-none bg-white/70 focus:border-cyan";

  return (
    <div className="space-y-5">
      {/* Form buat akun */}
      <div className="glass p-5">
        <div className="font-display font-bold text-[13px] mb-3">+ Buat Akun Baru</div>
        <div className="flex gap-1.5 mb-3">
          {[["umkm", "🧺 Tenant/UMKM"], ["mentor", "🎓 Mentor"]].map(([v, l]) => (
            <button key={v} onClick={() => setForm((f) => ({ ...f, role: v }))}
              className="flex-1 py-2 rounded-xl text-[10.5px] font-extrabold"
              style={form.role === v
                ? { background: "linear-gradient(90deg,var(--cyan),var(--violet))", color: "#fff" }
                : { background: "rgba(15,35,64,0.05)", color: "var(--ink-soft)" }}>
              {l}
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-2.5">
          <input value={form.nama} onChange={set("nama")} placeholder="Nama lengkap" className={inputCls} />
          <input value={form.email} onChange={set("email")} placeholder="Email (untuk login)" className={inputCls} />
          <input value={form.password} onChange={set("password")} placeholder="Kata sandi (min. 6 karakter)" className={inputCls} />
          {form.role === "umkm" && (
            <>
              <input value={form.nama_usaha} onChange={set("nama_usaha")} placeholder="Nama usaha" className={inputCls} />
              <select value={form.jenis_usaha} onChange={set("jenis_usaha")} className={inputCls}>
                {["Kuliner", "Fashion", "Craft/Kerajinan", "Jasa", "Lainnya"].map((j) => <option key={j}>{j}</option>)}
              </select>
              <select value={form.mentor_id} onChange={set("mentor_id")} className={inputCls}>
                <option value="">Tanpa mentor (bisa diatur nanti)</option>
                {mentors.map((m) => <option key={m.id} value={m.id}>Mentor: {m.nama}</option>)}
              </select>
            </>
          )}
        </div>
        {status.state === "err" && <div className="text-xs text-pink bg-pink-soft rounded-xl px-3 py-2 mt-3">{status.msg}</div>}
        {status.state === "ok" && <div className="text-xs text-green bg-green-soft rounded-xl px-3 py-2 mt-3">{status.msg}</div>}
        <button onClick={buat} disabled={status.state === "saving"}
          className="btn-grad rounded-xl px-5 py-2.5 text-xs mt-3 disabled:opacity-60">
          {status.state === "saving" ? "Membuat akun..." : "Buat Akun"}
        </button>
        <p className="text-[9.5px] text-ink-dim mt-2">
          Catat email &amp; kata sandi lalu bagikan langsung ke orangnya — mereka tinggal login.
        </p>
      </div>

      {/* Atur mentor per tenant */}
      <div className="glass p-5">
        <div className="font-display font-bold text-[13px] mb-3">Atur Mentor per Tenant</div>
        {tenants.length === 0 && <div className="text-xs text-ink-soft">Belum ada tenant.</div>}
        <div className="space-y-2">
          {tenants.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center gap-2.5 py-1.5">
              <span className="text-xs font-bold flex-1 min-w-[140px]">{t.nama_usaha}</span>
              <select
                defaultValue={t.mentor_id || ""}
                onChange={(e) => gantiMentor(t.id, e.target.value)}
                className="border border-line rounded-lg px-2.5 py-2 text-[11px] outline-none bg-white/70"
              >
                <option value="">— Tanpa mentor —</option>
                {mentors.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Daftar semua akun */}
      <div className="glass p-5">
        <div className="font-display font-bold text-[13px] mb-3">Semua Akun ({profiles.length})</div>
        <div className="space-y-1.5">
          {profiles.map((p) => (
            <div key={p.id} className="flex items-center gap-2.5 text-xs py-1">
              <span className="font-bold flex-1">{p.nama || "—"}</span>
              <span className="text-[8.5px] font-extrabold px-2 py-1 rounded-full"
                style={{
                  background: p.role === "super_admin" ? "var(--violet-soft)" : p.role === "mentor" ? "var(--pink-soft)" : "var(--cyan-soft)",
                  color: p.role === "super_admin" ? "var(--violet)" : p.role === "mentor" ? "var(--pink)" : "#0E7490",
                }}>
                {p.role.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
