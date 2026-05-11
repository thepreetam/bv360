'use client';

import { useState } from 'react';
import { QuickCapture } from '../capture/QuickCapture';
import { WalkthroughMode } from '../capture/WalkthroughMode';

type CaptureMode = 'quick' | 'walkthrough';

export function CaptureTab() {
  const [captureMode, setCaptureMode] = useState<CaptureMode>('quick');

  return (
    <div className="px-4 py-6">
      {/* Mode Selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setCaptureMode('quick')}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
            captureMode === 'quick'
              ? 'bg-black text-white'
              : 'border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Quick Capture
        </button>
        <button
          onClick={() => setCaptureMode('walkthrough')}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
            captureMode === 'walkthrough'
              ? 'bg-black text-white'
              : 'border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Guided Walkthrough
        </button>
      </div>

      {/* Content */}
      {captureMode === 'quick' && <QuickCapture />}
      {captureMode === 'walkthrough' && <WalkthroughMode />}
    </div>
  );
}
