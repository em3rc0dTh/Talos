import test from 'node:test';
import assert from 'node:assert/strict';
import {
  admitAutomationProposal,
  generateAutomationProposal,
  resolveGeminiAutomationDesigner,
  resolveOllamaAutomationDesigner,
  routeAutomationProposal,
  type AutomationProposalProvider,
  type AutomationProposalProviderContext,
} from '../packages/capability/src/index.ts';
import type { ProcessRevision } from '../packages/semantic-core/src/types.ts';
import type { CapabilityDesignBundle } from '../packages/capability/src/generic-design.ts';
import { ONE_APP_PRODUCT_REVIEW_RESOLUTION_ENHANCEMENT } from '../apps/reference-api/src/one-app-product-review-resolution-page.ts';

const NOW = '2026-08-28T18:50:00.000Z';
const ACTION = 'prc_action_alpha';
const WAIT = 'prc_wait_beta';
const REQUIREMENT = 'cap_requirement_alpha';

function process(): ProcessRevision {
  return {
    id: 'prc_revision_generic' as any,
    processDefinitionId: 'prc_definition_generic' as any,
    revision: 1,
    createdAt: NOW,
    parentRevisionIds: [],
    derivationKind: 'HUMAN_CONFIRMATION',
    sourceArtifactIds: ['src_generic' as any],
    nodes: [
      {
        id: ACTION as any,
        kind: 'ACTION',
        name: 'Perform business work',
        actorRefs: [], inputRefs: [], outputRefs: [], ruleRefs: [],
        truthClass: 'CONFIRMED', provenanceRefs: [], sourceExtensionRefs: [],
      },
      {
        id: WAIT as any,
        kind: 'WAIT',
        name: 'Wait for a confirmed duration',
        actorRefs: [], inputRefs: [], outputRefs: [], ruleRefs: [],
        details: { durationIso8601: 'PT5M' },
        truthClass: 'CONFIRMED', provenanceRefs: [], sourceExtensionRefs: [],
      },
    ],
    edges: [{
      id: 'prc_edge_generic' as any,
      sourceNodeId: ACTION as any,
      targetNodeId: WAIT as any,
      kind: 'SEQUENCE',
      truthClass: 'CONFIRMED',
      provenanceRefs: [], sourceExtensionRefs: [],
    }],
    actors: [], variables: [], dataObjects: [], rules: [], semanticClaims: [], conflictRecords: [], annotations: [], provenanceLinks: [], sourceExtensions: [],
    semanticStatus: 'VALIDATED', executionReadiness: 'READY_FOR_AUTOMATION_DESIGN', validationFindingRefs: [],
  };
}

function design(): CapabilityDesignBundle {
  return {
    designRevision: {
      id: 'cap_design_generic' as any,
      semanticFreezeRecordId: 'rvw_freeze_generic' as any,
      scopeFreezeRefs: ['rvw_scope_freeze_generic' as any],
      processRevisionId: 'prc_revision_generic' as any,
      validationAssessmentRefs: ['val_assessment_generic' as any],
      requirementRefs: [REQUIREMENT as any],
      unresolvedRequirementRefs: [REQUIREMENT as any],
      designState: 'NEEDS_DESIGN_DECISION',
      designDigest: 'digest-generic',
      createdAt: NOW,
    },
    requirements: [{
      id: REQUIREMENT as any,
      capabilityDesignRevisionId: 'cap_design_generic' as any,
      semanticScopeRef: 'val_scope_generic',
      semanticSubjectRefs: [ACTION],
      family: 'SOURCE_DEFINED',
      operationIntent: 'PERFORM_ACTION',
      requirementBasis: 'SEMANTIC_DERIVED',
      constraintRefs: [], safetyRequirementRefs: [],
      requirementState: 'UNRESOLVED',
      provenanceTraceRef: 'cap_trace_generic' as any,
      facetRefs: [],
    }],
    facets: [],
    provenanceTraces: [],
    designerRef: 'talos-generic-capability-designer',
    designerVersion: 'test-generic-v1',
  };
}

function context(): AutomationProposalProviderContext {
  return { process: process(), design: design(), availableOfferings: [] };
}

