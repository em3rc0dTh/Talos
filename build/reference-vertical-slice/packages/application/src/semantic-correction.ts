import { createOpaqueId } from '../../foundation/src/ids.ts';
import { deterministicJson } from '../../foundation/src/deterministic-json.ts';
import { digestDeterministicJson } from '../../foundation/src/digest.ts';
import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import type {
  BusinessRule,
  ProcessDefinition,
  ProcessEdge,
  ProcessEdgeKind,
  ProcessNode,
  ProcessNodeKind,
  ProcessRevision,
  SemanticClaim,
  ValidationBundle,
} from '../../semantic-core/src/types.ts';
import type { FindingDisposition } from '../../semantic-core/src/finding-disposition.ts';
import { validateProcessRevision } from '../../semantic-core/src/validation.ts';
import { persistValidationBundle } from './validation-persistence.ts';
import { generateExplanationDraft, type ExplanationBundle } from '../../review/src/explanation.ts';
import { createAcceptedReviewTransition, type ReviewContextBundle } from '../../review/src/workspace.ts';
import type {
  BaselineReconciliationAnalysis,
  BaselineTransitionCandidate,
  BaselineTransitionDecision,
  ReviewAuthoredSourceRevision,
  ReviewCommand,
  ReviewCommandApplication,
  ReviewConfirmationRecord,
  ReviewId,
  SemanticDiffEntry,
  SemanticDiffGuard,
} from '../../review/src/types.ts';

const CORRECTION_ENGINE_VERSION = 'semantic-review-correction-v0.1';

function append<T>(repo: ImmutableDocumentRepository, id: any, kind: string, payload: T, at: string): void {
  repo.append({ id, aggregateKind: kind, schemaVersion: 'review-v0.2-reference', payload, createdAt: at });
}

function persistExplanation(repo: ImmutableDocumentRepository, bundle: ExplanationBundle): void {
  const at = bundle.draft.generatedAt;
  for (const item of bundle.facets) append(repo, item.id, 'ExplanationEvidenceFacet', item, at);
  for (const item of bundle.propositions) append(repo, item.id, 'ExplanationProposition', item, at);
  for (const item of bundle.contentBlocks) append(repo, item.id, 'ExplanationContentBlock', item, at);
  append(repo, bundle.draft.id, 'ExplanationDraftSnapshot', bundle.draft, at);
}

function persistContext(repo: ImmutableDocumentRepository, context: ReviewContextBundle): void {
  const at = context.workspaceRevision.createdAt;
  if (!repo.get(context.reviewAuthoredSourceDefinition.id)) {
    append(repo, context.reviewAuthoredSourceDefinition.id, 'ReviewAuthoredSourceDefinition', context.reviewAuthoredSourceDefinition, context.reviewAuthoredSourceDefinition.createdAt);
  }
  append(repo, createOpaqueId('review', `workspace-definition-state:${context.workspaceDefinition.id}:${context.workspaceRevision.id}`), 'ReviewWorkspaceDefinitionState', context.workspaceDefinition, at);
  append(repo, context.workspaceRevision.id, 'ReviewWorkspaceRevision', context.workspaceRevision, at);
  for (const item of context.projectionRevision.projectionItemSnapshots) append(repo, item.id, 'ProjectionItemSnapshot', item, at);
  for (const item of context.projectionRevision.projectionBindingSnapshots) append(repo, item.id, 'ProjectionBinding', item, at);
  append(repo, context.projectionRevision.id, 'ReviewProjectionRevision', context.projectionRevision, at);
  append(repo, context.scopeBinding.id, 'ReviewScopeSurfaceBinding', context.scopeBinding, at);
  append(repo, context.baselineBundle.id, 'ReviewBaselineBundle', context.baselineBundle, at);
}

