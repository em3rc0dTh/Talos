import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createOpaqueId } from '../packages/foundation/src/ids.ts';
import {
  decideGuidedSemanticResolution,
  proposeGuidedSemanticResolution,
} from '../packages/application/src/semantic-resolution.ts';
import { validateProcessRevision } from '../packages/semantic-core/src/validation.ts';
import type { ProcessRevision } from '../packages/semantic-core/src/types.ts';
import { ONE_APP_PRODUCT_PAGE } from '../apps/reference-api/src/one-app-product-page.ts';
import {
  R1_04_BUSINESS_CONFIRMATION_EXTENSION,
} from '../apps/reference-api/src/one-app-r1-04-confirmation-extension.ts';
import {
  R1_05_AUTOMATION_DESIGN_EXTENSION,
} from '../apps/reference-api/src/one-app-r1-05-automation-design-extension.ts';
import {
  renderR111CGuidedResolutionUxPage,
} from '../apps/reference-api/src/one-app-r1-11c-guided-resolution-ux-extension.ts';

function waitRevision(): ProcessRevision {
  const processId = createOpaqueId('canonical', 'r1-11c:process');
  const start = createOpaqueId('canonical', 'r1-11c:start');
  const wait = createOpaqueId('canonical', 'r1-11c:wait');
  const end = createOpaqueId('canonical', 'r1-11c:end');
  return {
    id: createOpaqueId('canonical', 'r1-11c:revision:1'),
    processDefinitionId: processId,
    revision: 1,
    createdAt: '2026-09-18T14:00:00.000Z',
    parentRevisionIds: [],
    derivationKind: 'IMPORT',
    sourceArtifactIds: [],
    nodes: [
      { id: start, kind: 'EVENT', name: 'inicio', actorRefs: [], inputRefs: [], outputRefs: [], ruleRefs: [], truthClass: 'INFERRED', provenanceRefs: [], sourceExtensionRefs: [] },
      { id: wait, kind: 'WAIT', name: 'Dejar actuar 5 minutos', actorRefs: [], inputRefs: [], outputRefs: [], ruleRefs: [], truthClass: 'INFERRED', provenanceRefs: [], sourceExtensionRefs: [] },
      { id: end, kind: 'END', name: 'fin', actorRefs: [], inputRefs: [], outputRefs: [], ruleRefs: [], truthClass: 'INFERRED', provenanceRefs: [], sourceExtensionRefs: [] },
    ],
    edges: [
      { id: createOpaqueId('canonical', 'r1-11c:e1'), sourceNodeId: start, targetNodeId: wait, kind: 'SEQUENCE', truthClass: 'INFERRED', provenanceRefs: [], sourceExtensionRefs: [] },
      { id: createOpaqueId('canonical', 'r1-11c:e2'), sourceNodeId: wait, targetNodeId: end, kind: 'SEQUENCE', truthClass: 'INFERRED', provenanceRefs: [], sourceExtensionRefs: [] },
    ],
    actors: [],
    variables: [],
    dataObjects: [],
    rules: [],
    semanticClaims: [],
    conflictRecords: [],
    annotations: [],
    provenanceLinks: [],
    sourceExtensions: [],
    semanticStatus: 'NORMALIZED',
    executionReadiness: 'NOT_ASSESSED',
    validationFindingRefs: [],
  };
}

test('R1-11C guided resolution turns a fixed business wait into reviewable semantics', () => {
  const revision = waitRevision();
  const validation = validateProcessRevision(revision);
  const finding = validation.findings.find((item) => item.code === 'SV-EVT-003');
  assert.ok(finding);
  const question = validation.questions.find((item) => item.findingRefs.includes(finding.id));
  assert.ok(question);

  const proposal = proposeGuidedSemanticResolution({
    processRevision: revision,
    validation,
    answers: [{
      kind: 'WAIT_SEMANTICS',
      questionRef: question.id,
      findingRef: finding.id,
      targetRef: finding.targetRefs[0]!,
      waitKind: 'DURATION',
      expression: '5 minutes',
    }],
    authority: {
      answeredBy: 'business-user',
      authorityRef: 'ui:r1-11c:wait-answer',
      rationale: 'The vehicle treatment waits for five minutes.',
      answeredAt: '2026-09-18T14:01:00.000Z',
    },
  });

  assert.equal(proposal.createsCanonicalRevision, false);
  assert.equal(proposal.authorizesAutomationDesign, false);

  const decision = decideGuidedSemanticResolution({
    proposal,
    processRevision: revision,
    validation,
    decision: 'ACCEPT',
    decidedBy: 'business-user',
    authorityRef: 'ui:r1-11c:wait-accept',
    rationale: 'Apply the confirmed five minute wait.',
    decidedAt: '2026-09-18T14:02:00.000Z',
  });
  assert.equal(decision.decision, 'ACCEPT');
  if (decision.decision !== 'ACCEPT') return;
  const wait = decision.resolvedRevision.nodes.find((node) => node.kind === 'WAIT');
  assert.equal(wait?.details?.waitKind, 'DURATION');
  assert.equal(wait?.details?.expression, '5 minutes');
  assert.equal(decision.validation.findings.some((item) => item.code === 'SV-EVT-003' || item.code === 'SV-EVT-002'), false);
  assert.equal(decision.requiresProcessReconfirmation, true);
  assert.equal(decision.authorizesAutomationDesign, false);
  assert.equal(decision.authorizesExecution, false);
});

test('R1-11C defaults the One-App to plain-language review with technical details optional', () => {
  const page = renderR111CGuidedResolutionUxPage(ONE_APP_PRODUCT_PAGE);
  assert.match(page, /A few details need your confirmation/);
  assert.match(page, /Technical details/);
  assert.match(page, /Upload a process image or BPMN/);
  assert.match(page, /A fixed amount of time/);
  assert.match(page, /How long\? Example: 5 minutes/);
  assert.match(page, /Review my answers/);
  assert.match(page, /Apply clarifications/);
  assert.match(page, /Your original source stays unchanged/);
  assert.match(page, /body:not\(\.r111cAdvanced\).*#meta/s);
});

test('R1-11C reconnects reconfirmation and freeze-blocker UX instead of a dead-end error', () => {
  assert.match(R1_04_BUSINESS_CONFIRMATION_EXTENSION, /semantic-resolution\/decide/);
  assert.match(R1_04_BUSINESS_CONFIRMATION_EXTENSION, /Review updated process/);
  assert.match(R1_05_AUTOMATION_DESIGN_EXTENSION, /talos:r1-11c-freeze-blocked/);
  assert.match(R1_05_AUTOMATION_DESIGN_EXTENSION, /Talos needs a few process details before it can prepare the automation/);

  const serverPath = fileURLToPath(new URL('../apps/reference-api/src/one-app-server.ts', import.meta.url));
  const source = readFileSync(serverPath, 'utf8');
  assert.match(source, /\/api\/semantic-resolution\/propose/);
  assert.match(source, /\/api\/semantic-resolution\/decide/);
  assert.match(source, /freezeBlockers: publicFreezeBlockers\(binding\)/);
  assert.match(source, /guidedResolutionAvailable/);
  assert.match(source, /automaticAuthorityGranted: false/);
});
