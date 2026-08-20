import { digestDeterministicJson } from '../../foundation/src/digest.ts';
import type {
  BusinessRule,
  CanonicalId,
  ProcessEdge,
  ProcessNode,
  ProcessRevision,
  ProvenanceId,
} from '../../semantic-core/src/types.ts';
import {
  createBpmnProcessRevision,
  type BpmnInputRoute,
  type BpmnProcessRevision,
} from './bpmn-confirmation.ts';

export const BPMN_PROJECTOR_VERSION = 'talos-bpmn-projector-v0.1';

export type BpmnProjectionDiagnosticCode =
  | 'UNSUPPORTED_NODE_KIND'
  | 'UNSUPPORTED_EDGE_KIND'
  | 'UNPROJECTABLE_EDGE_ENDPOINT'
  | 'DECISION_NOT_EXCLUSIVE_BY_SEMANTICS'
  | 'WAIT_EXECUTION_TIMING_NOT_MATERIALIZED'
  | 'MULTIPLE_ACTORS_PRESERVED_AS_REFERENCES'
  | 'RULE_REFERENCE_MISSING';

export interface BpmnProjectionDiagnostic {
  code: BpmnProjectionDiagnosticCode;
  targetRef: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
}

export interface BpmnElementProjectionMapping {
  bpmnElementId: string;
  canonicalRef: CanonicalId;
  canonicalKind: 'NODE' | 'EDGE';
  provenanceRefs: ProvenanceId[];
  sourceArtifactIds: string[];
}

export interface BpmnProjectionResult {
  projectorVersion: typeof BPMN_PROJECTOR_VERSION;
  sourceRoute: Exclude<BpmnInputRoute, 'NATIVE_BPMN'>;
  processRevisionId: CanonicalId;
  sourceArtifactIds: string[];
  bpmnRevision: BpmnProcessRevision;
  elementMappings: BpmnElementProjectionMapping[];
  diagnostics: BpmnProjectionDiagnostic[];
  unprojectableCanonicalRefs: CanonicalId[];
}

type ProjectedNodeKind =
  | 'startEvent'
  | 'endEvent'
  | 'task'
  | 'userTask'
  | 'exclusiveGateway'
  | 'parallelGateway'
  | 'intermediateCatchEvent'
  | 'subProcess';

