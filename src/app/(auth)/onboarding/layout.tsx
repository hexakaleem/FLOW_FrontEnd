'use client';

import { useLogout } from '@/hooks/useLogout';
import { SignOut } from '@phosphor-icons/react';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const logout = useLogout();

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4">
      {/* Switch User / Logout Button */}
      <div className="absolute top-8 right-8">
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-muted hover:text-ink transition-colors group"
        >
          <SignOut size={16} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
          Switch account
        </button>
      </div>
      
      {children}
    </div>
  );
}
