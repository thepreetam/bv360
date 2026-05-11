'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useChecklistStore } from '@/stores/checklistStore';
import { ChecklistItem } from '../checklist/ChecklistItem';
import { DecisionButtons } from '../checklist/DecisionButtons';

export function ChecklistTab() {
  const items = useChecklistStore((state) => state.items);
  const aiRunComplete = useChecklistStore((state) => state.aiRunComplete);
  const completion = useMemo(() => {
    if (items.length === 0) return 0;
    const completed = items.filter((i) => i.completed).length;
    return Math.round((completed / items.length) * 100);
  }, [items]);
  const [decision, setDecision] = useState<'pass' | 'fail' | 'hold' | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const blockingItems = items.filter((i) => i.isBlocking);
  const incompleteBlocking = blockingItems.filter((i) => !i.completed);
  const blockingComplete = incompleteBlocking.length === 0;
  const canPass = blockingComplete && aiRunComplete;

  const firstIncomplete = incompleteBlocking[0];

  const handleShowMissing = () => {
    if (firstIncomplete && itemRefs.current[firstIncomplete.id]) {
      itemRefs.current[firstIncomplete.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleDecision = (type: 'pass' | 'fail' | 'hold') => {
    setDecision(type);
    console.log(`Step 10 marked as ${type}`);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Red Banner - shown when Pass is blocked */}
      {!canPass && (
        <div className="px-4 pt-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <span className="text-red-600 text-lg mt-0.5">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900">
                Cannot Pass — {incompleteBlocking.length} blocking item{incompleteBlocking.length !== 1 ? 's' : ''} incomplete
                {!aiRunComplete && ' + AI Check not run'}
              </p>
              {firstIncomplete && (
                <button
                  onClick={handleShowMissing}
                  className="text-xs text-red-700 underline mt-1"
                >
                  Show Missing
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scrollable Content */}
      <div className="px-4 py-6 space-y-6 overflow-y-auto flex-1">
        {/* Progress Header */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Checklist Progress</h2>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-black h-3 rounded-full transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {items.filter((i) => i.completed).length} of {items.length} items complete ({completion}%)
          </p>
        </div>

        {/* Blocking Items Status */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-900 mb-2">
            Blocking Items Status
          </p>
          <div className="space-y-1 text-sm">
            {blockingItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-2 ${
                  item.completed ? 'text-green-700' : 'text-red-700'
                }`}
              >
                <span>{item.completed ? '✓' : '✗'}</span>
                <span className="font-medium">{item.title}</span>
                {!item.completed && (
                  <span className="text-xs text-red-500">— incomplete</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Checklist Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-600">
              Inspection Items
            </h3>
          </div>
          {items.map((item) => (
            <div key={item.id} ref={(el) => { itemRefs.current[item.id] = el; }}>
              <ChecklistItem item={item} />
            </div>
          ))}
        </div>

        {/* Decision confirmation */}
        {decision && (
          <div className={`p-4 rounded-lg text-white text-center ${
            decision === 'pass' ? 'bg-green-600' : decision === 'fail' ? 'bg-red-600' : 'bg-amber-600'
          }`}>
            Step 10 marked as <strong>{decision.toUpperCase()}</strong>
          </div>
        )}
      </div>

      {/* Fixed Decision Buttons at Bottom */}
      <div className="px-4 py-4 border-t border-gray-200 bg-white">
        <DecisionButtons onDecision={handleDecision} />
      </div>
    </div>
  );
}
