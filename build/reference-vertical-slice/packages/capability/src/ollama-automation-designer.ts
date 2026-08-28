import type {
  AutomationProposalProvider,
  AutomationProposalProviderContext,
  AutomationProposalProviderResult,
} from './automation-proposal.ts';

export const OLLAMA_AUTOMATION_DESIGNER_PROVIDER_ID = 'TALOS_OLLAMA_AUTOMATION_DESIGNER_FALLBACK';
export const OLLAMA_AUTOMATION_DESIGNER_PIPELINE_VERSION = 'talos-ollama-automation-designer-v0.1';
export const OLLAMA_AUTOMATION_DESIGNER_ENV = {
  enabled: 'TALOS_OLLAMA_AUTOMATION_FALLBACK_ENABLED',
  endpoint: 'TALOS_OLLAMA_AUTOMATION_FALLBACK_URL',
  model: 'TALOS_OLLAMA_AUTOMATION_FALLBACK_MODEL',
  timeoutMs: 'TALOS_OLLAMA_AUTOMATION_FALLBACK_TIMEOUT_MS',
  maxOutputTokens: 'TALOS_OLLAMA_AUTOMATION_FALLBACK_MAX_OUTPUT_TOKENS',
} as const;

const DEFAULT_ENDPOINT = 'http://127.0.0.1:11434/api/chat';
const DEFAULT_MODEL = 'qwen3-vl:4b-instruct';
const DEFAULT_TIMEOUT_MS = 300_000;
const DEFAULT_MAX_OUTPUT_TOKENS = 4_096;

const PROMPT = `You are TALOS' LOCAL independent automation-design fallback model.

The cloud automation-design proposal was unavailable or insufficient. Re-design independently from the governed context below. Do not imitate an unknown primary answer.

You are NOT business authority, automation approval authority, deployment authority, or workflow-start authority. Your output is SUGGESTED review material only.

Rules:
- Never rewrite or contradict confirmed process meaning.
- Never invent IDs. Use exact capability requirement and canonical semantic IDs from the context.
- Never invent an actor, business rule, branch condition, credential, installed integration, or source fact.
- Propose one step per capability requirement when safe.
- An unresolved execution family may receive a proposed family, but only as a suggestion with rationale.
- Human work with no frozen actor evidence must keep roleRefs=[] and add a grouped material unresolved question.
- If a Talos offering is supplied, use implementationRef="offering:<offering id>" only when compatible.
- Otherwise use implementationRef beginning with "proposal:" and never claim that it is installed or credentialed.
- HUMAN_INTERACTION must use HUMAN_SERVICE and include the human contract.
- Do not reinterpret ACTION as WAIT/DECISION/SUBPROCESS. Raise an unresolved question when the Canonical model is insufficient.
- Orchestration treatment must match the canonical kind: EVENT→WORKFLOW_EVENT, DECISION→DETERMINISTIC_BRANCH, PARALLEL_SPLIT/JOIN→WORKFLOW_PARALLEL, WAIT→DURABLE_TIMER or WORKFLOW_CONDITION, SUBPROCESS→INLINE_COORDINATION or CHILD_WORKFLOW_CANDIDATE, STATE→WORKFLOW_STATE, END→TERMINAL.
- Do not generate Temporal code. Talos compiles approved design deterministically later.
- Do not emit authority, approval, binding, deployment or execution authorization fields.
- Do not include secrets.
- confidence is 0..1 design confidence, never authority.

Return concise JSON only:
{
  "steps": [{
    "capabilityRequirementRef":"existing requirement id",
    "semanticSubjectRefs":["existing canonical id"],
    "proposedFamily":"HUMAN_INTERACTION|DATA_COLLECTION|COMMUNICATION|SYSTEM_OPERATION|DOCUMENT_FILE|STORAGE|EXTERNAL_WORKFLOW_INVOCATION|AI_TASK|CUSTOM_INTEGRATION",
    "canonicalName":"proposal name",
    "implementationKind":"DIRECT_API|INTERNAL_SERVICE|MCP_TOOL|N8N_WORKFLOW|HUMAN_SERVICE|AI_SERVICE|DATABASE_ADAPTER|WEBHOOK_ENDPOINT",
    "implementationRef":"offering:<id> or proposal:<ref>",
    "rationale":"reason",
    "confidence":0.0,
    "human":{"interactionKind":"MANUAL_ACTION|REVIEW|APPROVAL|DECISION|DATA_ENTRY|CORRECTION|CHOICE|ACKNOWLEDGEMENT|SIGNATURE|UPLOAD_PROVISION|OBSERVATION","responsibilityKind":"PERFORMER|APPROVER|REVIEWER|DECISION_AUTHORITY|DATA_PROVIDER|SIGNER|OBSERVER","roleRefs":[],"outcomeCode":"COMPLETED","outcomeBusinessMeaning":"business completion meaning"}
  }],
  "orchestration":[{"semanticSubjectRef":"canonical node id","proposedTreatment":"WORKFLOW_EVENT|DETERMINISTIC_BRANCH|WORKFLOW_PARALLEL|DURABLE_TIMER|WORKFLOW_CONDITION|INLINE_COORDINATION|CHILD_WORKFLOW_CANDIDATE|WORKFLOW_STATE|TERMINAL","rationale":"reason","confidence":0.0}],
  "unresolvedQuestions":[{"semanticSubjectRefs":["canonical ids"],"question":"question","reason":"reason","material":true}],
  "assumptions":["explicit assumptions"],
  "diagnostics":["optional diagnostics"]
}`;

