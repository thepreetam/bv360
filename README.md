# BuildVerify 360 — Step 10: Rough Framing

A production-grade mobile-first inspection module for residential construction, built with Next.js 16, Vercel Postgres, and Gemini AI.

**Step 10:** https://bv360.vercel.app/projects/demo/steps/10
**Project Detail:** https://bv360.vercel.app/projects/demo

---

## Overview

Step 10: Rough Framing is part of the BuildVerify 360 platform — a construction inspection orchestration system that guides inspectors through structural framing verification against approved drawings. Each inspection step is a standalone module that can run independently.

This module implements the full **Phase 1 MVP** spec as defined in [`SPEC.md`](./SPEC.md), including:

- 15-item hierarchical checklist with 5 blocking items
- Mandatory photo-to-drawing correlation before evidence upload
- AI-powered analysis with bounding box visualizations (Gemini 2.5 Flash)
- Pass/Fail/Hold decision engine with full audit logging
- PDF export capability
- Mobile-first responsive UI (iOS Safari 15+, Android Chrome)

---

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Next.js (App Router) | 16.2.6 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| State | Zustand | 5.x |
| Database | Vercel Postgres (PostgreSQL) | 16.x |
| AI | Gemini 2.5 Flash | — |
| Storage | Vercel Blob (or S3-compatible) | — |
| Deploy | Vercel | — |

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+ (`npm install -g pnpm`)
- A Vercel account with a linked Postgres database

### Local Development

```bash
# 1. Clone the repo
git clone https://github.com/thepreetam/bv360.git
cd bv360

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in your POSTGRES_* values from Vercel dashboard

# 4. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — the demo project auto-creates on first load.

### Environment Variables

```env
# Vercel Postgres (from Vercel dashboard → Storage → your database)
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=

# Gemini AI (optional — mock AI used if not set)
# Get your API key at https://aistudio.google.com/
GEMINI_API_KEY=
```

---

## Architecture

```
app/
├── api/                          # 18 API route handlers
│   ├── projects/                  # Project CRUD
│   ├── step10/[stepId]/           # Step 10 data, evidence, decision
│   ├── checklist/                 # Checklist item updates
│   ├── evidence/                   # Evidence CRUD
│   ├── ai/                         # AI analysis, cost estimation
│   └── audit/                      # Audit log retrieval
│
├── projects/[projectId]/steps/10/ # Step 10 page (main entry)
│
components/step10/
├── tabs/
│   ├── ChecklistTab.tsx            # Checklist with progress bar
│   ├── CaptureTab.tsx             # Quick capture / walkthrough switcher
│   ├── GalleryTab.tsx              # Evidence gallery with filters
│   └── AITab.tsx                   # AI analysis trigger + results
├── checklist/
│   ├── ChecklistItem.tsx           # Accordion item (checkbox, sub-items, notes, status)
│   └── DecisionButtons.tsx         # Pass / Fail / Hold with blocking logic
├── capture/
│   ├── QuickCapture.tsx            # Webcam photo/video capture
│   ├── WalkthroughMode.tsx         # Guided 22-point walkthrough
│   └── CorrelationModal.tsx         # Mandatory metadata gate
├── gallery/
│   ├── GalleryLightbox.tsx        # Full-screen evidence viewer
│   └── FilterSheet.tsx             # Category/status filter
└── ai/
    ├── AIResults.tsx               # Per-photo detection results
    └── BoundingBoxOverlay.tsx      # SVG bounding box renderer

lib/db/
├── schema.ts                      # PostgreSQL schema (8 tables)
├── queries.ts                      # All SQL queries
└── types.ts                        # TypeScript interfaces

services/
└── aiService.ts                   # AI analysis (mock or Gemini)

stores/
├── checklistStore.ts               # Checklist state + blocking logic
├── evidenceStore.ts                # Evidence state + filtering
└── walkthroughStore.ts             # Guided walkthrough state

data/
├── checklist_step10.json           # 15 checklist items with sub-items
└── walkthrough_step10.json         # 22 guided walkthrough points
```

---

## Database Schema

9 tables matching the engineering spec:

| Table | Description |
|-------|-------------|
| `projects` | Construction projects |
| `steps` | Step 10 per project (status, AI check flag) |
| `checklist_items` | 15 inspection items with blocking flag |
| `checklist_sub_items` | Nested sub-items per checklist item |
| `drawing_sheets` | Seeded drawing sheets (5 sheets per project) |
| `drawings` | Uploaded architectural PDFs with parse results |
| `evidence` | Uploaded photos/videos with correlation metadata |
| `ai_detections` | AI analysis results with bounding boxes |
| `audit_logs` | Immutable action log (all state changes) |

Schema auto-initializes on first API call via `initializeSchema()`.

---

## API Reference

All endpoints return JSON. Timestamps are ISO 8601.

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects` | List all projects |
| `POST` | `/api/projects` | Create project (auto-creates Step 10 + seeds data) |
| `GET` | `/api/projects/[id]` | Get project with Step 10 status |
| `GET` | `/api/projects/[id]/drawings` | List drawings for project |
| `POST` | `/api/projects/[id]/drawings` | Upload drawing (multipart) |

### Drawings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/drawings/[id]` | Get single drawing |
| `DELETE` | `/api/drawings/[id]` | Delete drawing |
| `POST` | `/api/drawings/[id]/parse` | Parse drawing with Gemini AI |

