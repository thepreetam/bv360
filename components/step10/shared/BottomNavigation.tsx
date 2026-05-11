'use client';

import { CheckSquare, Camera, Image, Zap } from 'lucide-react';

type TabType = 'checklist' | 'capture' | 'gallery' | 'ai';

interface BottomNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

interface NavItem {
  id: TabType;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'checklist', label: 'Checklist', icon: <CheckSquare className="h-5 w-5" /> },
  { id: 'capture', label: 'Capture', icon: <Camera className="h-5 w-5" /> },
  { id: 'gallery', label: 'Gallery', icon: <Image className="h-5 w-5" /> },
  { id: 'ai', label: 'AI Audit', icon: <Zap className="h-5 w-5" /> },
];

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex gap-0 border-t border-border bg-white">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onTabChange(item.id)}
          className={`flex flex-1 flex-col items-center justify-center gap-1 px-2 py-3 transition-colors ${
            activeTab === item.id
              ? 'border-t-2 border-black bg-gray-50 text-black'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          aria-label={item.label}
          aria-current={activeTab === item.id ? 'page' : undefined}
        >
          {item.icon}
          <span className="text-xs font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
