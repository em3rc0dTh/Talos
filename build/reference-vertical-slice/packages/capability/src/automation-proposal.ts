import { createOpaqueId } from '../../foundation/src/ids.ts';
import { digestDeterministicJson } from '../../foundation/src/digest.ts';
import type { ProcessNodeKind, ProcessRevision } from '../../semantic-core/src/types.ts';
import type { CapabilityDesignBundle } from './generic-design.ts';
import type { CapabilityFamily, CapabilityOfferingRevision } from './types.ts';

export const AUTOMATION_PROPOSAL_SCHEMA_VERSION = 'talos-automation-proposal-v0.1';
export const AUTOMATION_PROPOSAL_POLICY_VERSION = 'talos-automation-proposal-policy-v0.1';

export type AutomationProposalImplementationKind = CapabilityOfferingRevision['implementationKind'];
export type AutomationProposalStatus = 'COMPLETE' | 'PARTIAL';
export type AutomationProposalState = 'SUGGESTED';

export type AutomationOrchestrationTreatment =
  | 'WORKFLOW_EVENT'
  | 'DETERMINISTIC_BRANCH'
  | 'WORKFLOW_PARALLEL'
  | 'DURABLE_TIMER'
  | 'WORKFLOW_CONDITION'
  | 'INLINE_COORDINATION'
  | 'CHILD_WORKFLOW_CANDIDATE'
  | 'WORKFLOW_STATE'
  | 'TERMINAL';

export interface AutomationProposalHumanContract {
  interactionKind:
    | 'MANUAL_ACTION'
    | 'REVIEW'
    | 'APPROVAL'
    | 'DECISION'
    | 'DATA_ENTRY'
    | 'CORRECTION'
    | 'CHOICE'
    | 'ACKNOWLEDGEMENT'
    | 'SIGNATURE'
    | 'UPLOAD_PROVISION'
    | 'OBSERVATION';
  responsibilityKind:
    | 'PERFORMER'
    | 'APPROVER'
    | 'REVIEWER'
    | 'DECISION_AUTHORITY'
    | 'DATA_PROVIDER'
    | 'SIGNER'
    | 'OBSERVER';
  roleRefs: string[];
  outcomeCode: string;
  outcomeBusinessMeaning: string;
}

export interface AutomationProposalStep {
  capabilityRequirementRef: string;
  semanticSubjectRefs: string[];
  proposedFamily: Exclude<CapabilityFamily, 'SOURCE_DEFINED'>;
  canonicalName: string;
  implementationKind: Exclude<AutomationProposalImplementationKind, 'SOURCE_DEFINED'>;
  implementationRef: string;
  rationale: string;
  confidence: number;
  human?: AutomationProposalHumanContract;
  state: AutomationProposalState;
  createsBinding: false;
}

export interface AutomationProposalOrchestrationItem {
  semanticSubjectRef: string;
  canonicalNodeKind: ProcessNodeKind;
  proposedTreatment: AutomationOrchestrationTreatment;
  rationale: string;
  confidence: number;
  state: AutomationProposalState;
  createsBinding: false;
}

export interface AutomationProposalQuestion {
  semanticSubjectRefs: string[];
  question: string;
  reason: string;
  material: boolean;
}

export interface AutomationProposal {
  id: string;
  schemaVersion: typeof AUTOMATION_PROPOSAL_SCHEMA_VERSION;
  policyVersion: typeof AUTOMATION_PROPOSAL_POLICY_VERSION;
  processRevisionRef: string;
  capabilityDesignRevisionRef: string;
  providerId: string;
  modelRef: string;
  pipelineVersion: string;
  proposalDigest: string;
  status: AutomationProposalStatus;
  state: AutomationProposalState;
  createsBinding: false;
  grantsAuthority: false;
  steps: AutomationProposalStep[];
  orchestration: AutomationProposalOrchestrationItem[];
  unresolvedQuestions: AutomationProposalQuestion[];
  assumptions: string[];
  diagnostics: string[];
  createdAt: string;
}

export interface AutomationProposalProviderContext {
  process: ProcessRevision;
  design: CapabilityDesignBundle;
  availableOfferings?: Array<Pick<CapabilityOfferingRevision,
    'id' | 'family' | 'supportedOperationIntents' | 'implementationKind' | 'implementationRef'>>;
}

export interface AutomationProposalProviderResult {
  providerId: string;
  modelRef: string;
  pipelineVersion: string;
  rawProposal: unknown;
}

export interface AutomationProposalProvider {
  readonly providerId: string;
  readonly modelRef: string;
  readonly pipelineVersion: string;
  propose(context: AutomationProposalProviderContext): Promise<AutomationProposalProviderResult>;
}

type JsonObject = Record<string, unknown>;

