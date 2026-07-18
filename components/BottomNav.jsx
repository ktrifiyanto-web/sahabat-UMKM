"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/dashboard/goals", label: "Target", icon: "🎯" },
  { href: "/dashboard/laporan", label: "Laporan", icon: "📄" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-card border-t border-line z-20"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="max-w-3xl mx-auto relative flex items-center justify-around h-[72px]">
        <Link
          href="/dashboard"
          aria-label="Catat transaksi"
          className="absolute left-1/2 -translate-x-1/2 -top-[22px] w-14 h-14 rounded-full bg-pink flex items-center justify-center text-white text-2xl"
          style={{ boxShadow: "0 6px 16px rgba(255,111,145,0.5)" }}
        >
          +
        </Link>
        {NAV_ITEMS.slice(0, 1).map((item) => (
          <NavLink key={item.href} item={item} active={pathname === item.href} />
        ))}
        <span className="opacity-0 w-8">.</span>
        {NAV_ITEMS.slice(1).map((item) => (
          <NavLink key={item.href} item={item} active={pathname === item.href} />
        ))}
      </div>
    </nav>
  );
}

function NavLink({ item, active }) {
  return (
    <Link
      href={item.href}
      className="flex flex-col items-center gap-0.5 text-[10px] font-bold"
      style={{ color: active ? "var(--violet)" : "var(--ink-soft)" }}
    >
      <span className="text-lg leading-none">{item.icon}</span>
      {item.label}
    </Link>
  );
}
