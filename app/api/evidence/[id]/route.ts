import { NextRequest, NextResponse } from 'next/server';
import { deleteEvidence } from '@/lib/db/queries';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteEvidence(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Delete evidence error:', error);
    return NextResponse.json({ error: 'Failed to delete evidence' }, { status: 500 });
  }
}