interface ProjectedNode {
  canonical: ProcessNode;
  bpmnId: string;
  kind: ProjectedNodeKind;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ProjectedEdge {
  canonical: ProcessEdge;
  bpmnId: string;
  sourceBpmnId: string;
  targetBpmnId: string;
  rule?: BusinessRule;
}

function xmlEscape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function xmlId(prefix: string, canonicalRef: string): string {
  const safe = canonicalRef.replace(/[^A-Za-z0-9_.-]/g, '_');
  const normalized = /^[A-Za-z_]/.test(safe) ? safe : `_${safe}`;
  return `${prefix}_${normalized}`;
}

function sorted<T extends { id: string }>(values: T[]): T[] {
  return [...values].sort((a, b) => a.id.localeCompare(b.id));
}

function semanticProjectionDigest(process: ProcessRevision): string {
  return digestDeterministicJson({
    processRevisionId: process.id,
    nodes: sorted(process.nodes).map((node) => ({
      id: node.id,
      kind: node.kind,
      name: node.name ?? null,
      actorRefs: [...node.actorRefs].sort(),
      ruleRefs: [...node.ruleRefs].sort(),
      truthClass: node.truthClass,
      details: node.details ?? null,
    })),
    edges: sorted(process.edges).map((edge) => ({
      id: edge.id,
      sourceNodeId: edge.sourceNodeId,
      targetNodeId: edge.targetNodeId,
      kind: edge.kind,
      conditionRuleRef: edge.conditionRuleRef ?? null,
      label: edge.label ?? null,
      truthClass: edge.truthClass,
    })),
    rules: sorted(process.rules).map((rule) => ({
      id: rule.id,
      naturalLanguage: rule.naturalLanguage,
      expression: rule.expression ?? null,
      truthClass: rule.truthClass,
    })),
  });
}

function initialLayoutDigest(nodes: ProjectedNode[]): string {
  return digestDeterministicJson(nodes.map((node) => ({
    bpmnId: node.bpmnId,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
  })));
}

function incomingCount(process: ProcessRevision, nodeId: CanonicalId): number {
  return process.edges.filter((edge) => edge.targetNodeId === nodeId).length;
}

function outgoing(process: ProcessRevision, nodeId: CanonicalId): ProcessEdge[] {
  return process.edges.filter((edge) => edge.sourceNodeId === nodeId);
}

function chooseNodeKind(
  process: ProcessRevision,
  node: ProcessNode,
  diagnostics: BpmnProjectionDiagnostic[],
): ProjectedNodeKind | undefined {
  switch (node.kind) {
    case 'EVENT':
      if (incomingCount(process, node.id) === 0) return 'startEvent';
      return 'intermediateCatchEvent';
    case 'END':
      return 'endEvent';
    case 'ACTION':
      return 'task';
    case 'HUMAN_INTERACTION':
      return 'userTask';
    case 'DECISION': {
      const branches = outgoing(process, node.id);
      const exclusive = branches.length >= 2
        && branches.every((edge) => edge.kind === 'CONDITIONAL' || edge.kind === 'DEFAULT');
      if (!exclusive) {
        diagnostics.push({
          code: 'DECISION_NOT_EXCLUSIVE_BY_SEMANTICS',
          targetRef: node.id,
          severity: 'ERROR',
          message: 'DECISION was not projected as an exclusive gateway because its outgoing canonical edges do not establish exclusive/default branch semantics.',
        });
        return undefined;
      }
      return 'exclusiveGateway';
    }
    case 'PARALLEL_SPLIT':
    case 'JOIN':
      return 'parallelGateway';
    case 'WAIT':
      diagnostics.push({
        code: 'WAIT_EXECUTION_TIMING_NOT_MATERIALIZED',
        targetRef: node.id,
        severity: 'INFO',
        message: 'WAIT is rendered for business review without a BPMN timerEventDefinition. Executable timing belongs to later automation design.',
      });
      return 'intermediateCatchEvent';
    case 'SUBPROCESS':
      return 'subProcess';
    case 'STATE':
    default:
      diagnostics.push({
        code: 'UNSUPPORTED_NODE_KIND',
        targetRef: node.id,
        severity: 'WARNING',
        message: `Canonical node kind ${node.kind} has no loss-aware BPMN v0.1 projection rule.`,
      });
      return undefined;
  }
}

function dimensions(kind: ProjectedNodeKind): { width: number; height: number } {
  switch (kind) {
    case 'startEvent':
    case 'endEvent':
    case 'intermediateCatchEvent':
      return { width: 36, height: 36 };
    case 'exclusiveGateway':
    case 'parallelGateway':
      return { width: 50, height: 50 };
    case 'subProcess':
      return { width: 140, height: 90 };
    default:
      return { width: 120, height: 80 };
  }
}

function deterministicLayout(process: ProcessRevision, projectedKinds: Map<CanonicalId, ProjectedNodeKind>): ProjectedNode[] {
  const projectedIds = new Set(projectedKinds.keys());
  const orderedNodes = sorted(process.nodes.filter((node) => projectedIds.has(node.id)));
  const depth = new Map<CanonicalId, number>();
  const roots = orderedNodes.filter((node) => process.edges.every((edge) => edge.targetNodeId !== node.id || !projectedIds.has(edge.sourceNodeId)));
  roots.forEach((node) => depth.set(node.id, 0));

  for (let pass = 0; pass < orderedNodes.length; pass += 1) {
    let changed = false;
    for (const edge of sorted(process.edges)) {
      if (!projectedIds.has(edge.sourceNodeId) || !projectedIds.has(edge.targetNodeId)) continue;
      const sourceDepth = depth.get(edge.sourceNodeId);
      if (sourceDepth === undefined) continue;
      const candidate = sourceDepth + 1;
      const current = depth.get(edge.targetNodeId);
      if (current === undefined || candidate > current) {
        depth.set(edge.targetNodeId, candidate);
        changed = true;
      }
    }
    if (!changed) break;
  }

  let fallbackDepth = Math.max(0, ...depth.values()) + 1;
  for (const node of orderedNodes) {
    if (!depth.has(node.id)) {
      depth.set(node.id, fallbackDepth);
      fallbackDepth += 1;
    }
  }

  const laneIndexByDepth = new Map<number, number>();
  return orderedNodes.map((node) => {
    const d = depth.get(node.id) ?? 0;
    const row = laneIndexByDepth.get(d) ?? 0;
    laneIndexByDepth.set(d, row + 1);
    const kind = projectedKinds.get(node.id)!;
    const size = dimensions(kind);
    return {
      canonical: node,
      bpmnId: xmlId('Node', node.id),
      kind,
      x: 120 + d * 210,
      y: 100 + row * 140,
      ...size,
    };
  });
}

function extensionElements(node: ProcessNode): string {
  const actorRefs = [...node.actorRefs].sort();
  if (actorRefs.length === 0) return '';
  const refs = actorRefs.map((actorRef) => `<talos:actorRef canonicalRef="${xmlEscape(actorRef)}"/>`).join('');
  return `<bpmn:extensionElements>${refs}</bpmn:extensionElements>`;
}

function renderNode(node: ProjectedNode): string {
  const name = node.canonical.name ? ` name="${xmlEscape(node.canonical.name)}"` : '';
  const ext = extensionElements(node.canonical);
  if (node.kind === 'subProcess') {
    return `<bpmn:subProcess id="${node.bpmnId}"${name}>${ext}</bpmn:subProcess>`;
  }
  return `<bpmn:${node.kind} id="${node.bpmnId}"${name}>${ext}</bpmn:${node.kind}>`;
}

function renderRule(edge: ProjectedEdge): string {
  if (!edge.rule) return '';
  const expression = edge.rule.expression === undefined
    ? edge.rule.naturalLanguage
    : JSON.stringify(edge.rule.expression);
  return `<bpmn:extensionElements><talos:businessRuleRef canonicalRef="${xmlEscape(edge.rule.id)}"/></bpmn:extensionElements><bpmn:conditionExpression xsi:type="bpmn:tFormalExpression" language="urn:talos:canonical-business-rule">${xmlEscape(expression)}</bpmn:conditionExpression>`;
}

function renderEdge(edge: ProjectedEdge): string {
  const name = edge.canonical.label ? ` name="${xmlEscape(edge.canonical.label)}"` : '';
  return `<bpmn:sequenceFlow id="${edge.bpmnId}" sourceRef="${edge.sourceBpmnId}" targetRef="${edge.targetBpmnId}"${name}>${renderRule(edge)}</bpmn:sequenceFlow>`;
}

function renderDi(nodes: ProjectedNode[], edges: ProjectedEdge[]): string {
  const nodeByBpmnId = new Map(nodes.map((node) => [node.bpmnId, node]));
  const shapes = nodes.map((node) => `<bpmndi:BPMNShape id="DI_${node.bpmnId}" bpmnElement="${node.bpmnId}"><dc:Bounds x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}"/></bpmndi:BPMNShape>`).join('');
  const edgeDi = edges.map((edge) => {
    const source = nodeByBpmnId.get(edge.sourceBpmnId)!;
    const target = nodeByBpmnId.get(edge.targetBpmnId)!;
    const x1 = source.x + source.width;
    const y1 = source.y + source.height / 2;
    const x2 = target.x;
    const y2 = target.y + target.height / 2;
    return `<bpmndi:BPMNEdge id="DI_${edge.bpmnId}" bpmnElement="${edge.bpmnId}"><di:waypoint x="${x1}" y="${y1}"/><di:waypoint x="${x2}" y="${y2}"/></bpmndi:BPMNEdge>`;
  }).join('');
  return `<bpmndi:BPMNDiagram id="Talos_BPMNDiagram"><bpmndi:BPMNPlane id="Talos_BPMNPlane" bpmnElement="Talos_Process">${shapes}${edgeDi}</bpmndi:BPMNPlane></bpmndi:BPMNDiagram>`;
}

export function projectCanonicalProcessToBpmn(input: {
  processRevision: ProcessRevision;
  sourceRoute: Exclude<BpmnInputRoute, 'NATIVE_BPMN'>;
  createdAt: string;
  createdBy: string;
  revisionNumber?: number;
}): BpmnProjectionResult {
  const process = input.processRevision;
  const diagnostics: BpmnProjectionDiagnostic[] = [];
  const unprojectable = new Set<CanonicalId>();
  const kinds = new Map<CanonicalId, ProjectedNodeKind>();

  for (const node of sorted(process.nodes)) {
    const kind = chooseNodeKind(process, node, diagnostics);
    if (kind) kinds.set(node.id, kind);
    else unprojectable.add(node.id);
    if (node.actorRefs.length > 1) {
      diagnostics.push({
        code: 'MULTIPLE_ACTORS_PRESERVED_AS_REFERENCES',
        targetRef: node.id,
        severity: 'INFO',
        message: 'Multiple canonical actor assignments are preserved as Talos BPMN extension references; lane projection is deferred.',
      });
    }
  }

  const nodes = deterministicLayout(process, kinds);
  const nodeByCanonical = new Map(nodes.map((node) => [node.canonical.id, node]));
  const ruleById = new Map(process.rules.map((rule) => [rule.id, rule]));
  const edges: ProjectedEdge[] = [];

  for (const edge of sorted(process.edges)) {
    if (!['SEQUENCE', 'CONDITIONAL', 'DEFAULT', 'PARALLEL'].includes(edge.kind)) {
      diagnostics.push({
        code: 'UNSUPPORTED_EDGE_KIND',
        targetRef: edge.id,
        severity: 'WARNING',
        message: `Canonical edge kind ${edge.kind} has no BPMN sequence-flow projection rule in v0.1.`,
      });
      unprojectable.add(edge.id);
      continue;
    }
    const source = nodeByCanonical.get(edge.sourceNodeId);
    const target = nodeByCanonical.get(edge.targetNodeId);
    if (!source || !target) {
      diagnostics.push({
        code: 'UNPROJECTABLE_EDGE_ENDPOINT',
        targetRef: edge.id,
        severity: 'WARNING',
        message: 'Edge is preserved as an unprojectable diagnostic because at least one endpoint has no loss-aware BPMN projection.',
      });
      unprojectable.add(edge.id);
      continue;
    }
    const rule = edge.conditionRuleRef ? ruleById.get(edge.conditionRuleRef) : undefined;
    if (edge.conditionRuleRef && !rule) {
      diagnostics.push({
        code: 'RULE_REFERENCE_MISSING',
        targetRef: edge.id,
        severity: 'ERROR',
        message: `Conditional edge references missing canonical BusinessRule ${edge.conditionRuleRef}.`,
      });
      unprojectable.add(edge.id);
      continue;
    }
    edges.push({
      canonical: edge,
      bpmnId: xmlId('Flow', edge.id),
      sourceBpmnId: source.bpmnId,
      targetBpmnId: target.bpmnId,
      ...(rule ? { rule } : {}),
    });
  }

  const processBody = `${nodes.map(renderNode).join('')}${edges.map(renderEdge).join('')}`;
  const bpmnXml = `<?xml version="1.0" encoding="UTF-8"?><bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:talos="urn:talos:bpmn:extensions:v0.1" id="Talos_Definitions" targetNamespace="urn:talos:process-review"><bpmn:process id="Talos_Process" isExecutable="false">${processBody}</bpmn:process>${renderDi(nodes, edges)}</bpmn:definitions>`;

  const semanticDigest = semanticProjectionDigest(process);
  const diagramDigest = initialLayoutDigest(nodes);
  const bpmnRevision = createBpmnProcessRevision({
    revisionNumber: input.revisionNumber ?? 1,
    sourceRoute: input.sourceRoute,
    editMode: 'INITIAL_PROJECTION',
    sourceArtifactRefs: [...process.sourceArtifactIds],
    canonicalProcessRevisionId: process.id,
    bpmnXml,
    semanticDigest,
    diagramDigest,
    createdAt: input.createdAt,
    createdBy: input.createdBy,
  });

  const sourceArtifactIds = [...process.sourceArtifactIds].sort();
  const elementMappings: BpmnElementProjectionMapping[] = [
    ...nodes.map((node) => ({
      bpmnElementId: node.bpmnId,
      canonicalRef: node.canonical.id,
      canonicalKind: 'NODE' as const,
      provenanceRefs: [...node.canonical.provenanceRefs].sort(),
      sourceArtifactIds,
    })),
    ...edges.map((edge) => ({
      bpmnElementId: edge.bpmnId,
      canonicalRef: edge.canonical.id,
      canonicalKind: 'EDGE' as const,
      provenanceRefs: [...edge.canonical.provenanceRefs].sort(),
      sourceArtifactIds,
    })),
  ].sort((a, b) => a.bpmnElementId.localeCompare(b.bpmnElementId));

  return {
    projectorVersion: BPMN_PROJECTOR_VERSION,
    sourceRoute: input.sourceRoute,
    processRevisionId: process.id,
    sourceArtifactIds,
    bpmnRevision,
    elementMappings,
    diagnostics,
    unprojectableCanonicalRefs: [...unprojectable].sort(),
  };
}
