import { BpmnModdle } from 'bpmn-moddle';
import { digestDeterministicJson, sha256Utf8 } from '../../foundation/src/digest.ts';
import type { CanonicalId } from '../../semantic-core/src/types.ts';
import {
  createBpmnProcessRevision,
  type BpmnCanonicalAlignmentStatus,
  type BpmnChangeClass,
  type BpmnEditMode,
  type BpmnProcessRevision,
} from './bpmn-confirmation.ts';
import { talosBpmnModdleDescriptor } from './talos-bpmn-moddle.ts';

export const BPMN_ROUNDTRIP_VERSION = 'talos-bpmn-roundtrip-v0.1';

export interface BpmnXmlWarning {
  message: string;
}

export interface BpmnXmlInspection {
  roundTripVersion: typeof BPMN_ROUNDTRIP_VERSION;
  originalXmlSha256: string;
  normalizedXml: string;
  normalizedXmlSha256: string;
  modelSemanticDigest: string;
  modelDiagramDigest: string;
  processIds: string[];
  diagramIds: string[];
  warnings: BpmnXmlWarning[];
  hasDiagramInterchange: boolean;
}

export interface BpmnRoundTripEditResult {
  revision: BpmnProcessRevision;
  changeClass: BpmnChangeClass;
  requiresCanonicalReconciliation: boolean;
  baseInspection: BpmnXmlInspection;
  editedInspection: BpmnXmlInspection;
}

type AnyRecord = Record<string, any>;

type DigestMode = 'SEMANTIC' | 'DIAGRAM';

const ORDER_SENSITIVE_PROPERTIES = new Set(['waypoint']);

function createModdle(): BpmnModdle {
  return new BpmnModdle({ talos: talosBpmnModdleDescriptor as any });
}

function warningMessage(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (value && typeof value === 'object' && 'message' in value) return String((value as { message: unknown }).message);
  return String(value);
}

function referenceValue(value: any): unknown {
  if (Array.isArray(value)) {
    return value
      .map(referenceValue)
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  }
  if (value && typeof value === 'object') {
    return {
      $ref: typeof value.id === 'string' ? value.id : null,
      $type: typeof value.$type === 'string' ? value.$type : null,
    };
  }
  return value ?? null;
}

function primitiveOrNull(value: unknown): unknown {
  if (value === null) return null;
  if (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') return value;
  return null;
}

function stableElement(value: any, mode: DigestMode, seen = new Set<object>(), propertyName?: string): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'object') return primitiveOrNull(value);

  if (Array.isArray(value)) {
    const items = value.map((item) => stableElement(item, mode, seen, propertyName));
    if (ORDER_SENSITIVE_PROPERTIES.has(propertyName ?? '')) return items;
    return items.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  }

  if (seen.has(value)) {
    return {
      $ref: typeof value.id === 'string' ? value.id : null,
      $type: typeof value.$type === 'string' ? value.$type : null,
    };
  }
  seen.add(value);

  try {
    const type = typeof value.$type === 'string' ? value.$type : null;
    if (mode === 'SEMANTIC' && type && (type.startsWith('bpmndi:') || type.startsWith('dc:') || type.startsWith('di:'))) {
      return null;
    }

    const result: Record<string, unknown> = {};
    if (type) result.$type = type;

    const descriptorProperties = Array.isArray(value.$descriptor?.properties)
      ? [...value.$descriptor.properties]
      : [];

    const handled = new Set<string>();
    for (const property of descriptorProperties.sort((a: AnyRecord, b: AnyRecord) => String(a.name).localeCompare(String(b.name)))) {
      const name = String(property.name);
      if (name === '$parent') continue;
      if (mode === 'SEMANTIC' && name === 'diagrams') continue;
      if (mode === 'DIAGRAM' && name !== 'diagrams' && type === 'bpmn:Definitions') continue;
      const propertyValue = value[name];
      if (propertyValue === undefined || propertyValue === null) continue;
      handled.add(name);
      if (property.isReference) {
        result[name] = referenceValue(propertyValue);
      } else {
        const stable = stableElement(propertyValue, mode, seen, name);
        if (stable !== null) result[name] = stable;
      }
    }

    if (value.$attrs && typeof value.$attrs === 'object' && Object.keys(value.$attrs).length > 0) {
      const attrs: Record<string, unknown> = {};
      for (const key of Object.keys(value.$attrs).sort()) {
        if (key === 'xsi:type' || key.startsWith('xmlns:')) continue;
        const attrValue = value.$attrs[key];
        if (attrValue !== undefined) attrs[key] = primitiveOrNull(attrValue);
      }
      if (Object.keys(attrs).length > 0) result.$attrs = attrs;
    }

    // Preserve unknown extension-element payload that does not have a descriptor.
    if (!type || descriptorProperties.length === 0) {
      for (const key of Object.keys(value).sort()) {
        if (key.startsWith('$') || key === 'id' || handled.has(key)) continue;
        const unknown = value[key];
        if (unknown === undefined || typeof unknown === 'function') continue;
        const stable = stableElement(unknown, mode, seen, key);
        if (stable !== null) result[key] = stable;
      }
    }

    return result;
  } finally {
    seen.delete(value);
  }
}

