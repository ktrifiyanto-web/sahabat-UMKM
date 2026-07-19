"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const ROLES = [
  { v: "umkm", label: "UMKM", icon: "🧺" },
  { v: "tenant", label: "Tenant Inkubasi", icon: "🏛️" },
  { v: "mentor", label: "Mentor", icon: "🎓" },
];

export default function LoginPage() {
  const [rolePilihan, setRolePilihan] = useState("umkm");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const masuk = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      setError("Email atau kata sandi salah. Coba lagi ya.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", data.user.id).maybeSingle();

    const tujuan =
      profile?.role === "mentor" ? "/mentor"
      : profile?.role === "admin_program" || profile?.role === "super_admin" ? "/admin"
      : "/dashboard";

    // Navigasi penuh agar sesi pasti terbaca server (mencegah bug kepental balik)
    window.location.href = tujuan;
  };

  const rolePrimary = ROLES.find((r) => r.v === rolePilihan);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="glass p-5 text-center mb-5 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.9), rgba(139,92,246,0.9))" }}>
          <div className="font-display text-2xl font-extrabold text-white relative z-10">
            Sobat<span style={{ color: "#FDE68A" }}>UMKM</span>
          </div>
          <div className="text-[11px] text-white/80 font-semibold mt-0.5 relative z-10">Naik Kelas Bersama</div>
        </div>

        <div className="glass p-3 mb-4 flex items-center justify-center gap-2 border-2"
          style={{ borderColor: "var(--cyan)" }}>
          <span className="text-base">{rolePrimary.icon}</span>
          <span className="font-extrabold text-sm text-cyan">Masuk sebagai {rolePrimary.label}</span>
        </div>

        <form onSubmit={masuk} className="glass p-6 space-y-4">
          <div>
            <label className="text-[10.5px] font-bold text-ink-soft block mb-1">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@usaha.com"
              className="w-full border border-line rounded-xl px-4 py-2.5 text-sm outline-none bg-white/70 focus:border-cyan" />
          </div>
          <div>
            <label className="text-[10.5px] font-bold text-ink-soft block mb-1">Kata Sandi</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-line rounded-xl px-4 py-2.5 text-sm outline-none bg-white/70 focus:border-cyan" />
          </div>
          {error && <div className="text-sm text-pink bg-pink-soft rounded-xl px-3 py-2">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full btn-grad rounded-xl py-3 text-sm disabled:opacity-60 active:scale-[0.98] transition-transform">
            {loading ? "Masuk..." : "Masuk"}
          </button>
        </form>

        <div className="text-center text-[10px] font-bold text-ink-soft mt-4 mb-2">atau masuk sebagai</div>
        <div className="flex gap-2">
          {ROLES.filter((r) => r.v !== rolePilihan).map((r) => (
            <button key={r.v} onClick={() => setRolePilihan(r.v)}
              className="flex-1 glass py-2.5 text-[11px] font-bold text-ink-soft">
              {r.icon} {r.label}
            </button>
          ))}
        </div>

        <div className="text-center text-sm text-ink-soft mt-5">
          Belum punya akun UMKM?{" "}
          <Link href="/register" className="text-cyan font-bold">Daftar di sini</Link>
        </div>
        <div className="text-center mt-3">
          <span className="text-[10px] text-ink-dim">Tenant &amp; Mentor: akun dibuatkan oleh Admin Program</span>
        </div>
      </div>
    </div>
  );
}
