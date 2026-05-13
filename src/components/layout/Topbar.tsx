"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MagnifyingGlass,
  BellSimple,
  BookmarkSimple,
  SignOut,
  User,
  Gear,
  CaretDown,
} from "@phosphor-icons/react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAppSelector } from "@/store/hooks";
import { useLogout } from "@/hooks/useLogout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getNotificationCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const stored = localStorage.getItem("notificationCount");
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

export function Topbar() {
  const [notifCount, setNotifCount] = useState(0);
  const user = useAppSelector((s) => s.auth.user);
  const handleLogout = useLogout();

  useEffect(() => {
    setNotifCount(getNotificationCount());
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-hairline bg-topbar/80 backdrop-blur-md px-6">
      <div className="relative flex w-full max-w-md items-center rounded-lg border border-hairline bg-surface-soft px-4 py-2">
        <MagnifyingGlass size={18} weight="regular" className="text-muted" />
        <input
          placeholder="Search origin, destination, or load ID..."
          className="w-full bg-transparent text-sm font-medium text-ink outline-none placeholder:text-muted-foreground ml-2"
        />
      </div>

      <div className="flex items-center gap-4">
        {(user?.role === "driver" ||
          user?.role === "independent_driver" ||
          user?.role === "company_driver") && (
          <Link
            href="/my-bookings"
            className="inline-flex items-center gap-2 h-10 px-4 text-sm font-semibold rounded-md border border-hairline bg-canvas text-ink hover:bg-surface-soft transition-colors"
          >
            <BookmarkSimple size={18} weight="regular" />
            My Bookings
          </Link>
        )}

        <div className="flex items-center gap-3 border-l border-hairline pl-4">
          <ThemeToggle />

          <Link
            href="/notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-canvas text-muted transition-colors hover:bg-surface-soft hover:text-ink"
          >
            <BellSimple size={18} weight="regular" />
            {notifCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-xs font-semibold text-white">
                {notifCount > 99 ? "99+" : notifCount}
              </span>
            )}
          </Link>

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-md p-1.5 transition-colors hover:bg-surface-soft outline-none">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {user?.firstName?.slice(0, 1)}
                {user?.lastName?.slice(0, 1)}
              </div>
              <CaretDown size={14} weight="regular" className="text-muted" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium text-ink">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-muted">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => window.location.href = "/settings"}
                className="cursor-pointer"
              >
                <Gear size={16} weight="regular" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.location.href = "/settings"}
                className="cursor-pointer"
              >
                <User size={16} weight="regular" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <SignOut size={16} weight="regular" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
