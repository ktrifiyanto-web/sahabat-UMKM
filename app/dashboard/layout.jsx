import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TombolKeluar from "@/components/TombolKeluar";

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: tenant } = await supabase
    .from("tenants")
    .select("nama_usaha")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="max-w-3xl mx-auto px-5 pt-6 pb-2 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xl font-extrabold tracking-tight">
            Sahabat<span className="text-green">Buku</span>
          </div>
          <div className="text-xs text-ink-soft mt-0.5">
            {tenant?.nama_usaha || "Usahamu"}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-1 bg-card border border-line rounded-full p-1 text-xs font-semibold">
            <Link href="/dashboard" className="px-3 py-1.5 rounded-full hover:bg-green-soft">
              Dashboard
            </Link>
            <Link href="/dashboard/goals" className="px-3 py-1.5 rounded-full hover:bg-green-soft">
              Target
            </Link>
          </nav>
          <TombolKeluar />
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-5 pb-16">{children}</main>
    </div>
  );
}
