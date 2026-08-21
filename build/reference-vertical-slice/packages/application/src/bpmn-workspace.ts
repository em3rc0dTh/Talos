import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import type { OpaqueId } from '../../foundation/src/ids.ts';
import { LocalImageByteStore } from '../../image-perception/src/byte-store.ts';
import { intakePngUpload } from '../../image-perception/src/intake.ts';
import {
  alignBpmnRevisionToCanonical,
  confirmBusinessProcess,
  createBpmnRoundTripEdit,
  createNativeBpmnImportRevision,
  type BpmnProcessRevision,
  type BusinessProcessConfirmationRecord,
} from '../../review/src/index.ts';
import type { CanonicalId } from '../../semantic-core/src/types.ts';

const BPMN_WORKSPACE_SCHEMA = 'talos-bpmn-workspace-v0.1';

export interface ImageWorkspaceIntakeResult {
  status: 'SOURCE_PRESERVED_INTERPRETATION_PENDING';
  sourceArtifactId: string;
  sourceRepresentationId: string;
  sourceContentSha256: string;
  width: number;
  height: number;
  mediaType: 'image/png';
  automaticConfirmationAuthorized: false;
  automaticExecutionAuthorized: false;
  nextRequiredStage: 'IMAGE_PERCEPTION';
}

export interface NativeBpmnWorkspaceImportResult {
  status: 'BPMN_READY_FOR_REVIEW';
  revision: BpmnProcessRevision;
  processIds: readonly string[];
  hasDiagramInterchange: boolean;
  warnings: readonly { message: string }[];
  automaticConfirmationAuthorized: false;
}

export interface BpmnWorkspaceEditResult {
  revision: BpmnProcessRevision;
  changeClass: 'NO_CHANGE' | 'VISUAL_ONLY' | 'SEMANTIC';
  requiresCanonicalReconciliation: boolean;
  hasDiagramInterchange: boolean;
  warnings: readonly { message: string }[];
}

function appendRevision(repo: ImmutableDocumentRepository, revision: BpmnProcessRevision): void {
  repo.append({
    id: revision.id as OpaqueId,
    aggregateKind: 'BpmnProcessRevision',
    schemaVersion: BPMN_WORKSPACE_SCHEMA,
    payload: revision,
    ...(revision.parentBpmnRevisionId ? { parentId: revision.parentBpmnRevisionId as OpaqueId } : {}),
    createdAt: revision.createdAt,
  });
}

function appendConfirmation(repo: ImmutableDocumentRepository, confirmation: BusinessProcessConfirmationRecord): void {
  repo.append({
    id: confirmation.id as OpaqueId,
    aggregateKind: 'BusinessProcessConfirmationRecord',
    schemaVersion: BPMN_WORKSPACE_SCHEMA,
    payload: confirmation,
    parentId: confirmation.bpmnRevisionId as OpaqueId,
    createdAt: confirmation.confirmedAt,
  });
}

export class BpmnWorkspaceService {
  readonly #repo: ImmutableDocumentRepository;
  readonly #byteStore: LocalImageByteStore;

  constructor(repo: ImmutableDocumentRepository, byteStore: LocalImageByteStore) {
    this.#repo = repo;
    this.#byteStore = byteStore;
  }

