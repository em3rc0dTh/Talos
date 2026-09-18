import { createOpaqueId } from '../../foundation/src/ids.ts';
import { validateProcessRevision } from '../../semantic-core/src/validation.ts';
import type {
  BusinessRule,
  CanonicalId,
  ClarificationQuestion,
  ProcessRevision,
  SemanticClaim,
  ValidationBundle,
  ValidationFinding,
} from '../../semantic-core/src/types.ts';

export const GUIDED_SEMANTIC_RESOLUTION_VERSION = 'talos-guided-semantic-resolution-v0.1';

export type SubprocessBoundaryMeaning =
  | 'EMBEDDED'
  | 'CALL_ACTIVITY'
  | 'EXTERNAL_ORCHESTRATION'
  | 'HUMAN_MANAGED';

export type GuidedWaitKind =
  | 'DURATION'
  | 'SCHEDULE'
  | 'DEADLINE'
  | 'MESSAGE'
  | 'EXTERNAL_EVENT'
  | 'HUMAN_RESPONSE'
  | 'CONDITION';

export type GuidedResolutionAnswer =
  | {
      kind: 'BRANCH_CONDITION';
      questionRef: string;
      findingRef: string;
      targetRef: string;
      condition: string;
    }
  | {
      kind: 'SUBPROCESS_BOUNDARY';
      questionRef: string;
      findingRef: string;
      targetRef: string;
      boundaryMeaning: SubprocessBoundaryMeaning;
      completionMeaning: string;
    }
  | {
      kind: 'WAIT_SEMANTICS';
      questionRef: string;
      findingRef: string;
      targetRef: string;
      waitKind: GuidedWaitKind;
      expression?: string;
      timezone?: string;
      resumeSemantics?: string;
    };

export interface GuidedResolutionAuthority {
  answeredBy: string;
  authorityRef: string;
  rationale: string;
  answeredAt: string;
}

export interface GuidedResolutionProposal {
  id: string;
  version: typeof GUIDED_SEMANTIC_RESOLUTION_VERSION;
  processRevisionRef: CanonicalId;
  validationAssessmentRef: string;
  answers: GuidedResolutionAnswer[];
  authority: GuidedResolutionAuthority;
  status: 'PROPOSED';
  createsCanonicalRevision: false;
  confirmsProcess: false;
  authorizesAutomationDesign: false;
  authorizesExecution: false;
}

export type GuidedResolutionDecision =
  | {
      decision: 'REJECT';
      proposalRef: string;
      decidedBy: string;
      authorityRef: string;
      rationale: string;
      decidedAt: string;
      createsCanonicalRevision: false;
      authorizesAutomationDesign: false;
      authorizesExecution: false;
    }
  | {
      decision: 'ACCEPT';
      proposalRef: string;
      decidedBy: string;
      authorityRef: string;
      rationale: string;
      decidedAt: string;
      createsCanonicalRevision: true;
      resolvedRevision: ProcessRevision;
      validation: ValidationBundle;
      requiresProcessReconfirmation: true;
      authorizesAutomationDesign: false;
      authorizesExecution: false;
    };

function required(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new TypeError(`${field} must be non-empty`);
  return normalized;
}

function findingById(validation: ValidationBundle): Map<string, ValidationFinding> {
  return new Map(validation.findings.map((finding) => [finding.id, finding]));
}

function questionById(validation: ValidationBundle): Map<string, ClarificationQuestion> {
  return new Map(validation.questions.map((question) => [question.id, question]));
}

