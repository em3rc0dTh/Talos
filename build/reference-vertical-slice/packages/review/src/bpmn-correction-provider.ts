import { digestDeterministicJson } from '../../foundation/src/digest.ts';

export const BPMN_CORRECTION_PROVIDER_PROTOCOL = 'talos-bpmn-correction-provider-v0.1';

export interface BpmnCorrectionProviderRequest {
  protocol: typeof BPMN_CORRECTION_PROVIDER_PROTOCOL;
  requestId: string;
  baseBpmnRevisionId: string;
  baseBpmnXml: string;
  baseBpmnXmlSha256: string;
  baseSemanticDigest: string;
  instruction: string;
}

export interface BpmnCorrectionProviderProposal {
  protocol: typeof BPMN_CORRECTION_PROVIDER_PROTOCOL;
  status: 'PROPOSED';
  requestId: string;
  baseBpmnRevisionId: string;
  proposedBpmnXml: string;
  providerClass: 'MODEL_PROVIDER';
  providerId: string;
  modelId: string;
  modelVersion: string;
  pipelineVersion: string;
}

export interface BpmnCorrectionProviderNoResult {
  protocol: typeof BPMN_CORRECTION_PROVIDER_PROTOCOL;
  status: 'NO_RESULT';
  requestId: string;
  baseBpmnRevisionId: string;
  providerClass: 'MODEL_PROVIDER';
  providerId: string;
  modelId: string;
  modelVersion: string;
  pipelineVersion: string;
  reason: string;
}

export type BpmnCorrectionProviderResponse = BpmnCorrectionProviderProposal | BpmnCorrectionProviderNoResult;

export interface BpmnCorrectionProvider {
  propose(request: BpmnCorrectionProviderRequest): Promise<unknown>;
}

function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) throw new TypeError(`${field} must be a non-empty string`);
  return value;
}

export function createBpmnCorrectionProviderRequest(input: {
  baseBpmnRevisionId: string;
  baseBpmnXml: string;
  baseBpmnXmlSha256: string;
  baseSemanticDigest: string;
  instruction: string;
}): BpmnCorrectionProviderRequest {
  const instruction = text(input.instruction, 'instruction');
  const requestId = `bpmn-correction:${digestDeterministicJson({
    baseBpmnRevisionId: input.baseBpmnRevisionId,
    baseBpmnXmlSha256: input.baseBpmnXmlSha256,
    baseSemanticDigest: input.baseSemanticDigest,
    instruction,
  })}`;
  return {
    protocol: BPMN_CORRECTION_PROVIDER_PROTOCOL,
    requestId,
    baseBpmnRevisionId: text(input.baseBpmnRevisionId, 'baseBpmnRevisionId'),
    baseBpmnXml: text(input.baseBpmnXml, 'baseBpmnXml'),
    baseBpmnXmlSha256: text(input.baseBpmnXmlSha256, 'baseBpmnXmlSha256'),
    baseSemanticDigest: text(input.baseSemanticDigest, 'baseSemanticDigest'),
    instruction,
  };
}

export function validateBpmnCorrectionProviderResponse(
  raw: unknown,
  expected: BpmnCorrectionProviderRequest,
): BpmnCorrectionProviderResponse {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new TypeError('BPMN correction provider response must be an object');
  const value = raw as Record<string, unknown>;
  if (value.protocol !== BPMN_CORRECTION_PROVIDER_PROTOCOL) throw new TypeError('BPMN correction provider protocol mismatch');
  if (value.requestId !== expected.requestId) throw new TypeError('BPMN correction provider requestId mismatch');
  if (value.baseBpmnRevisionId !== expected.baseBpmnRevisionId) throw new TypeError('BPMN correction provider base revision mismatch');
  if (value.providerClass !== 'MODEL_PROVIDER') throw new TypeError('BPMN correction providerClass must be MODEL_PROVIDER');
  const status = value.status;
  if (status !== 'PROPOSED' && status !== 'NO_RESULT') throw new TypeError('BPMN correction provider status is invalid');

  const common = {
    protocol: BPMN_CORRECTION_PROVIDER_PROTOCOL,
    status,
    requestId: expected.requestId,
    baseBpmnRevisionId: expected.baseBpmnRevisionId,
    providerClass: 'MODEL_PROVIDER' as const,
    providerId: text(value.providerId, 'providerId'),
    modelId: text(value.modelId, 'modelId'),
    modelVersion: text(value.modelVersion, 'modelVersion'),
    pipelineVersion: text(value.pipelineVersion, 'pipelineVersion'),
  };

  if (status === 'NO_RESULT') {
    return { ...common, status, reason: text(value.reason, 'reason') };
  }
  return { ...common, status, proposedBpmnXml: text(value.proposedBpmnXml, 'proposedBpmnXml') };
}
