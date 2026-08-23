import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createOpaqueId } from '../packages/foundation/src/ids.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';
import { openAutomationDesignWorkspace } from '../packages/capability/src/automation-design-workspace.ts';
import { selectAndBindAutomationCapabilities } from '../packages/capability/src/automation-capability-selection.ts';
import { persistAutomationCapabilitySelection } from '../packages/application/src/capability.ts';
import type { CapabilityDesignBundle } from '../packages/capability/src/generic-design.ts';

function fixture(): CapabilityDesignBundle {
  const designId = createOpaqueId('capability', 'i8-04-persist:design');
  const requirementId = createOpaqueId('capability', 'i8-04-persist:requirement');
  const traceId = createOpaqueId('capability', 'i8-04-persist:trace');
  const freezeId = createOpaqueId('review', 'i8-04-persist:freeze');
  const scopeFreezeId = createOpaqueId('review', 'i8-04-persist:scope-freeze');
  const processId = createOpaqueId('canonical', 'i8-04-persist:process');
  const assessmentId = createOpaqueId('validation', 'i8-04-persist:assessment');
  const scopeId = createOpaqueId('validation', 'i8-04-persist:scope');
  const subjectId = createOpaqueId('canonical', 'i8-04-persist:subject');
  return {
    designRevision: {
      id: designId,
      semanticFreezeRecordId: freezeId,
      scopeFreezeRefs: [scopeFreezeId],
      processRevisionId: processId,
      validationAssessmentRefs: [assessmentId],
      requirementRefs: [requirementId],
      unresolvedRequirementRefs: [],
      designState: 'READY_FOR_BINDING',
      designDigest: 'i8-04-persist-digest',
      createdAt: '2026-08-23T22:05:00.000Z',
    },
    requirements: [{
      id: requirementId,
      capabilityDesignRevisionId: designId,
      semanticScopeRef: scopeId,
      semanticSubjectRefs: [subjectId],
      family: 'SYSTEM_OPERATION',
      operationIntent: 'PERFORM_ACTION',
      requirementBasis: 'SEMANTIC_DERIVED',
      constraintRefs: [],
      safetyRequirementRefs: [],
      requirementState: 'REQUIRED',
      provenanceTraceRef: traceId,
      facetRefs: [],
    }],
    facets: [],
    provenanceTraces: [{
      id: traceId,
      requirementId,
      semanticFreezeRecordId: freezeId,
      scopeFreezeRef: scopeFreezeId,
      processRevisionId: processId,
      semanticSubjectRefs: [subjectId],
      semanticClaimRefs: [],
      validationAssessmentRefs: [assessmentId],
      derivationMethod: 'I8_04_PERSISTENCE_FIXTURE',
      designerVersion: 'i8-04-test',
      createdAt: '2026-08-23T22:05:00.000Z',
    }],
    designerRef: 'i8-04-test',
    designerVersion: 'i8-04-test',
  };
}

test('I8-04 persists selection trace, selection decision and binding without downstream execution artifacts', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'talos-i8-04-persist-'));
  const repo = new SqliteDocumentStore(path.join(dir, 'state.sqlite'));
  try {
    const base = fixture();
    const workspace = openAutomationDesignWorkspace(base, '2026-08-23T22:06:00.000Z');
    const result = selectAndBindAutomationCapabilities(base, workspace, [{
      source: 'EXPLICIT_OFFERING',
      requirementRef: base.requirements[0].id,
      family: 'SYSTEM_OPERATION',
      offeringCanonicalName: 'Inventory API',
      implementationKind: 'DIRECT_API',
      implementationRef: 'internal:inventory-api',
      decidedBy: 'automation-designer',
      authorityRef: 'authority:i8-04-persist',
      rationale: 'Explicitly bind the inventory API.',
    }], '2026-08-23T22:07:00.000Z');

    persistAutomationCapabilitySelection(repo, result);

    assert.equal(repo.listByKind('AutomationCapabilitySelectionTrace').length, 1);
    assert.equal(repo.listByKind('CapabilitySelectionDecision').length, 1);
    assert.equal(repo.listByKind('CapabilityBindingRevision').length, 1);
    assert.equal(repo.listByKind('CapabilityBindingAssessment').length, 1);
    assert.deepEqual(repo.get(result.traces[0].id as any)?.payload, result.traces[0]);
    for (const forbidden of [
      'ExecutionPlanRevision',
      'TemporalMappingRevision',
      'RuntimePolicyRevision',
      'DeploymentRevision',
      'WorkflowExecutionObservation',
    ]) assert.equal(repo.listByKind(forbidden).length, 0, `${forbidden} must remain absent after I8-04`);
  } finally {
    repo.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
