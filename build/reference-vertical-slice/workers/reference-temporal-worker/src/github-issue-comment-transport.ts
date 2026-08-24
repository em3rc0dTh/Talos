import { ApplicationFailure } from '@temporalio/activity';
import type { GenericCapabilityActivityInput } from './generic-contracts.ts';
import type { GenericCapabilityTransport,GenericEffectIdentity,GenericExternalCapabilityEffect } from './generic-activities.ts';

export const GITHUB_ISSUE_COMMENT_TRANSPORT_REF='GITHUB_ISSUE_COMMENT_V1';
const GITHUB_API_VERSION='2026-03-10';

export interface GitHubIssueCommentTransportOptions {
  repository:string;
  issueNumber:number;
  token:string;
  fetchImpl?:typeof fetch;
  apiBaseUrl?:string;
}

interface GitHubIssueComment {
  id:number;
  body?:string|null;
  html_url?:string;
}

export interface GitHubIssueCommentEffectInspection {
  exactMatches:GitHubIssueComment[];
  conflictingMatches:GitHubIssueComment[];
}

function parseRepository(repository:string):{owner:string;repo:string}{
  const [owner,repo,...rest]=repository.split('/');
  if(!owner||!repo||rest.length)throw new TypeError('GitHub repository must use owner/repo');
  return{owner,repo};
}

function validateOptions(options:GitHubIssueCommentTransportOptions):void{
  parseRepository(options.repository);
  if(!Number.isSafeInteger(options.issueNumber)||options.issueNumber<1)throw new TypeError('GitHub issue/PR number must be a positive integer');
  if(!options.token.trim())throw new TypeError('GitHub transport token must be configured');
}

function effectMarker(identity:GenericEffectIdentity):string{
  return`<!-- talos-effect:${identity.effectKey}:${identity.inputDigest} -->`;
}
function effectMarkerPrefix(identity:GenericEffectIdentity):string{
  return`<!-- talos-effect:${identity.effectKey}:`;
}

function headers(token:string):Record<string,string>{
  return{
    accept:'application/vnd.github+json',
    authorization:`Bearer ${token}`,
    'x-github-api-version':GITHUB_API_VERSION,
    'user-agent':'talos-r0-04-external-capability',
  };
}

function nonRetryable(message:string,type:string):never{
  throw ApplicationFailure.nonRetryable(message,type);
}

async function jsonResponse(response:Response):Promise<any>{
  const text=await response.text();
  if(!text)return undefined;
  try{return JSON.parse(text);}catch{return undefined;}
}

async function listComments(options:GitHubIssueCommentTransportOptions):Promise<GitHubIssueComment[]>{
  validateOptions(options);
  const {owner,repo}=parseRepository(options.repository);
  const base=(options.apiBaseUrl??'https://api.github.com').replace(/\/$/,'');
  const response=await(options.fetchImpl??fetch)(`${base}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${options.issueNumber}/comments?per_page=100&sort=created&direction=desc`,{
    method:'GET',headers:headers(options.token),
  });
  if(response.status===401||response.status===403||response.status===404)nonRetryable(`GitHub comment inspection rejected with HTTP ${response.status}`,'GITHUB_EXTERNAL_AUTH_OR_SCOPE_FAILURE');
  if(!response.ok)throw new Error(`GitHub comment inspection failed with HTTP ${response.status}`);
  const payload=await jsonResponse(response);
  if(!Array.isArray(payload))nonRetryable('GitHub comment inspection returned an invalid payload','GITHUB_EXTERNAL_INVALID_RESPONSE');
  return payload.filter((item:any)=>item&&Number.isSafeInteger(item.id)).map((item:any)=>({id:item.id,body:typeof item.body==='string'?item.body:null,html_url:typeof item.html_url==='string'?item.html_url:undefined}));
}

