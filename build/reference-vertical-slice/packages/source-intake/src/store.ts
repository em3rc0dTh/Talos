import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import { createOpaqueId, type OpaqueId } from '../../foundation/src/ids.ts';
import type { AdapterAttemptCompletion,AdapterAttemptStart,AdapterAttemptView,AdapterDiagnostic,AdapterResult,SourceId } from './types.ts';

function normalizeAppendPayload<T>(aggregateKind:string,payload:T):T{
  if(aggregateKind!=='SourcePropertyEvidenceDescriptor'||!payload||typeof payload!=='object'||Array.isArray(payload))return payload;
  const record=payload as Record<string,unknown>;
  if(!Object.prototype.hasOwnProperty.call(record,'literalValue')||record.literalValue!==undefined)return payload;
  const {literalValue:_omitted,...rest}=record;
  return rest as T;
}

export function appendRecord<T>(repo:ImmutableDocumentRepository, aggregateKind:string, payload:T, createdAt:string, documentId?:OpaqueId, parentId?:OpaqueId):OpaqueId {
  const id=documentId??createOpaqueId('source');
  const normalizedPayload=normalizeAppendPayload(aggregateKind,payload);
  repo.append({id,aggregateKind,schemaVersion:'reference-v1',payload:normalizedPayload,...(parentId?{parentId}:{}),createdAt});
  return id;
}

export function getAttemptView(repo:ImmutableDocumentRepository, attemptId:SourceId):AdapterAttemptView|undefined{
  const starts=repo.listByKind<AdapterAttemptStart>('AdapterAttemptStart').filter(d=>d.payload.id===attemptId);
  if(starts.length===0)return undefined;
  const start=starts.at(-1)!.payload;
  const completion=repo.listByKind<AdapterAttemptCompletion>('AdapterAttemptCompletion').map(d=>d.payload).filter(c=>c.adapterAttemptId===attemptId).at(-1);
  const diagnostics=repo.listByKind<AdapterDiagnostic>('AdapterDiagnostic').map(d=>d.payload).filter(d=>d.adapterAttemptId===attemptId);
  const result=completion?.resultId?repo.listByKind<AdapterResult>('AdapterResult').map(d=>d.payload).find(r=>r.id===completion.resultId):undefined;
  return {start,...(completion?{completion}:{}),diagnostics,...(result?{result}: {})};
}

export function findSuccessfulResultByFingerprint(repo:ImmutableDocumentRepository,fingerprint:string):AdapterResult|undefined{
  const completions=repo.listByKind<AdapterAttemptCompletion>('AdapterAttemptCompletion').map(d=>d.payload);
  return repo.listByKind<AdapterResult>('AdapterResult').map(d=>d.payload).find(r=>r.inputFingerprint===fingerprint&&completions.some(c=>c.adapterAttemptId===r.adapterAttemptId&&c.status==='SUCCEEDED'&&c.resultId===r.id));
}
