'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  disableDarkInvert?: boolean;
}

const sizeConfig = {
  xs: { height: 24, width: 98, className: 'h-6 w-[98px]' },
  sm: { height: 32, width: 131, className: 'h-8 w-[131px]' },
  md: { height: 40, width: 164, className: 'h-10 w-[164px]' },
  lg: { height: 48, width: 197, className: 'h-12 w-[197px]' },
  xl: { height: 64, width: 262, className: 'h-16 w-[262px]' },
};

export function Logo({
  size = 'md',
  className,
  disableDarkInvert = false,
}: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const config = sizeConfig[size] || sizeConfig.md;
  const isDark = mounted && resolvedTheme === 'dark';
  const logoSrc = isDark && !disableDarkInvert ? '/logo.svg' : '/logo-green.svg';

  return (
    <img
      src={logoSrc}
      alt="DONETO"
      width={config.width}
      height={config.height}
      draggable={false}
      style={{
        display: 'block',
        width: `${config.width}px`,
        height: `${config.height}px`,
        aspectRatio: '8838 / 2155',
        objectFit: 'contain',
      }}
      className={cn(config.className, 'select-none pointer-events-none', className)}
    />
  );
}