function completeRaw() {
  return {
    steps: [{
      capabilityRequirementRef: REQUIREMENT,
      semanticSubjectRefs: [ACTION],
      proposedFamily: 'SYSTEM_OPERATION',
      canonicalName: 'Generic business operation adapter',
      implementationKind: 'INTERNAL_SERVICE',
      implementationRef: 'proposal:generic-business-operation',
      rationale: 'The confirmed process contains business work but no authoritative provider; this is a proposed implementation direction only.',
      confidence: 0.78,
    }],
    orchestration: [{
      semanticSubjectRef: WAIT,
      proposedTreatment: 'DURABLE_TIMER',
      rationale: 'The canonical node is a confirmed WAIT with duration semantics.',
      confidence: 0.99,
    }],
    unresolvedQuestions: [],
    assumptions: ['The implementation provider remains unconfigured until explicit capability selection.'],
    diagnostics: [],
  };
}

function partialRaw() {
  return {
    ...completeRaw(),
    unresolvedQuestions: [{
      semanticSubjectRefs: [ACTION],
      question: 'Which governed implementation should perform this business work?',
      reason: 'The confirmed process does not identify an implementation provider.',
      material: true,
    }],
  };
}

function staticProvider(id: string, raw: unknown): AutomationProposalProvider {
  return {
    providerId: id,
    modelRef: `model:${id}`,
    pipelineVersion: `pipeline:${id}`,
    async propose() {
      return { providerId: id, modelRef: `model:${id}`, pipelineVersion: `pipeline:${id}`, rawProposal: raw };
    },
  };
}

test('AI automation proposal remains SUGGESTED and cannot create authority or bindings', async () => {
  const proposal = await generateAutomationProposal(staticProvider('PRIMARY', completeRaw()), context(), NOW);
  assert.equal(proposal.status, 'COMPLETE');
  assert.equal(proposal.state, 'SUGGESTED');
  assert.equal(proposal.createsBinding, false);
  assert.equal(proposal.grantsAuthority, false);
  assert.equal(proposal.steps[0].createsBinding, false);
  assert.equal(proposal.orchestration[0].canonicalNodeKind, 'WAIT');
  assert.equal(proposal.orchestration[0].proposedTreatment, 'DURABLE_TIMER');
});

test('Talos rejects invented semantic references, authority fields and unavailable offerings', () => {
  assert.throws(() => admitAutomationProposal(context(), { providerId: 'P', modelRef: 'M', pipelineVersion: 'V' }, {
    ...completeRaw(), steps: [{ ...completeRaw().steps[0], semanticSubjectRefs: ['invented-node'] }],
  }, NOW), /outside its frozen requirement/);

  assert.throws(() => admitAutomationProposal(context(), { providerId: 'P', modelRef: 'M', pipelineVersion: 'V' }, {
    ...completeRaw(), authorityRef: 'model-must-not-authorize',
  }, NOW), /may not emit authority field/);

  assert.throws(() => admitAutomationProposal(context(), { providerId: 'P', modelRef: 'M', pipelineVersion: 'V' }, {
    ...completeRaw(), steps: [{ ...completeRaw().steps[0], implementationRef: 'offering:not-installed' }],
  }, NOW), /unavailable offering/);
});

test('Talos rejects orchestration that changes confirmed canonical meaning', () => {
  assert.throws(() => admitAutomationProposal(context(), { providerId: 'P', modelRef: 'M', pipelineVersion: 'V' }, {
    ...completeRaw(), orchestration: [{
      semanticSubjectRef: WAIT,
      proposedTreatment: 'DETERMINISTIC_BRANCH',
      rationale: 'Invalid attempt to reinterpret WAIT as a decision.',
      confidence: 0.9,
    }],
  }, NOW), /incompatible with canonical WAIT/);
});

