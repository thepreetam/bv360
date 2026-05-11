'use client';

import { X } from 'lucide-react';
import { VerificationCategory, useEvidenceStore } from '@/stores/evidenceStore';
import { useChecklistStore } from '@/stores/checklistStore';

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: VerificationCategory[] = [
  'Dimensional',
  'Location',
  'Material',
  'Connection',
  'Deficiency',
  'As-Built',
];

const AI_STATUSES = [
  { value: 'pass', label: 'AI Pass' },
  { value: 'fail', label: 'AI Fail' },
  { value: 'flag', label: 'AI Flag' },
  { value: 'unanalyzed', label: 'Not Analyzed' },
];

export function FilterSheet({ isOpen, onClose }: FilterSheetProps) {
  const filters = useEvidenceStore((state) => state.filters);
  const setFilters = useEvidenceStore((state) => state.setFilters);
  const items = useChecklistStore((state) => state.items);

  if (!isOpen) return null;

  const handleCategoryChange = (category: VerificationCategory | undefined) => {
    setFilters({
      ...filters,
      category: filters.category === category ? undefined : category,
    });
  };

  const handleAiStatusChange = (status: string | undefined) => {
    setFilters({
      ...filters,
      aiStatus: filters.aiStatus === status ? undefined : (status as any),
    });
  };

  const handleChecklistItemChange = (itemId: string | undefined) => {
    setFilters({
      ...filters,
      checklistItem: filters.checklistItem === itemId ? undefined : itemId,
    });
  };

  const handleClear = () => {
    setFilters({});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50">
      <div className="w-full bg-white rounded-t-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Filters</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
            Category
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`p-2 rounded text-xs font-semibold border transition-colors ${
                  filters.category === cat
                    ? 'border-black bg-black text-white'
                    : 'border-gray-300 hover:border-black'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* AI Status Filter */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
            AI Analysis Status
          </label>
          <div className="space-y-2">
            {AI_STATUSES.map((status) => (
              <button
                key={status.value}
                onClick={() => handleAiStatusChange(status.value)}
                className={`w-full p-2 rounded text-xs font-semibold border transition-colors text-left ${
                  filters.aiStatus === status.value
                    ? 'border-black bg-black text-white'
                    : 'border-gray-300 hover:border-black'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Checklist Item Filter */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
            Linked Checklist Item
          </label>
          <div className="space-y-2">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleChecklistItemChange(item.id)}
                className={`w-full p-2 rounded text-xs font-semibold border transition-colors text-left ${
                  filters.checklistItem === item.id
                    ? 'border-black bg-black text-white'
                    : 'border-gray-300 hover:border-black'
                }`}
              >
                {item.id} - {item.title}
              </button>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-4">
          <button
            onClick={handleClear}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-900"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
