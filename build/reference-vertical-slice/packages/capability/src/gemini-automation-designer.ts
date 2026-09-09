import type { ProcessRevision } from '../../semantic-core/src/types.ts';
import type { CapabilityDesignBundle } from './generic-design.ts';
import type { CapabilityOfferingRevision } from './types.ts';
import type {
  AutomationProposalProvider,
  AutomationProposalProviderContext,
  AutomationProposalProviderResult,
} from './automation-proposal.ts';

export const GEMINI_AUTOMATION_DESIGNER_PROVIDER_ID = 'TALOS_GEMINI_AUTOMATION_DESIGNER';
export const GEMINI_AUTOMATION_DESIGNER_PIPELINE_VERSION = 'talos-gemini-automation-designer-v0.1';
export const GEMINI_AUTOMATION_DESIGNER_ENV = {
  apiKey: 'GEMINI_API_KEY',
  model: 'TALOS_AUTOMATION_GEMINI_MODEL',
  apiBaseUrl: 'TALOS_AUTOMATION_GEMINI_API_BASE_URL',
  timeoutMs: 'TALOS_AUTOMATION_GEMINI_TIMEOUT_MS',
  maxOutputTokens: 'TALOS_AUTOMATION_GEMINI_MAX_OUTPUT_TOKENS',
} as const;

const DEFAULT_MODEL = 'gemini-3.6-flash';
const DEFAULT_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_MAX_OUTPUT_TOKENS = 8_192;

