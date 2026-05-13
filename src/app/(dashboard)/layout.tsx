"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useAppSelector } from "@/store/hooks";

const ROLE_ALLOWED_PATHS: Record<string, string[]> = {
  "/loads": ["broker"],
  "/loads/create": ["broker"],
  "/freight-history": ["broker"],
  "/fleet": ["carrier", "independent_driver", "company_driver"],
  "/fleet/add": ["carrier", "independent_driver"],
  "/team": ["broker", "carrier"],
  "/team/roles": ["broker", "carrier"],
  "/team/invite": ["broker", "carrier"],
  "/admin": ["admin"],
  "/analytics": ["carrier"],
  "/payments": ["broker", "carrier"],
  "/my-bookings": ["carrier", "independent_driver", "company_driver"],
  "/documents": ["carrier", "independent_driver", "company_driver"],
  "/notifications": [
    "broker",
    "carrier",
    "independent_driver",
    "company_driver",
  ],
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAuthReady(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;

    if (!user?.role) {
      router.replace("/login");
      return;
    }

    // Admins are allowed everywhere
    if (user.role === "admin") return;

    for (const [basePath, allowedRoles] of Object.entries(ROLE_ALLOWED_PATHS)) {
      // Use exact match or startsWith with a trailing slash to prevent partial matches
      // e.g. /teams shouldn't match /team if /teams is not in the list
      const isMatch = pathname === basePath || pathname.startsWith(basePath + "/");
      if (isMatch && !allowedRoles.includes(user.role)) {
        console.warn(`[AUTH] Access denied to ${pathname} for role ${user.role}`);
        router.replace("/dashboard");
        return;
      }
    }
  }, [pathname, user?.role, router, isAuthReady]);

  if (!isAuthReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <div className="ml-[240px] flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