export async function inspectGitHubIssueCommentEffect(
  options:GitHubIssueCommentTransportOptions,
  identity:GenericEffectIdentity,
):Promise<GitHubIssueCommentEffectInspection>{
  const comments=await listComments(options);
  const exact=effectMarker(identity);
  const prefix=effectMarkerPrefix(identity);
  return{
    exactMatches:comments.filter(comment=>comment.body?.includes(exact)),
    conflictingMatches:comments.filter(comment=>comment.body?.includes(prefix)&&!comment.body?.includes(exact)),
  };
}

function inputComment(input:GenericCapabilityActivityInput):string{
  if(!input.input||typeof input.input!=='object'||Array.isArray(input.input))nonRetryable('GitHub comment capability input must be an object','INVALID_GITHUB_COMMENT_CAPABILITY_INPUT');
  const comment=(input.input as Record<string,unknown>).comment;
  if(typeof comment!=='string'||!comment.trim())nonRetryable('GitHub comment capability input requires a non-empty comment','INVALID_GITHUB_COMMENT_CAPABILITY_INPUT');
  if(comment.length>20_000)nonRetryable('GitHub comment capability input exceeds the Talos certification limit','INVALID_GITHUB_COMMENT_CAPABILITY_INPUT');
  return comment.trim();
}

function evidence(options:GitHubIssueCommentTransportOptions,identity:GenericEffectIdentity,comment:GitHubIssueComment):Omit<GenericExternalCapabilityEffect,'effectStatus'>{
  return{
    transportRef:GITHUB_ISSUE_COMMENT_TRANSPORT_REF,
    externalEffectRef:`github:issue-comment:${comment.id}`,
    evidenceRefs:[
      `github:repository:${options.repository}`,
      `github:issue-or-pr:${options.issueNumber}`,
      `github:issue-comment:${comment.id}`,
      ...(comment.html_url?[`github:html-url:${comment.html_url}`]:[]),
      `talos:effect-key:${identity.effectKey}`,
      `talos:input-digest:${identity.inputDigest}`,
    ],
  };
}

export class GitHubIssueCommentCapabilityTransport implements GenericCapabilityTransport {
  readonly transportRef=GITHUB_ISSUE_COMMENT_TRANSPORT_REF;
  readonly #options:GitHubIssueCommentTransportOptions;
  constructor(options:GitHubIssueCommentTransportOptions){validateOptions(options);this.#options={...options};}

  async execute(input:GenericCapabilityActivityInput,identity:GenericEffectIdentity):Promise<GenericExternalCapabilityEffect>{
    const commentText=inputComment(input);
    const inspection=await inspectGitHubIssueCommentEffect(this.#options,identity);
    if(inspection.conflictingMatches.length>0)nonRetryable('GitHub already contains this Talos effect key with a different approved input digest','GITHUB_EXTERNAL_IDEMPOTENCY_CONFLICT');
    const prior=inspection.exactMatches[0];
    if(prior)return{effectStatus:'DUPLICATE_IDENTICAL',...evidence(this.#options,identity,prior)};

    const {owner,repo}=parseRepository(this.#options.repository);
    const base=(this.#options.apiBaseUrl??'https://api.github.com').replace(/\/$/,'');
    const response=await(this.#options.fetchImpl??fetch)(`${base}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${this.#options.issueNumber}/comments`,{
      method:'POST',
      headers:{...headers(this.#options.token),'content-type':'application/json'},
      body:JSON.stringify({body:`${commentText}\n\n${effectMarker(identity)}`}),
    });
    if(response.status===401||response.status===403||response.status===404||response.status===410||response.status===422)nonRetryable(`GitHub comment creation rejected with HTTP ${response.status}`,'GITHUB_EXTERNAL_AUTH_OR_REQUEST_FAILURE');
    if(!response.ok)throw new Error(`GitHub comment creation failed with HTTP ${response.status}`);
    const created=await jsonResponse(response) as GitHubIssueComment|undefined;
    if(!created||!Number.isSafeInteger(created.id))nonRetryable('GitHub comment creation returned no concrete comment id','GITHUB_EXTERNAL_INVALID_RESPONSE');
    return{effectStatus:'INSERTED',...evidence(this.#options,identity,created)};
  }
}
