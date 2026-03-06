'use client';

import { useEffect } from 'react';
import { Sidebar, Header } from '@/components/layout';
import { useAuthStore } from '@/lib/stores';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setUser, isLoading } = useAuthStore();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const data = await response.json();
          setUser(data.data);
        } else {
          // Auth failed - continue without user (demo mode)
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        // Continue without user on error (demo mode)
        setUser(null);
      }
    };

    fetchUser();
  }, [setUser]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />
        {children}
      </main>
    </div>
  );
}
