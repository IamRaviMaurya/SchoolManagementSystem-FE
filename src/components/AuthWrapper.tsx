"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Apply the saved theme before anything paints, on every route (login pages included).
    const savedTheme = localStorage.getItem("sms-theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);

    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    const isMainLogin = pathname === "/login";
    const isClientLogin = pathname?.includes("/login");

    if (!token) {
      if (!isClientLogin && pathname !== null) {
        router.replace("/login");
      }
    } else if (isMainLogin) {
      // Only auto-redirect away from the main /login; dynamic /[slug]/login stays reachable.
      router.replace(role === "SUPER_ADMIN" ? "/super-admin/dashboard" : "/dashboard");
    }
  }, [pathname, router]);

  // Don't render interactive content server-side to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen hc-root flex flex-col items-center justify-center hc-text-3 text-xs font-mono gap-3">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span>Verifying Administrative Authorization...</span>
      </div>
    );
  }

  const isLoginPage = pathname?.includes("/login");
  const tokenExists = typeof window !== "undefined" && !!localStorage.getItem("token");

  if (isLoginPage) {
    return <div className="min-h-screen hc-root flex flex-col">{children}</div>;
  }

  if (!tokenExists) {
    return (
      <div className="min-h-screen hc-root flex flex-col items-center justify-center hc-text-3 text-xs font-mono gap-3">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span>Redirecting to Login...</span>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
