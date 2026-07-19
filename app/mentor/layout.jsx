import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TombolKeluar from "@/components/TombolKeluar";
import NotifBell from "@/components/NotifBell";

export default async function MentorLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, nama").eq("id", user.id).maybeSingle();
  if (!profile || !["mentor", "super_admin"].includes(profile.role)) redirect("/dashboard");

  return (
    <div className="min-h-screen">
      <header className="max-w-4xl mx-auto px-5 pt-5 pb-1 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="font-display text-lg font-extrabold">
            Sobat<span className="text-cyan">UMKM</span>
          </div>
          <span className="inline-block text-[9.5px] text-white font-extrabold px-2.5 py-1 rounded-full mt-1"
            style={{ background: "linear-gradient(90deg,var(--violet),var(--pink))" }}>
            🎓 Mentor Pendamping · {profile.nama}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <NotifBell userId={user.id} />
          <TombolKeluar />
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-5 pb-16">{children}</main>
    </div>
  );
}
