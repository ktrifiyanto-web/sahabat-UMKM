import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TombolKeluar from "@/components/TombolKeluar";
import NotifBell from "@/components/NotifBell";

export default async function AdminLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, nama")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !["admin_program", "super_admin"].includes(profile.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="max-w-5xl mx-auto px-5 pt-6 pb-2 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="font-display text-xl font-extrabold tracking-tight">
            Sobat<span className="text-violet">UMKM</span>
          </div>
          <div className="text-xs text-ink-soft mt-0.5">Dashboard Admin Program · {profile.nama}</div>
        </div>
        <div className="flex items-center gap-2">
          <NotifBell userId={user.id} />
          <TombolKeluar />
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-5 pb-16">{children}</main>
    </div>
  );
}
