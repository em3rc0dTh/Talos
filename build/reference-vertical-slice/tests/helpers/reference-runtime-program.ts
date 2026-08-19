import { designReferenceExecutionPlan } from '../../packages/execution/src/reference-plan.ts';
import { designReferenceTemporalMapping } from '../../packages/temporal-design/src/reference-mapping.ts';
import { designReferenceRuntimePolicy } from '../../packages/runtime-policy/src/reference-policy.ts';
import { designReferenceDeployment } from '../../packages/deployment/src/reference-deployment.ts';
import { compileReferenceRuntimeProgram } from '../../workers/reference-temporal-worker/src/compile-runtime-program.ts';

export function buildReferenceRuntimeProgram(
  at = '2026-08-19T21:00:00.000Z',
) {
  const process: any = {
    id: 'prc_process_revision_2',
    processDefinitionId: 'prc_process_definition',
    nodes: [
      { id: 'prc_start', name: 'Request submitted' },
      { id: 'prc_review', name: 'Review request' },
      { id: 'prc_decision', name: 'Approved?' },
      { id: 'prc_email', name: 'Send confirmation email' },
      { id: 'prc_completed', name: 'Completed' },
      { id: 'prc_rejected', name: 'Rejected' },
    ],
    edges: [
      { id: 'prc_e1', sourceNodeId: 'prc_start', targetNodeId: 'prc_review', kind: 'SEQUENCE' },
      { id: 'prc_e2', sourceNodeId: 'prc_review', targetNodeId: 'prc_decision', kind: 'SEQUENCE' },
      { id: 'prc_e3', sourceNodeId: 'prc_decision', targetNodeId: 'prc_email', kind: 'CONDITIONAL' },
      { id: 'prc_e4', sourceNodeId: 'prc_decision', targetNodeId: 'prc_rejected', kind: 'DEFAULT' },
      { id: 'prc_e5', sourceNodeId: 'prc_email', targetNodeId: 'prc_completed', kind: 'SEQUENCE' },
    ],
  };
  const validation: any = {
    id: 'val_assessment_2',
    executionReadiness: 'READY_FOR_AUTOMATION_DESIGN',
  };
  const freeze: any = {
    id: 'rvw_freeze_2',
    freezeKind: 'AUTOMATION_DESIGN_HANDOFF',
    processRevisionId: process.id,
  };
  const scopeFreeze: any = {
    id: 'rvw_scope_freeze_2',
    semanticFreezeRecordId: freeze.id,
    semanticScopeRef: 'scope-reference',
    disposition: 'ACCEPTED',
  };
  const capability: any = {
    bindingAssessment: { result: 'READY_FOR_EXECUTION_DESIGN' },
    designRevision: { id: 'cap_design_1', processRevisionId: process.id },
    bindingRevision: { id: 'cap_binding_1' },
    requirements: [
      { id: 'cap_human_req', family: 'HUMAN_INTERACTION' },
      { id: 'cap_email_req', family: 'COMMUNICATION' },
    ],
    humanDesign: { id: 'cap_human_design' },
    inputFields: [{ id: 'cap_recipient_field' }],
    inputMappings: [{ id: 'cap_recipient_mapping' }],
    selectionDecision: { id: 'cap_selection' },
  };

  const execution = designReferenceExecutionPlan(
    process,
    validation,
    freeze,
    scopeFreeze,
    capability,
    at,
  );
  const mapping = designReferenceTemporalMapping(execution, at);
  const policy = designReferenceRuntimePolicy(execution, mapping, at);
  const deployment = designReferenceDeployment(execution, mapping, policy, at);
  const program = compileReferenceRuntimeProgram(
    execution,
    mapping,
    policy,
    deployment,
    { family: 'TEMPORAL_TYPESCRIPT_SDK', version: '1.22.0' },
  );

  return { process, validation, freeze, scopeFreeze, capability, execution, mapping, policy, deployment, program };
}
