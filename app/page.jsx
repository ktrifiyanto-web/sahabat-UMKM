import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="font-display text-3xl font-extrabold tracking-tight mb-2">
          Sobat
          <span style={{ background: "linear-gradient(90deg,var(--cyan),var(--violet))", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
            UMKM
          </span>
        </div>
        <p className="text-ink-soft text-sm mb-8">
          Kelola bisnis lebih cerdas — pembukuan santai, pantau kesehatan usaha,
          analisis AI, dan pendampingan mentor dalam satu platform.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/register" className="btn-grad rounded-xl px-6 py-3 text-sm">Daftar Gratis</Link>
          <Link href="/login" className="glass rounded-xl px-6 py-3 font-bold text-sm">Masuk</Link>
        </div>
      </div>
    </div>
  );
}
