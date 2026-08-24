import { createHash } from 'node:crypto';
import { ApplicationFailure } from '@temporalio/activity';
import type { GenericCapabilityActivityInput,GenericCapabilityActivityResult } from './generic-contracts.ts';

export interface GenericEffectIdentity { effectKey:string; inputDigest:string; }
export interface GenericExternalCapabilityEffect {
  effectStatus:'INSERTED'|'DUPLICATE_IDENTICAL';
  transportRef:string;
  externalEffectRef:string;
  evidenceRefs:string[];
}
export interface GenericCapabilityTransport {
  readonly transportRef:string;
  execute(input:GenericCapabilityActivityInput,identity:GenericEffectIdentity):Promise<GenericExternalCapabilityEffect>;
}
export interface GenericEffectRecord {
  effectKey:string;
  capabilityUseOccurrenceRef:string;
  executionId:string;
  inputDigest:string;
  createdAt:string;
  transportRef?:string;
  externalEffectRef?:string;
  evidenceRefs?:string[];
}

export function genericEffectIdentity(input:GenericCapabilityActivityInput):GenericEffectIdentity{
  return{
    effectKey:createHash('sha256').update(`${input.executionId}:${input.capabilityUseOccurrenceRef}`).digest('hex'),
    inputDigest:createHash('sha256').update(JSON.stringify(input.input??null)).digest('hex'),
  };
}

function resultFromRecord(record:GenericEffectRecord,effectStatus:'INSERTED'|'DUPLICATE_IDENTICAL'):GenericCapabilityActivityResult{
  return{
    outcome:'COMPLETED',
    capabilityUseOccurrenceRef:record.capabilityUseOccurrenceRef,
    effectKey:record.effectKey,
    effectStatus,
    ...(record.transportRef?{transportRef:record.transportRef}:{}),
    ...(record.externalEffectRef?{externalEffectRef:record.externalEffectRef}:{}),
    ...(record.evidenceRefs?{evidenceRefs:[...record.evidenceRefs]}:{}),
  };
}

export class GenericEffectLedger {
  private readonly effects=new Map<string,GenericEffectRecord>();
  list():GenericEffectRecord[]{return [...this.effects.values()].map(x=>({...x,...(x.evidenceRefs?{evidenceRefs:[...x.evidenceRefs]}:{})}));}
  lookup(input:GenericCapabilityActivityInput):GenericCapabilityActivityResult|undefined{
    const identity=genericEffectIdentity(input);
    const prior=this.effects.get(identity.effectKey);
    if(!prior)return undefined;
    if(prior.inputDigest!==identity.inputDigest)throw ApplicationFailure.nonRetryable('Idempotency key reused with different generic capability input','GENERIC_IDEMPOTENCY_CONFLICT');
    return resultFromRecord(prior,'DUPLICATE_IDENTICAL');
  }
  record(input:GenericCapabilityActivityInput,external?:GenericExternalCapabilityEffect):GenericCapabilityActivityResult{
    const identity=genericEffectIdentity(input);
    const prior=this.effects.get(identity.effectKey);
    if(prior){
      if(prior.inputDigest!==identity.inputDigest)throw ApplicationFailure.nonRetryable('Idempotency key reused with different generic capability input','GENERIC_IDEMPOTENCY_CONFLICT');
      return resultFromRecord(prior,'DUPLICATE_IDENTICAL');
    }
    const record:GenericEffectRecord={
      effectKey:identity.effectKey,
      capabilityUseOccurrenceRef:input.capabilityUseOccurrenceRef,
      executionId:input.executionId,
      inputDigest:identity.inputDigest,
      createdAt:new Date().toISOString(),
      ...(external?{
        transportRef:external.transportRef,
        externalEffectRef:external.externalEffectRef,
        evidenceRefs:[...external.evidenceRefs],
      }:{}),
    };
    this.effects.set(identity.effectKey,record);
    return resultFromRecord(record,external?.effectStatus??'INSERTED');
  }
}

export function createGenericActivities(ledger:GenericEffectLedger,transport?:GenericCapabilityTransport){
  return{async executeGenericCapability(input:GenericCapabilityActivityInput):Promise<GenericCapabilityActivityResult>{
    if(!input.executionId||!input.capabilityUseOccurrenceRef)throw ApplicationFailure.nonRetryable('Generic capability Activity input is incomplete','INVALID_GENERIC_CAPABILITY_REQUEST');
    const prior=ledger.lookup(input);
    if(prior)return prior;
    if(!transport)return ledger.record(input);
    const identity=genericEffectIdentity(input);
    const external=await transport.execute(input,identity);
    if(external.transportRef!==transport.transportRef)throw ApplicationFailure.nonRetryable('External capability transport returned a mismatched transport reference','INVALID_EXTERNAL_CAPABILITY_EVIDENCE');
    if(!external.externalEffectRef||!Array.isArray(external.evidenceRefs)||external.evidenceRefs.length===0)throw ApplicationFailure.nonRetryable('External capability transport did not return concrete effect evidence','INVALID_EXTERNAL_CAPABILITY_EVIDENCE');
    return ledger.record(input,external);
  }};
}
