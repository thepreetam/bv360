'use client';

import { useState, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { useChecklistStore, ChecklistItem as ChecklistItemType } from '@/stores/checklistStore';

interface ChecklistItemProps {
  item: ChecklistItemType;
}

export function ChecklistItem({ item }: ChecklistItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(item.notes || '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const toggleItemComplete = useChecklistStore((state) => state.toggleItemComplete);
  const toggleSubItemComplete = useChecklistStore((state) => state.toggleSubItemComplete);
  const setItemDecision = useChecklistStore((state) => state.setDecision);

  const handleNotesChange = useCallback(
    (value: string) => {
      setNotes(value);
      setSaveStatus('saving');

      const timeout = setTimeout(async () => {
        try {
          await fetch(`/api/checklist/${item.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes: value }),
          });
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } catch {
          setSaveStatus('error');
        }
      }, 500);

      return () => clearTimeout(timeout);
    },
    [item.id]
  );

  const handleStatusChange = async (newStatus: 'pass' | 'fail' | null) => {
    setItemDecision(item.id, newStatus as any);
    try {
      await fetch(`/api/checklist/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, is_checked: newStatus === 'pass' }),
      });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const subItemsComplete = item.subItems?.filter((s) => s.completed).length || 0;
  const subItemsTotal = item.subItems?.length || 0;

  return (
    <div
      className={`border rounded-lg overflow-hidden bg-white ${
        item.isBlocking && !item.completed ? 'border-red-300' : 'border-gray-300'
      }`}
    >
      {/* Collapsed header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors min-h-[44px]"
      >
        <input
          type="checkbox"
          checked={item.completed}
          onChange={(e) => {
            e.stopPropagation();
            toggleItemComplete(item.id);
          }}
          className="h-5 w-5 accent-black"
        />

        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">{item.title}</h3>
            {item.isBlocking && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded border border-red-200 uppercase tracking-wider">
                BLOCKING
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-0.5">
            {subItemsTotal > 0
              ? `${subItemsComplete}/${subItemsTotal} sub-items`
              : item.description || 'Tap to expand'}
          </p>
        </div>

        {item.evidenceCount > 0 && (
          <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded">
            {item.evidenceCount}
          </span>
        )}

        <ChevronDown
          className={`h-4 w-4 text-gray-600 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-200 px-4 py-4 bg-gray-50 space-y-4">
          {/* Sub-items */}
          {item.subItems && item.subItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Sub-Items</p>
              {item.subItems.map((subItem) => (
                <label
                  key={subItem.id}
                  className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors min-h-[44px]"
                >
                  <input
                    type="checkbox"
                    checked={subItem.completed}
                    onChange={() => toggleSubItemComplete(item.id, subItem.id)}
                    className="h-4 w-4 accent-black"
                  />
                  <span className="text-sm text-gray-700 flex-1">{subItem.text}</span>
                </label>
              ))}
            </div>
          )}

          {/* Notes field */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Notes</p>
              {saveStatus !== 'idle' && (
                <span className="text-[10px] text-gray-400">
                  {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Error'}
                </span>
              )}
            </div>
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Add notes..."
              className="w-full p-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-black resize-none"
              rows={2}
            />
          </div>

          {/* Per-item status selector */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Status</p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => handleStatusChange(item.decision === 'pass' ? null : 'pass')}
                className={`px-3 py-2 rounded text-xs font-semibold transition-colors border ${
                  item.decision === 'pass'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-green-700 border-green-300 hover:bg-green-50'
                }`}
              >
                Pass
              </button>
              <button
                onClick={() => handleStatusChange(item.decision === 'fail' ? null : 'fail')}
                className={`px-3 py-2 rounded text-xs font-semibold transition-colors border ${
                  item.decision === 'fail'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-red-700 border-red-300 hover:bg-red-50'
                }`}
              >
                Fail
              </button>
              <button
                onClick={() => handleStatusChange(null)}
                className={`px-3 py-2 rounded text-xs font-semibold transition-colors border ${
                  !item.decision || item.decision === 'hold'
                    ? 'bg-gray-400 text-white border-gray-400'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Pending
              </button>
            </div>
          </div>

          {/* Add Evidence button */}
          <button className="w-full px-3 py-2 border border-gray-300 rounded bg-white hover:bg-gray-100 transition-colors text-sm font-semibold text-left pl-4">
            + Add Evidence
          </button>
        </div>
      )}
    </div>
  );
}
