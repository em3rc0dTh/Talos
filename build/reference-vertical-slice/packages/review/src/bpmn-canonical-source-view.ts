import { BpmnModdle } from 'bpmn-moddle';
import { inspectBpmnXml, type BpmnXmlWarning } from './bpmn-roundtrip.ts';
import { talosBpmnModdleDescriptor } from './talos-bpmn-moddle.ts';

export const BPMN_CANONICAL_SOURCE_VIEW_VERSION = 'talos-bpmn-canonical-source-view-v0.1';

export interface BpmnCanonicalSourceLane {
  id: string;
  name?: string;
  flowNodeIds: string[];
}

export interface BpmnCanonicalSourceNode {
  id: string;
  type: string;
  name?: string;
  incomingCount: number;
  outgoingCount: number;
}

export interface BpmnCanonicalSourceFlow {
  id: string;
  sourceId: string;
  targetId: string;
  name?: string;
  isDefault: boolean;
  conditionBody?: string;
  conditionLanguage?: string;
}

export interface BpmnCanonicalSourceProcess {
  id: string;
  name?: string;
  lanes: BpmnCanonicalSourceLane[];
  nodes: BpmnCanonicalSourceNode[];
  flows: BpmnCanonicalSourceFlow[];
}

export interface BpmnCanonicalSourceView {
  version: typeof BPMN_CANONICAL_SOURCE_VIEW_VERSION;
  originalXmlSha256: string;
  semanticDigest: string;
  processes: BpmnCanonicalSourceProcess[];
  warnings: BpmnXmlWarning[];
}

type AnyRecord = Record<string, any>;

function createModdle(): BpmnModdle {
  return new BpmnModdle({ talos: talosBpmnModdleDescriptor as any });
}

function idOf(value: AnyRecord | undefined): string {
  return typeof value?.id === 'string' && value.id ? value.id : '';
}

function nameOf(value: AnyRecord | undefined): string | undefined {
  const name = typeof value?.name === 'string' ? value.name.trim() : '';
  return name || undefined;
}

function flattenLanes(process: AnyRecord): BpmnCanonicalSourceLane[] {
  const lanes: BpmnCanonicalSourceLane[] = [];
  const visit = (lane: AnyRecord) => {
    const id = idOf(lane);
    if (id) {
      lanes.push({
        id,
        ...(nameOf(lane) ? { name: nameOf(lane) } : {}),
        flowNodeIds: (lane.flowNodeRef ?? []).map((node: AnyRecord) => idOf(node)).filter(Boolean).sort(),
      });
    }
    for (const child of lane.childLaneSet?.lanes ?? []) visit(child);
  };
  for (const laneSet of process.laneSets ?? []) {
    for (const lane of laneSet.lanes ?? []) visit(lane);
  }
  return lanes.sort((left, right) => left.id.localeCompare(right.id));
}

function processView(process: AnyRecord): BpmnCanonicalSourceProcess {
  const flowElements: AnyRecord[] = process.flowElements ?? [];
  const sequenceFlows = flowElements.filter((element) => element.$type === 'bpmn:SequenceFlow');
  const flowNodes = flowElements.filter((element) => element.$type !== 'bpmn:SequenceFlow');
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();

  for (const flow of sequenceFlows) {
    const sourceId = idOf(flow.sourceRef);
    const targetId = idOf(flow.targetRef);
    if (sourceId) outgoing.set(sourceId, (outgoing.get(sourceId) ?? 0) + 1);
    if (targetId) incoming.set(targetId, (incoming.get(targetId) ?? 0) + 1);
  }

  const nodes: BpmnCanonicalSourceNode[] = flowNodes
    .map((element) => {
      const id = idOf(element);
      return {
        id,
        type: typeof element.$type === 'string' ? element.$type : 'UNKNOWN',
        ...(nameOf(element) ? { name: nameOf(element) } : {}),
        incomingCount: incoming.get(id) ?? 0,
        outgoingCount: outgoing.get(id) ?? 0,
      };
    })
    .filter((node) => node.id)
    .sort((left, right) => left.id.localeCompare(right.id));

  const flows: BpmnCanonicalSourceFlow[] = sequenceFlows
    .map((flow) => {
      const id = idOf(flow);
      const sourceId = idOf(flow.sourceRef);
      const targetId = idOf(flow.targetRef);
      const conditionBody = typeof flow.conditionExpression?.body === 'string'
        ? flow.conditionExpression.body.trim()
        : typeof flow.conditionExpression === 'string'
          ? flow.conditionExpression.trim()
          : '';
      const conditionLanguage = typeof flow.conditionExpression?.language === 'string'
        ? flow.conditionExpression.language.trim()
        : '';
      return {
        id,
        sourceId,
        targetId,
        ...(nameOf(flow) ? { name: nameOf(flow) } : {}),
        isDefault: Boolean(flow.sourceRef?.default && idOf(flow.sourceRef.default) === id),
        ...(conditionBody ? { conditionBody } : {}),
        ...(conditionLanguage ? { conditionLanguage } : {}),
      };
    })
    .filter((flow) => flow.id && flow.sourceId && flow.targetId)
    .sort((left, right) => left.id.localeCompare(right.id));

  return {
    id: idOf(process),
    ...(nameOf(process) ? { name: nameOf(process) } : {}),
    lanes: flattenLanes(process),
    nodes,
    flows,
  };
}

/**
 * Parse exact BPMN XML into a plain, dependency-free source view for upper layers.
 *
 * This boundary deliberately performs no Talos canonical-ID creation, no semantic
 * readiness judgment, no confirmation, and no execution mapping. `review` owns
 * the BPMN parser dependency; `application` receives only source facts.
 */
export async function buildBpmnCanonicalSourceView(xml: string): Promise<BpmnCanonicalSourceView> {
  const inspection = await inspectBpmnXml(xml);
  const moddle = createModdle();
  const parsed = await moddle.fromXML(xml);
  const definitions = parsed.rootElement as AnyRecord;
  const processes = (definitions.rootElements ?? [])
    .filter((element: AnyRecord) => element.$type === 'bpmn:Process')
    .map(processView)
    .sort((left: BpmnCanonicalSourceProcess, right: BpmnCanonicalSourceProcess) => left.id.localeCompare(right.id));

  return {
    version: BPMN_CANONICAL_SOURCE_VIEW_VERSION,
    originalXmlSha256: inspection.originalXmlSha256,
    semanticDigest: inspection.modelSemanticDigest,
    processes,
    warnings: inspection.warnings,
  };
}
