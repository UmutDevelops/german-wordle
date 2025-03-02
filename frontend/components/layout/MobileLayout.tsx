"use client";

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  fullHeight?: boolean;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  header,
  footer,
  className,
  fullHeight = true
}) => {
  return (
    <div className={cn(
      'flex flex-col',
      fullHeight ? 'min-h-screen' : '',
      className
    )}>
      {header && (
        <header className="sticky top-0 z-10 bg-card shadow-sm">
          {header}
        </header>
      )}
      
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        {children}
      </main>
      
      {footer && (
        <footer className="sticky bottom-0 z-10 bg-card shadow-sm">
          {footer}
        </footer>
      )}
    </div>
  );
};

export default MobileLayout;