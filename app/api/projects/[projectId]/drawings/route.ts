import { NextRequest, NextResponse } from 'next/server';
import { getDrawingsForProject, createDrawing, getProject } from '@/lib/db/queries';
import { createAuditLog } from '@/lib/db/queries';

export const runtime = 'nodejs';

function getClientInfo(request: NextRequest) {
  return {
    ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown',
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    const drawings = await getDrawingsForProject(projectId);
    return NextResponse.json(drawings);
  } catch (error) {
    console.error('Get drawings error:', error);
    return NextResponse.json({ error: 'Failed to get drawings' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const sheet_name = formData.get('sheet_name') as string;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (!sheet_name?.trim()) {
      return NextResponse.json({ error: 'sheet_name is required' }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 50MB' }, { status: 400 });
    }

    const allowedTypes = ['application/pdf', 'application/octet-stream'];
    const fileType = file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'dwg';

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileUrl = `data:${file.type};base64,${buffer.toString('base64')}`;

    const drawing = await createDrawing({
      project_id: projectId,
      sheet_name: sheet_name.trim(),
      file_url: fileUrl,
      file_type: fileType,
      file_size_bytes: file.size,
    });

    const { ip_address, user_agent } = getClientInfo(request);
    await createAuditLog({
      step_id: 'drawing-upload',
      action: 'drawing_uploaded',
      old_value: null,
      new_value: {
        drawing_id: drawing.id,
        sheet_name: drawing.sheet_name,
        file_type: fileType,
        file_size_bytes: file.size,
      },
      ip_address,
      user_agent,
    });

    return NextResponse.json(drawing, { status: 201 });
  } catch (error) {
    console.error('Upload drawing error:', error);
    return NextResponse.json({ error: 'Failed to upload drawing' }, { status: 500 });
  }
}