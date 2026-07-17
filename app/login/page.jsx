"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const masuk = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Email atau kata sandi salah. Coba lagi ya.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-2xl font-extrabold tracking-tight">
            Sahabat<span className="text-green">Buku</span>
          </div>
          <div className="text-sm text-ink-soft mt-1">Catat santai, laporan tetap rapi.</div>
        </div>

        <form
          onSubmit={masuk}
          className="bg-card border border-line rounded-2xl p-6 space-y-4"
        >
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 border border-line rounded-xl px-4 py-2.5 text-sm outline-none bg-background"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-sm text-red bg-red-soft rounded-xl px-3 py-2">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-60"
          >
            {loading ? "Masuk..." : "Masuk"}
          </button>
        </form>

        <div className="text-center text-sm text-ink-soft mt-4">
          Belum punya akun?{" "}
          <Link href="/register" className="text-green font-semibold">
            Daftar di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
