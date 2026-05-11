// UUID generation utility

export interface Project {
  id: string;
  name: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface Step {
  id: string;
  project_id: string;
  step_number: number;
  status: 'in_progress' | 'passed' | 'failed' | 'held';
  passed_at: string | null;
  failed_at: string | null;
  held_at: string | null;
  ai_check_run: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  step_id: string;
  item_number: string;
  label: string;
  is_blocking: boolean;
  is_checked: boolean;
  status: 'pending' | 'pass' | 'fail';
  notes: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ChecklistSubItem {
  id: string;
  checklist_item_id: string;
  sub_item_text: string;
  is_checked: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DrawingSheet {
  id: string;
  project_id: string;
  sheet_name: string;
  sheet_url: string;
  tagged_steps: number[];
  created_at: string;
  updated_at: string;
}

export interface Evidence {
  id: string;
  step_id: string;
  file_url: string;
  thumbnail_small_url: string;
  thumbnail_medium_url: string;
  thumbnail_large_url: string;
  drawing_sheet_id: string;
  detail_reference: string;
  verification_category: VerificationCategory;
  gps_lat: number | null;
  gps_lon: number | null;
  captured_at: string | null;
  correlation_completed: boolean;
  created_at: string;
  updated_at: string;
}

export type VerificationCategory =
  | 'dimensional'
  | 'location'
  | 'material'
  | 'connection'
  | 'deficiency'
  | 'as_built';

export interface AIDetection {
  id: string;
  evidence_id: string;
  prompt_version: string;
  verification_type: string;
  status: 'pass' | 'flag' | 'fail';
  confidence: number;
  box_2d: [number, number, number, number];
  analysis: string;
  is_overridden: boolean;
  overridden_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  step_id: string;
  action: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export const VERIFICATION_TYPES = [
  'header_presence',
  'header_plies',
  'header_depth',
  'mep_hole_position',
  'mep_hole_diameter',
  'mep_edge_distance',
  'nail_plate_presence',
  'fire_blocking_presence',
  'roof_height',
  'house_wrap_overlap',
] as const;

export type VerificationType = typeof VERIFICATION_TYPES[number];