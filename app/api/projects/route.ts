import { NextRequest, NextResponse } from 'next/server';
import { listProjects, createProject } from '@/lib/db/queries';
import { initializeSchema } from '@/lib/db/schema';

let initialized = false;

async function ensureSchema() {
  if (!initialized) {
    await initializeSchema();
    initialized = true;
  }
}

export async function GET() {
  try {
    await ensureSchema();
    const projects = await listProjects();
    return NextResponse.json(projects);
  } catch (error) {
    console.error('List projects error:', error);
    return NextResponse.json({ error: 'Failed to list projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureSchema();
    const body = await request.json();
    const { name, address } = body;

    if (!name || !address) {
      return NextResponse.json({ error: 'name and address are required' }, { status: 400 });
    }

    const project = await createProject(name, address);
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}