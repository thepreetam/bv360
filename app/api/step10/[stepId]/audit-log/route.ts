import { NextRequest, NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/db/queries';

function getClientInfo(request: NextRequest) {
  return {
    ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown',
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ stepId: string }> }
) {
  try {
    const { stepId } = await params;
    const { ip_address, user_agent } = getClientInfo(_request);
    await createAuditLog({
      step_id: stepId,
      action: 'step10_viewed',
      old_value: null,
      new_value: { step_id: stepId },
      ip_address,
      user_agent,
    });
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}