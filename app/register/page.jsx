"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const JENIS_USAHA = ["Kuliner", "Fashion", "Craft/Kerajinan", "Jasa", "Lainnya"];

export default function RegisterPage() {
  const [nama, setNama] = useState("");
  const [namaUsaha, setNamaUsaha] = useState("");
  const [jenisUsaha, setJenisUsaha] = useState(JENIS_USAHA[0]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const daftar = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nama } },
    });

    if (signUpError) {
      setLoading(false);
      setError(
        signUpError.message.includes("already registered")
          ? "Email ini sudah terdaftar. Coba masuk saja."
          : "Gagal mendaftar, coba lagi ya."
      );
      return;
    }

    // Data usaha (nama_usaha, jenis_usaha) dibuat saat pertama kali masuk dashboard,
    // bukan di sini — supaya tidak gagal diam-diam kalau email konfirmasi masih aktif
    // dan sesi belum benar-benar berjalan.
    //
    // Navigasi penuh (bukan router.push) supaya sesi baru pasti sudah terbaca
    // server sebelum halaman berikutnya dimuat — ini memperbaiki bug "kepental balik".
    if (data.session) {
      window.location.href = `/dashboard?setup=1&nama_usaha=${encodeURIComponent(namaUsaha)}&jenis_usaha=${encodeURIComponent(jenisUsaha)}`;
    } else {
      window.location.href = "/login?terdaftar=1";
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-background px-4 py-10 overflow-hidden">
      <BlobBackground />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="font-display text-3xl font-extrabold tracking-tight">
            Sobat<span className="text-cyan">UMKM</span>
          </div>
          <div className="text-sm text-ink-soft mt-1.5">Daftar dulu, catat santai mulai hari ini.</div>
        </div>

        <form
          onSubmit={daftar}
          className="bg-card border border-line rounded-3xl p-7 space-y-4"
          style={{ boxShadow: "0 8px 30px rgba(124,92,252,0.08)" }}
        >
          <div>
            <label className="text-xs font-semibold text-ink-soft">Nama Kamu</label>
            <input
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full mt-1 border border-line rounded-xl px-4 py-2.5 text-sm outline-none bg-background focus:border-cyan transition-colors"
              placeholder="Nama lengkap"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-soft">Nama Usaha</label>
            <input
              required
              value={namaUsaha}
              onChange={(e) => setNamaUsaha(e.target.value)}
              className="w-full mt-1 border border-line rounded-xl px-4 py-2.5 text-sm outline-none bg-background focus:border-cyan transition-colors"
              placeholder="mis. Keripik Bu Yanti"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-soft">Jenis Usaha</label>
            <select
              value={jenisUsaha}
              onChange={(e) => setJenisUsaha(e.target.value)}
              className="w-full mt-1 border border-line rounded-xl px-4 py-2.5 text-sm outline-none bg-background focus:border-cyan transition-colors"
            >
              {JENIS_USAHA.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-soft">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 border border-line rounded-xl px-4 py-2.5 text-sm outline-none bg-background focus:border-cyan transition-colors"
              placeholder="nama@usaha.com"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-soft">Kata Sandi</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 border border-line rounded-xl px-4 py-2.5 text-sm outline-none bg-background focus:border-cyan transition-colors"
              placeholder="Minimal 6 karakter"
            />
          </div>

          {error && <div className="text-sm text-pink bg-pink-soft rounded-xl px-3 py-2">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-grad rounded-xl py-3 text-sm disabled:opacity-60 transition-transform active:scale-[0.98]"
          >
            {loading ? "Mendaftar..." : "Daftar & Mulai Catat"}
          </button>
        </form>

        <div className="text-center text-sm text-ink-soft mt-5">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-cyan font-bold">
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
}

function BlobBackground() {
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none">
      <svg className="absolute -top-16 -right-16 opacity-70" width="220" height="220" viewBox="0 0 220 220" fill="none">
        <circle cx="110" cy="110" r="110" fill="var(--pink-soft)" />
      </svg>
      <svg className="absolute -bottom-20 -left-14 opacity-70" width="260" height="260" viewBox="0 0 260 260" fill="none">
        <circle cx="130" cy="130" r="130" fill="var(--violet-soft)" />
      </svg>
      <svg className="absolute top-1/4 -left-10" width="90" height="90" viewBox="0 0 90 90" fill="none">
        <circle cx="45" cy="45" r="45" fill="var(--amber-soft)" />
      </svg>
    </div>
  );
}
