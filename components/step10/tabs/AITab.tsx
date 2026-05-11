'use client';

import { useState, useEffect } from 'react';
import { useEvidenceStore } from '@/stores/evidenceStore';
import { useChecklistStore } from '@/stores/checklistStore';
import { AIResults } from '../ai/AIResults';
import { X } from 'lucide-react';

interface AIResultSummary {
  totalItems: number;
  totalChecks: number;
  passCount: number;
  flagCount: number;
  failCount: number;
  averageConfidence: string;
}

interface AnalysisResult {
  evidenceId: string;
  overallStatus: 'PASS' | 'FAIL' | 'FLAG';
  verifications: Array<{
    verificationId: string;
    status: 'PASS' | 'FAIL' | 'FLAG';
    confidence: number;
    description: string;
    overridden: boolean;
    overrideReason?: string;
  }>;
  timestamp: string;
}

export function AITab() {
  const [phase, setPhase] = useState<'idle' | 'confirm' | 'processing' | 'results'>('idle');
  const [showConfirm, setShowConfirm] = useState(false);
  const [costEstimate, setCostEstimate] = useState<{ estimated_cost_usd: number } | null>(null);
  const [summary, setSummary] = useState<AIResultSummary | null>(null);
  const [results, setResults] = useState<AnalysisResult[]>([]);

  const evidence = useEvidenceStore((state) => state.evidence);
  const updateEvidence = useEvidenceStore((state) => state.updateEvidence);
  const setAiRunComplete = useChecklistStore((state) => state.setAiRunComplete);

  const stepId = useChecklistStore((state) => state.items[0]?.id) || '';

  const handleRunAnalysis = async () => {
    if (evidence.length === 0) {
      alert('No evidence to analyze');
      return;
    }

    setShowConfirm(true);

    try {
      const res = await fetch('/api/ai/analyze/estimate-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evidence_count: evidence.length }),
      });
      if (res.ok) {
        setCostEstimate(await res.json());
      }
    } catch {
      setCostEstimate({ estimated_cost_usd: evidence.length * 0.01 });
    }
  };

  const handleConfirmAnalysis = async () => {
    setShowConfirm(false);
    setPhase('processing');

    try {
      const response = await fetch(`/api/ai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evidence_ids: evidence.map((e) => e.id),
        }),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();

      setSummary(data.summary);
      setResults(data.results);

      data.results.forEach((result: any) => {
        const aiDetections = result.verifications.map((v: any) => ({
          verificationId: v.verificationId,
          status: v.status,
          confidence: v.confidence,
          description: v.description,
          overridden: false,
        }));

        updateEvidence(result.evidenceId, { aiResults: aiDetections });
      });

      setAiRunComplete(true);
      setPhase('results');
    } catch (error) {
      console.error('AI analysis error:', error);
      alert('Failed to run AI analysis. Please try again.');
      setPhase('idle');
    }
  };

  const handleRerun = () => {
    setPhase('idle');
    setSummary(null);
    setResults([]);
  };

  return (
    <div className="px-4 py-6 space-y-6">
      {phase === 'idle' && (
        <>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">AI Audit</h2>

            {evidence.length === 0 ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  No evidence available for AI analysis. Use the Capture tab to add photos or videos.
                </p>
              </div>
            ) : (
              <>
                <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg space-y-2">
                  <p className="text-sm font-semibold">Ready to Analyze</p>
                  <p className="text-xs text-gray-600">
                    {evidence.length} evidence item(s) selected
                  </p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-900 font-semibold mb-1">ABOUT AI ANALYSIS</p>
                  <p className="text-xs text-blue-800">
                    The AI auditor will analyze each photo/video for construction quality issues,
                    including header presence, stud alignment, bearing conditions, and fastening patterns.
                  </p>
                  <p className="text-xs text-blue-700 mt-2 font-medium">
                    AI is advisory only. Inspector makes the final decision.
                  </p>
                </div>

                <button
                  onClick={handleRunAnalysis}
                  className="w-full px-4 py-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors text-lg"
                >
                  Run AI Analysis
                </button>
              </>
            )}
          </div>
        </>
      )}

      {phase === 'processing' && (
        <div className="space-y-4">
          <div className="p-8 text-center space-y-4">
            <div className="inline-block">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-black rounded-full animate-spin"></div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Analyzing with AI</h3>
              <p className="text-sm text-gray-600 mt-1">Processing {evidence.length} image(s)...</p>
            </div>
          </div>
        </div>
      )}

      {phase === 'results' && summary && results && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Analysis Results</h2>
          <AIResults
            summary={summary}
            results={results}
            onRerun={handleRerun}
          />
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50">
          <div className="w-full bg-white rounded-t-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Confirm AI Analysis</h3>
              <button onClick={() => setShowConfirm(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
              <p className="text-sm font-semibold">This will analyze {evidence.length} correlated photo(s)</p>
              <p className="text-xs text-gray-600">
                Estimated cost: {costEstimate
                  ? `$${costEstimate.estimated_cost_usd.toFixed(2)} USD`
                  : `~$${(evidence.length * 0.01).toFixed(2)} USD`}
              </p>
              <p className="text-xs text-gray-600">
                Based on Gemini 2.5 Flash pricing (~0.01 per image)
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-900 font-semibold">
                AI is advisory only. Inspector makes the final decision.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAnalysis}
                className="flex-1 px-4 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-900"
              >
                Run Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}