'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/lib/stores';

const navigation = [
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Selery Logo */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <Image src="/selery-logo.png" alt="Selery" width={140} height={36} className="h-9 w-auto object-contain" priority />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User + Charm branding */}
      <div className="border-t border-sidebar-border p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-selery-cyan text-white text-xs">
              {user?.name ? getInitials(user.name) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-sidebar-foreground">{user?.name || 'User'}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">
              {user?.workspace?.name || user?.team?.name || 'Workspace'}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 opacity-50">
          <span className="text-[10px] text-sidebar-foreground/60">powered by</span>
          <Image src="/charm-logo-white.svg" alt="Charm" width={48} height={16} className="h-3.5 w-auto object-contain" />
        </div>
      </div>
    </div>
  );
}
