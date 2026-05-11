import { NextRequest, NextResponse } from 'next/server';
import { analyzeEvidence } from '@/services/aiService';
import { createAIDetections, markAIStepRun, getEvidenceForStep, createAuditLog } from '@/lib/db/queries';

function getClientInfo(request: NextRequest) {
  return {
    ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown',
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ stepId: string }> }
) {
  try {
    const { stepId } = await params;
    const body = await request.json();
    const { evidence_ids, prompt_version } = body;

    if (!evidence_ids || !Array.isArray(evidence_ids) || evidence_ids.length === 0) {
      return NextResponse.json({ error: 'evidence_ids array is required' }, { status: 400 });
    }

    const { ip_address, user_agent } = getClientInfo(request);

    const result = await analyzeEvidence(evidence_ids, prompt_version);

    await createAIDetections(result.detections);
    await markAIStepRun(stepId);

    await createAuditLog({
      step_id: stepId,
      action: 'ai_check_triggered',
      old_value: null,
      new_value: { evidence_ids, prompt_version: prompt_version || 'v1.0-20260501' },
      ip_address,
      user_agent,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 });
  }
}