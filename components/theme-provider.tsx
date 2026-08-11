'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes/dist/types';
import { usePathname } from 'next/navigation';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/';

  return (
    <NextThemesProvider {...props} forcedTheme={isLoginPage ? 'light' : undefined}>
      {children}
    </NextThemesProvider>
  );
}

