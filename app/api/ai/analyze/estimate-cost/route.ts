import { NextRequest, NextResponse } from 'next/server';
import { estimateAICost } from '@/services/aiService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { evidence_count } = body;

    if (!evidence_count || evidence_count < 1) {
      return NextResponse.json({ error: 'evidence_count is required' }, { status: 400 });
    }

    const result = await estimateAICost(evidence_count);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Cost estimate error:', error);
    return NextResponse.json({ error: 'Failed to estimate cost' }, { status: 500 });
  }
}