import type { TalosProductRecoverySnapshot } from './product-runtime-recovery.ts';

export type TalosProductStage='PROCESS'|'REVIEW'|'CONFIRM'|'AUTOMATE'|'RUN';
export type TalosProductStatus='READY'|'ACTIVE'|'COMPLETE'|'BLOCKED'|'WAITING';

export interface TalosProductJourneyStage{
  id:TalosProductStage;
  label:string;
  status:TalosProductStatus;
}

export interface TalosProductJourneyState{
  version:'talos.product-journey.v1';
  stage:TalosProductStage;
  stages:TalosProductJourneyStage[];
  inputModes:Array<'IMAGE'|'BPMN'|'CANVAS'>;
  title:string;
  description:string;
  primaryAction:string;
  technicalDetailsAvailable:true;
  automaticAuthorityGranted:false;
}

function stageFromRecovery(recovery:TalosProductRecoverySnapshot):TalosProductStage{
  const counts=recovery.aggregateCounts;
  if((counts.WorkflowExecutionObservation??0)>0||(counts.WorkflowExecutionApprovalRecord??0)>0||(counts.DeploymentAttempt??0)>0||(counts.DeploymentApprovalRecord??0)>0||(counts.RuntimePolicyRevision??0)>0||(counts.TemporalMappingRevision??0)>0||(counts.AutomationDesignApprovalRecord??0)>0)return'RUN';
  if((counts.SemanticFreezeRecord??0)>0||(counts.AutomationExecutionPlanReview??0)>0||(counts.CapabilityBindingRevision??0)>0)return'AUTOMATE';
  if((counts.BusinessProcessConfirmationRecord??0)>0)return'AUTOMATE';
  if((counts.ProcessRevision??0)>0||(counts.BpmnProcessRevision??0)>0||(counts.GuidedSemanticResolutionProposal??0)>0)return'REVIEW';
  return'PROCESS';
}

export function buildTalosProductJourneyState(recovery:TalosProductRecoverySnapshot):TalosProductJourneyState{
  const stage=stageFromRecovery(recovery);
  const order:TalosProductStage[]=['PROCESS','REVIEW','CONFIRM','AUTOMATE','RUN'];
  const current=order.indexOf(stage);
  const labels:Record<TalosProductStage,string>={PROCESS:'Process',REVIEW:'Review',CONFIRM:'Confirm',AUTOMATE:'Automate',RUN:'Run'};
  const stages=order.map((id,index):TalosProductJourneyStage=>({id,label:labels[id],status:index<current?'COMPLETE':index===current?'ACTIVE':'WAITING'}));
  const copy:Record<TalosProductStage,{title:string;description:string;primaryAction:string}>={
    PROCESS:{title:'Bring your process',description:'Upload an image, import BPMN, or create the process directly in Talos.',primaryAction:'ADD_PROCESS'},
    REVIEW:{title:'Check what Talos understood',description:'Review the steps and answer only the business questions that are still unclear.',primaryAction:'REVIEW_PROCESS'},
    CONFIRM:{title:'Confirm the process',description:'Confirm the reviewed process before Talos prepares any automation.',primaryAction:'CONFIRM_PROCESS'},
    AUTOMATE:{title:'Prepare the automation',description:'Choose how the confirmed business process should be automated.',primaryAction:'PREPARE_AUTOMATION'},
    RUN:{title:'Run and monitor',description:'Test or run the approved automation while Talos keeps execution evidence.',primaryAction:'CONTINUE_RUN'},
  };
  return{version:'talos.product-journey.v1',stage,stages,inputModes:['IMAGE','BPMN','CANVAS'],...copy[stage],technicalDetailsAvailable:true,automaticAuthorityGranted:false};
}
