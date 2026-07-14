import { ShieldCheck, Lock } from 'lucide-react';
import { LoginForm } from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left side */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-12 lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_50%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight">DONETO</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold leading-tight text-white">
            Welcome to the future of admin management.
          </h1>
          <p className="max-w-md text-lg text-blue-100">
            Manage your users, track analytics, and grow your platform — all
            from one beautifully designed dashboard.
          </p>
          <div className="flex items-center gap-2 text-sm text-blue-200">
            <Lock className="h-4 w-4" />
            <span>Secured with enterprise-grade encryption</span>
          </div>
        </div>

        <div className="relative z-10 text-sm text-blue-300">
          © {new Date().getFullYear()} DONETO Inc. All rights reserved.
        </div>
      </div>

      {/* Right side */}
      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <ShieldCheck className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold tracking-tight">DONETO</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Welcome Back</h2>
            <p className="text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
