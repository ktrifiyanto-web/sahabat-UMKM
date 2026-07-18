"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const JENIS_USAHA = ["Kuliner", "Fashion", "Craft/Kerajinan", "Jasa", "Lainnya"];

export default function RegisterPage() {
  const router = useRouter();
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

    setLoading(false);

    // Data usaha (nama_usaha, jenis_usaha) dibuat saat pertama kali masuk dashboard,
    // bukan di sini — supaya tidak gagal diam-diam kalau email konfirmasi masih aktif
    // dan sesi belum benar-benar berjalan.
    if (data.session) {
      router.push(`/dashboard?setup=1&nama_usaha=${encodeURIComponent(namaUsaha)}&jenis_usaha=${encodeURIComponent(jenisUsaha)}`);
      router.refresh();
    } else {
      router.push("/login?terdaftar=1");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-display text-2xl font-extrabold tracking-tight">
            Sobat<span className="text-violet">UMKM</span>
          </div>
          <div className="text-sm text-ink-soft mt-1">Daftar dulu, catat santai mulai hari ini.</div>
        </div>

        <form onSubmit={daftar} className="bg-card border border-line rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-ink-soft">Nama Kamu</label>
            <input
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full mt-1 border border-line rounded-xl px-4 py-2.5 text-sm outline-none bg-background"
              placeholder="Nama lengkap"
            />
          </div>
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
          <div>
            <label className="text-xs font-semibold text-ink-soft">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 border border-line rounded-xl px-4 py-2.5 text-sm outline-none bg-background"
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
              className="w-full mt-1 border border-line rounded-xl px-4 py-2.5 text-sm outline-none bg-background"
              placeholder="Minimal 6 karakter"
            />
          </div>

          {error && <div className="text-sm text-pink bg-pink-soft rounded-xl px-3 py-2">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-60"
          >
            {loading ? "Mendaftar..." : "Daftar & Mulai Catat"}
          </button>
        </form>

        <div className="text-center text-sm text-ink-soft mt-4">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-violet font-semibold">
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
