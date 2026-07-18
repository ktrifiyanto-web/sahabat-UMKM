import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="font-display text-3xl font-extrabold tracking-tight mb-2">
          Sobat<span className="text-violet">UMKM</span>
        </div>
        <p className="text-ink-soft text-sm mb-8">
          Pembukuan santai untuk UMKM — catat pakai bahasa sehari-hari,
          laporan tetap rapi basis akuntansi profesional.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/register"
            className="bg-pink text-white rounded-xl px-6 py-3 font-bold text-sm"
          >
            Daftar Gratis
          </Link>
          <Link
            href="/login"
            className="border border-line bg-card rounded-xl px-6 py-3 font-bold text-sm"
          >
            Masuk
          </Link>
        </div>
      </div>
    </div>
  );
}
