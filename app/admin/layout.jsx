import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TombolKeluar from "@/components/TombolKeluar";
import NotifBell from "@/components/NotifBell";

export default async function AdminLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, nama").eq("id", user.id).maybeSingle();
  if (!profile || !["admin_program", "super_admin"].includes(profile.role)) redirect("/dashboard");

  const menu = [
    { href: "/admin", label: "🏠 Ringkasan" },
    { href: "/admin/akun", label: "👥 Kelola Akun" },
    { href: "/admin/blast", label: "📣 Blast Pesan" },
    { href: "/admin/export", label: "📥 Export Data" },
  ];

  return (
    <div className="min-h-screen">
      <header className="max-w-5xl mx-auto px-5 pt-5 pb-1 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="font-display text-lg font-extrabold">
            Sobat<span className="text-cyan">UMKM</span>
          </div>
          <span className="inline-block text-[9.5px] text-white font-extrabold px-2.5 py-1 rounded-full mt-1"
            style={{ background: "linear-gradient(90deg,var(--cyan),var(--violet))" }}>
            🛡️ Super Admin · {profile.nama}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <NotifBell userId={user.id} />
          <TombolKeluar />
        </div>
      </header>
      <nav className="max-w-5xl mx-auto px-5 pt-3 flex gap-2 flex-wrap">
        {menu.map((m) => (
          <Link key={m.href} href={m.href}
            className="text-[11px] font-bold text-ink-soft bg-white/60 border border-line rounded-full px-3.5 py-2">
            {m.label}
          </Link>
        ))}
      </nav>
      <main className="max-w-5xl mx-auto px-5 pb-16">{children}</main>
    </div>
  );
}
