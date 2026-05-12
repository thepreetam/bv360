import { sql } from '@vercel/postgres';

export async function initializeSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      address TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS steps (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      step_number INT NOT NULL DEFAULT 10,
      status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'passed', 'failed', 'held')),
      passed_at TIMESTAMP NULL,
      failed_at TIMESTAMP NULL,
      held_at TIMESTAMP NULL,
      ai_check_run BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS checklist_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      step_id UUID NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
      item_number VARCHAR(10) NOT NULL,
      label VARCHAR(255) NOT NULL,
      is_blocking BOOLEAN NOT NULL DEFAULT FALSE,
      is_checked BOOLEAN NOT NULL DEFAULT FALSE,
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'pass', 'fail')),
      notes TEXT DEFAULT '',
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS checklist_sub_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      checklist_item_id UUID NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
      sub_item_text TEXT NOT NULL,
      is_checked BOOLEAN NOT NULL DEFAULT FALSE,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS drawing_sheets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      sheet_name VARCHAR(255) NOT NULL,
      sheet_url VARCHAR(2048) NOT NULL DEFAULT '',
      tagged_steps INT[] NOT NULL DEFAULT '{10}',
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS evidence (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      step_id UUID NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
      file_url VARCHAR(2048) NOT NULL,
      thumbnail_small_url VARCHAR(2048) NOT NULL DEFAULT '',
      thumbnail_medium_url VARCHAR(2048) NOT NULL DEFAULT '',
      thumbnail_large_url VARCHAR(2048) NOT NULL DEFAULT '',
      drawing_sheet_id UUID NOT NULL,
      detail_reference VARCHAR(255) NOT NULL,
      verification_category VARCHAR(50) NOT NULL CHECK (verification_category IN ('dimensional', 'location', 'material', 'connection', 'deficiency', 'as_built')),
      gps_lat FLOAT,
      gps_lon FLOAT,
      captured_at TIMESTAMP,
      correlation_completed BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS ai_detections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      evidence_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
      prompt_version VARCHAR(50) NOT NULL DEFAULT 'v1.0-20260501',
      verification_type VARCHAR(50) NOT NULL,
      status VARCHAR(20) NOT NULL CHECK (status IN ('pass', 'flag', 'fail')),
      confidence FLOAT NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
      box_2d JSONB NOT NULL DEFAULT '[]',
      analysis TEXT NOT NULL DEFAULT '',
      is_overridden BOOLEAN NOT NULL DEFAULT FALSE,
      overridden_by VARCHAR(255),
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      step_id UUID NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
      action VARCHAR(255) NOT NULL,
      old_value JSONB,
      new_value JSONB,
      ip_address VARCHAR(45) NOT NULL,
      user_agent TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS drawings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      sheet_name VARCHAR(255) NOT NULL,
      file_url VARCHAR(2048) NOT NULL,
      file_type VARCHAR(20) NOT NULL DEFAULT 'pdf' CHECK (file_type IN ('pdf', 'dwg')),
      parse_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (parse_status IN ('pending', 'processing', 'completed', 'failed')),
      parse_result JSONB,
      parse_error TEXT,
      page_count INT,
      file_size_bytes INT,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    )
  `;

  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_steps_project_id ON steps(project_id)',
    'CREATE INDEX IF NOT EXISTS idx_steps_status ON steps(status)',
    'CREATE INDEX IF NOT EXISTS idx_checklist_step_id ON checklist_items(step_id)',
    'CREATE INDEX IF NOT EXISTS idx_subitem_checklist_id ON checklist_sub_items(checklist_item_id)',
    'CREATE INDEX IF NOT EXISTS idx_drawings_project_id ON drawing_sheets(project_id)',
    'CREATE INDEX IF NOT EXISTS idx_drawings_project_id2 ON drawings(project_id)',
    'CREATE INDEX IF NOT EXISTS idx_evidence_step_id ON evidence(step_id)',
    'CREATE INDEX IF NOT EXISTS idx_evidence_sheet_id ON evidence(drawing_sheet_id)',
    'CREATE INDEX IF NOT EXISTS idx_evidence_category ON evidence(verification_category)',
    'CREATE INDEX IF NOT EXISTS idx_detections_evidence_id ON ai_detections(evidence_id)',
    'CREATE INDEX IF NOT EXISTS idx_detections_type ON ai_detections(verification_type)',
    'CREATE INDEX IF NOT EXISTS idx_detections_status ON ai_detections(status)',
    'CREATE INDEX IF NOT EXISTS idx_audit_step_id ON audit_logs(step_id)',
    'CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action)',
    'CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at DESC)',
  ];

  for (const idx of indexes) {
    await sql.query(idx);
  }
}

export async function seedChecklistItems(stepId: string) {
  const items = [
    {
      item_number: '10.1',
      label: 'Pre-Inspection Readiness',
      is_blocking: true,
      sort_order: 1,
      sub_items: [
        'Approved stamped drawings on-site',
        'Truss drawings + engineering letters available',
        'Foundation & underground inspections passed',
        'Structure fully framed, stable, exposed',
        'Address posted, permits active',
      ],
    },
    {
      item_number: '10.2',
      label: 'Exterior Checks',
      is_blocking: false,
      sort_order: 2,
      sub_items: [
        'Roof line matches approved plans',
        'Overall building height per plans',
        'Window installation (proper placement, flashing, sealing)',
        'Doors correct size and placement',
        'Wall/roof sheathing (proper thickness, fastening pattern)',
        'House wrap / insulation paper (proper installation, overlap)',
      ],
    },
    {
      item_number: '10.3',
      label: 'Headers & Beams',
      is_blocking: true,
      sort_order: 3,
      sub_items: [
        'Header present above every door/window opening',
        'Number of plies matches drawing (e.g., double 2x10, single LVL)',
        'Header depth matches or exceeds specified dimension',
        'Bearing length ≥1.5 inches on each end',
        'Jack stud count matches span table',
        'Fasteners: 16d nails at 3 inches O.C. along plies',
        'Header is flush with studs (unless dropped header specified)',
      ],
    },
    {
      item_number: '10.4',
      label: 'MEP Penetrations',
      is_blocking: true,
      sort_order: 4,
      sub_items: [
        'No holes in middle third of joist span',
        'Hole diameter ≤1/3 joist depth',
        'Edge distance ≥2 inches from top/bottom of joist or stud',
        'No notches in beams (LVL/PSL) — engineer letter required if present',
        'Nail plates installed wherever hole is within 1.25 inches of stud edge',
        'Foundation penetrations documented',
      ],
    },
    {
      item_number: '10.5',
      label: 'Fire Blocking',
      is_blocking: true,
      sort_order: 5,
      sub_items: [
        'Fire blocking present at every floor level',
        'Blocking at top plates (between studs and attic floor)',
        'Blocking in soffits, dropped ceilings where concealed space >54 inches wide',
        'Penetration seals (pipes, ducts, wires) have firestop caulk or putty',
        'Draft stops in attic every 1000 sq ft',
        'Garage/house common wall fully blocked',
      ],
    },
    {
      item_number: '10.6',
      label: 'Roof Height',
      is_blocking: true,
      sort_order: 6,
      sub_items: [
        'Ridge height within ±2 inches of approved plan',
        'Roof pitch matches elevation drawings',
        'Ridge level (variation ≤1 inch along length)',
        'If height >6 inches above plan → automatic zoning review (lock project)',
      ],
    },
    {
      item_number: '10.7',
      label: 'Weather Barrier',
      is_blocking: false,
      sort_order: 7,
      sub_items: [
        'House wrap installed continuously',
        'Horizontal seams overlap ≥6 inches (top over bottom)',
        'Vertical seams (if any) overlap ≥12 inches shingle fashion',
        'Wrap extends into window/door openings ≥2 inches',
        'Window sill has pan flashing or sill tape',
        'Window head has Z-flashing or metal drip cap',
        'Roof-to-wall intersection has step flashing + counter flashing',
        'No tears >4 inches in house wrap',
      ],
    },
    {
      item_number: '10.8',
      label: 'Staircase',
      is_blocking: false,
      sort_order: 8,
      sub_items: [
        'Riser height between 4 inches and 7-3/4 inches',
        'Variation between any two risers ≤3/8 inch',
        'Tread depth ≥10 inches (with nosing) or ≥11 inches (open riser)',
        'Landing depth ≥36 inches',
        'Stair width ≥36 inches',
        'Headroom ≥6 feet 8 inches',
      ],
    },
    {
      item_number: '10.9',
      label: 'Drywall',
      is_blocking: false,
      sort_order: 9,
      sub_items: [
        'Screw spacing: ceiling 12 inches O.C., walls 16 inches O.C. field / 8 inches O.C. edges',
        'Fire-rated assemblies: 12 inches O.C. field / 8 inches O.C. edges',
        'Screw heads slightly below paper surface (no popped screws)',
        'Green board (moisture-resistant) in wet areas',
      ],
    },
    {
      item_number: '10.10',
      label: 'Framing Hardware',
      is_blocking: false,
      sort_order: 10,
      sub_items: [
        'Joist hangers: every hole filled with correct nail (10d x 1.5 inches)',
        'Hurricane ties: 5 nails into rafter, 5 into top plate',
        'No empty holes in any connector',
        'Nail type matches spec (galvanized where required)',
      ],
    },
    {
      item_number: '10.11',
      label: 'Interior & Structure',
      is_blocking: false,
      sort_order: 11,
      sub_items: [
        'Framing layout matches plans',
        'Stud spacing (16" or 24" O.C.)',
        'Load-bearing walls correct',
        'Beams, headers, columns correct sizing',
        'Proper support under beams (posts, footings)',
      ],
    },
    {
      item_number: '10.12',
      label: 'Floor & Roof Systems',
      is_blocking: false,
      sort_order: 12,
      sub_items: [
        'Floor joists (size, spacing, spans)',
        'Subfloor installation (glue + nail pattern)',
        'Roof rafters or trusses (alignment, bracing)',
        'Roof sheathing attachment',
        'Attic framing and access opening',
      ],
    },
    {
      item_number: '10.13',
      label: 'Openings & Safety',
      is_blocking: false,
      sort_order: 13,
      sub_items: [
        "Window/door rough openings correct",
        'Proper header sizes above openings',
        'Egress window requirements (bedrooms)',
        'Stair framing meets code (rise/run, landings)',
      ],
    },
    {
      item_number: '10.14',
      label: 'Garage Separation',
      is_blocking: false,
      sort_order: 14,
      sub_items: [
        'Fire-rated drywall on garage side of common wall',
        'Continuous blocking from foundation to underside of roof sheathing',
        'No penetrations without firestop',
      ],
    },
    {
      item_number: '10.15',
      label: 'Final Walkthrough',
      is_blocking: false,
      sort_order: 15,
      sub_items: [
        'Inspector visually scans entire structure',
        'All checklist items reviewed',
        'No obvious deficiencies observed',
      ],
    },
  ];

  for (const item of items) {
    const result = await sql`
      INSERT INTO checklist_items (step_id, item_number, label, is_blocking, sort_order)
      VALUES (${stepId}::uuid, ${item.item_number}, ${item.label}, ${item.is_blocking}, ${item.sort_order})
      ON CONFLICT DO NOTHING
      RETURNING id
    `;

    if (result.rows.length > 0) {
      const itemId = result.rows[0].id;
      for (let i = 0; i < item.sub_items.length; i++) {
        await sql`
          INSERT INTO checklist_sub_items (checklist_item_id, sub_item_text, sort_order)
          VALUES (${itemId}::uuid, ${item.sub_items[i]}, ${i + 1})
          ON CONFLICT DO NOTHING
        `;
      }
    }
  }
}

export async function seedDrawingSheets(projectId: string) {
  const sheets = [
    { sheet_name: 'S-101 Structural', tagged_steps: [10] },
    { sheet_name: 'S-102 MEP Plan', tagged_steps: [10] },
    { sheet_name: 'A-201 Elevations', tagged_steps: [10] },
    { sheet_name: 'S-103 Foundation', tagged_steps: [10] },
    { sheet_name: 'A-301 Roof Plan', tagged_steps: [10] },
  ];

  for (const sheet of sheets) {
    const taggedSteps = [10];
    await sql`
      INSERT INTO drawing_sheets (project_id, sheet_name, tagged_steps)
      VALUES (${projectId}::uuid, ${sheet.sheet_name}, ${JSON.stringify(taggedSteps)}::jsonb)
      ON CONFLICT DO NOTHING
    `;
  }
}