function envValue(env: Readonly<Record<string, string | undefined>>, name: string): string | undefined {
  const value = env[name]?.trim();
  return value ? value : undefined;
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

function processContext(process: ProcessRevision) {
  return {
    id: process.id,
    revision: process.revision,
    executionReadiness: process.executionReadiness,
    nodes: process.nodes.map((node) => ({
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
    edges: process.edges.map((edge) => ({
      id: edge.id,
      sourceNodeId: edge.sourceNodeId,
      targetNodeId: edge.targetNodeId,
      kind: edge.kind,
      conditionRuleRef: edge.conditionRuleRef ?? '',
      label: edge.label ?? '',
      truthClass: edge.truthClass,
    })),
    actors: process.actors.map((actor) => ({ id: actor.id, kind: actor.kind, name: actor.name, role: actor.role ?? '' })),
    dataObjects: process.dataObjects.map((item) => ({ id: item.id, name: item.name, kind: item.kind ?? '', businessMeaning: item.businessMeaning ?? '' })),
    rules: process.rules.map((rule) => ({ id: rule.id, naturalLanguage: rule.naturalLanguage, truthClass: rule.truthClass, unresolvedTerms: [...rule.unresolvedTerms] })),
  };
}

function designContext(design: CapabilityDesignBundle) {
  return {
    designRevisionId: design.designRevision.id,
    designState: design.designRevision.designState,
    requirements: design.requirements.map((requirement) => ({
      id: requirement.id,
      semanticSubjectRefs: [...requirement.semanticSubjectRefs],
      family: requirement.family,
      operationIntent: requirement.operationIntent,
      actorOrResponsibilityRefs: [...(requirement.actorOrResponsibilityRefs ?? [])],
      dataObjectRefs: [...(requirement.dataObjectRefs ?? [])],
      requirementState: requirement.requirementState,
      notes: requirement.notes ?? '',
    })),
  };
}

function offeringContext(offerings: AutomationProposalProviderContext['availableOfferings']) {
  return (offerings ?? []).map((offering) => ({
    id: offering.id,
    family: offering.family,
    supportedOperationIntents: [...offering.supportedOperationIntents],
    implementationKind: offering.implementationKind,
    implementationRef: offering.implementationRef,
  }));
}

const SYSTEM_INSTRUCTION = `You are TALOS' automation-design proposal model.

You are NOT business authority, automation approval authority, deployment authority, or workflow-start authority.
Your output is review material with state SUGGESTED only.

Design a practical implementation proposal for the exact confirmed canonical process and generic capability requirements provided by Talos.

Rules:
- Never rewrite or contradict confirmed process meaning.
- Never invent an actor, organizational role, business rule, branch condition, credential, configured integration, or source fact.
- Use exact capabilityRequirementRef and semanticSubjectRefs from the input. Never create IDs.
- Propose one step per capability requirement when a safe proposal is possible.
- If the execution family is unresolved, you MAY propose a family based on the business semantics, but it remains only a suggestion. Explain the rationale.
- If human work lacks actor/role evidence, keep roleRefs=[]; this means runtime assignment to an eligible authenticated human, NOT an invented business role. Missing role evidence alone is NOT a material unresolved question.
- Add a material actor/role question only when the confirmed Canonical process contains an explicit participant/role constraint that cannot be satisfied or when a specific role is required by confirmed business meaning.
- When a compatible configured HUMAN_INTERACTION + HUMAN_SERVICE offering is supplied by Talos, prefer that exact governed offering. In particular, a Talos Workflow-native human-coordination offering is the normal design for roleless human work.
- For any configured offering supplied by Talos, reference it as implementationRef="offering:<offering id>" only when its family, implementation kind and supported operation intent are compatible.
- If no configured offering exists, use a stable generic proposal reference beginning with "proposal:". Do not pretend the capability is installed or credentialed.
- HUMAN_INTERACTION must use implementationKind HUMAN_SERVICE and include a human contract.
- Do not reinterpret an ACTION as WAIT, DECISION, SUBPROCESS, or another canonical node kind. If the confirmed Canonical model appears insufficient for an execution-critical treatment, raise an unresolved question instead of changing semantics.
- Orchestration proposals may only describe canonical EVENT, DECISION, PARALLEL_SPLIT, JOIN, WAIT, SUBPROCESS, STATE, or END nodes.
- WAIT may propose DURABLE_TIMER or WORKFLOW_CONDITION. DECISION may propose DETERMINISTIC_BRANCH. Parallel split/join may propose WORKFLOW_PARALLEL. SUBPROCESS may propose INLINE_COORDINATION or CHILD_WORKFLOW_CANDIDATE. EVENT may propose WORKFLOW_EVENT. STATE may propose WORKFLOW_STATE. END may propose TERMINAL.
- Do not generate Temporal code. Talos will compile an approved design deterministically later.
- Do not emit authorityRef, approval, binding, deployment, execution or workflow-start authorization fields.
- Do not include secrets.
- confidence is evidence/design confidence from 0 to 1, never authority.

Return compact JSON only with this shape:
{
  "steps": [
    {
      "capabilityRequirementRef": "existing requirement id",
      "semanticSubjectRefs": ["existing canonical subject id"],
      "proposedFamily": "HUMAN_INTERACTION|DATA_COLLECTION|COMMUNICATION|SYSTEM_OPERATION|DOCUMENT_FILE|STORAGE|EXTERNAL_WORKFLOW_INVOCATION|AI_TASK|CUSTOM_INTEGRATION",
      "canonicalName": "human-readable proposed capability",
      "implementationKind": "DIRECT_API|INTERNAL_SERVICE|MCP_TOOL|N8N_WORKFLOW|HUMAN_SERVICE|AI_SERVICE|DATABASE_ADAPTER|WEBHOOK_ENDPOINT",
      "implementationRef": "offering:<existing offering id> or proposal:<stable generic ref>",
      "rationale": "why this is a reasonable design proposal",
      "confidence": 0.0,
      "human": {
        "interactionKind": "MANUAL_ACTION|REVIEW|APPROVAL|DECISION|DATA_ENTRY|CORRECTION|CHOICE|ACKNOWLEDGEMENT|SIGNATURE|UPLOAD_PROVISION|OBSERVATION",
        "responsibilityKind": "PERFORMER|APPROVER|REVIEWER|DECISION_AUTHORITY|DATA_PROVIDER|SIGNER|OBSERVER",
        "roleRefs": [],
        "outcomeCode": "durable outcome code",
        "outcomeBusinessMeaning": "what completion means"
      }
    }
  ],
  "orchestration": [
    {
      "semanticSubjectRef": "existing canonical node id",
      "proposedTreatment": "WORKFLOW_EVENT|DETERMINISTIC_BRANCH|WORKFLOW_PARALLEL|DURABLE_TIMER|WORKFLOW_CONDITION|INLINE_COORDINATION|CHILD_WORKFLOW_CANDIDATE|WORKFLOW_STATE|TERMINAL",
      "rationale": "why this treatment maps to the canonical semantic",
      "confidence": 0.0
    }
  ],
  "unresolvedQuestions": [
    {
      "semanticSubjectRefs": ["existing canonical ids"],
      "question": "business/design question",
      "reason": "why Talos cannot safely close it",
      "material": true
    }
  ],
  "assumptions": ["explicit proposal assumptions, never facts"],
  "diagnostics": ["optional design diagnostics"]
}`;

function candidateText(payload: unknown): string {
  const root = payload && typeof payload === 'object' ? payload as any : undefined;
  const parts = root?.candidates?.[0]?.content?.parts;
  return Array.isArray(parts)
    ? parts.map((part: any) => typeof part?.text === 'string' ? part.text : '').join('').trim()
    : '';
}

function requestPayload(context: AutomationProposalProviderContext, maxOutputTokens: number): Record<string, unknown> {
  return {
    contents: [{ parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nTALOS_GOVERNED_CONTEXT\n${JSON.stringify({
      process: processContext(context.process),
      capabilityDesign: designContext(context.design),
      availableOfferings: offeringContext(context.availableOfferings),
    })}` }] }],
    generationConfig: {
      thinkingConfig: { thinkingLevel: 'low' },
      maxOutputTokens,
      responseMimeType: 'application/json',
      temperature: 0,
    },
  };
}

export interface GeminiAutomationDesignerResolution {
  status: 'DISABLED' | 'CONFIGURED';
  reason?: 'GEMINI_API_KEY_NOT_CONFIGURED';
  provider?: AutomationProposalProvider;
}

export function resolveGeminiAutomationDesigner(
  env: Readonly<Record<string, string | undefined>> = process.env,
  baseFetch: typeof fetch = fetch,
): GeminiAutomationDesignerResolution {
  const apiKey = envValue(env, GEMINI_AUTOMATION_DESIGNER_ENV.apiKey);
  if (!apiKey) return { status: 'DISABLED', reason: 'GEMINI_API_KEY_NOT_CONFIGURED' };
  const model = envValue(env, GEMINI_AUTOMATION_DESIGNER_ENV.model) ?? DEFAULT_MODEL;
  const apiBaseUrl = envValue(env, GEMINI_AUTOMATION_DESIGNER_ENV.apiBaseUrl) ?? DEFAULT_API_BASE;
  const timeoutMs = integerEnv(env, GEMINI_AUTOMATION_DESIGNER_ENV.timeoutMs, DEFAULT_TIMEOUT_MS, 1_000, 120_000);
  const maxOutputTokens = integerEnv(env, GEMINI_AUTOMATION_DESIGNER_ENV.maxOutputTokens, DEFAULT_MAX_OUTPUT_TOKENS, 512, 32_768);
  const endpoint = `${apiBaseUrl.replace(/\/$/, '')}/${encodeURIComponent(model)}:generateContent`;

  const provider: AutomationProposalProvider = Object.freeze({
    providerId: GEMINI_AUTOMATION_DESIGNER_PROVIDER_ID,
    modelRef: model,
    pipelineVersion: GEMINI_AUTOMATION_DESIGNER_PIPELINE_VERSION,
    async propose(context: AutomationProposalProviderContext): Promise<AutomationProposalProviderResult> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await baseFetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify(requestPayload(context, maxOutputTokens)),
          signal: controller.signal,
        });
        const rawText = await response.text();
        if (!response.ok) {
          let message = rawText.slice(0, 1_000);
          try { message = JSON.parse(rawText)?.error?.message ?? message; } catch { /* keep raw provider text */ }
          throw new TypeError(`GEMINI_AUTOMATION_DESIGNER_PROVIDER_ERROR:${response.status}:${message}`);
        }
        let payload: unknown;
        try { payload = rawText ? JSON.parse(rawText) : {}; }
        catch { throw new TypeError('GEMINI_AUTOMATION_DESIGNER_INVALID_PROVIDER_JSON'); }
        const text = candidateText(payload);
        if (!text) throw new TypeError('GEMINI_AUTOMATION_DESIGNER_EMPTY_RESPONSE');
        let rawProposal: unknown;
        try { rawProposal = JSON.parse(text); }
        catch { throw new TypeError('GEMINI_AUTOMATION_DESIGNER_INVALID_PROPOSAL_JSON'); }
        return {
          providerId: GEMINI_AUTOMATION_DESIGNER_PROVIDER_ID,
          modelRef: model,
          pipelineVersion: GEMINI_AUTOMATION_DESIGNER_PIPELINE_VERSION,
          rawProposal,
        };
      } finally {
        clearTimeout(timer);
      }
    },
  });

  return { status: 'CONFIGURED', provider };
}
