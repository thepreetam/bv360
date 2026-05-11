'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TopBar } from '@/components/step10/shared/TopBar';
import { BottomNavigation } from '@/components/step10/shared/BottomNavigation';
import { ChecklistTab } from '@/components/step10/tabs/ChecklistTab';
import { CaptureTab } from '@/components/step10/tabs/CaptureTab';
import { GalleryTab } from '@/components/step10/tabs/GalleryTab';
import { AITab } from '@/components/step10/tabs/AITab';
import { useChecklistStore } from '@/stores/checklistStore';
import { useEvidenceStore } from '@/stores/evidenceStore';

type TabType = 'checklist' | 'capture' | 'gallery' | 'ai';

export default function Step10Page() {
  const params = useParams();
  const router = useRouter();
  const projectId = (params?.projectId as string) || 'demo';
  const [activeTab, setActiveTab] = useState<TabType>('checklist');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setItems = useChecklistStore((state) => state.setItems);
  const setAiRunComplete = useChecklistStore((state) => state.setAiRunComplete);
  const setStepStatus = useChecklistStore((state) => state.setStepStatus);
  const setEvidence = useEvidenceStore((state) => state.setEvidence);

  const loadStep10Data = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const projectsRes = await fetch('/api/projects');
      const projects = await projectsRes.json();

      let project = projects.find((p: any) => p.id === projectId);

      if (!project) {
        const createRes = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Demo Project - 123 Main St',
            address: '123 Main St, Anytown, USA',
          }),
        });
        project = await createRes.json();
      }

      if (!project.step10_id) {
        const stepRes = await fetch(`/api/projects/${project.id}`);
        const fullProject = await stepRes.json();
        project = { ...project, ...fullProject };
      }

      const stepId = project.step10_id;

      const stepRes = await fetch(`/api/step10/${stepId}`);
      if (!stepRes.ok) {
        throw new Error('Failed to load Step 10 data');
      }
      const data = await stepRes.json();

      const checklistItems = data.checklist.map((item: any) => ({
        id: item.id,
        title: item.label,
        description: '',
        isBlocking: item.is_blocking,
        subItems: (item.sub_items || []).map((sub: any) => ({
          id: sub.id,
          text: sub.sub_item_text,
          completed: sub.is_checked,
        })),
        completed: item.is_checked,
        evidenceCount: 0,
        notes: item.notes || '',
        decision: item.status === 'pass' ? 'pass' : item.status === 'fail' ? 'fail' : null,
      }));

      setItems(checklistItems as any);
      setAiRunComplete(data.step?.ai_check_run || false);
      setStepStatus(data.step?.status || 'in_progress');

      const evidenceItems = (data.evidence || []).map((ev: any) => ({
        id: ev.id,
        fileUrl: ev.file_url,
        type: 'photo' as const,
        drawingSheet: ev.drawing_sheet_id,
        detailReference: ev.detail_reference,
        category: ev.verification_category,
        linkedChecklistItem: undefined,
        timestamp: ev.created_at,
        gpsLat: ev.gps_lat,
        gpsLon: ev.gps_lon,
      }));
      setEvidence(evidenceItems as any);

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load Step 10:', err);
      setError('Failed to load data. Make sure the database is connected.');
      setIsLoading(false);
    }
  }, [projectId, setItems, setAiRunComplete, setStepStatus, setEvidence]);

  useEffect(() => {
    loadStep10Data();
  }, [loadStep10Data]);

  if (isLoading) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
        <p className="mt-4 text-sm text-gray-600">Loading Step 10...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center px-8">
        <p className="text-red-600 text-center font-semibold mb-4">{error}</p>
        <button
          onClick={loadStep10Data}
          className="px-4 py-2 bg-black text-white rounded-lg font-semibold"
        >
          Retry
        </button>
        <button
          onClick={() => router.push('/')}
          className="mt-4 text-sm text-gray-600 underline"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col max-w-sm mx-auto">
      <TopBar projectId={projectId} stepNumber={10} stepTitle="Rough Framing" />

      <div className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'checklist' && <ChecklistTab />}
        {activeTab === 'capture' && <CaptureTab />}
        {activeTab === 'gallery' && <GalleryTab />}
        {activeTab === 'ai' && <AITab />}
      </div>

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}