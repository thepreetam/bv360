'use client';

import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Step10Layout({ children }: LayoutProps) {
  return (
    <div className="bg-white">
      {children}
    </div>
  );
}
