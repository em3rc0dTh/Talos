import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createTalosProductHumanRuntimeControl,
} from '../apps/reference-api/src/private-preview-human-control.ts';
import {
  GENERIC_HUMAN_SIGNAL_NAME,
  GENERIC_HUMAN_UPDATE_NAME,
  GENERIC_RUNTIME_STATE_QUERY_NAME,
  type GenericWorkflowRuntimeState,
} from '../workers/reference-temporal-worker/src/generic-contracts.ts';

function pendingState(messageKind: 'UPDATE_HANDLER' | 'SIGNAL_HANDLER'): GenericWorkflowRuntimeState {
  return {
    executionId: 'RUN-HUMAN-1',
    status: 'RUNNING',
    currentElementRef: 'exe_human_1',
    pendingHumanTask: {
      executionElementRef: 'exe_human_1',
      capabilityUseOccurrenceRef: 'exe_use_human_1',
      messageKind,
      participantRoleRefs: ['role:manager'],
      outcomes: [
        { outcomeRef: 'outcome:approve', outcomeCode: 'APPROVE', businessMeaning: 'Approve the request' },
        { outcomeRef: 'outcome:reject', outcomeCode: 'REJECT', businessMeaning: 'Reject the request' },
      ],
    },
    acceptedHumanSubmissions: [],
  };
}

function fakeClient(messageKind: 'UPDATE_HANDLER' | 'SIGNAL_HANDLER') {
  let state = pendingState(messageKind);
  const calls: Array<{ kind: string; name: string; payload?: unknown }> = [];
  const accept = (submission: any) => {
    const receipt = {
      submissionId: submission.submissionId,
      executionElementRef: submission.executionElementRef,
      capabilityUseOccurrenceRef: 'exe_use_human_1',
      outcomeRef: submission.outcomeCode === 'APPROVE' ? 'outcome:approve' : 'outcome:reject',
      outcomeCode: submission.outcomeCode,
      actorRef: submission.actorRef,
      authorityRef: submission.authorityRef,
      accepted: true as const,
    };
    state = {
      executionId: state.executionId,
      status: 'RUNNING',
      currentElementRef: 'exe_after_human',
      acceptedHumanSubmissions: [receipt],
    };
    return receipt;
  };
  const client = {
    workflow: {
      getHandle(workflowId: string) {
        assert.equal(workflowId, 'talos-RUN-HUMAN-1');
        return {
          async query(name: string) {
            calls.push({ kind: 'query', name });
            assert.equal(name, GENERIC_RUNTIME_STATE_QUERY_NAME);
            return state;
          },
          async executeUpdate(name: string, options: { args: any[] }) {
            calls.push({ kind: 'update', name, payload: options.args[0] });
            assert.equal(name, GENERIC_HUMAN_UPDATE_NAME);
            return accept(options.args[0]);
          },
          async signal(name: string, submission: any) {
            calls.push({ kind: 'signal', name, payload: submission });
            assert.equal(name, GENERIC_HUMAN_SIGNAL_NAME);
            accept(submission);
          },
        };
      },
    },
  };
  return { client: client as any, calls };
}

test('R1-08H UPDATE control queries the active frozen task and returns the accepted Temporal receipt', async () => {
  const fake = fakeClient('UPDATE_HANDLER');
  const control = createTalosProductHumanRuntimeControl({ address: 'test', namespace: 'talos-test' } as any, {
    client: fake.client,
  });
  try {
    const before = await control.getState('RUN-HUMAN-1');
    assert.equal(before.runtimeState.pendingHumanTask?.messageKind, 'UPDATE_HANDLER');
    const result = await control.submitOutcome({
      executionId: 'RUN-HUMAN-1',
      submissionId: 'submission-001',
      executionElementRef: 'exe_human_1',
      outcomeCode: 'APPROVE',
      actorRef: 'actor:owner',
      authorityRef: 'authority:human:001',
      rationale: 'Approved after review.',
    });
    assert.equal(result.receipt.accepted, true);
    assert.equal(result.receipt.outcomeCode, 'APPROVE');
    assert.equal(result.receipt.actorRef, 'actor:owner');
    assert.equal(result.runtimeState.pendingHumanTask, undefined);
    assert.equal(result.runtimeState.acceptedHumanSubmissions[0]?.submissionId, 'submission-001');
    assert(fake.calls.some((call) => call.kind === 'update'));
  } finally {
    await control.close();
  }
});

test('R1-08H SIGNAL control waits until the accepted frozen-outcome receipt is queryable', async () => {
  const fake = fakeClient('SIGNAL_HANDLER');
  const control = createTalosProductHumanRuntimeControl({ address: 'test', namespace: 'talos-test' } as any, {
    client: fake.client,
    signalReceiptPollMs: 1,
    signalReceiptTimeoutMs: 100,
  });
  try {
    const result = await control.submitOutcome({
      executionId: 'RUN-HUMAN-1',
      submissionId: 'submission-002',
      executionElementRef: 'exe_human_1',
      outcomeCode: 'REJECT',
      actorRef: 'actor:owner',
      authorityRef: 'authority:human:002',
    });
    assert.equal(result.receipt.outcomeCode, 'REJECT');
    assert(fake.calls.some((call) => call.kind === 'signal'));
    assert(fake.calls.filter((call) => call.kind === 'query').length >= 2);
  } finally {
    await control.close();
  }
});

test('R1-08H product control rejects an outcome that is not present in the pending frozen design', async () => {
  const fake = fakeClient('UPDATE_HANDLER');
  const control = createTalosProductHumanRuntimeControl({ address: 'test', namespace: 'talos-test' } as any, {
    client: fake.client,
  });
  try {
    await assert.rejects(
      () => control.submitOutcome({
        executionId: 'RUN-HUMAN-1',
        submissionId: 'submission-003',
        executionElementRef: 'exe_human_1',
        outcomeCode: 'MAGIC_NEW_OUTCOME',
        actorRef: 'actor:owner',
        authorityRef: 'authority:human:003',
      }),
      /TALOS_HUMAN_CONTROL_OUTCOME_NOT_ALLOWED/,
    );
    assert.equal(fake.calls.some((call) => call.kind === 'update' || call.kind === 'signal'), false);
  } finally {
    await control.close();
  }
});