function persistTransition(
  repo: ImmutableDocumentRepository,
  analysis: BaselineReconciliationAnalysis,
  candidate: BaselineTransitionCandidate,
  decision: BaselineTransitionDecision,
  next: ReviewContextBundle,
): void {
  append(repo, analysis.id, 'BaselineReconciliationAnalysis', analysis, analysis.createdAt);
  append(repo, candidate.id, 'BaselineTransitionCandidate', candidate, candidate.detectedAt);
  append(repo, decision.id, 'BaselineTransitionDecision', decision, decision.decidedAt);
  persistContext(repo, next);
}

function currentProcessDefinition(repo: ImmutableDocumentRepository, processDefinitionId: string): ProcessDefinition {
  const states = repo.listByKind<ProcessDefinition>('ProcessDefinitionState').map((item) => item.payload)
    .filter((item) => item.id === processDefinitionId);
  const current = states.at(-1);
  if (!current) throw new TypeError(`ProcessDefinitionState missing for ${processDefinitionId}`);
  return current;
}

function applicationByClientKey(repo: ImmutableDocumentRepository, key: string | undefined) {
  if (!key) return undefined;
  const command = repo.listByKind<ReviewCommand>('ReviewCommand').map((item) => item.payload)
    .find((item) => item.clientRequestKey === key);
  if (!command) return undefined;
  const application = repo.listByKind<ReviewCommandApplication>('ReviewCommandApplication').map((item) => item.payload)
    .find((item) => item.reviewCommandId === command.id);
  return application ? { command, application } : undefined;
}

function rejected(
  repo: ImmutableDocumentRepository,
  command: ReviewCommand,
  at: string,
  suffix: string,
  result: ReviewCommandApplication['result'],
  diagnostic: string,
): SemanticCorrectionResult {
  const application: ReviewCommandApplication = {
    id: createOpaqueId('review', `review-app:${command.id}:${suffix}`),
    reviewCommandId: command.id,
    result,
    appliedAt: at,
    diagnosticRefs: [diagnostic],
  };
  append(repo, application.id, 'ReviewCommandApplication', application, at);
  return { application, authoredClaims: [], confirmations: [], findingDispositions: [], diffEntries: [] };
}

function correctionClaim(
  command: ReviewCommand,
  subjectRef: string,
  propertyPath: string,
  value: unknown,
  at: string,
  supersedes: SemanticClaim[] = [],
): SemanticClaim {
  return {
    id: createOpaqueId('provenance', `review-correction-claim:${command.id}:${subjectRef}:${propertyPath}`),
    subjectRef,
    propertyPath,
    value,
    perspective: 'BUSINESS_INTENT',
    truthClass: 'CONFIRMED',
    evidenceFragmentRefs: [],
    provenanceLinkRefs: [],
    assertedBy: command.requestedBy,
    createdAt: at,
    interpretationMethod: 'HUMAN_REVIEW_CORRECTION',
    interpreterVersion: CORRECTION_ENGINE_VERSION,
    ...(supersedes.length ? { supersedesClaimRefs: supersedes.map((claim) => claim.id) } : {}),
  };
}

function replaceActiveClaimSet(current: SemanticClaim[], authored: SemanticClaim[]): SemanticClaim[] {
  const replaced = new Set(authored.flatMap((claim) => claim.supersedesClaimRefs ?? []).map(String));
  return [...current.filter((claim) => !replaced.has(String(claim.id))), ...authored];
}

function semanticallyEqual(a: unknown, b: unknown): boolean {
  return deterministicJson(a) === deterministicJson(b);
}

function correctionDifferences(before: ProcessRevision, after: ProcessRevision): SemanticDiffEntry[] {
  const out: SemanticDiffEntry[] = [];
  const compare = <T extends { id: string }>(kind: string, beforeItems: T[], afterItems: T[]) => {
    const beforeMap = new Map(beforeItems.map((item) => [item.id, item]));
    const afterMap = new Map(afterItems.map((item) => [item.id, item]));
    for (const [id, item] of beforeMap) {
      const next = afterMap.get(id);
      if (!next) out.push({ kind: 'REMOVED', subjectRef: id, propertyPath: kind, before: item });
      else if (!semanticallyEqual(item, next)) out.push({ kind: 'CHANGED', subjectRef: id, propertyPath: kind, before: item, after: next });
    }
    for (const [id, item] of afterMap) {
      if (!beforeMap.has(id)) out.push({ kind: 'ADDED', subjectRef: id, propertyPath: kind, after: item });
    }
  };
  compare('node', before.nodes, after.nodes);
  compare('edge', before.edges, after.edges);
  compare('rule', before.rules, after.rules);
  compare('actor', before.actors, after.actors);
  compare('dataObject', before.dataObjects, after.dataObjects);
  return out;
}

