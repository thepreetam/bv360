import { NextRequest, NextResponse } from 'next/server';
import { getStep10, getChecklistForStep, getEvidenceForStep, getAIDetectionsForStep } from '@/lib/db/queries';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ stepId: string }> }
) {
  try {
    const { stepId } = await params;
    const step = await getStep10(stepId);
    if (!step) {
      return NextResponse.json({ error: 'Step 10 not found' }, { status: 404 });
    }

    const checklist = await getChecklistForStep(step.id);
    const evidence = await getEvidenceForStep(step.id);
    const aiResults = await getAIDetectionsForStep(step.id);

    return NextResponse.json({ step, checklist, evidence, aiResults });
  } catch (error) {
    console.error('Get step 10 error:', error);
    return NextResponse.json({ error: 'Failed to get step 10' }, { status: 500 });
  }
}