function validateAnswer(
  answer: GuidedResolutionAnswer,
  validation: ValidationBundle,
  findings: Map<string, ValidationFinding>,
  questions: Map<string, ClarificationQuestion>,
): void {
  const finding = findings.get(answer.findingRef);
  if (!finding) throw new TypeError('GUIDED_RESOLUTION_FINDING_NOT_IN_ASSESSMENT');
  const question = questions.get(answer.questionRef);
  if (!question || !question.findingRefs.includes(finding.id)) {
    throw new TypeError('GUIDED_RESOLUTION_QUESTION_FINDING_MISMATCH');
  }
  if (!finding.targetRefs.includes(answer.targetRef) || question.targetRef !== answer.targetRef) {
    throw new TypeError('GUIDED_RESOLUTION_TARGET_MISMATCH');
  }
  if (finding.assessmentId !== validation.assessment.id || question.assessmentId !== validation.assessment.id) {
    throw new TypeError('GUIDED_RESOLUTION_ASSESSMENT_MISMATCH');
  }
  if (answer.kind === 'BRANCH_CONDITION') {
    if (finding.code !== 'SV-CFL-001') throw new TypeError('GUIDED_RESOLUTION_KIND_MISMATCH');
    required(answer.condition, 'condition');
    return;
  }
  if (answer.kind === 'SUBPROCESS_BOUNDARY') {
    if (finding.code !== 'SV-SUB-002') throw new TypeError('GUIDED_RESOLUTION_KIND_MISMATCH');
    required(answer.completionMeaning, 'completionMeaning');
    return;
  }
  if (!['SV-EVT-001', 'SV-EVT-002', 'SV-EVT-003'].includes(finding.code)) {
    throw new TypeError('GUIDED_RESOLUTION_KIND_MISMATCH');
  }
  if (answer.waitKind === 'DURATION') {
    required(answer.expression ?? '', 'expression');
    return;
  }
  if (answer.waitKind === 'SCHEDULE' || answer.waitKind === 'DEADLINE') {
    required(answer.expression ?? '', 'expression');
    required(answer.timezone ?? '', 'timezone');
    return;
  }
  required(answer.resumeSemantics ?? '', 'resumeSemantics');
}

export function proposeGuidedSemanticResolution(input: {
  processRevision: ProcessRevision;
  validation: ValidationBundle;
  answers: GuidedResolutionAnswer[];
  authority: GuidedResolutionAuthority;
}): GuidedResolutionProposal {
  if (input.validation.assessment.processRevisionId !== input.processRevision.id) {
    throw new TypeError('GUIDED_RESOLUTION_REVISION_ASSESSMENT_MISMATCH');
  }
  required(input.authority.answeredBy, 'answeredBy');
  required(input.authority.authorityRef, 'authorityRef');
  required(input.authority.rationale, 'rationale');
  if (!input.answers.length) throw new TypeError('GUIDED_RESOLUTION_ANSWERS_REQUIRED');

  const findings = findingById(input.validation);
  const questions = questionById(input.validation);
  const seen = new Set<string>();
  for (const answer of input.answers) {
    validateAnswer(answer, input.validation, findings, questions);
    if (seen.has(answer.findingRef)) throw new TypeError('GUIDED_RESOLUTION_DUPLICATE_FINDING_ANSWER');
    seen.add(answer.findingRef);
  }

  return Object.freeze({
    id: createOpaqueId('review', `guided-resolution:${input.processRevision.id}:${input.validation.assessment.id}:${input.authority.answeredAt}`),
    version: GUIDED_SEMANTIC_RESOLUTION_VERSION,
    processRevisionRef: input.processRevision.id,
    validationAssessmentRef: input.validation.assessment.id,
    answers: input.answers.map((answer) => Object.freeze({ ...answer })),
    authority: Object.freeze({ ...input.authority }),
    status: 'PROPOSED',
    createsCanonicalRevision: false,
    confirmsProcess: false,
    authorizesAutomationDesign: false,
    authorizesExecution: false,
  });
}

function confirmedClaim(input: {
  revisionId: CanonicalId;
  answer: GuidedResolutionAnswer;
  authority: GuidedResolutionAuthority;
  propertyPath: string;
  value: unknown;
}): SemanticClaim {
  return {
    id: createOpaqueId('provenance', `guided-resolution-claim:${input.revisionId}:${input.answer.findingRef}:${input.propertyPath}`),
    subjectRef: input.answer.targetRef,
    propertyPath: input.propertyPath,
    value: input.value,
    perspective: 'BUSINESS_INTENT',
    truthClass: 'CONFIRMED',
    evidenceFragmentRefs: [],
    provenanceLinkRefs: [],
    assertedBy: input.authority.answeredBy,
    createdAt: input.authority.answeredAt,
    interpretationMethod: 'GUIDED_USER_RESOLUTION',
    interpreterVersion: GUIDED_SEMANTIC_RESOLUTION_VERSION,
  };
}