function expectedDifference(command: ReviewCommand, entry: SemanticDiffEntry, supportingRefs: Set<string>): boolean {
  const target = new Set(command.targetSubjectRefs);
  if (command.actionKind === 'CORRECT_PROPERTY') {
    if (command.targetPropertyPath === 'details.subprocessMode') {
      return entry.kind === 'CHANGED' && entry.propertyPath === 'node' && target.has(entry.subjectRef);
    }
    if (command.targetPropertyPath === 'conditionRuleRef') {
      return (entry.kind === 'CHANGED' && entry.propertyPath === 'edge' && target.has(entry.subjectRef))
        || (entry.kind === 'ADDED' && entry.propertyPath === 'rule' && supportingRefs.has(entry.subjectRef));
    }
  }
  if (command.actionKind === 'ADD_PROCESS_ELEMENT') {
    return (entry.kind === 'ADDED' && entry.propertyPath === 'node' && supportingRefs.has(entry.subjectRef))
      || (entry.kind === 'ADDED' && entry.propertyPath === 'edge' && supportingRefs.has(entry.subjectRef));
  }
  if (command.actionKind === 'ADD_RELATIONSHIP') {
    return entry.kind === 'ADDED' && entry.propertyPath === 'edge' && supportingRefs.has(entry.subjectRef);
  }
  return false;
}

function persistDiffGuard(
  repo: ImmutableDocumentRepository,
  command: ReviewCommand,
  before: ProcessRevision,
  after: ProcessRevision,
  supportingRefs: Set<string>,
  at: string,
): { guard: SemanticDiffGuard; entries: SemanticDiffEntry[] } {
  const entries = correctionDifferences(before, after);
  const refs = entries.map((entry, index) => createOpaqueId('review', `semantic-correction-diff:${command.id}:${index}:${entry.subjectRef}:${entry.propertyPath ?? '$'}`));
  const unexpected = entries
    .map((entry, index) => expectedDifference(command, entry, supportingRefs) ? undefined : refs[index])
    .filter(Boolean) as ReviewId[];
  const guard: SemanticDiffGuard = {
    id: createOpaqueId('review', `semantic-correction-guard:${command.id}:${after.id}`),
    reviewCommandRef: command.id,
    fromProcessRevisionRef: before.id,
    candidateProcessRevisionRef: after.id,
    expectedChangeRefs: [...command.targetSubjectRefs, ...supportingRefs],
    semanticDifferenceRefs: refs,
    result: unexpected.length ? 'OUTSIDE_INTENT' : 'WITHIN_INTENT',
    unexpectedDifferenceRefs: unexpected,
    evaluatedAt: at,
  };
  for (let index = 0; index < entries.length; index += 1) append(repo, refs[index], 'SemanticDiffEntry', entries[index], at);
  append(repo, guard.id, 'SemanticDiffGuard', guard, at);
  return { guard, entries };
}

function nodeKind(value: unknown): ProcessNodeKind | undefined {
  return typeof value === 'string' && ['EVENT','ACTION','DECISION','PARALLEL_SPLIT','JOIN','WAIT','HUMAN_INTERACTION','SUBPROCESS','STATE','END'].includes(value)
    ? value as ProcessNodeKind
    : undefined;
}

function edgeKind(value: unknown): ProcessEdgeKind | undefined {
  return typeof value === 'string' && ['SEQUENCE','CONDITIONAL','DEFAULT','PARALLEL','MESSAGE','ERROR','TIMEOUT','COMPENSATION','REPEAT','CANCEL','ESCALATION','TOKEN_FLOW','SOURCE_DEFINED'].includes(value)
    ? value as ProcessEdgeKind
    : undefined;
}

