import { NextRequest, NextResponse } from 'next/server';
import { updateChecklistSubItem } from '@/lib/db/queries';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { is_checked } = body;

    const subItem = await updateChecklistSubItem(id, is_checked);
    return NextResponse.json(subItem);
  } catch (error) {
    console.error('Update sub-item error:', error);
    return NextResponse.json({ error: 'Failed to update sub-item' }, { status: 500 });
  }
}