function modelDigests(definitions: any): { semantic: string; diagram: string } {
  const semantic = digestDeterministicJson({
    definitions: stableElement(definitions, 'SEMANTIC'),
  });
  const diagram = digestDeterministicJson({
    diagrams: stableElement(definitions.diagrams ?? [], 'DIAGRAM', new Set(), 'diagrams'),
  });
  return { semantic, diagram };
}

function collectIds(definitions: any): { processIds: string[]; diagramIds: string[] } {
  const processIds = (definitions.rootElements ?? [])
    .filter((element: AnyRecord) => element.$type === 'bpmn:Process')
    .map((element: AnyRecord) => String(element.id ?? ''))
    .filter(Boolean)
    .sort();
  const diagramIds = (definitions.diagrams ?? [])
    .map((element: AnyRecord) => String(element.id ?? ''))
    .filter(Boolean)
    .sort();
  return { processIds, diagramIds };
}

async function parseBpmn(xml: string): Promise<{ definitions: any; warnings: BpmnXmlWarning[]; moddle: BpmnModdle }> {
  if (xml.trim().length === 0) throw new TypeError('BPMN XML must not be empty');
  const moddle = createModdle();
  const parsed = await moddle.fromXML(xml);
  const definitions = parsed.rootElement;
  if (!definitions || definitions.$type !== 'bpmn:Definitions') {
    throw new TypeError('BPMN XML root must be bpmn:Definitions');
  }
  const { processIds } = collectIds(definitions);
  if (processIds.length === 0) throw new TypeError('BPMN XML must contain at least one bpmn:Process');
  return {
    definitions,
    warnings: (parsed.warnings ?? []).map((warning: unknown) => ({ message: warningMessage(warning) })),
    moddle,
  };
}

/**
 * Preserves the exact received XML digest, then validates the canonical BPMN model after
 * bpmn-moddle has normalized XML representation details. The safety assertion is model
 * idempotence: normalized model -> XML -> normalized model must preserve both business
 * semantics and BPMN-DI. Exact source bytes/XML remain separately pinned by originalXmlSha256.
 */
export async function inspectBpmnXml(xml: string): Promise<BpmnXmlInspection> {
  const originalXmlSha256 = sha256Utf8(xml);
  const source = await parseBpmn(xml);

  const firstSerialization = await source.moddle.toXML(source.definitions, { format: true, preamble: true });
  const firstNormalizedXml = firstSerialization.xml;
  const normalized = await parseBpmn(firstNormalizedXml);
  const normalizedDigests = modelDigests(normalized.definitions);

  const secondSerialization = await normalized.moddle.toXML(normalized.definitions, { format: true, preamble: true });
  const normalizedXml = secondSerialization.xml;
  const verified = await parseBpmn(normalizedXml);
  const verifiedDigests = modelDigests(verified.definitions);

  if (normalizedDigests.semantic !== verifiedDigests.semantic) {
    throw new TypeError('BPMN semantic digest changed across canonical model/XML round trip');
  }
  if (normalizedDigests.diagram !== verifiedDigests.diagram) {
    throw new TypeError('BPMN-DI digest changed across canonical model/XML round trip');
  }

  const ids = collectIds(verified.definitions);
  return {
    roundTripVersion: BPMN_ROUNDTRIP_VERSION,
    originalXmlSha256,
    normalizedXml,
    normalizedXmlSha256: sha256Utf8(normalizedXml),
    modelSemanticDigest: normalizedDigests.semantic,
    modelDiagramDigest: normalizedDigests.diagram,
    processIds: ids.processIds,
    diagramIds: ids.diagramIds,
    warnings: [...source.warnings, ...normalized.warnings, ...verified.warnings],
    hasDiagramInterchange: ids.diagramIds.length > 0,
  };
}