test('partial primary proposal triggers one independent fallback without model voting', async () => {
  const routed = await routeAutomationProposal(
    context(),
    staticProvider('PRIMARY', partialRaw()),
    staticProvider('FALLBACK', completeRaw()),
    NOW,
  );
  assert.equal(routed.decision, 'FALLBACK_ACCEPTED');
  assert.equal(routed.automaticFallbackTriggered, true);
  assert.equal(routed.primary.result, 'PARTIAL');
  assert.equal(routed.fallback?.result, 'COMPLETE');
  assert.equal(routed.selectedProposal?.providerId, 'FALLBACK');
  assert.equal(routed.createsBinding, false);
  assert.equal(routed.automaticAutomationApprovalAuthorized, false);
  assert.equal(routed.automaticDeploymentAuthorized, false);
  assert.equal(routed.automaticWorkflowExecutionAuthorized, false);
});

test('both insufficient proposals fail closed at design', async () => {
  const routed = await routeAutomationProposal(context(), staticProvider('PRIMARY', partialRaw()), staticProvider('FALLBACK', partialRaw()), NOW);
  assert.equal(routed.decision, 'UNRESOLVED_AFTER_FALLBACK');
  assert.equal(routed.selectedProposal, undefined);
  assert.equal(routed.automaticFallbackTriggered, true);
});

test('Gemini automation designer uses low-thinking JSON proposal contract without exposing the key', async () => {
  const secret = 'test-secret-never-persist';
  let observedKey = '';
  let observedBody: any;
  const fakeFetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    observedKey = new Headers(init?.headers).get('x-goog-api-key') ?? '';
    observedBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(completeRaw()) }] }, finishReason: 'STOP' }] }), {
      status: 200, headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;
  const resolved = resolveGeminiAutomationDesigner({ GEMINI_API_KEY: secret }, fakeFetch);
  assert.equal(resolved.status, 'CONFIGURED');
  if (resolved.status !== 'CONFIGURED') return;
  assert.equal(resolved.provider?.modelRef, 'gemini-3.6-flash');
  const proposal = await generateAutomationProposal(resolved.provider!, context(), NOW);
  assert.equal(observedKey, secret);
  assert.equal(observedBody.generationConfig.thinkingConfig.thinkingLevel, 'low');
  assert.equal(observedBody.generationConfig.responseMimeType, 'application/json');
  assert.equal(JSON.stringify(proposal).includes(secret), false);
  assert.equal(proposal.status, 'COMPLETE');
});

test('Ollama automation designer is opt-in and remains a non-thinking independent fallback', async () => {
  assert.equal(resolveOllamaAutomationDesigner({}).status, 'DISABLED');
  let body: any;
  const fakeFetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    body = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ message: { role: 'assistant', content: JSON.stringify(completeRaw()) }, done: true }), {
      status: 200, headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;
  const resolved = resolveOllamaAutomationDesigner({ TALOS_OLLAMA_AUTOMATION_FALLBACK_ENABLED: 'true' }, fakeFetch);
  assert.equal(resolved.status, 'CONFIGURED');
  if (resolved.status !== 'CONFIGURED') return;
  const proposal = await generateAutomationProposal(resolved.provider, context(), NOW);
  assert.equal(body.stream, false);
  assert.equal(body.think, false);
  assert.equal(body.format, 'json');
  assert.equal(proposal.status, 'COMPLETE');
});

test('One-App preserves audit evidence but collapses it and per-requirement technical detail by default', () => {
  assert.match(ONE_APP_PRODUCT_REVIEW_RESOLUTION_ENHANCEMENT, /disclosureForList\('questions','review questions'\)/);
  assert.match(ONE_APP_PRODUCT_REVIEW_RESOLUTION_ENHANCEMENT, /disclosureForList\('findings','validation findings'\)/);
  assert.match(ONE_APP_PRODUCT_REVIEW_RESOLUTION_ENHANCEMENT, /disclosureForField\('bpmnEditor','advanced BPMN\/XML'\)/);
  assert.match(ONE_APP_PRODUCT_REVIEW_RESOLUTION_ENHANCEMENT, /disclosureForEvidence\('evidenceTrace','evidence trace'\)/);
  assert.match(ONE_APP_PRODUCT_REVIEW_RESOLUTION_ENHANCEMENT, /compactRequirementCards\(\)/);
  assert.match(ONE_APP_PRODUCT_REVIEW_RESOLUTION_ENHANCEMENT, /Review technical details/);
});
