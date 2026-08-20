import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';
import { LocalImageByteStore } from '../packages/image-perception/src/byte-store.ts';
import { designGenericCapabilities } from '../packages/capability/src/generic-design.ts';
import { resolveGenericCapabilities, type GenericRequirementResolution } from '../packages/capability/src/generic-resolution.ts';
import { designGenericResolvedExecutionPlan } from '../packages/execution/src/generic-resolved-plan.ts';
import { persistGenericCapabilityResolution } from '../packages/application/src/capability.ts';
import { persistGenericResolvedExecutionPlan } from '../packages/application/src/execution-design.ts';
import { buildFrozenQuarry02ImageReview } from './helpers/quarry02-frozen-image.ts';

const fixturePath = path.resolve(process.cwd(), '../../brainstorming/mining-site/quarry-02-water-order-delivery/quarry-02.png');
const AT = '2026-08-20T13:30:00.000Z';

function setup() {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-image-i5c03-'));
  const repo = new SqliteDocumentStore(path.join(runtimeDir, 'talos-state.sqlite'));
  const byteStore = new LocalImageByteStore(path.join(runtimeDir, 'source-bytes'));
  const frozen = buildFrozenQuarry02ImageReview(repo, byteStore, readFileSync(fixturePath));
  const current = frozen.ready.current;
  const base = designGenericCapabilities(current.process, current.validation.scope, current.validation.assessment, frozen.freeze, frozen.scopeFreeze, AT);
  return { runtimeDir, repo, current, base, ...frozen };
}

function close(x: ReturnType<typeof setup>) {
  x.repo.close();
  rmSync(x.runtimeDir, { recursive: true, force: true });
}

function systemResolutions(x: ReturnType<typeof setup>): GenericRequirementResolution[] {
  return x.base.requirements.map((requirement, index) => ({
    requirementRef: requirement.id,
    family: 'SYSTEM_OPERATION',
    authorityRef: 'reference-execution-architect',
    decidedBy: 'talos-reference-design',
    rationale: 'TEST_ONLY architecture decision to prove generic binding without asserting that the source specified a system implementation.',
    offeringCanonicalName: `REFERENCE_GENERIC_OPERATION_${index + 1}`,
    offeringLifecycleStatus: 'TEST_ONLY',
    implementationKind: 'INTERNAL_SERVICE',
    implementationRef: `reference-generic-operation:${requirement.id}`,
  }));
}

test('I5C-03 resolves every unresolved Quarry-02 work requirement only through explicit authority-backed design decisions', () => {
  const x = setup();
  try {
    const resolved = resolveGenericCapabilities(x.base, systemResolutions(x), AT);
    assert.equal(resolved.designRevision.supersedesCapabilityDesignRef, x.base.designRevision.id);
    assert.equal(resolved.designRevision.designState, 'READY_FOR_BINDING');
    assert.deepEqual(resolved.designRevision.unresolvedRequirementRefs, []);
    assert.equal(resolved.requirements.length, x.base.requirements.length);
    assert.equal(resolved.bindingRevisions.length, resolved.requirements.length);
    assert(resolved.bindingRevisions.every((binding) => binding.bindingState === 'READY_FOR_EXECUTION_DESIGN'));
    assert(resolved.bindingAssessments.every((assessment) => assessment.result === 'READY_FOR_EXECUTION_DESIGN'));
    assert(resolved.selectionDecisions.every((decision) => decision.selectionBasis === 'TECHNICAL_ARCHITECTURE_DECISION'));
    assert(resolved.selectionDecisions.every((decision) => decision.authorityRef === 'reference-execution-architect'));
    assert(resolved.offeringDefinitions.every((offering) => offering.lifecycleStatus === 'TEST_ONLY'));
    assert.equal(resolved.humanDesigns.length, 0);

    for (const requirement of resolved.requirements) {
      assert.equal(requirement.family, 'SYSTEM_OPERATION');
      assert.equal(requirement.requirementBasis, 'CONFIRMED_DESIGN');
      assert.equal(requirement.requirementState, 'REQUIRED');
      const familyFacet = resolved.facets.find((facet) => facet.capabilityRequirementId === requirement.id && facet.propertyPath === 'family');
      assert.equal(familyFacet?.designBasis, 'CONFIRMED_DESIGN');
      assert.equal(familyFacet?.authorityRef, 'reference-execution-architect');
    }

    const serialized = JSON.stringify(resolved);
    for (const forbidden of ['Gmail', 'N8N_WORKFLOW', 'TEMPORAL_ACTIVITY', 'CHILD_WORKFLOW']) {
      assert.equal(serialized.includes(forbidden), false, `resolution invented ${forbidden}`);
    }
  } finally {
    close(x);
  }
});

