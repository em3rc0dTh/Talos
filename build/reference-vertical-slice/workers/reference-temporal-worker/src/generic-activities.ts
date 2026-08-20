import { createHash } from 'node:crypto';
import { ApplicationFailure } from '@temporalio/activity';
import type { GenericCapabilityActivityInput,GenericCapabilityActivityResult } from './generic-contracts.ts';

export interface GenericEffectRecord { effectKey:string; capabilityUseOccurrenceRef:string; executionId:string; inputDigest:string; createdAt:string; }
export class GenericEffectLedger {
  private readonly effects=new Map<string,GenericEffectRecord>();
  list():GenericEffectRecord[]{return [...this.effects.values()].map(x=>({...x}));}
  record(input:GenericCapabilityActivityInput):GenericCapabilityActivityResult{
    const effectKey=createHash('sha256').update(`${input.executionId}:${input.capabilityUseOccurrenceRef}`).digest('hex');
    const inputDigest=createHash('sha256').update(JSON.stringify(input.input??null)).digest('hex');
    const prior=this.effects.get(effectKey);
    if(prior){
      if(prior.inputDigest!==inputDigest)throw ApplicationFailure.nonRetryable('Idempotency key reused with different generic capability input','GENERIC_IDEMPOTENCY_CONFLICT');
      return{outcome:'COMPLETED',capabilityUseOccurrenceRef:input.capabilityUseOccurrenceRef,effectKey,effectStatus:'DUPLICATE_IDENTICAL'};
    }
    this.effects.set(effectKey,{effectKey,capabilityUseOccurrenceRef:input.capabilityUseOccurrenceRef,executionId:input.executionId,inputDigest,createdAt:new Date().toISOString()});
    return{outcome:'COMPLETED',capabilityUseOccurrenceRef:input.capabilityUseOccurrenceRef,effectKey,effectStatus:'INSERTED'};
  }
}
export function createGenericActivities(ledger:GenericEffectLedger){
  return{async executeGenericCapability(input:GenericCapabilityActivityInput):Promise<GenericCapabilityActivityResult>{
    if(!input.executionId||!input.capabilityUseOccurrenceRef)throw ApplicationFailure.nonRetryable('Generic capability Activity input is incomplete','INVALID_GENERIC_CAPABILITY_REQUEST');
    return ledger.record(input);
  }};
}
