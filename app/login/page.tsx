'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/infrastructure';

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(redirectPath);
        router.refresh();
      } else {
        setError(data.error || 'Invalid password');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      {/* SearchAtlas Logo */}
      <div className="flex justify-center mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://searchatlas.com/wp-content/uploads/2023/12/white.svg"
          alt="SearchAtlas"
          className="h-10 w-auto"
        />
      </div>

      {/* Login Card */}
      <div className="bg-[#1C1D24] border border-[#2A2B35] rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#A57BEA]/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#A57BEA]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Dashboard Access</h1>
            <p className="text-sm text-[#8B8D98]">Enter password to continue</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
                className="w-full px-4 py-3 bg-[#14151A] border border-[#2A2B35] rounded-lg text-white placeholder:text-[#5C5E6A] focus:outline-none focus:ring-2 focus:ring-[#A57BEA] focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C5E6A] hover:text-white transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full py-3 px-4 bg-[#A57BEA] hover:bg-[#9066D8] disabled:bg-[#A57BEA]/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Continue'
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-[#5C5E6A] text-xs mt-6">
        Infrastructure Health Dashboard
      </p>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="w-full max-w-sm">
      <div className="flex justify-center mb-8">
        <div className="h-10 w-32 bg-[#2A2B35] rounded animate-pulse" />
      </div>
      <div className="bg-[#1C1D24] border border-[#2A2B35] rounded-xl p-6">
        <div className="h-40 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#A57BEA]" />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#14151A] flex items-center justify-center p-4">
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
