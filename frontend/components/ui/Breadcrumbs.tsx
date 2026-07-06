'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs: React.FC = () => {
  const pathname = usePathname();
  const paths = pathname.split('/').filter((x) => x);

  if (paths.length === 0) return null;

  const formatLabel = (str: string) => {
    return str
      .replace(/-/g, ' ')
      .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
  };

  return (
    <nav className="flex items-center space-x-2 text-xs md:text-sm text-muted-foreground mb-8">
      <Link
        href="/"
        className="flex items-center hover:text-primary transition-colors duration-200"
      >
        <Home size={14} className="mr-1 shrink-0" />
        <span className="hidden sm:inline">Home</span>
      </Link>
      
      {paths.map((path, idx) => {
        const href = `/${paths.slice(0, idx + 1).join('/')}`;
        const isLast = idx === paths.length - 1;
        const label = formatLabel(path);

        return (
          <React.Fragment key={href}>
            <ChevronRight size={14} className="shrink-0 text-muted-foreground/60" />
            {isLast ? (
              <span className="font-semibold text-foreground truncate max-w-[200px] md:max-w-none">
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="hover:text-primary transition-colors duration-200 truncate max-w-[120px] md:max-w-none"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
