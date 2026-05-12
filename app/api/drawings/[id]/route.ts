import { NextRequest, NextResponse } from 'next/server';
import { getDrawingById, updateDrawingParseResult, deleteDrawing, createAuditLog } from '@/lib/db/queries';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const drawing = await getDrawingById(id);
    if (!drawing) {
      return NextResponse.json({ error: 'Drawing not found' }, { status: 404 });
    }
    return NextResponse.json(drawing);
  } catch (error) {
    console.error('Get drawing error:', error);
    return NextResponse.json({ error: 'Failed to get drawing' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const drawing = await getDrawingById(id);
    if (!drawing) {
      return NextResponse.json({ error: 'Drawing not found' }, { status: 404 });
    }

    await deleteDrawing(id);

    const ip_address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const user_agent = request.headers.get('user-agent') || 'unknown';
    await createAuditLog({
      step_id: 'drawing-delete',
      action: 'drawing_deleted',
      old_value: { drawing_id: id, sheet_name: drawing.sheet_name },
      new_value: null,
      ip_address,
      user_agent,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Delete drawing error:', error);
    return NextResponse.json({ error: 'Failed to delete drawing' }, { status: 500 });
  }
}