export function decideGuidedSemanticResolution(input: {
  proposal: GuidedResolutionProposal;
  processRevision: ProcessRevision;
  validation: ValidationBundle;
  decision: 'ACCEPT' | 'REJECT';
  decidedBy: string;
  authorityRef: string;
  rationale: string;
  decidedAt: string;
}): GuidedResolutionDecision {
  required(input.decidedBy, 'decidedBy');
  required(input.authorityRef, 'authorityRef');
  required(input.rationale, 'rationale');
  if (input.proposal.processRevisionRef !== input.processRevision.id) {
    throw new TypeError('GUIDED_RESOLUTION_PROPOSAL_REVISION_MISMATCH');
  }
  if (input.proposal.validationAssessmentRef !== input.validation.assessment.id) {
    throw new TypeError('GUIDED_RESOLUTION_PROPOSAL_ASSESSMENT_MISMATCH');
  }
  if (input.decision === 'REJECT') {
    return {
      decision: 'REJECT',
      proposalRef: input.proposal.id,
      decidedBy: input.decidedBy,
      authorityRef: input.authorityRef,
      rationale: input.rationale,
      decidedAt: input.decidedAt,
      createsCanonicalRevision: false,
      authorizesAutomationDesign: false,
      authorizesExecution: false,
    };
  }

  const nextId = createOpaqueId('canonical', `guided-resolution:${input.processRevision.id}:${input.proposal.id}:${input.decidedAt}`);
  const nodes = input.processRevision.nodes.map((node) => ({
    ...node,
    actorRefs: [...node.actorRefs],
    inputRefs: [...node.inputRefs],
    outputRefs: [...node.outputRefs],
    ruleRefs: [...node.ruleRefs],
    details: node.details ? { ...node.details } : undefined,
    provenanceRefs: [...node.provenanceRefs],
    sourceExtensionRefs: [...node.sourceExtensionRefs],
  }));
  const edges = input.processRevision.edges.map((edge) => ({
    ...edge,
    provenanceRefs: [...edge.provenanceRefs],
    sourceExtensionRefs: [...edge.sourceExtensionRefs],
  }));
  const rules: BusinessRule[] = input.processRevision.rules.map((rule) => ({
    ...rule,
    inputs: [...rule.inputs],
    outputs: rule.outputs ? [...rule.outputs] : undefined,
    unresolvedTerms: [...rule.unresolvedTerms],
    provenanceRefs: [...rule.provenanceRefs],
  }));
  const claims: SemanticClaim[] = [...input.processRevision.semanticClaims];

  for (const answer of input.proposal.answers) {
    if (answer.kind === 'BRANCH_CONDITION') {
      const edge = edges.find((candidate) => candidate.id === answer.targetRef);
      if (!edge || edge.kind !== 'CONDITIONAL') throw new TypeError('GUIDED_RESOLUTION_BRANCH_TARGET_NOT_FOUND');
      const condition = required(answer.condition, 'condition');
      const ruleId = createOpaqueId('canonical', `guided-resolution-rule:${nextId}:${edge.id}`);
      rules.push({
        id: ruleId,
        naturalLanguage: condition,
        expression: { language: 'BUSINESS_NATURAL_LANGUAGE', body: condition },
        inputs: [],
        truthClass: 'CONFIRMED',
        unresolvedTerms: [],
        provenanceRefs: [],
      });
      edge.conditionRuleRef = ruleId;
      const sourceNode = nodes.find((node) => node.id === edge.sourceNodeId);
      if (sourceNode && !sourceNode.ruleRefs.includes(ruleId)) sourceNode.ruleRefs.push(ruleId);
      claims.push(confirmedClaim({
        revisionId: nextId,
        answer,
        authority: input.proposal.authority,
        propertyPath: 'conditionRule',
        value: { ruleRef: ruleId, naturalLanguage: condition },
      }));
    } else if (answer.kind === 'SUBPROCESS_BOUNDARY') {
      const node = nodes.find((candidate) => candidate.id === answer.targetRef);
      if (!node || node.kind !== 'SUBPROCESS') throw new TypeError('GUIDED_RESOLUTION_SUBPROCESS_TARGET_NOT_FOUND');
      node.details = {
        ...(node.details ?? {}),
        subprocessMode: answer.boundaryMeaning,
        completionMeaning: required(answer.completionMeaning, 'completionMeaning'),
      };
      claims.push(confirmedClaim({
        revisionId: nextId,
        answer,
        authority: input.proposal.authority,
        propertyPath: 'details.subprocessBoundary',
        value: {
          boundaryMeaning: answer.boundaryMeaning,
          completionMeaning: answer.completionMeaning,
        },
      }));
    } else {
      const node = nodes.find((candidate) => candidate.id === answer.targetRef);
      if (!node || node.kind !== 'WAIT') throw new TypeError('GUIDED_RESOLUTION_WAIT_TARGET_NOT_FOUND');
      const nextDetails: Record<string, unknown> = { ...(node.details ?? {}), waitKind: answer.waitKind };
      if (answer.expression?.trim()) nextDetails.expression = answer.expression.trim();
      if (answer.timezone?.trim()) nextDetails.timezone = answer.timezone.trim();
      if (answer.resumeSemantics?.trim()) nextDetails.resumeSemantics = answer.resumeSemantics.trim();
      node.details = nextDetails;
      claims.push(confirmedClaim({
        revisionId: nextId,
        answer,
        authority: input.proposal.authority,
        propertyPath: 'details.waitSemantics',
        value: {
          waitKind: answer.waitKind,
          ...(answer.expression?.trim() ? { expression: answer.expression.trim() } : {}),
          ...(answer.timezone?.trim() ? { timezone: answer.timezone.trim() } : {}),
          ...(answer.resumeSemantics?.trim() ? { resumeSemantics: answer.resumeSemantics.trim() } : {}),
        },
      }));
    }
  }

  const resolvedRevision: ProcessRevision = {
    ...input.processRevision,
    id: nextId,
    revision: input.processRevision.revision + 1,
    createdAt: input.decidedAt,
    parentRevisionIds: [input.processRevision.id],
    derivationKind: 'HUMAN_CONFIRMATION',
    nodes,
    edges,
    rules,
    semanticClaims: claims,
    semanticStatus: 'NORMALIZED',
    executionReadiness: 'NOT_ASSESSED',
    validationFindingRefs: [],
    annotations: [
      ...input.processRevision.annotations,
      {
        kind: 'GUIDED_SEMANTIC_RESOLUTION',
        version: GUIDED_SEMANTIC_RESOLUTION_VERSION,
        proposalRef: input.proposal.id,
        sourceAssessmentRef: input.validation.assessment.id,
        answeredBy: input.proposal.authority.answeredBy,
        answerAuthorityRef: input.proposal.authority.authorityRef,
        acceptedBy: input.decidedBy,
        acceptanceAuthorityRef: input.authorityRef,
      },
    ],
  };
  const validation = validateProcessRevision(resolvedRevision, 'AUTOMATION_DESIGN_READINESS', {
    assessedAt: input.decidedAt,
    supersedesAssessmentId: input.validation.assessment.id,
  });

  return {
    decision: 'ACCEPT',
    proposalRef: input.proposal.id,
    decidedBy: input.decidedBy,
    authorityRef: input.authorityRef,
    rationale: input.rationale,
    decidedAt: input.decidedAt,
    createsCanonicalRevision: true,
    resolvedRevision,
    validation,
    requiresProcessReconfirmation: true,
    authorizesAutomationDesign: false,
    authorizesExecution: false,
  };
}
