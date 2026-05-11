import { NextRequest, NextResponse } from 'next/server';
import { getDrawingSheets, getProject } from '@/lib/db/queries';

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
    const sheets = await getDrawingSheets(projectId);
    return NextResponse.json(sheets);
  } catch (error) {
    console.error('Get drawing sheets error:', error);
    return NextResponse.json({ error: 'Failed to get drawing sheets' }, { status: 500 });
  }
}