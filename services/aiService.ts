import type { AIDetection } from '@/lib/db/types';

const VERIFICATION_TYPES = [
  { id: 'header_presence', name: 'Header Presence' },
  { id: 'header_plies', name: 'Header Plies' },
  { id: 'header_depth', name: 'Header Depth' },
  { id: 'mep_hole_position', name: 'MEP Hole Position' },
  { id: 'mep_hole_diameter', name: 'MEP Hole Diameter' },
  { id: 'mep_edge_distance', name: 'MEP Edge Distance' },
  { id: 'nail_plate_presence', name: 'Nail Plate Presence' },
  { id: 'fire_blocking_presence', name: 'Fire Blocking' },
  { id: 'roof_height', name: 'Roof Height' },
  { id: 'house_wrap_overlap', name: 'House Wrap Overlap' },
];

const PROMPT_VERSION = 'v1.0-20260501';

function generateMockResult(evidenceId: string, imageWidth = 800, imageHeight = 600): AIDetection[] {
  const counts = [3, 4, 5];
  const selected = VERIFICATION_TYPES.slice(0, counts[Math.floor(Math.random() * counts.length)]);

  return selected.map((type, i) => {
    const conf = Math.random() * 0.3 + 0.7;
    const statuses: Array<'pass' | 'flag' | 'fail'> = ['pass', 'pass', 'pass', 'flag', 'pass'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const xmin = Math.floor(Math.random() * 400) + 50;
    const ymin = Math.floor(Math.random() * 300) + 50;
    const xmax = xmin + Math.floor(Math.random() * 200) + 100;
    const ymax = ymin + Math.floor(Math.random() * 150) + 50;

    return {
      id: `det_${Date.now()}_${i}`,
      evidence_id: evidenceId,
      prompt_version: PROMPT_VERSION,
      verification_type: type.id,
      status,
      confidence: Math.round(conf * 100) / 100,
      box_2d: [ymin, xmin, ymax, xmax] as [number, number, number, number],
      analysis: `${type.name}: ${status === 'pass' ? 'Verified compliant' : status === 'flag' ? 'Requires review' : 'Non-compliant'}`,
      is_overridden: false,
      overridden_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });
}

export async function analyzeEvidence(
  evidenceIds: string[],
  _promptVersion = PROMPT_VERSION
): Promise<{
  summary: {
    totalItems: number;
    totalChecks: number;
    passCount: number;
    flagCount: number;
    failCount: number;
    averageConfidence: string;
  };
  results: Array<{
    evidenceId: string;
    overallStatus: 'PASS' | 'FAIL' | 'FLAG';
    verifications: Array<{
      verificationId: string;
      status: 'PASS' | 'FAIL' | 'FLAG';
      confidence: number;
      description: string;
      overridden: boolean;
    }>;
    timestamp: string;
  }>;
  detections: Omit<AIDetection, 'created_at' | 'updated_at'>[];
}> {
  await new Promise((r) => setTimeout(r, 2000));

  const allVerifications: Omit<AIDetection, 'created_at' | 'updated_at'>[] = [];
  const results = evidenceIds.map((evidenceId) => {
    const detections = generateMockResult(evidenceId);
    detections.forEach((d) => {
      allVerifications.push({
        id: d.id,
        evidence_id: d.evidence_id,
        prompt_version: d.prompt_version,
        verification_type: d.verification_type,
        status: d.status,
        confidence: d.confidence,
        box_2d: d.box_2d,
        analysis: d.analysis,
        is_overridden: d.is_overridden,
        overridden_by: d.overridden_by,
      });
    });

    const overallStatus = (detections.some((d) => d.status === 'fail')
      ? 'FAIL'
      : detections.some((d) => d.status === 'flag')
      ? 'FLAG'
      : 'PASS') as 'PASS' | 'FAIL' | 'FLAG';

    return {
      evidenceId,
      overallStatus,
      verifications: detections.map((d) => ({
        verificationId: d.verification_type,
        status: d.status.toUpperCase() as 'PASS' | 'FAIL' | 'FLAG',
        confidence: d.confidence,
        description: d.analysis,
        overridden: false,
      })),
      timestamp: new Date().toISOString(),
    };
  });

  const allDetections = allVerifications;
  const passCount = allDetections.filter((d) => d.status === 'pass').length;
  const flagCount = allDetections.filter((d) => d.status === 'flag').length;
  const failCount = allDetections.filter((d) => d.status === 'fail').length;
  const avgConf =
    allDetections.length > 0
      ? (allDetections.reduce((sum, d) => sum + d.confidence, 0) / allDetections.length).toFixed(2)
      : '0.00';

  return {
    summary: {
      totalItems: evidenceIds.length,
      totalChecks: allDetections.length,
      passCount,
      flagCount,
      failCount,
      averageConfidence: avgConf,
    },
    results,
    detections: allVerifications,
  };
}

export async function estimateAICost(evidenceCount: number): Promise<{
  estimated_cost_usd: number;
  currency: string;
  note: string;
}> {
  return {
    estimated_cost_usd: parseFloat((evidenceCount * 0.01).toFixed(2)),
    currency: 'USD',
    note: 'Based on Gemini 2.5 Flash pricing (~$0.01 per image)',
  };
}