test('I5C-03 can produce complete generic human-interaction design only when participant/outcome decisions are explicit', () => {
  const x = setup();
  try {
    const specs = systemResolutions(x);
    const target = x.base.requirements[0];
    const worker = x.current.process.actors.find((actor) => actor.name === 'Worker');
    assert.ok(worker);
    specs[0] = {
      requirementRef: target.id,
      family: 'HUMAN_INTERACTION',
      operationIntent: 'PERFORM_MANUAL_ACTION',
      authorityRef: 'reference-execution-architect',
      decidedBy: 'talos-reference-design',
      rationale: 'TEST_ONLY explicit human execution design used to pressure-test the generic human contract.',
      offeringCanonicalName: 'REFERENCE_HUMAN_OPERATION',
      offeringLifecycleStatus: 'TEST_ONLY',
      implementationKind: 'HUMAN_SERVICE',
      implementationRef: 'reference-human-service',
      human: {
        interactionKind: 'MANUAL_ACTION',
        responsibilityKind: 'PERFORMER',
        roleRefs: [worker!.id],
        assignmentCardinality: 'EXACTLY_ONE',
        outcomes: [{ code: 'COMPLETED', businessMeaning: 'The explicitly assigned manual action completed.', terminal: true }],
      },
    };
    const resolved = resolveGenericCapabilities(x.base, specs, AT);
    const human = resolved.humanDesigns[0];
    assert.ok(human);
    assert.equal(human.designState, 'COMPLETE');
    assert.equal(resolved.participantRequirements[0].participantState, 'COMPLETE');
    assert.deepEqual(resolved.participantRequirements[0].roleRefs, [worker!.id]);
    assert.deepEqual(resolved.humanOutcomeContracts[0].unresolvedOutcomeRefs, []);
    assert.equal(resolved.humanOutcomes[0].outcomeCode, 'COMPLETED');
  } finally {
    close(x);
  }
});

test('I5C-03 rejects missing authority and incomplete human design instead of silently binding', () => {
  const x = setup();
  try {
    const missingAuthority = systemResolutions(x);
    missingAuthority[0] = { ...missingAuthority[0], authorityRef: '' };
    assert.throws(() => resolveGenericCapabilities(x.base, missingAuthority, AT), /authorityRef is required/);

    const humanWithoutDesign = systemResolutions(x);
    humanWithoutDesign[0] = { ...humanWithoutDesign[0], family: 'HUMAN_INTERACTION', implementationKind: 'HUMAN_SERVICE' };
    assert.throws(() => resolveGenericCapabilities(x.base, humanWithoutDesign, AT), /requires human design/);
  } finally {
    close(x);
  }
});