interface CorrectionMutation {
  nodes: ProcessNode[];
  edges: ProcessEdge[];
  rules: BusinessRule[];
  authoredClaims: SemanticClaim[];
  confirmationDrafts: { subjectRef: string; propertyPath: string; value: unknown }[];
  supportingRefs: Set<string>;
}

function applyCorrectionMutation(current: ProcessRevision, command: ReviewCommand, at: string): CorrectionMutation | undefined {
  const nodes = current.nodes.map((item) => ({ ...item, details: item.details ? { ...item.details } : undefined }));
  const edges = current.edges.map((item) => ({ ...item }));
  const rules = current.rules.map((item) => ({ ...item }));
  const authoredClaims: SemanticClaim[] = [];
  const confirmationDrafts: CorrectionMutation['confirmationDrafts'] = [];
  const supportingRefs = new Set<string>();
  const previousClaims = (subjectRef: string, propertyPath: string) => current.semanticClaims.filter((claim) => claim.subjectRef === subjectRef && claim.propertyPath === propertyPath);

  if (command.actionKind === 'CORRECT_PROPERTY' && command.targetPropertyPath === 'details.subprocessMode') {
    if (command.targetSubjectRefs.length !== 1 || typeof command.proposedValue !== 'string' || !command.proposedValue.trim()) return undefined;
    const node = nodes.find((item) => item.id === command.targetSubjectRefs[0]);
    if (!node || node.kind !== 'SUBPROCESS') return undefined;
    const value = command.proposedValue.trim();
    node.details = { ...(node.details ?? {}), subprocessMode: value };
    node.truthClass = 'CONFIRMED';
    authoredClaims.push(correctionClaim(command, node.id, 'details.subprocessMode', value, at, previousClaims(node.id, 'details.subprocessMode')));
    confirmationDrafts.push({ subjectRef: node.id, propertyPath: 'details.subprocessMode', value });
    return { nodes, edges, rules, authoredClaims, confirmationDrafts, supportingRefs };
  }

  if (command.actionKind === 'CORRECT_PROPERTY' && command.targetPropertyPath === 'conditionRuleRef') {
    if (command.targetSubjectRefs.length !== 1 || !command.proposedValue || typeof command.proposedValue !== 'object') return undefined;
    const edge = edges.find((item) => item.id === command.targetSubjectRefs[0]);
    if (!edge || edge.kind !== 'CONDITIONAL') return undefined;
    const proposal = command.proposedValue as Record<string, unknown>;
    const naturalLanguage = typeof proposal.naturalLanguage === 'string' ? proposal.naturalLanguage.trim() : '';
    if (!naturalLanguage || !proposal.expression || typeof proposal.expression !== 'object' || Array.isArray(proposal.expression)) return undefined;
    const ruleId = createOpaqueId('canonical', `review-business-rule:${current.id}:${command.id}:${edge.id}`);
    const rule: BusinessRule = {
      id: ruleId,
      naturalLanguage,
      expression: proposal.expression,
      inputs: [],
      truthClass: 'CONFIRMED',
      unresolvedTerms: [],
      provenanceRefs: [],
    };
    rules.push(rule);
    edge.conditionRuleRef = rule.id;
    edge.truthClass = 'CONFIRMED';
    authoredClaims.push(
      correctionClaim(command, edge.id, 'conditionRuleRef', rule.id, at, previousClaims(edge.id, 'conditionRuleRef')),
      correctionClaim(command, rule.id, 'naturalLanguage', naturalLanguage, at),
      correctionClaim(command, rule.id, 'expression', proposal.expression, at),
    );
    confirmationDrafts.push(
      { subjectRef: edge.id, propertyPath: 'conditionRuleRef', value: rule.id },
      { subjectRef: rule.id, propertyPath: 'naturalLanguage', value: naturalLanguage },
      { subjectRef: rule.id, propertyPath: 'expression', value: proposal.expression },
    );
    supportingRefs.add(rule.id);
    return { nodes, edges, rules, authoredClaims, confirmationDrafts, supportingRefs };
  }

  if (command.actionKind === 'ADD_PROCESS_ELEMENT') {
    if (!command.proposedValue || typeof command.proposedValue !== 'object') return undefined;
    const proposal = command.proposedValue as Record<string, unknown>;
    const kind = nodeKind(proposal.kind);
    const name = typeof proposal.name === 'string' ? proposal.name.trim() : '';
    if (!kind || !name) return undefined;
    const newNodeId = createOpaqueId('canonical', `review-added-node:${current.id}:${command.id}`);
    const node: ProcessNode = {
      id: newNodeId,
      kind,
      name,
      actorRefs: [],
      inputRefs: [],
      outputRefs: [],
      ruleRefs: [],
      ...(proposal.details && typeof proposal.details === 'object' && !Array.isArray(proposal.details) ? { details: proposal.details as Record<string, unknown> } : {}),
      truthClass: 'CONFIRMED',
      provenanceRefs: [],
      sourceExtensionRefs: [],
    };
    nodes.push(node);
    supportingRefs.add(node.id);
    authoredClaims.push(
      correctionClaim(command, node.id, 'kind', kind, at),
      correctionClaim(command, node.id, 'name', name, at),
    );
    confirmationDrafts.push(
      { subjectRef: node.id, propertyPath: 'kind', value: kind },
      { subjectRef: node.id, propertyPath: 'name', value: name },
    );

    const afterSubjectRef = typeof proposal.afterSubjectRef === 'string' ? proposal.afterSubjectRef : undefined;
    if (kind === 'END' && !afterSubjectRef) return undefined;
    if (afterSubjectRef) {
      if (!nodes.some((item) => item.id === afterSubjectRef && item.id !== node.id)) return undefined;
      const relationshipKind = edgeKind(proposal.relationshipKind ?? 'SEQUENCE');
      if (!relationshipKind) return undefined;
      const edgeId = createOpaqueId('canonical', `review-added-edge:${current.id}:${command.id}:${afterSubjectRef}:${node.id}`);
      const edge: ProcessEdge = {
        id: edgeId,
        sourceNodeId: afterSubjectRef as any,
        targetNodeId: node.id,
        kind: relationshipKind,
        truthClass: 'CONFIRMED',
        provenanceRefs: [],
        sourceExtensionRefs: [],
      };
      edges.push(edge);
      supportingRefs.add(edge.id);
      authoredClaims.push(correctionClaim(command, edge.id, 'kind', relationshipKind, at));
      confirmationDrafts.push({ subjectRef: edge.id, propertyPath: 'kind', value: relationshipKind });
    }
    return { nodes, edges, rules, authoredClaims, confirmationDrafts, supportingRefs };
  }

  if (command.actionKind === 'ADD_RELATIONSHIP') {
    if (!command.proposedValue || typeof command.proposedValue !== 'object') return undefined;
    const proposal = command.proposedValue as Record<string, unknown>;
    const sourceNodeRef = typeof proposal.sourceNodeRef === 'string' ? proposal.sourceNodeRef : '';
    const targetNodeRef = typeof proposal.targetNodeRef === 'string' ? proposal.targetNodeRef : '';
    const kind = edgeKind(proposal.kind);
    if (!sourceNodeRef || !targetNodeRef || !kind) return undefined;
    if (!nodes.some((item) => item.id === sourceNodeRef) || !nodes.some((item) => item.id === targetNodeRef)) return undefined;
    if (sourceNodeRef === targetNodeRef || edges.some((item) => item.sourceNodeId === sourceNodeRef && item.targetNodeId === targetNodeRef && item.kind === kind)) return undefined;
    if (kind === 'CONDITIONAL' && typeof proposal.conditionRuleRef !== 'string') return undefined;
    if (typeof proposal.conditionRuleRef === 'string' && !rules.some((rule) => rule.id === proposal.conditionRuleRef)) return undefined;
    const edgeId = createOpaqueId('canonical', `review-added-relationship:${current.id}:${command.id}:${sourceNodeRef}:${targetNodeRef}:${kind}`);
    const edge: ProcessEdge = {
      id: edgeId,
      sourceNodeId: sourceNodeRef as any,
      targetNodeId: targetNodeRef as any,
      kind,
      ...(typeof proposal.conditionRuleRef === 'string' ? { conditionRuleRef: proposal.conditionRuleRef as any } : {}),
      ...(typeof proposal.label === 'string' && proposal.label.trim() ? { label: proposal.label.trim() } : {}),
      truthClass: 'CONFIRMED',
      provenanceRefs: [],
      sourceExtensionRefs: [],
    };
    edges.push(edge);
    supportingRefs.add(edge.id);
    authoredClaims.push(correctionClaim(command, edge.id, 'kind', kind, at));
    confirmationDrafts.push({ subjectRef: edge.id, propertyPath: 'kind', value: kind });
    return { nodes, edges, rules, authoredClaims, confirmationDrafts, supportingRefs };
  }

  return undefined;
}

