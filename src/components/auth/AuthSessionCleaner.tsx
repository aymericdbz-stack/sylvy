"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const PROTECTED_PREFIXES = [
  "/notebook",
  "/experiments",
  "/protocols",
  "/resources",
  "/templates",
  "/settings",
  "/planner",
  "/choose-tool",
];

function isInvalidRefreshTokenError(message: string) {
  return /invalid refresh token|refresh token not found/i.test(message);
}

export default function AuthSessionCleaner() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.getSession();
      if (cancelled) return;

      if (error && isInvalidRefreshTokenError(error.message)) {
        await supabase.auth.signOut();
        if (cancelled) return;

        const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
        if (isProtected) {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        }
        router.refresh();
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return null;
}

