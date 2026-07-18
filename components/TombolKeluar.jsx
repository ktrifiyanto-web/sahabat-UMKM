"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function TombolKeluar() {
  const router = useRouter();

  const keluar = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={keluar}
      className="text-xs font-semibold text-ink-soft border border-line rounded-full px-3 py-1.5 hover:border-pink hover:text-pink transition-colors"
    >
      Keluar
    </button>
  );
}