const VALID_FAMILIES = new Set<Exclude<CapabilityFamily, 'SOURCE_DEFINED'>>([
  'HUMAN_INTERACTION',
  'DATA_COLLECTION',
  'COMMUNICATION',
  'SYSTEM_OPERATION',
  'DOCUMENT_FILE',
  'STORAGE',
  'EXTERNAL_WORKFLOW_INVOCATION',
  'AI_TASK',
  'CUSTOM_INTEGRATION',
]);

const VALID_IMPLEMENTATION_KINDS = new Set<Exclude<AutomationProposalImplementationKind, 'SOURCE_DEFINED'>>([
  'DIRECT_API',
  'INTERNAL_SERVICE',
  'MCP_TOOL',
  'N8N_WORKFLOW',
  'HUMAN_SERVICE',
  'AI_SERVICE',
  'DATABASE_ADAPTER',
  'WEBHOOK_ENDPOINT',
]);

const VALID_INTERACTIONS = new Set<AutomationProposalHumanContract['interactionKind']>([
  'MANUAL_ACTION','REVIEW','APPROVAL','DECISION','DATA_ENTRY','CORRECTION','CHOICE','ACKNOWLEDGEMENT','SIGNATURE','UPLOAD_PROVISION','OBSERVATION',
]);
const VALID_RESPONSIBILITIES = new Set<AutomationProposalHumanContract['responsibilityKind']>([
  'PERFORMER','APPROVER','REVIEWER','DECISION_AUTHORITY','DATA_PROVIDER','SIGNER','OBSERVER',
]);
const VALID_ORCHESTRATION = new Set<AutomationOrchestrationTreatment>([
  'WORKFLOW_EVENT','DETERMINISTIC_BRANCH','WORKFLOW_PARALLEL','DURABLE_TIMER','WORKFLOW_CONDITION','INLINE_COORDINATION','CHILD_WORKFLOW_CANDIDATE','WORKFLOW_STATE','TERMINAL',
]);

function object(value: unknown, label: string): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value as JsonObject;
}

function array(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  return value;
}