function envValue(env: Readonly<Record<string, string | undefined>>, name: string): string | undefined {
  const value = env[name]?.trim();
  return value ? value : undefined;
}

function enabled(env: Readonly<Record<string, string | undefined>>): boolean {
  return /^(1|true|yes|on)$/i.test(envValue(env, OLLAMA_AUTOMATION_DESIGNER_ENV.enabled) ?? '');
}

function integerEnv(
  env: Readonly<Record<string, string | undefined>>,
  name: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const raw = envValue(env, name);
  if (!raw) return fallback;
  if (!/^\d+$/.test(raw)) throw new TypeError(`${name} must be an integer`);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new TypeError(`${name} must be between ${min} and ${max}`);
  return value;
}

function governedContext(context: AutomationProposalProviderContext) {
  return {
    process: {
      id: context.process.id,
      revision: context.process.revision,
      executionReadiness: context.process.executionReadiness,
      nodes: context.process.nodes.map((node) => ({
        id: node.id,
        kind: node.kind,
        name: node.name ?? '',
        description: node.description ?? '',
        actorRefs: [...node.actorRefs],
        inputRefs: [...node.inputRefs],
        outputRefs: [...node.outputRefs],
        ruleRefs: [...node.ruleRefs],
        truthClass: node.truthClass,
        details: node.details ?? {},
      })),
      edges: context.process.edges.map((edge) => ({
        id: edge.id,
        sourceNodeId: edge.sourceNodeId,
        targetNodeId: edge.targetNodeId,
        kind: edge.kind,
        conditionRuleRef: edge.conditionRuleRef ?? '',
        label: edge.label ?? '',
        truthClass: edge.truthClass,
      })),
      actors: context.process.actors.map((actor) => ({ id: actor.id, kind: actor.kind, name: actor.name, role: actor.role ?? '' })),
      rules: context.process.rules.map((rule) => ({ id: rule.id, naturalLanguage: rule.naturalLanguage, truthClass: rule.truthClass, unresolvedTerms: [...rule.unresolvedTerms] })),
    },
    capabilityDesign: {
      designRevisionId: context.design.designRevision.id,
      designState: context.design.designRevision.designState,
      requirements: context.design.requirements.map((requirement) => ({
        id: requirement.id,
        semanticSubjectRefs: [...requirement.semanticSubjectRefs],
        family: requirement.family,
        operationIntent: requirement.operationIntent,
        actorOrResponsibilityRefs: [...(requirement.actorOrResponsibilityRefs ?? [])],
        dataObjectRefs: [...(requirement.dataObjectRefs ?? [])],
        requirementState: requirement.requirementState,
        notes: requirement.notes ?? '',
      })),
    },
    availableOfferings: (context.availableOfferings ?? []).map((offering) => ({
      id: offering.id,
      family: offering.family,
      supportedOperationIntents: [...offering.supportedOperationIntents],
      implementationKind: offering.implementationKind,
      implementationRef: offering.implementationRef,
    })),
  };
}

