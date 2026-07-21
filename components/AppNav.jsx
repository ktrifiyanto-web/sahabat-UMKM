"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppNav({ brandSub, items, footer }) {
  const pathname = usePathname();

  return (
    <>
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-[210px] flex-shrink-0 px-3.5 py-6 border-r border-line/60 bg-white/55 backdrop-blur-xl min-h-screen sticky top-0 self-start">
        <div className="font-display text-lg font-extrabold px-2">
          Sobat
          <span style={{ background: "linear-gradient(90deg,var(--cyan),var(--violet))", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
            UMKM
          </span>
        </div>
        <div className="text-[10px] text-ink-soft px-2 mb-5">{brandSub}</div>
        {items.map((it) =>
          it.divider ? (
            <div key={it.divider} className="text-[9px] font-extrabold text-ink-dim uppercase tracking-wider px-3 pt-4 pb-1.5">
              {it.divider}
            </div>
          ) : (
            <NavLink key={it.href} item={it} active={pathname === it.href} />
          )
        )}
        {footer && <div className="mt-auto pt-4 px-2">{footer}</div>}
      </aside>

      {/* Bottom nav — mobile */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/85 backdrop-blur-xl border-t border-line z-30"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-around h-[64px]">
          {items
            .filter((it) => !it.divider && it.mobile)
            .slice(0, 6)
            .map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className="relative flex flex-col items-center gap-0.5 text-[9px] font-bold px-2"
                style={{ color: pathname === it.href ? "var(--cyan)" : "var(--ink-soft)" }}
              >
                <span className="text-lg leading-none">{it.icon}</span>
                {it.label}
                {it.badge > 0 && (
                  <span className="absolute -top-1 right-0 bg-pink text-white text-[8px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {it.badge > 9 ? "9+" : it.badge}
                  </span>
                )}
              </Link>
            ))}
        </div>
      </nav>
    </>
  );
}

function NavLink({ item, active }) {
  return (
    <Link
      href={item.href}
      className="relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] font-bold mb-1"
      style={
        active
          ? { background: "linear-gradient(90deg, rgba(6,182,212,0.13), rgba(139,92,246,0.13))", color: "var(--foreground)" }
          : { color: "var(--ink-soft)" }
      }
    >
      <span className="text-[15px]">{item.icon}</span>
      {item.label}
      {item.badge > 0 && (
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-pink text-white text-[8.5px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
          {item.badge > 9 ? "9+" : item.badge}
        </span>
      )}
    </Link>
  );
}
