'use client';

import { useState } from 'react';
import { ChevronDown, Download } from 'lucide-react';
import { useEvidenceStore } from '@/stores/evidenceStore';

interface Verification {
  verificationId: string;
  status: 'PASS' | 'FAIL' | 'FLAG';
  confidence: number;
  description: string;
  overridden: boolean;
  overrideReason?: string;
}

interface AnalysisResult {
  evidenceId: string;
  overallStatus: 'PASS' | 'FAIL' | 'FLAG';
  verifications: Verification[];
  timestamp: string;
}

interface AIResultsProps {
  summary: {
    totalItems: number;
    totalChecks: number;
    passCount: number;
    flagCount: number;
    failCount: number;
    averageConfidence: string;
  };
  results: AnalysisResult[];
  onRerun: () => void;
}

export function AIResults({ summary, results, onRerun }: AIResultsProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const evidence = useEvidenceStore((state) => state.evidence);
  const updateEvidence = useEvidenceStore((state) => state.updateEvidence);

  const getStatusColor = (status: string) => {
    if (status === 'PASS') return 'bg-green-100 text-green-900 border-green-300';
    if (status === 'FAIL') return 'bg-red-100 text-red-900 border-red-300';
    return 'bg-amber-100 text-amber-900 border-amber-300';
  };

  const handleOverride = (evidenceId: string, verificationId: string, newStatus: string) => {
    const item = evidence.find((e) => e.id === evidenceId);
    if (item && item.aiResults) {
      const updatedResults = item.aiResults.map((r) =>
        r.verificationId === verificationId
          ? {
              ...r,
              overridden: true,
              status: newStatus as 'PASS' | 'FAIL' | 'FLAG',
              overrideReason: `Manually overridden to ${newStatus}`,
            }
          : r
      );
      updateEvidence(evidenceId, { aiResults: updatedResults });
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <p className="text-xs text-green-700 font-semibold">PASS</p>
          <p className="text-2xl font-bold text-green-900">{summary.passCount}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
          <p className="text-xs text-amber-700 font-semibold">FLAG</p>
          <p className="text-2xl font-bold text-amber-900">{summary.flagCount}</p>
        </div>
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-xs text-red-700 font-semibold">FAIL</p>
          <p className="text-2xl font-bold text-red-900">{summary.failCount}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <p className="text-xs text-blue-700 font-semibold">CONFIDENCE</p>
          <p className="text-2xl font-bold text-blue-900">{Math.round(parseFloat(summary.averageConfidence) * 100)}%</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">
          Per-Photo Analysis
        </p>
        {results.map((result) => (
          <div
            key={result.evidenceId}
            className={`border rounded-lg overflow-hidden ${getStatusColor(result.overallStatus)}`}
          >
            <button
              onClick={() => setExpandedItem(expandedItem === result.evidenceId ? null : result.evidenceId)}
              className="w-full p-4 flex items-center justify-between hover:opacity-80 transition-opacity"
            >
              <div className="text-left flex-1">
                <p className="font-semibold text-sm">
                  {evidence.find((e) => e.id === result.evidenceId)?.drawingSheet || result.evidenceId}
                </p>
                <p className="text-xs opacity-75 mt-0.5">
                  {result.verifications.length} checks performed
                </p>
              </div>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${
                  expandedItem === result.evidenceId ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedItem === result.evidenceId && (
              <div className="border-t px-4 py-3 space-y-2 bg-white/50">
                {result.verifications.map((verification) => (
                  <div key={verification.verificationId} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold font-mono">{verification.verificationId}</p>
                      <span className="text-xs font-bold">
                        {(verification.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs">{verification.description}</p>
                    {verification.overridden && (
                      <p className="text-xs italic opacity-75">
                        Overridden: {verification.overrideReason}
                      </p>
                    )}
                    {!verification.overridden && (
                      <div className="flex gap-1 mt-1">
                        {verification.status !== 'PASS' && (
                          <button
                            onClick={() => handleOverride(result.evidenceId, verification.verificationId, 'PASS')}
                            className="text-xs px-2 py-1 bg-green-200 hover:bg-green-300 text-green-900 rounded font-semibold"
                          >
                            Override to Pass
                          </button>
                        )}
                        {verification.status !== 'FAIL' && (
                          <button
                            onClick={() => handleOverride(result.evidenceId, verification.verificationId, 'FAIL')}
                            className="text-xs px-2 py-1 bg-red-200 hover:bg-red-300 text-red-900 rounded font-semibold"
                          >
                            Override to Fail
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        <button
          onClick={onRerun}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          Re-run Analysis
        </button>
        <button className="flex-1 px-4 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors flex items-center justify-center gap-2">
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>
    </div>
  );
}