export async function createNativeBpmnImportRevision(input: {
  bpmnXml: string;
  sourceArtifactRefs: string[];
  sourceRepresentationRefs?: string[];
  createdAt: string;
  createdBy: string;
  revisionNumber?: number;
}): Promise<{ revision: BpmnProcessRevision; inspection: BpmnXmlInspection }> {
  const inspection = await inspectBpmnXml(input.bpmnXml);
  const revision = createBpmnProcessRevision({
    revisionNumber: input.revisionNumber ?? 1,
    sourceRoute: 'NATIVE_BPMN',
    editMode: 'NATIVE_BPMN_IMPORT',
    sourceArtifactRefs: input.sourceArtifactRefs,
    sourceRepresentationRefs: input.sourceRepresentationRefs,
    canonicalAlignmentStatus: 'REQUIRES_CANONICAL_RECONCILIATION',
    bpmnXml: input.bpmnXml,
    semanticDigest: inspection.modelSemanticDigest,
    diagramDigest: inspection.modelDiagramDigest,
    createdAt: input.createdAt,
    createdBy: input.createdBy,
  });
  return { revision, inspection };
}

function alignmentForNonSemanticEdit(base: BpmnProcessRevision): {
  status: BpmnCanonicalAlignmentStatus;
  canonicalProcessRevisionId?: CanonicalId;
  canonicalAlignmentAuthorityRef?: string;
} {
  if (base.canonicalAlignmentStatus !== 'ALIGNED_TO_CANONICAL' || !base.canonicalProcessRevisionId) {
    return { status: 'REQUIRES_CANONICAL_RECONCILIATION' };
  }
  return {
    status: 'ALIGNED_TO_CANONICAL',
    canonicalProcessRevisionId: base.canonicalProcessRevisionId,
    ...(base.canonicalAlignmentAuthorityRef
      ? { canonicalAlignmentAuthorityRef: base.canonicalAlignmentAuthorityRef }
      : {}),
  };
}

export async function createBpmnRoundTripEdit(input: {
  baseRevision: BpmnProcessRevision;
  editedBpmnXml: string;
  editMode: Extract<BpmnEditMode, 'GRAPH_EDIT' | 'XML_EDIT'>;
  createdAt: string;
  createdBy: string;
  revisionNumber?: number;
}): Promise<BpmnRoundTripEditResult> {
  if (input.baseRevision.state !== 'DRAFT') throw new TypeError('Only a DRAFT BPMN revision may be edited');
  const baseInspection = await inspectBpmnXml(input.baseRevision.bpmnXml);
  const editedInspection = await inspectBpmnXml(input.editedBpmnXml);

  const semanticChanged = baseInspection.modelSemanticDigest !== editedInspection.modelSemanticDigest;
  const diagramChanged = baseInspection.modelDiagramDigest !== editedInspection.modelDiagramDigest;
  const xmlChanged = input.baseRevision.bpmnXmlSha256 !== editedInspection.originalXmlSha256;

  const changeClass: BpmnChangeClass = semanticChanged
    ? 'SEMANTIC'
    : (diagramChanged || xmlChanged ? 'VISUAL_ONLY' : 'NO_CHANGE');

  const nonSemanticAlignment = alignmentForNonSemanticEdit(input.baseRevision);
  const canonicalAlignmentStatus: BpmnCanonicalAlignmentStatus = semanticChanged
    ? 'REQUIRES_CANONICAL_RECONCILIATION'
    : nonSemanticAlignment.status;

  const revision = createBpmnProcessRevision({
    revisionNumber: input.revisionNumber ?? input.baseRevision.revisionNumber + 1,
    parentBpmnRevisionId: input.baseRevision.id,
    sourceRoute: input.baseRevision.sourceRoute,
    editMode: input.editMode,
    sourceArtifactRefs: input.baseRevision.sourceArtifactRefs,
    sourceRepresentationRefs: input.baseRevision.sourceRepresentationRefs,
    ...(!semanticChanged && nonSemanticAlignment.canonicalProcessRevisionId
      ? { canonicalProcessRevisionId: nonSemanticAlignment.canonicalProcessRevisionId }
      : {}),
    canonicalAlignmentStatus,
    ...(!semanticChanged && nonSemanticAlignment.canonicalAlignmentAuthorityRef
      ? { canonicalAlignmentAuthorityRef: nonSemanticAlignment.canonicalAlignmentAuthorityRef }
      : {}),
    bpmnXml: input.editedBpmnXml,
    semanticDigest: semanticChanged ? editedInspection.modelSemanticDigest : input.baseRevision.semanticDigest,
    diagramDigest: diagramChanged ? editedInspection.modelDiagramDigest : input.baseRevision.diagramDigest,
    createdAt: input.createdAt,
    createdBy: input.createdBy,
    supersedesBpmnRevisionId: input.baseRevision.id,
  });

  return {
    revision,
    changeClass,
    requiresCanonicalReconciliation: canonicalAlignmentStatus === 'REQUIRES_CANONICAL_RECONCILIATION',
    baseInspection,
    editedInspection,
  };
}
