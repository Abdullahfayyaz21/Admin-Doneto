'use client';

import React, { useEffect } from 'react';
import { Logo } from '@/components/brand/logo';
import { Lock } from 'lucide-react';
import { LoginForm } from '@/components/LoginForm';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="flex min-h-screen">
        {/* Left side brand hero */}
        <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-[#061501] via-[#0d3300] to-[#185500] p-12 lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.15),transparent_50%)]" />
          <div className="relative z-10">
            <div className="flex items-center text-white">
              <img src="/logo.svg" alt="DONETO" className="h-9 w-auto" />
            </div>
          </div>

          <div className="relative z-10 space-y-6">
            <h1 className="text-4xl font-bold leading-tight text-white">
              Welcome to the future of admin management.
            </h1>
            <p className="max-w-md text-lg text-emerald-100/90">
              Manage your users, track analytics, and grow your platform — all
              from one beautifully designed dashboard.
            </p>
            <div className="flex items-center gap-2 text-sm text-emerald-200">
              <Lock className="h-4 w-4" />
              <span>Secured with enterprise-grade encryption</span>
            </div>
          </div>

          <div className="relative z-10 text-sm text-emerald-300/80">
            © {new Date().getFullYear()} DONETO Inc. All rights reserved.
          </div>
        </div>

        {/* Right side login form */}
        <div className="flex w-full items-center justify-center bg-background p-8 lg:w-1/2">
          <div className="w-full max-w-md space-y-8 animate-in fade-in-50 duration-300">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center lg:hidden mb-4">
                <Logo size="md" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight">Welcome Back</h2>
              <p className="text-muted-foreground text-sm">
                Sign in to your account to continue
              </p>
            </div>

            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}

