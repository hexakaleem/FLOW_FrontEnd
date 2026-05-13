"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import { useLogout } from "@/hooks/useLogout";
import {
  Gauge,
  Package,
  Storefront,
  Truck,
  CurrencyDollar,
  FileText,
  ChartLine,
  Lifebuoy,
  Gear,
  BookmarkSimple,
  Bell,
  SignOut,
  ClockCounterClockwise,
} from "@phosphor-icons/react";

interface NavItem {
  href: string;
  label: string;
  Icon: React.ElementType;
  permission?: string;
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  admin: [
    { href: "/admin", label: "Admin Panel", Icon: Gauge },
    { href: "/admin/users", label: "Users", Icon: Lifebuoy },
    { href: "/admin/verifications", label: "Verification", Icon: FileText },
    { href: "/admin/settings", label: "Platform Config", Icon: Gear },
  ],
  broker: [
    { href: "/dashboard", label: "Dashboard", Icon: Gauge },
    { href: "/loads", label: "My Loads", Icon: Package },
    { href: "/loads/create", label: "Create Load", Icon: Storefront },
    { href: "/freight-history", label: "Freight History", Icon: ClockCounterClockwise },
    { href: "/payments", label: "Payments", Icon: CurrencyDollar },
    { href: "/notifications", label: "Notifications", Icon: Bell },
    { href: "/settings", label: "Settings", Icon: Gear },
    { href: "/team", label: "Team", Icon: Lifebuoy, permission: "team:read" },
  ],
  carrier: [
    { href: "/dashboard", label: "Dashboard", Icon: Gauge },
    { href: "/marketplace", label: "Marketplace", Icon: Storefront },
    { href: "/my-bookings", label: "My Bookings", Icon: BookmarkSimple },
    { href: "/fleet", label: "Fleet", Icon: Truck, permission: "fleet:read" },
    { href: "/team", label: "Team", Icon: Lifebuoy, permission: "team:read" },
    {
      href: "/payments",
      label: "Payments",
      Icon: CurrencyDollar,
      permission: "payments:read",
    },
    {
      href: "/analytics",
      label: "Analytics",
      Icon: ChartLine,
      permission: "analytics:read",
    },
    {
      href: "/documents",
      label: "Documents",
      Icon: FileText,
      permission: "documents:read",
    },
    { href: "/notifications", label: "Notifications", Icon: Bell },
    { href: "/settings", label: "Settings", Icon: Gear },
  ],
  independent_driver: [
    { href: "/dashboard", label: "Dashboard", Icon: Gauge },
    { href: "/marketplace", label: "Load Board", Icon: Storefront },
    { href: "/my-bookings", label: "My Bookings", Icon: BookmarkSimple },
    { href: "/fleet", label: "My Truck", Icon: Truck },
    { href: "/documents", label: "Documents", Icon: FileText },
    { href: "/notifications", label: "Notifications", Icon: Bell },
    { href: "/settings", label: "Settings", Icon: Gear },
  ],
  company_driver: [
    { href: "/dashboard", label: "Dashboard", Icon: Gauge },
    { href: "/my-bookings", label: "My Loads", Icon: BookmarkSimple },
    { href: "/fleet", label: "My Truck", Icon: Truck },
    { href: "/documents", label: "Documents", Icon: FileText },
    { href: "/notifications", label: "Notifications", Icon: Bell },
    { href: "/settings", label: "Settings", Icon: Gear },
  ],
};

export function Sidebar() {
  const pathname = usePathname();
  const user = useAppSelector((state) => state.auth.user);
  const userPermissions = useAppSelector((state) => state.auth.permissions);
  const handleLogout = useLogout();

  const role = user?.role || "broker";
  const navItems = NAV_BY_ROLE[role] || NAV_BY_ROLE.broker;

  const visibleNavItems = navItems.filter((item) => {
    if (!item.permission) return true;
    if (role === "carrier" && userPermissions.length === 0) return true;
    return userPermissions.includes(item.permission);
  });

  return (
    <aside className="fixed top-0 left-0 bottom-0 z-50 flex w-[240px] flex-col border-r border-hairline bg-canvas shadow-sm">
      <div className="px-6 py-8">
        <div className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white font-bold text-lg">
            F
          </div>
          <span className="text-xl font-bold tracking-[-1px] text-ink uppercase">
            FLOW<span className="text-muted-foreground/40 font-normal">ONE</span>
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-2 scrollbar-hide">
        {visibleNavItems.map(({ href, label, Icon }) => {
          const isActive =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] font-semibold transition-all",
                isActive
                  ? "bg-surface-soft text-ink ring-1 ring-inset ring-hairline shadow-sm"
                  : "text-muted-foreground hover:bg-surface-soft hover:text-ink",
              )}
            >
              <Icon
                size={18}
                weight={isActive ? "bold" : "regular"}
                className={cn(
                  isActive
                    ? "text-ink"
                    : "text-muted-foreground group-hover:text-ink",
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-hairline bg-surface-soft/30">
        <div className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-surface-soft group relative">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-semibold">
            {user?.firstName?.slice(0, 1)}
            {user?.lastName?.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-semibold text-ink">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-[12px] text-muted-foreground capitalize font-medium">
              {user?.role?.replace("_", " ")}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-canvas hover:text-ink border border-transparent hover:border-hairline shadow-sm"
            title="Sign out"
          >
            <SignOut size={18} weight="regular" />
          </button>
        </div>
      </div>
    </aside>
  );
}