function persistCandidate(
  repo: ImmutableDocumentRepository,
  current: ProcessRevision,
  command: ReviewCommand,
  mutation: CorrectionMutation,
  at: string,
): ProcessRevision {
  const activeClaims = replaceActiveClaimSet(current.semanticClaims, mutation.authoredClaims);
  const candidate: ProcessRevision = {
    ...current,
    id: createOpaqueId('canonical', `review-semantic-correction:${current.id}:${command.id}`),
    revision: current.revision + 1,
    createdAt: at,
    parentRevisionIds: [current.id],
    derivationKind: 'HUMAN_CONFIRMATION',
    nodes: mutation.nodes,
    edges: mutation.edges,
    rules: mutation.rules,
    semanticClaims: activeClaims,
    semanticStatus: 'NORMALIZED',
    executionReadiness: 'NOT_ASSESSED',
    validationFindingRefs: [],
  };
  const definition = currentProcessDefinition(repo, current.processDefinitionId);
  const nextDefinition: ProcessDefinition = { ...definition, revisionIds: [...definition.revisionIds, candidate.id] };
  repo.append({ id: candidate.id, aggregateKind: 'ProcessRevision', schemaVersion: 'canonical-v0.1-reference', payload: candidate, createdAt: at });
  repo.append({
    id: createOpaqueId('canonical', `process-definition-state:${nextDefinition.id}:${candidate.id}`),
    aggregateKind: 'ProcessDefinitionState',
    schemaVersion: 'canonical-v0.1-reference',
    payload: nextDefinition,
    createdAt: at,
  });
  for (const claim of mutation.authoredClaims) {
    repo.append({ id: claim.id, aggregateKind: 'SemanticClaim', schemaVersion: 'provenance-v0.3-reference', payload: claim, createdAt: at });
  }
  return candidate;
}