export type OllamaAutomationDesignerResolution =
  | { status: 'DISABLED'; reason: 'OLLAMA_AUTOMATION_FALLBACK_NOT_ENABLED' }
  | { status: 'CONFIGURED'; provider: AutomationProposalProvider };

export function resolveOllamaAutomationDesigner(
  env: Readonly<Record<string, string | undefined>> = process.env,
  baseFetch: typeof fetch = fetch,
): OllamaAutomationDesignerResolution {
  if (!enabled(env)) return { status: 'DISABLED', reason: 'OLLAMA_AUTOMATION_FALLBACK_NOT_ENABLED' };
  const endpoint = envValue(env, OLLAMA_AUTOMATION_DESIGNER_ENV.endpoint) ?? DEFAULT_ENDPOINT;
  const model = envValue(env, OLLAMA_AUTOMATION_DESIGNER_ENV.model) ?? DEFAULT_MODEL;
  const timeoutMs = integerEnv(env, OLLAMA_AUTOMATION_DESIGNER_ENV.timeoutMs, DEFAULT_TIMEOUT_MS, 1_000, 600_000);
  const maxOutputTokens = integerEnv(env, OLLAMA_AUTOMATION_DESIGNER_ENV.maxOutputTokens, DEFAULT_MAX_OUTPUT_TOKENS, 512, 16_384);

  const provider: AutomationProposalProvider = Object.freeze({
    providerId: OLLAMA_AUTOMATION_DESIGNER_PROVIDER_ID,
    modelRef: model,
    pipelineVersion: OLLAMA_AUTOMATION_DESIGNER_PIPELINE_VERSION,
    async propose(context: AutomationProposalProviderContext): Promise<AutomationProposalProviderResult> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await baseFetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: `${PROMPT}\n\nTALOS_GOVERNED_CONTEXT\n${JSON.stringify(governedContext(context))}` }],
            stream: false,
            think: false,
            format: 'json',
            options: { temperature: 0, num_predict: maxOutputTokens },
          }),
          signal: controller.signal,
        });
        const rawText = await response.text();
        if (!response.ok) throw new TypeError(`OLLAMA_AUTOMATION_DESIGNER_PROVIDER_ERROR:${response.status}:${rawText.slice(0, 1_000)}`);
        let payload: any;
        try { payload = rawText ? JSON.parse(rawText) : {}; }
        catch { throw new TypeError('OLLAMA_AUTOMATION_DESIGNER_INVALID_PROVIDER_JSON'); }
        const content = typeof payload?.message?.content === 'string' ? payload.message.content.trim() : '';
        if (!content) throw new TypeError('OLLAMA_AUTOMATION_DESIGNER_EMPTY_RESPONSE');
        let rawProposal: unknown;
        try { rawProposal = JSON.parse(content); }
        catch { throw new TypeError('OLLAMA_AUTOMATION_DESIGNER_INVALID_PROPOSAL_JSON'); }
        return {
          providerId: OLLAMA_AUTOMATION_DESIGNER_PROVIDER_ID,
          modelRef: model,
          pipelineVersion: OLLAMA_AUTOMATION_DESIGNER_PIPELINE_VERSION,
          rawProposal,
        };
      } finally {
        clearTimeout(timer);
      }
    },
  });

  return { status: 'CONFIGURED', provider };
}
