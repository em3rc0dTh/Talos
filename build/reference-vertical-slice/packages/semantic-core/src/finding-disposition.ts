import type { CanonicalId, ProvenanceId, ValidationId } from './types.ts';

export interface FindingDisposition {
  id: ValidationId;
  findingId: ValidationId;
  disposition: 'RESOLVED_BY_NEW_REVISION'|'CONFIRMED_AS_ACCEPTABLE'|'DEFERRED_TO_LATER_GATE'|'SUPERSEDED_BY_NEW_ASSESSMENT'|'NO_LONGER_APPLICABLE_TO_NEW_SCOPE'|'DOWNSTREAM_DESIGN_COMPLETED'|'SOURCE_DEFINED';
  rationale?: string;
  authorityRef?: string;
  recordedBy?: string;
  recordedAt: string;
  resultingClaimRefs?: ProvenanceId[];
  resultingProcessRevisionRef?: CanonicalId;
  resultingAssessmentRef?: ValidationId;
  downstreamArtifactRef?: string;
}