test('I5C-03 resolved ExecutionPlan pins bindings and creates CapabilityUseOccurrence, but Quarry-02 remains mapping-blocked by incomplete WAIT truth', () => {
  const x = setup();
  try {
    const resolved = resolveGenericCapabilities(x.base, systemResolutions(x), AT);
    const subprocess = x.current.process.nodes.find((node) => node.kind === 'SUBPROCESS');
    assert.ok(subprocess);
    const plan = designGenericResolvedExecutionPlan(
      x.current.process,
      x.current.validation.scope,
      x.current.validation.assessment,
      x.freeze,
      x.scopeFreeze,
      resolved,
      [{
        semanticSubjectRef: subprocess!.id,
        boundaryKind: 'INLINE_COORDINATION',
        authorityRef: 'reference-execution-architect',
        decidedBy: 'talos-reference-design',
        rationale: 'Keep the collapsed business subprocess as inline coordination; do not infer Child Workflow.',
      }],
      AT,
    );

    assert.deepEqual(new Set(plan.revision.capabilityBindingRevisionRefs), new Set(resolved.bindingRevisions.map((binding) => binding.id)));
    assert.equal(plan.capabilityUses.length, resolved.requirements.length);
    assert(plan.elements.filter((element) => element.kind === 'CAPABILITY_INVOCATION').length >= resolved.requirements.length);
    assert.equal(plan.revision.readiness, 'NEEDS_EXECUTION_DESIGN_DECISION');
    assert.equal(plan.assessment.readiness, 'NEEDS_EXECUTION_DESIGN_DECISION');

    const waitNode = x.current.process.nodes.find((node) => node.kind === 'WAIT');
    assert.ok(waitNode);
    const waitElement = plan.elements.find((element) => element.semanticSubjectRefs.includes(waitNode!.id));
    assert.equal(waitElement?.kind, 'WAIT_COORDINATION');
    assert.equal(waitElement?.designState, 'INCOMPLETE');
    const waitRequirement = plan.requirements.find((requirement) => requirement.targetRef === waitElement?.id);
    assert.match(waitRequirement?.description ?? '', /lacks complete structured resume semantics/i);

    const subprocessElement = plan.elements.find((element) => element.semanticSubjectRefs.includes(subprocess!.id));
    assert.equal(subprocessElement?.designState, 'COMPLETE');
    assert.equal(plan.coordinationResolutions[0].resolutionKind, 'INLINE_COORDINATION');
    assert.equal(JSON.stringify(plan).includes('CHILD_WORKFLOW'), false);
  } finally {
    close(x);
  }
});

test('I5C-03 persistence keeps resolved capability/execution artifacts independently immutable and creates no Temporal/deployment/runtime artifacts', () => {
  const x = setup();
  try {
    const resolved = resolveGenericCapabilities(x.base, systemResolutions(x), AT);
    const subprocess = x.current.process.nodes.find((node) => node.kind === 'SUBPROCESS')!;
    const plan = designGenericResolvedExecutionPlan(
      x.current.process,
      x.current.validation.scope,
      x.current.validation.assessment,
      x.freeze,
      x.scopeFreeze,
      resolved,
      [{ semanticSubjectRef: subprocess.id, boundaryKind: 'INLINE_COORDINATION', authorityRef: 'reference-execution-architect', decidedBy: 'talos-reference-design', rationale: 'Explicit inline execution design.' }],
      AT,
    );
    persistGenericCapabilityResolution(x.repo, resolved);
    persistGenericResolvedExecutionPlan(x.repo, plan);
    assert.deepEqual(x.repo.get(resolved.designRevision.id)?.payload, resolved.designRevision);
    assert.deepEqual(x.repo.get(plan.revision.id)?.payload, plan.revision);
    assert.equal(x.repo.listByKind('CapabilityBindingRevision').length, resolved.bindingRevisions.length);
    assert.equal(x.repo.listByKind('CapabilityUseOccurrence').length, plan.capabilityUses.length);
    assert.equal(x.repo.listByKind('ExecutionCoordinationResolution').length, 1);
    for (const forbidden of ['TemporalMappingRevision', 'RuntimePolicyRevision', 'DeploymentRevision', 'WorkflowExecutionObservation']) {
      assert.equal(x.repo.listByKind(forbidden).length, 0, `${forbidden} must remain unopened in I5C-03`);
    }
  } finally {
    close(x);
  }
});
