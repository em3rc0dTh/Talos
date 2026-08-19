import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import type { ValidationBundle } from '../../semantic-core/src/types.ts';

export function persistValidationBundle(repo:ImmutableDocumentRepository,bundle:ValidationBundle):void{
  const at=bundle.assessment.assessedAt;
  repo.append({id:bundle.scope.id,aggregateKind:'AssessmentScope',schemaVersion:'semantic-validation-v0.2-reference',payload:bundle.scope,createdAt:at});
  for(const finding of bundle.findings)repo.append({id:finding.id,aggregateKind:'ValidationFinding',schemaVersion:'semantic-validation-v0.2-reference',payload:finding,createdAt:at});
  for(const question of bundle.questions)repo.append({id:question.id,aggregateKind:'ClarificationQuestion',schemaVersion:'semantic-validation-v0.2-reference',payload:question,createdAt:question.issuedAt});
  if(bundle.clarificationPlan)repo.append({id:bundle.clarificationPlan.id,aggregateKind:'ClarificationPlan',schemaVersion:'semantic-validation-v0.2-reference',payload:bundle.clarificationPlan,createdAt:bundle.clarificationPlan.createdAt});
  repo.append({id:bundle.readinessDecision.id,aggregateKind:'ReadinessDecision',schemaVersion:'semantic-validation-v0.2-reference',payload:bundle.readinessDecision,createdAt:at});
  repo.append({id:bundle.assessment.id,aggregateKind:'ValidationAssessment',schemaVersion:'semantic-validation-v0.2-reference',payload:bundle.assessment,createdAt:at});
}