function resolvedFindingDispositions(
  repo: ImmutableDocumentRepository,
  currentValidation: ValidationBundle,
  candidateValidation: ValidationBundle,
  candidate: ProcessRevision,
  command: ReviewCommand,
  authoredClaims: SemanticClaim[],
  at: string,
): FindingDisposition[] {
  const out: FindingDisposition[] = [];
  for (const finding of currentValidation.findings) {
    const remains = candidateValidation.findings.some((item) => item.code === finding.code && semanticallyEqual([...item.targetRefs].sort(), [...finding.targetRefs].sort()));
    if (remains) continue;
    const disposition: FindingDisposition = {
      id: createOpaqueId('validation', `finding-disposition:${finding.id}:${candidate.id}`),
      findingId: finding.id,
      disposition: 'RESOLVED_BY_NEW_REVISION',
      rationale: `Explicit reviewer-authored ${command.actionKind} changed the semantic baseline and the superseding validation no longer emits this finding.`,
      authorityRef: command.authorityRef,
      recordedBy: command.requestedBy,
      recordedAt: at,
      resultingClaimRefs: authoredClaims.map((claim) => claim.id),
      resultingProcessRevisionRef: candidate.id,
      resultingAssessmentRef: candidateValidation.assessment.id,
    };
    append(repo, disposition.id, 'FindingDisposition', disposition, at);
    out.push(disposition);
  }
  return out;
}

