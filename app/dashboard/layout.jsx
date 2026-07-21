import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsahaSaya } from "@/lib/usaha-aktif";
import TombolKeluar from "@/components/TombolKeluar";
import NotifBell from "@/components/NotifBell";
import AppNav from "@/components/AppNav";
import PilihUsaha from "@/components/PilihUsaha";

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { daftarUsaha, usahaAktif } = await getUsahaSaya();

  let chatBelum = 0;
  if (usahaAktif) {
    const { count } = await supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", usahaAktif.id)
      .eq("dibaca", false)
      .neq("sender_id", user.id);
    chatBelum = count || 0;
  }

  const navItems = [
    { href: "/dashboard", label: "Ringkasan", icon: "🏠", mobile: true },
    { href: "/dashboard/bisnis-saya", label: "Bisnis Saya", icon: "🏢", mobile: true },
    { href: "/dashboard/chat", label: "Chat Mentor", icon: "💬", mobile: true, badge: chatBelum },
    { divider: "Laporan Lengkap" },
    { href: "/dashboard/sektor", label: "Target & Sektor", icon: "🎯", mobile: true },
    { href: "/dashboard/project", label: "Project 90 Hari", icon: "🗂️", mobile: false },
    { href: "/dashboard/roadmap", label: "Jangka Panjang", icon: "🛣️", mobile: false },
    { href: "/dashboard/strategi", label: "Strategi", icon: "🧭", mobile: false },
    { href: "/dashboard/laporan", label: "Keuangan", icon: "📈", mobile: true },
    { href: "/dashboard/profil", label: "Profil Usaha", icon: "🪪", mobile: true },
  ];

  return (
    <div className="min-h-screen flex">
      <AppNav brandSub={usahaAktif?.nama_usaha || "Usahamu"} items={navItems} />
      <div className="flex-1 min-w-0">
        <header className="flex items-center justify-between px-5 pt-5 pb-1 max-w-4xl mx-auto gap-2">
          <div className="md:hidden">
            <div className="font-display text-lg font-extrabold">
              Sobat<span className="text-cyan">UMKM</span>
            </div>
            <div className="text-[10px] text-ink-soft">{usahaAktif?.nama_usaha || "Usahamu"}</div>
          </div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2">
            <PilihUsaha daftarUsaha={daftarUsaha} usahaAktifId={usahaAktif?.id} />
            <NotifBell userId={user.id} />
            <TombolKeluar />
          </div>
        </header>
        <main className="px-5 pb-28 md:pb-14 max-w-4xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