function string(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${label} must be a non-empty string`);
  return value.trim();
}

function optionalStrings(value: unknown, label: string): string[] {
  if (value === undefined) return [];
  return array(value, label).map((item, index) => string(item, `${label}[${index}]`));
}

function confidence(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new TypeError(`${label} must be between 0 and 1`);
  }
  return value;
}

function forbidAuthorityLanguage(value: unknown, path = 'proposal'): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => forbidAuthorityLanguage(item, `${path}[${index}]`));
    return;
  }
  for (const [key, child] of Object.entries(value as JsonObject)) {
    if (/^(authorityRef|approved|approval|bindingAuthorized|deploymentAuthorized|executionAuthorized|workflowStartAuthorized|createsBinding|grantsAuthority)$/i.test(key)) {
      throw new TypeError(`AI automation proposal may not emit authority field ${path}.${key}`);
    }
    forbidAuthorityLanguage(child, `${path}.${key}`);
  }
}

function humanContract(value: unknown, requirementActorRefs: readonly string[], label: string): AutomationProposalHumanContract {
  const raw = object(value, label);
  const interactionKind = string(raw.interactionKind, `${label}.interactionKind`) as AutomationProposalHumanContract['interactionKind'];
  const responsibilityKind = string(raw.responsibilityKind, `${label}.responsibilityKind`) as AutomationProposalHumanContract['responsibilityKind'];
  if (!VALID_INTERACTIONS.has(interactionKind)) throw new TypeError(`${label}.interactionKind is unsupported`);
  if (!VALID_RESPONSIBILITIES.has(responsibilityKind)) throw new TypeError(`${label}.responsibilityKind is unsupported`);
  const roleRefs = optionalStrings(raw.roleRefs, `${label}.roleRefs`);
  for (const ref of roleRefs) {
    if (!requirementActorRefs.includes(ref)) throw new TypeError(`${label}.roleRefs contains an actor not present in the frozen capability requirement`);
  }
  return {
    interactionKind,
    responsibilityKind,
    roleRefs,
    outcomeCode: string(raw.outcomeCode, `${label}.outcomeCode`),
    outcomeBusinessMeaning: string(raw.outcomeBusinessMeaning, `${label}.outcomeBusinessMeaning`),
  };
}

function allowedTreatments(kind: ProcessNodeKind): ReadonlySet<AutomationOrchestrationTreatment> {
  switch (kind) {
    case 'EVENT': return new Set(['WORKFLOW_EVENT']);
    case 'DECISION': return new Set(['DETERMINISTIC_BRANCH']);
    case 'PARALLEL_SPLIT':
    case 'JOIN': return new Set(['WORKFLOW_PARALLEL']);
    case 'WAIT': return new Set(['DURABLE_TIMER','WORKFLOW_CONDITION']);
    case 'SUBPROCESS': return new Set(['INLINE_COORDINATION','CHILD_WORKFLOW_CANDIDATE']);
    case 'STATE': return new Set(['WORKFLOW_STATE']);
    case 'END': return new Set(['TERMINAL']);
    default: return new Set();
  }
}

export function admitAutomationProposal(
  context: AutomationProposalProviderContext,
  provider: Omit<AutomationProposalProviderResult, 'rawProposal'>,
  rawProposal: unknown,
  createdAt: string,
): AutomationProposal {
  forbidAuthorityLanguage(rawProposal);
  const raw = object(rawProposal, 'proposal');
  const requirementById = new Map(context.design.requirements.map((requirement) => [requirement.id as string, requirement]));
  const processNodeById = new Map(context.process.nodes.map((node) => [node.id as string, node]));
  const availableOfferingById = new Map((context.availableOfferings ?? []).map((offering) => [offering.id as string, offering]));
  const seenRequirements = new Set<string>();

  const steps: AutomationProposalStep[] = array(raw.steps ?? [], 'proposal.steps').map((item, index) => {
    const candidate = object(item, `proposal.steps[${index}]`);
    const capabilityRequirementRef = string(candidate.capabilityRequirementRef, `proposal.steps[${index}].capabilityRequirementRef`);
    const requirement = requirementById.get(capabilityRequirementRef);
    if (!requirement) throw new TypeError(`proposal step references unknown capability requirement ${capabilityRequirementRef}`);
    if (seenRequirements.has(capabilityRequirementRef)) throw new TypeError(`proposal contains duplicate capability requirement ${capabilityRequirementRef}`);
    seenRequirements.add(capabilityRequirementRef);

    const semanticSubjectRefs = optionalStrings(candidate.semanticSubjectRefs, `proposal.steps[${index}].semanticSubjectRefs`);
    if (semanticSubjectRefs.length === 0) throw new TypeError(`proposal step ${capabilityRequirementRef} requires semanticSubjectRefs`);
    for (const ref of semanticSubjectRefs) {
      if (!requirement.semanticSubjectRefs.includes(ref)) {
        throw new TypeError(`proposal step ${capabilityRequirementRef} references semantic subject outside its frozen requirement`);
      }
    }
    for (const requiredRef of requirement.semanticSubjectRefs) {
      if (!semanticSubjectRefs.includes(requiredRef)) {
        throw new TypeError(`proposal step ${capabilityRequirementRef} dropped frozen semantic subject ${requiredRef}`);
      }
    }

    const proposedFamily = string(candidate.proposedFamily, `proposal.steps[${index}].proposedFamily`) as Exclude<CapabilityFamily, 'SOURCE_DEFINED'>;
    if (!VALID_FAMILIES.has(proposedFamily)) throw new TypeError(`proposal step ${capabilityRequirementRef} uses unsupported family`);
    const implementationKind = string(candidate.implementationKind, `proposal.steps[${index}].implementationKind`) as Exclude<AutomationProposalImplementationKind, 'SOURCE_DEFINED'>;
    if (!VALID_IMPLEMENTATION_KINDS.has(implementationKind)) throw new TypeError(`proposal step ${capabilityRequirementRef} uses unsupported implementation kind`);
    const implementationRef = string(candidate.implementationRef, `proposal.steps[${index}].implementationRef`);

    if (implementationRef.startsWith('offering:')) {
      const offeringId = implementationRef.slice('offering:'.length);
      const offering = availableOfferingById.get(offeringId);
      if (!offering) throw new TypeError(`proposal step ${capabilityRequirementRef} references unavailable offering ${offeringId}`);
      if (offering.family !== proposedFamily) throw new TypeError(`proposal step ${capabilityRequirementRef} offering family mismatch`);
      if (offering.implementationKind !== implementationKind) throw new TypeError(`proposal step ${capabilityRequirementRef} offering implementation mismatch`);
    } else if (!implementationRef.startsWith('proposal:')) {
      throw new TypeError(`proposal step ${capabilityRequirementRef} implementationRef must reference a governed offering or explicit proposal namespace`);
    }

    const human = proposedFamily === 'HUMAN_INTERACTION'
      ? humanContract(candidate.human, requirement.actorOrResponsibilityRefs ?? [], `proposal.steps[${index}].human`)
      : undefined;
    if (proposedFamily !== 'HUMAN_INTERACTION' && candidate.human !== undefined) {
      throw new TypeError(`proposal step ${capabilityRequirementRef} may include human contract only for HUMAN_INTERACTION`);
    }

    return {
      capabilityRequirementRef,
      semanticSubjectRefs,
      proposedFamily,
      canonicalName: string(candidate.canonicalName, `proposal.steps[${index}].canonicalName`),
      implementationKind,
      implementationRef,
      rationale: string(candidate.rationale, `proposal.steps[${index}].rationale`),
      confidence: confidence(candidate.confidence, `proposal.steps[${index}].confidence`),
      ...(human ? { human } : {}),
      state: 'SUGGESTED',
      createsBinding: false,
    };
  });

  const orchestration: AutomationProposalOrchestrationItem[] = array(raw.orchestration ?? [], 'proposal.orchestration').map((item, index) => {
    const candidate = object(item, `proposal.orchestration[${index}]`);
    const semanticSubjectRef = string(candidate.semanticSubjectRef, `proposal.orchestration[${index}].semanticSubjectRef`);
    const node = processNodeById.get(semanticSubjectRef);
    if (!node) throw new TypeError(`proposal orchestration references unknown process node ${semanticSubjectRef}`);
    const proposedTreatment = string(candidate.proposedTreatment, `proposal.orchestration[${index}].proposedTreatment`) as AutomationOrchestrationTreatment;
    if (!VALID_ORCHESTRATION.has(proposedTreatment) || !allowedTreatments(node.kind).has(proposedTreatment)) {
      throw new TypeError(`proposal orchestration treatment ${proposedTreatment} is incompatible with canonical ${node.kind}`);
    }
    return {
      semanticSubjectRef,
      canonicalNodeKind: node.kind,
      proposedTreatment,
      rationale: string(candidate.rationale, `proposal.orchestration[${index}].rationale`),
      confidence: confidence(candidate.confidence, `proposal.orchestration[${index}].confidence`),
      state: 'SUGGESTED',
      createsBinding: false,
    };
  });

  const unresolvedQuestions: AutomationProposalQuestion[] = array(raw.unresolvedQuestions ?? [], 'proposal.unresolvedQuestions').map((item, index) => {
    const candidate = object(item, `proposal.unresolvedQuestions[${index}]`);
    const semanticSubjectRefs = optionalStrings(candidate.semanticSubjectRefs, `proposal.unresolvedQuestions[${index}].semanticSubjectRefs`);
    for (const ref of semanticSubjectRefs) {
      if (!processNodeById.has(ref)) throw new TypeError(`proposal question references unknown canonical semantic subject ${ref}`);
    }
    if (typeof candidate.material !== 'boolean') throw new TypeError(`proposal.unresolvedQuestions[${index}].material must be boolean`);
    return {
      semanticSubjectRefs,
      question: string(candidate.question, `proposal.unresolvedQuestions[${index}].question`),
      reason: string(candidate.reason, `proposal.unresolvedQuestions[${index}].reason`),
      material: candidate.material,
    };
  });

  const assumptions = optionalStrings(raw.assumptions, 'proposal.assumptions');
  const diagnostics = optionalStrings(raw.diagnostics, 'proposal.diagnostics');
  const uncoveredRequirementRefs = context.design.requirements
    .map((requirement) => requirement.id as string)
    .filter((requirementRef) => !seenRequirements.has(requirementRef));
  const hasMaterialUnresolved = unresolvedQuestions.some((question) => question.material);
  const status: AutomationProposalStatus = uncoveredRequirementRefs.length === 0 && !hasMaterialUnresolved ? 'COMPLETE' : 'PARTIAL';
  if (uncoveredRequirementRefs.length > 0) diagnostics.push(`UNCOVERED_CAPABILITY_REQUIREMENTS:${uncoveredRequirementRefs.join(',')}`);

  const stable = {
    processRevisionRef: context.process.id as string,
    capabilityDesignRevisionRef: context.design.designRevision.id as string,
    providerId: provider.providerId,
    modelRef: provider.modelRef,
    pipelineVersion: provider.pipelineVersion,
    status,
    steps,
    orchestration,
    unresolvedQuestions,
    assumptions,
    diagnostics,
  };
  const proposalDigest = digestDeterministicJson(stable);
  return {
    id: createOpaqueId('capability', `automation-proposal:${proposalDigest}`),
    schemaVersion: AUTOMATION_PROPOSAL_SCHEMA_VERSION,
    policyVersion: AUTOMATION_PROPOSAL_POLICY_VERSION,
    ...stable,
    proposalDigest,
    state: 'SUGGESTED',
    createsBinding: false,
    grantsAuthority: false,
    createdAt,
  };
}

export async function generateAutomationProposal(
  provider: AutomationProposalProvider,
  context: AutomationProposalProviderContext,
  createdAt: string,
): Promise<AutomationProposal> {
  const result = await provider.propose(context);
  if (result.providerId !== provider.providerId || result.modelRef !== provider.modelRef || result.pipelineVersion !== provider.pipelineVersion) {
    throw new TypeError('automation proposal provider result identity mismatch');
  }
  return admitAutomationProposal(
    context,
    { providerId: result.providerId, modelRef: result.modelRef, pipelineVersion: result.pipelineVersion },
    result.rawProposal,
    createdAt,
  );
}
