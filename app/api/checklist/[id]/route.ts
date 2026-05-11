import { NextRequest, NextResponse } from 'next/server';
import { updateChecklistItem, updateChecklistSubItem, getStepById } from '@/lib/db/queries';
import { createAuditLog } from '@/lib/db/queries';

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
    const { is_checked, status, notes } = body;

    const item = await updateChecklistItem(id, { is_checked, status, notes });

    const { ip_address, user_agent } = getClientInfo(request);
    await createAuditLog({
      step_id: item.step_id,
      action: 'checklist_item_updated',
      old_value: { is_checked: item.is_checked, status: item.status, notes: item.notes },
      new_value: { is_checked, status, notes },
      ip_address,
      user_agent,
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Update checklist item error:', error);
    return NextResponse.json({ error: 'Failed to update checklist item' }, { status: 500 });
  }
}