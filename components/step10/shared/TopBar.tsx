'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TopBarProps {
  projectId: string;
  stepNumber: number;
  stepTitle: string;
}

export function TopBar({ projectId, stepNumber, stepTitle }: TopBarProps) {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-white px-4 py-3">
      <button
        onClick={() => router.back()}
        className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div className="flex-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Step {stepNumber}
        </div>
        <h1 className="text-lg font-bold text-black">{stepTitle}</h1>
      </div>
    </div>
  );
}
