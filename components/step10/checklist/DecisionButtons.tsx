'use client';

import { useState, useMemo } from 'react';
import { useChecklistStore } from '@/stores/checklistStore';

interface DecisionButtonsProps {
  onDecision: (decision: 'pass' | 'fail' | 'hold') => void;
}

export function DecisionButtons({ onDecision }: DecisionButtonsProps) {
  const [showReasonModal, setShowReasonModal] = useState<'fail' | 'hold' | null>(null);
  const [reason, setReason] = useState('');

  const items = useChecklistStore((state) => state.items);
  const aiRunComplete = useChecklistStore((state) => state.aiRunComplete);

  const blockingComplete = useMemo(() => {
    return items
      .filter((i) => i.isBlocking)
      .every((item) => item.completed);
  }, [items]);

  const handlePass = () => {
    if (!blockingComplete) {
      alert('Cannot pass: Not all blocking items are complete');
      return;
    }
    if (!aiRunComplete) {
      alert('Cannot pass: Must run AI check before passing');
      return;
    }
    onDecision('pass');
  };

  const handleFailOrHold = (type: 'fail' | 'hold') => {
    setShowReasonModal(type);
  };

  const submitReason = () => {
    if (!reason.trim()) {
      alert(`Please provide a ${showReasonModal} reason`);
      return;
    }
    onDecision(showReasonModal as 'fail' | 'hold');
    setShowReasonModal(null);
    setReason('');
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handlePass}
          disabled={!blockingComplete || !aiRunComplete}
          className={`px-4 py-3 rounded-lg font-semibold text-sm transition-colors ${
            blockingComplete && aiRunComplete
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          Pass
        </button>

        <button
          onClick={() => handleFailOrHold('fail')}
          className="px-4 py-3 rounded-lg font-semibold text-sm bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          Fail
        </button>

        <button
          onClick={() => handleFailOrHold('hold')}
          className="px-4 py-3 rounded-lg font-semibold text-sm bg-amber-600 text-white hover:bg-amber-700 transition-colors"
        >
          Hold
        </button>
      </div>

      {/* Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50">
          <div className="w-full bg-white rounded-t-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold">
              {showReasonModal === 'fail' ? 'Reason for Failure' : 'Reason for Hold'}
            </h3>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter your reason..."
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              rows={4}
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReasonModal(null);
                  setReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitReason}
                className={`flex-1 px-4 py-2 text-white font-semibold rounded-lg ${
                  showReasonModal === 'fail'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
