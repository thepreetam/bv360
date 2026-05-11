import { NextRequest, NextResponse } from 'next/server';
import { initializeSchema } from '@/lib/db/schema';

let initialized = false;

export async function GET() {
  try {
    if (!initialized) {
      await initializeSchema();
      initialized = true;
    }
    return NextResponse.json({ status: 'ok', initialized: true });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({ status: 'error', error: String(error) }, { status: 500 });
  }
}