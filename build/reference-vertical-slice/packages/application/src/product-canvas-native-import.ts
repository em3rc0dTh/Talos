import type { ProductCanvasInput } from './product-canvas-intake.ts';
import { buildCanvasRevision, type TalosCanvasNativeSource } from '../../canvas-source/src/index.ts';

function record(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(field + ' must be an object');
  return value as Record<string, unknown>;
}

function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(field + ' must be non-empty');
  return value.trim();
}

function propertyText(value: unknown): string | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const property = value as Record<string, unknown>;
  if (property.state !== 'SET') return undefined;
  if (typeof property.value === 'string' && property.value.trim()) return property.value.trim();
  if (typeof property.literalText === 'string' && property.literalText.trim()) return property.literalText.trim();
  return undefined;
}

function elementKind(snapshot: any): ProductCanvasInput['elements'][number]['kind'] {
  if (snapshot.kind === 'TRIGGER') return 'START';
  if (snapshot.kind === 'ACTION') return 'STEP';
  if (snapshot.kind === 'DECISION') return 'DECISION';
  if (snapshot.kind === 'WAIT') return 'WAIT';
  if (snapshot.kind === 'SUBPROCESS') return 'SUBPROCESS';
  if (snapshot.kind === 'END') return 'END';
  if (snapshot.kind === 'HUMAN_INTERACTION') {
    return propertyText(snapshot.propertyValues?.interactionKind) === 'APPROVAL' ? 'APPROVAL' : 'PERSON';
  }
  throw new TypeError('Portable Canvas contains an unsupported element kind: ' + String(snapshot.kind));
}

function relationshipKind(snapshot: any): ProductCanvasInput['connections'][number]['kind'] {
  if (snapshot.kind === 'CONTROL_FLOW') return 'FLOW';
  if (snapshot.kind === 'CONDITIONAL_FLOW') return 'CONDITION';
  if (snapshot.kind === 'DEFAULT_FLOW') return 'DEFAULT';
  if (snapshot.kind === 'PARALLEL_FLOW') return 'PARALLEL';
  throw new TypeError('Portable Canvas contains an unsupported relationship kind: ' + String(snapshot.kind));
}