### Step 10

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/step10/[stepId]` | Full Step 10 data (checklist + evidence + AI results) |
| `POST` | `/api/step10/[stepId]/evidence` | Upload evidence (multipart, requires correlation) |
| `PUT` | `/api/step10/[stepId]/decision` | Submit Pass/Fail/Hold decision |
| `GET` | `/api/step10/[stepId]/audit-log` | Log page view |

### Checklist

| Method | Endpoint | Description |
|--------|----------|-------------|
| `PUT` | `/api/checklist/[id]` | Update item (is_checked, status, notes) |
| `PUT` | `/api/checklist-sub-items/[id]` | Update sub-item (is_checked) |

### Evidence

| Method | Endpoint | Description |
|--------|----------|-------------|
| `DELETE` | `/api/evidence/[id]` | Delete evidence + associated AI results |

### AI

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/analyze` | Run AI analysis on evidence |
| `POST` | `/api/ai/analyze/estimate-cost` | Estimate cost before running |
| `PUT` | `/api/ai/detections/[id]/override` | Override AI detection verdict |

### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/drawing-sheets/[projectId]` | Seeded drawing sheets for correlation |
| `GET` | `/api/audit/step10/[stepId]` | Audit logs with optional filtering |
| `GET` | `/api/health` | Health check + schema init |

---

## Key Features

### Blocking Items (5 required for Pass)

Items 10.1, 10.3, 10.4, 10.5, 10.6 are marked as blocking. The Pass button is disabled until all 5 are checked AND at least one AI analysis has been run.

### AI Analysis

The AI tab shows a cost estimation modal before running analysis (~$0.01/image with Gemini 2.5 Flash). Results include:
- Per-photo verification results (10 types: header presence, stud alignment, MEP holes, fire blocking, etc.)
- Bounding box SVG overlays on photos
- Confidence scores with color coding (green ≥0.85, yellow 0.60–0.84, red <0.60)
- Override capability for inspector corrections

### Correlation Modal

Every piece of evidence MUST be correlated before upload:
- Drawing Sheet (from seeded DB data)
- Detail Reference (free text: "Grid B-3", "Detail 4A")
- Verification Category (6 options: Dimensional, Location, Material, Connection, Deficiency, As-Built)

This links each photo to specific plan details for the AI to compare against.

### Architectural Drawing Parsing

Upload architectural/structural PDFs to each project. The AI parses them to establish **ground truth** for photo verification:

- Upload PDF via the Project Detail page (`/projects/[id]`)
- Click "Parse with AI" to extract structured data with Gemini 2.5 Flash
- Extracted data includes: project info, overall dimensions, structural elements (headers, beams, columns, shear walls), room dimensions and elevations, specifications by category
- Parsed data appears in the drawing's detail panel
- Without `GEMINI_API_KEY`: mock data is generated for demo purposes

### Audit Logging

Every action is logged with old/new values, IP address, and user agent:
- `checklist_item_updated` — item check, status change, notes
- `evidence_uploaded` — file URL, GPS, correlation metadata
- `ai_check_triggered` — evidence IDs, prompt version
- `step_decision_made` — Pass/Fail/Hold with timestamps

### Decision Engine

**Pass** requires:
1. All 5 blocking items checked with status = 'pass'
2. At least one AI check run

**Fail** requires:
- Reason (required)
- Remediation note (required) — triggers project lock

**Hold** is always available with optional reason.

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import at [vercel.com/new](https://vercel.com/new)
3. Create a **Vercel Postgres** database → link to project
4. Add environment variables from the Postgres dashboard
5. Deploy — schema initializes automatically

```bash
# Or via CLI
pnpm vercel --prod
```

### Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_*` | Yes | Vercel Postgres connection string |
| `GEMINI_API_KEY` | No | Enables real Gemini AI. Without it, mock AI is used. |

---

## Development

### Project Structure

The `rough-framing-scope/` directory is the **standalone Next.js app** (frontend + API routes). There is no separate backend — all server-side logic runs as Next.js API routes, which deploy to Vercel Functions.

### Adding Real Gemini AI

Set `GEMINI_API_KEY` in your environment. The `aiService.ts` module will automatically use the real Gemini API instead of mock data. No code changes needed.

### Adding Real File Upload

The current demo stores evidence as base64 data URLs. For production:

1. Replace base64 encoding in `app/api/step10/[stepId]/evidence/route.ts` with Vercel Blob upload
2. Update `createEvidence()` in `lib/db/queries.ts` to save the returned S3/Blob URL

### Running Tests

```bash
pnpm build     # Production build
pnpm dev       # Development server
```

No test runner is configured yet. Recommended: Vitest + Playwright.

---

## References

- **Engineering Spec:** [`SPEC.md`](./SPEC.md) — exhaustive 4,360-line spec with data models, API contracts, AI prompts, UI wireframes
- **UI/UX Spec:** [`mvp/ui-spec/ui-spec.md`](./mvp/ui-spec/ui-spec.md) — design system, color palette, component specs
- **Step 10 Scope:** [`mvp/scope/Step10_Rough_Framing_Scope.md`](./mvp/scope/Step10_Rough_Framing_Scope.md) — business requirements
- **AI Prompt:** [`mvp/scope/BUILDVERIFY360_AuditorGemini.md`](./mvp/scope/BUILDVERIFY360_AuditorGemini.md) — Gemini integration details

---

## License

Proprietary — BuildVerify 360