import { NextRequest, NextResponse } from 'next/server';
import { getDrawingById, updateDrawingParseResult, createAuditLog } from '@/lib/db/queries';
import { parseDrawingWithGemini, generateMockParsedData } from '@/services/drawingParseService';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const drawing = await getDrawingById(id);

    if (!drawing) {
      return NextResponse.json({ error: 'Drawing not found' }, { status: 404 });
    }

    if (drawing.parse_status === 'processing') {
      return NextResponse.json({ error: 'Parsing already in progress' }, { status: 409 });
    }

    await updateDrawingParseResult(id, 'processing');

    const hasApiKey = !!process.env.GEMINI_API_KEY;
    let result;

    if (hasApiKey && drawing.file_url.startsWith('data:')) {
      const base64 = drawing.file_url.split(',')[1];
      if (!base64) {
        await updateDrawingParseResult(id, 'failed', undefined, 'Could not extract file data');
        return NextResponse.json({ error: 'Invalid file data' }, { status: 400 });
      }
      const buffer = Buffer.from(base64, 'base64');
      result = await parseDrawingWithGemini(buffer, drawing.sheet_name);
    } else {
      result = { success: true, data: generateMockParsedData(drawing.sheet_name) };
    }

    if (result.success) {
      await updateDrawingParseResult(id, 'completed', result.data);
    } else {
      await updateDrawingParseResult(id, 'failed', undefined, result.error);
    }

    const ip_address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const user_agent = request.headers.get('user-agent') || 'unknown';
    await createAuditLog({
      step_id: 'drawing-parse',
      action: 'drawing_parsed',
      old_value: { drawing_id: id, parse_status: drawing.parse_status },
      new_value: {
        drawing_id: id,
        parse_status: result.success ? 'completed' : 'failed',
        error: result.success ? undefined : result.error,
        used_gemini: hasApiKey,
      },
      ip_address,
      user_agent,
    });

    const updatedDrawing = await getDrawingById(id);
    return NextResponse.json(updatedDrawing);
  } catch (error) {
    console.error('Parse drawing error:', error);
    await updateDrawingParseResult(id, 'failed', undefined, 'Internal server error');
    return NextResponse.json({ error: 'Failed to parse drawing' }, { status: 500 });
  }
}