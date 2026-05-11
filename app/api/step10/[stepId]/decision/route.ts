import { NextRequest, NextResponse } from 'next/server';
import {
  getStepById,
  getChecklistForStep,
  submitStepDecision,
  createAuditLog,
} from '@/lib/db/queries';
import type { ChecklistItem } from '@/lib/db/types';

function getClientInfo(request: NextRequest) {
  return {
    ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown',
  };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ stepId: string }> }
) {
  try {
    const { stepId } = await params;
    const body = await request.json();
    const { decision, reason, remediation_note } = body;

    if (!['pass', 'fail', 'hold'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
    }

    if (decision === 'fail' && (!reason || !remediation_note)) {
      return NextResponse.json(
        { error: 'reason and remediation_note are required for fail decision' },
        { status: 400 }
      );
    }

    const step = await getStepById(stepId);
    if (!step) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 });
    }

    if (step.status !== 'in_progress') {
      return NextResponse.json(
        { error: `Step already ${step.status}` },
        { status: 409 }
      );
    }

    if (decision === 'pass') {
      const checklist = await getChecklistForStep(stepId);
      const blockingItems = checklist.filter((item: ChecklistItem) => item.is_blocking);

      const missingBlocking = blockingItems.filter(
        (item: ChecklistItem) => !item.is_checked || item.status !== 'pass'
      );

      if (missingBlocking.length > 0) {
        return NextResponse.json(
          {
            error: `Cannot Pass — ${missingBlocking.length} blocking item(s) missing`,
            missing_blocking_items: missingBlocking.map((item: ChecklistItem) => ({
              item_number: item.item_number,
              label: item.label,
              status: item.status,
            })),
          },
          { status: 400 }
        );
      }

      if (!step.ai_check_run) {
        return NextResponse.json(
          {
            error: 'Cannot Pass — AI Check has not been run. Run AI Check before submitting Pass decision.',
          },
          { status: 400 }
        );
      }
    }

    const updatedStep = await submitStepDecision(stepId, decision, reason, remediation_note);

    const { ip_address, user_agent } = getClientInfo(request);
    await createAuditLog({
      step_id: stepId,
      action: 'step_decision_made',
      old_value: { status: 'in_progress' },
      new_value: {
        status: decision,
        passed_at: updatedStep.passed_at,
        failed_at: updatedStep.failed_at,
        held_at: updatedStep.held_at,
        reason,
        remediation_note,
      },
      ip_address,
      user_agent,
    });

    return NextResponse.json({
      step: updatedStep,
      message:
        decision === 'pass'
          ? 'Step 10 passed. Phase 1 demo complete.'
          : decision === 'fail'
          ? 'Step 10 failed. Project locked until remediation.'
          : 'Step 10 on hold.',
    });
  } catch (error) {
    console.error('Decision error:', error);
    return NextResponse.json({ error: 'Failed to submit decision' }, { status: 500 });
  }
}