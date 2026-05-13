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
    { href: "/marketplace", label: "Marketplace", Icon: Storefront },
    { href: "/my-bookings", label: "My Bookings", Icon: BookmarkSimple },
    { href: "/payments", label: "Payments", Icon: CurrencyDollar },
    { href: "/notifications", label: "Notifications", Icon: Bell },
    { href: "/settings", label: "Settings", Icon: Gear },
  ],
  carrier: [
    { href: "/dashboard", label: "Dashboard", Icon: Gauge },
    { href: "/marketplace", label: "Marketplace", Icon: Storefront },
    { href: "/my-bookings", label: "My Bookings", Icon: BookmarkSimple },
    { href: "/fleet", label: "Fleet", Icon: Truck, permission: "fleet.view" },
    { href: "/team", label: "Team", Icon: Lifebuoy, permission: "team.view" },
    {
      href: "/payments",
      label: "Payments",
      Icon: CurrencyDollar,
      permission: "payments.view",
    },
    {
      href: "/analytics",
      label: "Analytics",
      Icon: ChartLine,
      permission: "analytics.view",
    },
    {
      href: "/documents",
      label: "Documents",
      Icon: FileText,
      permission: "documents.view",
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
    <aside className="fixed top-0 left-0 bottom-0 z-50 flex w-[240px] flex-col border-r border-hairline bg-sidebar shadow-2xl">
      <div className="px-6 py-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 group"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded bg-dat-blue text-white font-bold text-lg">
            F
          </div>
          <span className="text-xl font-bold tracking-tighter text-white">
            FLOW<span className="text-dat-blue">ONE</span>
          </span>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2 scrollbar-hide">
        {visibleNavItems.map(({ href, label, Icon }) => {
          const isActive =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium transition-all",
                isActive
                  ? "bg-dat-blue text-white shadow-lg shadow-dat-blue/20"
                  : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-white",
              )}
            >
              <Icon
                size={18}
                weight={isActive ? "bold" : "regular"}
                className={cn(
                  isActive
                    ? "text-white"
                    : "text-sidebar-foreground group-hover:text-white",
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 mt-auto border-t border-hairline">
        <div className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-sidebar-hover group">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-card text-xs font-semibold text-ink">
            {user?.firstName?.slice(0, 1)}
            {user?.lastName?.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-ink">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-xs text-muted-foreground capitalize">
              {user?.role?.replace("_", " ")}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted opacity-0 group-hover:opacity-100 transition-all hover:bg-surface-card hover:text-ink"
            title="Sign out"
          >
            <SignOut size={18} weight="regular" />
          </button>
        </div>
      </div>
    </aside>
  );
}
