"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const ADMIN_ROUTES: Record<string, string> = {
  "1": "/admin",
  "2": "/admin/calendar",
  "3": "/admin/services",
  "4": "/admin/vehicles",
  "5": "/admin/work-orders",
  "6": "/admin/recurrences",
  "7": "/admin/products",
  "8": "/admin/machines",
  "9": "/admin/accounting",
};

export function useKeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname.startsWith("/admin")) return;

    function handleKeyDown(e: KeyboardEvent) {
      const modifier = e.metaKey || e.ctrlKey;

      if (modifier && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        const route = ADMIN_ROUTES[e.key];
        if (route) router.push(route);
      }

      if (modifier && e.key === "k") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("open-global-search"));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pathname, router]);
}
