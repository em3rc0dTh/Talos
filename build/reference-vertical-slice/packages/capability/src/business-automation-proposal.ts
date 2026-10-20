import type { ProcessRevision } from '../../semantic-core/src/types.ts';
import type { CapabilityFamily } from './types.ts';

export interface BusinessAutomationStepProposal {
  semanticSubjectRef: string;
  businessStepName: string;
  family: CapabilityFamily | null;
  basis: 'CONFIRMED_SEMANTICS' | 'DESIGN_SUGGESTION' | 'UNRESOLVED';
  direction: string;
  participantLabel: string | null;
  connectionState: 'NOT_REQUIRED' | 'IMPLEMENTATION_REQUIRED' | 'UNRESOLVED';
  question: string | null;
}

/** Label rules suggest design directions only. They never change Canonical truth,
 * select a provider, create a binding, or supply approval/execution authority. */
export function buildBusinessAutomationProposal(process: ProcessRevision) {
  const steps: BusinessAutomationStepProposal[] = process.nodes
    .filter(node => node.kind === 'ACTION' || node.kind === 'HUMAN_INTERACTION')
    .map(node => {
      const actors = node.actorRefs.map(ref => process.actors.find(actor => actor.id === ref));
      const completeActors = actors.length > 0 && actors.every(Boolean);
      const human = node.kind === 'HUMAN_INTERACTION' || (completeActors && actors.every(actor => actor!.kind === 'HUMAN_ROLE' || actor!.kind === 'HUMAN_PERSON'));
      const system = completeActors && actors.every(actor => actor!.kind === 'SYSTEM');
      const ai = completeActors && actors.every(actor => actor!.kind === 'AI');
      const name = node.name || 'Business activity';
      const label = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      let family: CapabilityFamily | null = human ? 'HUMAN_INTERACTION' : system ? 'SYSTEM_OPERATION' : ai ? 'AI_TASK' : null;
      let direction = human ? 'Tracked human work' : system ? 'System or API' : ai ? 'Configured AI capability' : 'Execution direction pending';
      let basis: BusinessAutomationStepProposal['basis'] = family ? 'CONFIRMED_SEMANTICS' : 'UNRESOLVED';
      // Mixed/unknown actors are a real business uncertainty, even if the label
      // resembles a familiar action. Do not override their responsibility.
      if (!family && actors.length === 0) {
        if (/\b(notific\w*|notify|notification\w*|informar|avisar|send email|send message)\b/.test(label)) {
          family = 'COMMUNICATION'; direction = 'Automatic notification · channel chosen during implementation';
        } else if (/\b(enviar solicitud|registrar solicitud|recibir solicitud|submit request|receive request|collect information)\b/.test(label)) {
          family = 'DATA_COLLECTION'; direction = 'Request intake through a form or API';
        }
        if (family) basis = 'DESIGN_SUGGESTION';
      }
      return {
        semanticSubjectRef: node.id,
        businessStepName: name,
        family,
        basis,
        direction,
        participantLabel: human && completeActors ? actors.map(actor => actor!.name).join(', ') : null,
        connectionState: family === 'HUMAN_INTERACTION' ? 'NOT_REQUIRED' : family ? 'IMPLEMENTATION_REQUIRED' : 'UNRESOLVED',
        question: !family ? `Who or what performs “${name}”?` : human && !completeActors ? `Who is responsible for “${name}”?` : null,
      };
    });
  return {
    version: 'talos.business-automation-proposal.v1' as const,
    processRevisionRef: process.id,
    state: steps.some(step => step.question) ? 'NEEDS_BUSINESS_ANSWER' : 'PROPOSAL_READY',
    steps,
    decisionCount: process.nodes.filter(node => node.kind === 'DECISION').length,
    createsBinding: false,
    changesCanonicalProcess: false,
    deploymentAuthorized: false,
    executionAuthorized: false,
  };
}