  #storedRevision(revisionId: string): BpmnProcessRevision | undefined {
    return this.#repo.get<BpmnProcessRevision>(revisionId as OpaqueId)?.payload;
  }

  #confirmationForRevision(revisionId: string): BusinessProcessConfirmationRecord | undefined {
    const records = this.#repo.listByKind<BusinessProcessConfirmationRecord>('BusinessProcessConfirmationRecord');
    for (let index = records.length - 1; index >= 0; index -= 1) {
      const record = records[index]!.payload;
      if (record.bpmnRevisionId === revisionId && record.status === 'CONFIRMED') return record;
    }
    return undefined;
  }

  #nextWorkspaceRevisionNumber(): number {
    const revisions = this.#repo.listByKind<BpmnProcessRevision>('BpmnProcessRevision');
    return revisions.reduce((highest, document) => Math.max(highest, document.payload.revisionNumber), 0) + 1;
  }

  intakeImage(input: {
    pngBytes: Uint8Array;
    declaredName?: string;
    initiatedBy?: string;
    receivedAt?: string;
  }): ImageWorkspaceIntakeResult {
    const intake = intakePngUpload(this.#repo, this.#byteStore, input.pngBytes, {
      ...(input.declaredName ? { declaredName: input.declaredName } : {}),
      ...(input.initiatedBy ? { initiatedBy: input.initiatedBy } : {}),
      ...(input.receivedAt ? { receivedAt: input.receivedAt } : {}),
      declaredDescription: 'Talos Process Confirmation workspace image upload',
    });

    return {
      status: 'SOURCE_PRESERVED_INTERPRETATION_PENDING',
      sourceArtifactId: intake.artifact.id,
      sourceRepresentationId: intake.representation.id,
      sourceContentSha256: intake.representation.contentHash,
      width: intake.coordinateSpace.width,
      height: intake.coordinateSpace.height,
      mediaType: 'image/png',
      automaticConfirmationAuthorized: false,
      automaticExecutionAuthorized: false,
      nextRequiredStage: 'IMAGE_PERCEPTION',
    };
  }

  async importNativeBpmn(input: {
    bpmnXml: string;
    declaredName?: string;
    initiatedBy: string;
    importedAt?: string;
  }): Promise<NativeBpmnWorkspaceImportResult> {
    const importedAt = input.importedAt ?? new Date().toISOString();
    const sourceRef = input.declaredName ? `native-bpmn:${input.declaredName}` : 'native-bpmn:upload';
    const { revision, inspection } = await createNativeBpmnImportRevision({
      bpmnXml: input.bpmnXml,
      sourceArtifactRefs: [sourceRef],
      sourceRepresentationRefs: [sourceRef],
      createdAt: importedAt,
      createdBy: input.initiatedBy,
      revisionNumber: this.#nextWorkspaceRevisionNumber(),
    });
    appendRevision(this.#repo, revision);
    return {
      status: 'BPMN_READY_FOR_REVIEW',
      revision,
      processIds: inspection.processIds,
      hasDiagramInterchange: inspection.hasDiagramInterchange,
      warnings: inspection.warnings,
      automaticConfirmationAuthorized: false,
    };
  }

  getRevision(revisionId: string): BpmnProcessRevision | undefined {
    const stored = this.#storedRevision(revisionId);
    if (!stored) return undefined;
    const confirmation = this.#confirmationForRevision(revisionId);
    return confirmation ? { ...stored, state: 'CONFIRMED' } : stored;
  }

  async edit(input: {
    baseRevisionId: string;
    editedBpmnXml: string;
    editMode: 'GRAPH_EDIT' | 'XML_EDIT';
    editedBy: string;
    editedAt?: string;
  }): Promise<BpmnWorkspaceEditResult> {
    const baseRevision = this.getRevision(input.baseRevisionId);
    if (!baseRevision) throw new TypeError('BPMN workspace base revision not found');
    const result = await createBpmnRoundTripEdit({
      baseRevision,
      editedBpmnXml: input.editedBpmnXml,
      editMode: input.editMode,
      createdAt: input.editedAt ?? new Date().toISOString(),
      createdBy: input.editedBy,
      revisionNumber: this.#nextWorkspaceRevisionNumber(),
    });
    appendRevision(this.#repo, result.revision);
    return {
      revision: result.revision,
      changeClass: result.changeClass,
      requiresCanonicalReconciliation: result.requiresCanonicalReconciliation,
      hasDiagramInterchange: result.editedInspection.hasDiagramInterchange,
      warnings: result.editedInspection.warnings,
    };
  }

  realignToCanonical(input: {
    revisionId: string;
    canonicalProcessRevisionId: CanonicalId;
    alignedBy: string;
    authorityRef: string;
    alignedAt?: string;
  }): BpmnProcessRevision {
    const revision = this.getRevision(input.revisionId);
    if (!revision) throw new TypeError('BPMN workspace revision not found');
    const aligned = alignBpmnRevisionToCanonical(revision, {
      canonicalProcessRevisionId: input.canonicalProcessRevisionId,
      alignedBy: input.alignedBy,
      alignedAt: input.alignedAt ?? new Date().toISOString(),
      authorityRef: input.authorityRef,
      revisionNumber: this.#nextWorkspaceRevisionNumber(),
    });
    appendRevision(this.#repo, aligned);
    return aligned;
  }

  confirm(input: {
    revisionId: string;
    canonicalProcessRevisionId: CanonicalId;
    confirmedBy: string;
    authorityRef: string;
    rationale?: string;
    confirmedAt?: string;
  }): { revision: BpmnProcessRevision; confirmation: BusinessProcessConfirmationRecord } {
    const revision = this.getRevision(input.revisionId);
    if (!revision) throw new TypeError('BPMN workspace revision not found');
    const result = confirmBusinessProcess(revision, {
      canonicalProcessRevisionId: input.canonicalProcessRevisionId,
      confirmedBy: input.confirmedBy,
      confirmedAt: input.confirmedAt ?? new Date().toISOString(),
      authorityRef: input.authorityRef,
      ...(input.rationale ? { rationale: input.rationale } : {}),
    });

    // The original BPMN revision remains immutable. Confirmation is an
    // independent append-only authority record; getRevision() derives the
    // effective CONFIRMED view from that record instead of rewriting payload.
    appendConfirmation(this.#repo, result.confirmation);
    return { revision: { ...revision, state: 'CONFIRMED' }, confirmation: result.confirmation };
  }
}