export interface SemanticCorrectionResult {
  application: ReviewCommandApplication;
  candidateProcessRevision?: ProcessRevision;
  candidateValidation?: ValidationBundle;
  nextContext?: ReviewContextBundle;
  explanation?: ExplanationBundle;
  authoredRevision?: ReviewAuthoredSourceRevision;
  authoredClaims: SemanticClaim[];
  confirmations: ReviewConfirmationRecord[];
  findingDispositions: FindingDisposition[];
  diffGuard?: SemanticDiffGuard;
  diffEntries: SemanticDiffEntry[];
}

export function applySemanticCorrection(
  repo: ImmutableDocumentRepository,
  currentContext: ReviewContextBundle,
  currentProcess: ProcessRevision,
  currentValidation: ValidationBundle,
  command: ReviewCommand,
): SemanticCorrectionResult {
  const at = command.requestedAt;
  const replay = applicationByClientKey(repo, command.clientRequestKey);
  if (replay) {
    if (replay.command.id !== command.id) throw new TypeError('clientRequestKey already used by a different review command');
    return { application: { ...replay.application, result: 'IDEMPOTENT_REPLAY' }, authoredClaims: [], confirmations: [], findingDispositions: [], diffEntries: [] };
  }
  append(repo, command.id, 'ReviewCommand', command, at);

  if (command.expectedReviewWorkspaceRevisionId !== currentContext.workspaceRevision.id
    || command.expectedReviewBaselineBundleId !== currentContext.baselineBundle.id) {
    return rejected(repo, command, at, 'stale', 'REJECTED_STALE', 'STALE_REVIEW_BASELINE');
  }
  if (!command.authorityRef) {
    return rejected(repo, command, at, 'authority', 'REJECTED_AUTHORITY', 'SEMANTIC_CORRECTION_REQUIRES_AUTHORITY');
  }
  if (!['CORRECT_PROPERTY','ADD_PROCESS_ELEMENT','ADD_RELATIONSHIP'].includes(command.actionKind)) {
    return rejected(repo, command, at, 'unsupported-action', 'REJECTED_INVALID', 'I5A02_ACTION_NOT_SUPPORTED');
  }
  if (!command.targetSemanticScopeRefs.includes(currentValidation.assessment.primaryScopeRef)) {
    return rejected(repo, command, at, 'scope', 'REJECTED_INVALID', 'CORRECTION_TARGET_SCOPE_MUST_MATCH_CURRENT_REVIEW_SCOPE');
  }

  const mutation = applyCorrectionMutation(currentProcess, command, at);
  if (!mutation) return rejected(repo, command, at, 'shape', 'REJECTED_INVALID', 'SEMANTIC_CORRECTION_SHAPE_OR_TARGET_INVALID');

  const candidate = persistCandidate(repo, currentProcess, command, mutation, at);
  const diff = persistDiffGuard(repo, command, currentProcess, candidate, mutation.supportingRefs, at);
  if (diff.guard.result !== 'WITHIN_INTENT') {
    const application: ReviewCommandApplication = {
      id: createOpaqueId('review', `review-app:${command.id}:collateral`),
      reviewCommandId: command.id,
      result: 'REJECTED_COLLATERAL_DIFF',
      appliedAt: at,
      candidateProcessRevisionRef: candidate.id,
      semanticDiffGuardRef: diff.guard.id,
      diagnosticRefs: ['SEMANTIC_DIFF_OUTSIDE_REVIEWER_INTENT'],
    };
    append(repo, application.id, 'ReviewCommandApplication', application, at);
    return { application, candidateProcessRevision: candidate, authoredClaims: mutation.authoredClaims, confirmations: [], findingDispositions: [], diffGuard: diff.guard, diffEntries: diff.entries };
  }

  const authoredRevisionId = createOpaqueId('review', `semantic-correction:${currentContext.reviewAuthoredSourceDefinition.id}:${command.id}`);
  const confirmations = mutation.confirmationDrafts.map((draft, index): ReviewConfirmationRecord => ({
    id: createOpaqueId('review', `correction-confirmation:${command.id}:${index}:${draft.subjectRef}:${draft.propertyPath}`),
    reviewAuthoredSourceRevisionRef: authoredRevisionId,
    reviewCommandRef: command.id,
    subjectRef: draft.subjectRef,
    propertyPath: draft.propertyPath,
    confirmedValue: draft.value,
    authorityRef: command.authorityRef,
    confirmedBy: command.requestedBy,
    confirmedAt: at,
  }));
  const authoredRevision: ReviewAuthoredSourceRevision = {
    id: authoredRevisionId,
    reviewAuthoredSourceDefinitionId: currentContext.reviewAuthoredSourceDefinition.id,
    ...(currentContext.workspaceRevision.activeReviewAuthoredSourceRevisionId ? { parentRevisionId: currentContext.workspaceRevision.activeReviewAuthoredSourceRevisionId } : {}),
    reviewCommandRef: command.id,
    claimRefs: mutation.authoredClaims.map((claim) => claim.id),
    confirmationRefs: confirmations.map((record) => record.id),
    createdAt: at,
    createdBy: command.requestedBy,
    semanticDigest: digestDeterministicJson({
      command: command.id,
      parentProcessRevision: currentProcess.id,
      actionKind: command.actionKind,
      targetSubjectRefs: command.targetSubjectRefs,
      targetPropertyPath: command.targetPropertyPath,
      proposedValue: command.proposedValue,
      authoredClaims: mutation.authoredClaims.map((claim) => claim.id),
    }),
  };
  append(repo, authoredRevision.id, 'ReviewAuthoredSourceRevision', authoredRevision, at);
  for (const confirmation of confirmations) append(repo, confirmation.id, 'ReviewConfirmationRecord', confirmation, at);

  const candidateValidation = validateProcessRevision(candidate, 'AUTOMATION_DESIGN_READINESS', {
    assessedAt: at,
    supersedesAssessmentId: currentValidation.assessment.id,
  });
  persistValidationBundle(repo, candidateValidation);

  const explanation = generateExplanationDraft(candidate, candidateValidation, {
    generatedAt: at,
    sourceRepresentationRefs: currentContext.workspaceDefinition.sourceRepresentationIds,
    confirmations,
  });
  persistExplanation(repo, explanation);

  const transition = createAcceptedReviewTransition(
    currentContext,
    candidate,
    candidateValidation,
    explanation,
    authoredRevision.id,
    command.id,
    diff.guard.semanticDifferenceRefs,
    at,
    command.requestedBy,
  );
  persistTransition(repo, transition.reconciliationAnalysis, transition.transitionCandidate, transition.transitionDecision, transition.next);

  const findingDispositions = resolvedFindingDispositions(repo, currentValidation, candidateValidation, candidate, command, mutation.authoredClaims, at);
  const application: ReviewCommandApplication = {
    id: createOpaqueId('review', `review-app:${command.id}:applied`),
    reviewCommandId: command.id,
    result: 'APPLIED',
    appliedAt: at,
    reviewAuthoredSourceRevisionRef: authoredRevision.id,
    candidateProcessRevisionRef: candidate.id,
    candidateValidationAssessmentRef: candidateValidation.assessment.id,
    semanticDiffGuardRef: diff.guard.id,
    baselineTransitionCandidateRef: transition.transitionCandidate.id,
    baselineTransitionDecisionRef: transition.transitionDecision.id,
    resultingWorkspaceRevisionRef: transition.next.workspaceRevision.id,
    diagnosticRefs: [],
  };
  append(repo, application.id, 'ReviewCommandApplication', application, at);

  return {
    application,
    candidateProcessRevision: candidate,
    candidateValidation,
    nextContext: transition.next,
    explanation,
    authoredRevision,
    authoredClaims: mutation.authoredClaims,
    confirmations,
    findingDispositions,
    diffGuard: diff.guard,
    diffEntries: diff.entries,
  };
}
