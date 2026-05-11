import { sql } from '@vercel/postgres';
import type {
  Project,
  Step,
  ChecklistItem,
  ChecklistSubItem,
  DrawingSheet,
  Evidence,
  AIDetection,
  AuditLog,
  VerificationCategory,
} from './types';
import { seedChecklistItems, seedDrawingSheets } from './schema';

export async function createProject(name: string, address: string): Promise<Project & { step10_id: string }> {
  const projectResult = await sql`
    INSERT INTO projects (name, address)
    VALUES (${name}, ${address})
    RETURNING id, name, address, created_at, updated_at
  `;

  const project = projectResult.rows[0] as Project;

  const stepResult = await sql`
    INSERT INTO steps (project_id, step_number)
    VALUES (${project.id}::uuid, 10)
    RETURNING id
  `;

  const step10Id = stepResult.rows[0].id;

  await seedChecklistItems(step10Id);
  await seedDrawingSheets(project.id);

  return { ...project, step10_id: step10Id };
}

export async function getProject(id: string): Promise<Project | null> {
  const result = await sql`
    SELECT id, name, address, created_at, updated_at
    FROM projects
    WHERE id = ${id}::uuid
  `;
  return result.rows[0] as Project | null;
}

export async function listProjects(): Promise<Project[]> {
  const result = await sql`
    SELECT p.id, p.name, p.address, p.created_at, p.updated_at,
           s.status as step10_status
    FROM projects p
    LEFT JOIN steps s ON s.project_id = p.id AND s.step_number = 10
    ORDER BY p.created_at DESC
  `;
  return result.rows as Project[];
}

export async function getStep10(projectId: string): Promise<Step | null> {
  const result = await sql`
    SELECT id, project_id, step_number, status, passed_at, failed_at, held_at,
           ai_check_run, created_at, updated_at
    FROM steps
    WHERE project_id = ${projectId}::uuid AND step_number = 10
  `;
  return result.rows[0] as Step | null;
}

export async function getStepById(id: string): Promise<Step | null> {
  const result = await sql`
    SELECT id, project_id, step_number, status, passed_at, failed_at, held_at,
           ai_check_run, created_at, updated_at
    FROM steps
    WHERE id = ${id}::uuid
  `;
  return result.rows[0] as Step | null;
}

export async function getChecklistForStep(stepId: string): Promise<Array<ChecklistItem & { sub_items: ChecklistSubItem[] }>> {
  const itemsResult = await sql`
    SELECT id, step_id, item_number, label, is_blocking, is_checked, status,
           notes, sort_order, created_at, updated_at
    FROM checklist_items
    WHERE step_id = ${stepId}::uuid
    ORDER BY sort_order
  `;

  const items = itemsResult.rows as ChecklistItem[];
  const result = [];

  for (const item of items) {
    const subResult = await sql`
      SELECT id, checklist_item_id, sub_item_text, is_checked, sort_order,
             created_at, updated_at
      FROM checklist_sub_items
      WHERE checklist_item_id = ${item.id}::uuid
      ORDER BY sort_order
    `;
    result.push({ ...item, sub_items: subResult.rows as ChecklistSubItem[] });
  }

  return result;
}

export async function updateChecklistItem(
  id: string,
  updates: { is_checked?: boolean; status?: string; notes?: string }
): Promise<ChecklistItem> {
  const result = await sql`
    UPDATE checklist_items
    SET is_checked = COALESCE(${updates.is_checked ?? null}, is_checked),
        status = COALESCE(${updates.status ?? null}, status),
        notes = COALESCE(${updates.notes ?? null}, notes),
        updated_at = now()
    WHERE id = ${id}::uuid
    RETURNING id, step_id, item_number, label, is_blocking, is_checked, status,
              notes, sort_order, created_at, updated_at
  `;
  return result.rows[0] as ChecklistItem;
}

export async function updateChecklistSubItem(
  id: string,
  is_checked: boolean
): Promise<ChecklistSubItem> {
  const result = await sql`
    UPDATE checklist_sub_items
    SET is_checked = ${is_checked}, updated_at = now()
    WHERE id = ${id}::uuid
    RETURNING id, checklist_item_id, sub_item_text, is_checked, sort_order,
              created_at, updated_at
  `;
  return result.rows[0] as ChecklistSubItem;
}

export async function getDrawingSheets(projectId: string): Promise<DrawingSheet[]> {
  const result = await sql`
    SELECT id, project_id, sheet_name, sheet_url, tagged_steps, created_at, updated_at
    FROM drawing_sheets
    WHERE project_id = ${projectId}::uuid
    ORDER BY sheet_name
  `;
  return result.rows as DrawingSheet[];
}

export async function getEvidenceForStep(stepId: string): Promise<Evidence[]> {
  const result = await sql`
    SELECT id, step_id, file_url, thumbnail_small_url, thumbnail_medium_url,
           thumbnail_large_url, drawing_sheet_id, detail_reference, verification_category,
           gps_lat, gps_lon, captured_at, correlation_completed, created_at, updated_at
    FROM evidence
    WHERE step_id = ${stepId}::uuid
    ORDER BY created_at DESC
  `;
  return result.rows as Evidence[];
}

