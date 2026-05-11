import { NextRequest, NextResponse } from 'next/server';
import { createEvidence, getStep10, createAuditLog } from '@/lib/db/queries';
import type { VerificationCategory } from '@/lib/db/types';

export const runtime = 'nodejs';

function getClientInfo(request: NextRequest) {
  return {
    ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown',
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ stepId: string }> }
) {
  try {
    const { stepId } = await params;
    const formData = await request.formData();

    const file = formData.get('file') as File | null;
    const drawing_sheet_id = formData.get('drawing_sheet_id') as string;
    const detail_reference = formData.get('detail_reference') as string;
    const verification_category = formData.get('verification_category') as VerificationCategory;
    const gps_lat = formData.get('gps_lat') as string | null;
    const gps_lon = formData.get('gps_lon') as string | null;
    const captured_at = formData.get('captured_at') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }
    if (!drawing_sheet_id) {
      return NextResponse.json({ error: 'drawing_sheet_id is required' }, { status: 400 });
    }
    if (!detail_reference) {
      return NextResponse.json({ error: 'detail_reference is required' }, { status: 400 });
    }
    if (!verification_category) {
      return NextResponse.json({ error: 'verification_category is required' }, { status: 400 });
    }

    const validCategories: VerificationCategory[] = [
      'dimensional', 'location', 'material', 'connection', 'deficiency', 'as_built',
    ];
    if (!validCategories.includes(verification_category)) {
      return NextResponse.json({ error: 'Invalid verification_category' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 10MB' }, { status: 400 });
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG/PNG allowed' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
    const thumbnailSmallUrl = fileUrl;
    const thumbnailMediumUrl = fileUrl;
    const thumbnailLargeUrl = fileUrl;

    const evidence = await createEvidence({
      step_id: stepId,
      file_url: fileUrl,
      thumbnail_small_url: thumbnailSmallUrl,
      thumbnail_medium_url: thumbnailMediumUrl,
      thumbnail_large_url: thumbnailLargeUrl,
      drawing_sheet_id,
      detail_reference,
      verification_category,
      gps_lat: gps_lat ? parseFloat(gps_lat) : null,
      gps_lon: gps_lon ? parseFloat(gps_lon) : null,
      captured_at,
    });

    const { ip_address, user_agent } = getClientInfo(request);
    await createAuditLog({
      step_id: stepId,
      action: 'evidence_uploaded',
      old_value: null,
      new_value: {
        evidence_id: evidence.id,
        file_url: evidence.file_url,
        drawing_sheet_id,
        verification_category,
        gps_lat: evidence.gps_lat,
        gps_lon: evidence.gps_lon,
      },
      ip_address,
      user_agent,
    });

    return NextResponse.json(evidence, { status: 201 });
  } catch (error) {
    console.error('Evidence upload error:', error);
    return NextResponse.json({ error: 'Failed to upload evidence' }, { status: 500 });
  }
}