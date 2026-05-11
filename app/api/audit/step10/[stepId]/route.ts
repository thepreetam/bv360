import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stepId: string }> }
) {
  try {
    const { stepId } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const logs = await getAuditLogs(stepId, action, limit, offset);
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Get audit logs error:', error);
    return NextResponse.json({ error: 'Failed to get audit logs' }, { status: 500 });
  }
}