export async function createEvidence(data: {
  step_id: string;
  file_url: string;
  thumbnail_small_url: string;
  thumbnail_medium_url: string;
  thumbnail_large_url: string;
  drawing_sheet_id: string;
  detail_reference: string;
  verification_category: VerificationCategory;
  gps_lat?: number | null;
  gps_lon?: number | null;
  captured_at?: string | null;
}): Promise<Evidence> {
  const result = await sql`
    INSERT INTO evidence (
      step_id, file_url, thumbnail_small_url, thumbnail_medium_url,
      thumbnail_large_url, drawing_sheet_id, detail_reference,
      verification_category, gps_lat, gps_lon, captured_at, correlation_completed
    )
    VALUES (
      ${data.step_id}::uuid, ${data.file_url}, ${data.thumbnail_small_url},
      ${data.thumbnail_medium_url}, ${data.thumbnail_large_url},
      ${data.drawing_sheet_id}::uuid, ${data.detail_reference},
      ${data.verification_category}, ${data.gps_lat ?? null}, ${data.gps_lon ?? null},
      ${data.captured_at ?? null}, TRUE
    )
    RETURNING id, step_id, file_url, thumbnail_small_url, thumbnail_medium_url,
              thumbnail_large_url, drawing_sheet_id, detail_reference, verification_category,
              gps_lat, gps_lon, captured_at, correlation_completed, created_at, updated_at
  `;
  return result.rows[0] as Evidence;
}

export async function deleteEvidence(id: string): Promise<void> {
  await sql`DELETE FROM evidence WHERE id = ${id}::uuid`;
}

export async function getAIDetectionsForStep(stepId: string): Promise<AIDetection[]> {
  const result = await sql`
    SELECT ad.id, ad.evidence_id, ad.prompt_version, ad.verification_type, ad.status,
           ad.confidence, ad.box_2d, ad.analysis, ad.is_overridden, ad.overridden_by,
           ad.created_at, ad.updated_at
    FROM ai_detections ad
    JOIN evidence e ON e.id = ad.evidence_id
    WHERE e.step_id = ${stepId}::uuid
    ORDER BY ad.created_at DESC
  `;
  return result.rows as AIDetection[];
}

export async function createAIDetections(detections: Omit<AIDetection, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
  for (const d of detections) {
    await sql`
      INSERT INTO ai_detections (
        evidence_id, prompt_version, verification_type, status,
        confidence, box_2d, analysis, is_overridden, overridden_by
      )
      VALUES (
        ${d.evidence_id}::uuid, ${d.prompt_version}, ${d.verification_type},
        ${d.status}, ${d.confidence}, ${JSON.stringify(d.box_2d)}, ${d.analysis},
        ${d.is_overridden}, ${d.overridden_by}
      )
    `;
  }
}

export async function overrideAIDetection(
  id: string,
  status: string,
  overridden_by: string
): Promise<AIDetection> {
  const result = await sql`
    UPDATE ai_detections
    SET status = ${status}, is_overridden = TRUE, overridden_by = ${overridden_by}, updated_at = now()
    WHERE id = ${id}::uuid
    RETURNING id, evidence_id, prompt_version, verification_type, status, confidence,
              box_2d::text, analysis, is_overridden, overridden_by, created_at, updated_at
  `;
  const row = result.rows[0] as unknown as AIDetection;
  return row;
}

export async function submitStepDecision(
  stepId: string,
  decision: 'pass' | 'fail' | 'hold',
  reason?: string,
  remediation_note?: string
): Promise<Step> {
  const updates: Record<string, unknown> = { status: decision };

  if (decision === 'pass') {
    updates.passed_at = new Date().toISOString();
    updates.failed_at = null;
    updates.held_at = null;
  } else if (decision === 'fail') {
    updates.failed_at = new Date().toISOString();
    updates.passed_at = null;
    updates.held_at = null;
  } else if (decision === 'hold') {
    updates.held_at = new Date().toISOString();
    updates.passed_at = null;
    updates.failed_at = null;
  }

  const pAt = typeof updates.passed_at === 'string' ? updates.passed_at : null;
  const fAt = typeof updates.failed_at === 'string' ? updates.failed_at : null;
  const hAt = typeof updates.held_at === 'string' ? updates.held_at : null;

  const result = await sql`
    UPDATE steps
    SET status = ${decision},
        passed_at = ${pAt},
        failed_at = ${fAt},
        held_at = ${hAt},
        updated_at = now()
    WHERE id = ${stepId}::uuid AND status = 'in_progress'
    RETURNING id, project_id, step_number, status, passed_at, failed_at, held_at,
              ai_check_run, created_at, updated_at
  `;

  if (result.rows.length === 0) {
    throw new Error('Step not found or already decided');
  }

  return result.rows[0] as Step;
}

export async function markAIStepRun(stepId: string): Promise<void> {
  await sql`
    UPDATE steps SET ai_check_run = TRUE, updated_at = now()
    WHERE id = ${stepId}::uuid
  `;
}

export async function createAuditLog(data: {
  step_id: string;
  action: string;
  old_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
  ip_address: string;
  user_agent: string;
}): Promise<void> {
await sql`
      INSERT INTO audit_logs (step_id, action, old_value, new_value, ip_address, user_agent)
      VALUES (
        ${data.step_id}::uuid, ${data.action},
        ${data.old_value ? JSON.stringify(data.old_value) : null},
        ${data.new_value ? JSON.stringify(data.new_value) : null},
        ${data.ip_address}, ${data.user_agent}
      )
    `;
}

export async function getAuditLogs(
  stepId: string,
  action?: string,
  limit = 100,
  offset = 0
): Promise<AuditLog[]> {
  const result = action
    ? await sql`
      SELECT id, step_id, action, old_value, new_value, ip_address, user_agent, created_at
      FROM audit_logs
      WHERE step_id = ${stepId}::uuid AND action = ${action}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    : await sql`
      SELECT id, step_id, action, old_value, new_value, ip_address, user_agent, created_at
      FROM audit_logs
      WHERE step_id = ${stepId}::uuid
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

  return result.rows as AuditLog[];
}