export function productCanvasInputFromNativeSource(
  value: unknown,
  initiatedBy: string,
): ProductCanvasInput {
  const source = record(value, 'nativeSource') as unknown as TalosCanvasNativeSource;
  if (source.schemaVersion !== 'talos-canvas-native-v0.2') throw new TypeError('Unsupported Talos Canvas schemaVersion');
  if (!source.canvasDefinition || !source.canvasRevision) throw new TypeError('Portable Canvas is missing its definition or revision');
  if (source.canvasDefinition.latestRevisionId !== source.canvasRevision.id) throw new TypeError('Portable Canvas latestRevisionId does not pin the exported revision');
  if (source.canvasRevision.canvasDefinitionId !== source.canvasDefinition.id) throw new TypeError('Portable Canvas definition/revision lineage mismatch');
  if (source.semanticDigestAlgorithmVersion !== source.canvasRevision.digestAlgorithmVersion
      || source.nativeDigestAlgorithmVersion !== source.canvasRevision.digestAlgorithmVersion) {
    throw new TypeError('Portable Canvas digest algorithm version mismatch');
  }
  if (JSON.stringify(source.elements) !== JSON.stringify(source.canvasRevision.elementSnapshots)
      || JSON.stringify(source.relationships) !== JSON.stringify(source.canvasRevision.relationshipSnapshots)
      || JSON.stringify(source.containerMemberships) !== JSON.stringify(source.canvasRevision.containerMemberships)) {
    throw new TypeError('Portable Canvas top-level snapshots do not match the pinned revision');
  }

  const rebuilt = buildCanvasRevision({
    id: source.canvasRevision.id,
    canvasDefinitionId: source.canvasRevision.canvasDefinitionId,
    revisionNumber: source.canvasRevision.revisionNumber,
    ...(source.canvasRevision.parentRevisionId ? { parentRevisionId: source.canvasRevision.parentRevisionId } : {}),
    createdAt: source.canvasRevision.createdAt,
    ...(source.canvasRevision.createdBy ? { createdBy: source.canvasRevision.createdBy } : {}),
    revisionKind: source.canvasRevision.revisionKind,
    changeSetId: source.canvasRevision.changeSetId,
    elements: source.elements.map(({ snapshotId: _snapshotId, canvasRevisionId: _canvasRevisionId, ...item }) => item),
    relationships: source.relationships.map(({ snapshotId: _snapshotId, canvasRevisionId: _canvasRevisionId, ...item }) => item),
    memberships: source.containerMemberships.map(({ canvasRevisionId: _canvasRevisionId, ...item }) => item),
    ...(source.canvasRevision.presentationSnapshot ? { presentationSnapshot: source.canvasRevision.presentationSnapshot } : {}),
    ...(source.canvasRevision.notes ? { notes: source.canvasRevision.notes } : {}),
  });
  if (rebuilt.semanticDigest !== source.canvasRevision.semanticDigest) throw new TypeError('Portable Canvas semantic digest verification failed');
  if (rebuilt.nativeRepresentationDigest !== source.canvasRevision.nativeRepresentationDigest) throw new TypeError('Portable Canvas native digest verification failed');

  const clientIds = new Map<string, string>();
  const elements = source.elements.map((snapshot, index) => {
    const id = 'import-' + String(index + 1);
    clientIds.set(snapshot.canvasElementId, id);
    const kind = elementKind(snapshot);
    return {
      id,
      kind,
      label: text(snapshot.label, 'Canvas element label'),
      ...(kind === 'WAIT' ? {
        waitKind: propertyText(snapshot.propertyValues?.waitKind),
        expression: propertyText(snapshot.propertyValues?.duration),
      } : {}),
    };
  });

  const connections = source.relationships.map((snapshot, index) => {
    if (snapshot.sourceEndpoint.state !== 'SET' || snapshot.targetEndpoint.state !== 'SET') {
      throw new TypeError('Portable Canvas contains an unconnected relationship endpoint');
    }
    const from = clientIds.get(snapshot.sourceEndpoint.elementId);
    const to = clientIds.get(snapshot.targetEndpoint.elementId);
    if (!from || !to) throw new TypeError('Portable Canvas relationship points outside the exported revision');
    const kind = relationshipKind(snapshot);
    const condition = kind === 'CONDITION' && snapshot.guard?.semanticState === 'SET'
      ? snapshot.guard.literalText
      : undefined;
    if (kind === 'CONDITION' && !condition?.trim()) throw new TypeError('Portable Canvas conditional flow is missing its business condition');
    return { id: 'import-connection-' + String(index + 1), from, to, kind, ...(condition ? { condition } : {}) };
  });

  const originalPresentation = source.canvasRevision.presentationSnapshot;
  const nodeLayouts = originalPresentation?.nodeLayouts?.flatMap((layout) => {
    if (!layout || typeof layout !== 'object' || Array.isArray(layout)) return [];
    const item = layout as Record<string, unknown>;
    const oldCanvasId = typeof item.canvasElementId === 'string' ? item.canvasElementId : undefined;
    const clientElementId = oldCanvasId ? clientIds.get(oldCanvasId) : undefined;
    return clientElementId ? [{ ...item, clientElementId }] : [];
  });
  const presentation = originalPresentation ? {
    ...originalPresentation,
    ...(nodeLayouts ? { nodeLayouts } : {}),
  } : undefined;

  return {
    title: source.canvasDefinition.title?.trim() || 'Imported Talos Canvas',
    initiatedBy: text(initiatedBy, 'initiatedBy'),
    elements,
    connections,
    ...(presentation ? { presentation } : {}),
  };
}
