import { NextRequest, NextResponse } from 'next/server';
import { overrideAIDetection, createAuditLog, getStepById } from '@/lib/db/queries';

function getClientInfo(request: NextRequest) {
  return {
    ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown',
  };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, overridden_by } = body;

    if (!status || !['pass', 'flag', 'fail'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (!overridden_by) {
      return NextResponse.json({ error: 'overridden_by is required' }, { status: 400 });
    }

    const detection = await overrideAIDetection(id, status, overridden_by);

    const evidenceRes = await fetch(
      `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/evidence/${id}`
    );

    const { ip_address, user_agent } = getClientInfo(request);
    await createAuditLog({
      step_id: 'unknown',
      action: 'ai_detection_overridden',
      old_value: { status: detection.status, is_overridden: false },
      new_value: { status, is_overridden: true, overridden_by },
      ip_address,
      user_agent,
    });

    return NextResponse.json(detection);
  } catch (error) {
    console.error('Override detection error:', error);
    return NextResponse.json({ error: 'Failed to override detection' }, { status: 500 });
  }
}