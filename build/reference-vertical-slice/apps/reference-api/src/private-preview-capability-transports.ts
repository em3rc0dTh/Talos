import type { AutomationProposalOfferingCandidate } from '../../../packages/capability/src/index.ts';
import type { TalosProductCapabilityTransportResolver } from './private-preview-temporal-runtime.ts';
import {
  GITHUB_ISSUE_COMMENT_TRANSPORT_REF,
  GitHubIssueCommentCapabilityTransport,
} from '../../../workers/reference-temporal-worker/src/github-issue-comment-transport.ts';

export const TALOS_PRODUCT_CAPABILITY_ENV = {
  githubRepository: 'TALOS_PRODUCT_GITHUB_REPOSITORY',
  githubIssueNumber: 'TALOS_PRODUCT_GITHUB_ISSUE_NUMBER',
  githubToken: 'TALOS_PRODUCT_GITHUB_TOKEN',
  githubApiBaseUrl: 'TALOS_PRODUCT_GITHUB_API_BASE_URL',
} as const;

export const TALOS_PRODUCT_GITHUB_ISSUE_COMMENT_OFFERING_ID = 'talos-product-offering:github-issue-comment-v1';

type Environment = Readonly<Record<string, string | undefined>>;

function value(env: Environment, name: string): string | undefined {
  const candidate = env[name]?.trim();
  return candidate ? candidate : undefined;
}

function required(env: Environment, name: string): string {
  const resolved = value(env, name);
  if (!resolved) throw new TypeError(`TALOS_PRODUCT_CAPABILITY_CONFIGURATION_REQUIRED: ${name}`);
  return resolved;
}

function issueNumber(env: Environment): number {
  const raw = required(env, TALOS_PRODUCT_CAPABILITY_ENV.githubIssueNumber);
  if (!/^\d+$/.test(raw)) {
    throw new TypeError(`TALOS_PRODUCT_CAPABILITY_CONFIGURATION_INVALID: ${TALOS_PRODUCT_CAPABILITY_ENV.githubIssueNumber}`);
  }
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new TypeError(`TALOS_PRODUCT_CAPABILITY_CONFIGURATION_INVALID: ${TALOS_PRODUCT_CAPABILITY_ENV.githubIssueNumber}`);
  }
  return parsed;
}

function validRepository(repository: string): boolean {
  const [owner, repo, ...rest] = repository.split('/');
  return Boolean(owner && repo && rest.length === 0);
}

/**
 * Non-secret capability metadata exposed to the governed Automation Designer.
 * Availability is derived only from concrete server-side runtime configuration.
 * No credential value is copied into the offering candidate.
 */
export function resolveTalosProductAutomationOfferings(
  env: Environment = process.env,
): AutomationProposalOfferingCandidate[] {
  const repository = value(env, TALOS_PRODUCT_CAPABILITY_ENV.githubRepository);
  const issue = value(env, TALOS_PRODUCT_CAPABILITY_ENV.githubIssueNumber);
  const token = value(env, TALOS_PRODUCT_CAPABILITY_ENV.githubToken);
  if (!repository || !issue || !token) return [];
  if (!validRepository(repository) || !/^\d+$/.test(issue) || Number(issue) < 1) return [];
  return [{
    id: TALOS_PRODUCT_GITHUB_ISSUE_COMMENT_OFFERING_ID,
    family: 'COMMUNICATION',
    supportedOperationIntents: ['PERFORM_ACTION'],
    implementationKind: 'DIRECT_API',
    implementationRef: GITHUB_ISSUE_COMMENT_TRANSPORT_REF,
  }];
}

/**
 * Concrete product adapter registry.
 *
 * The exact approved CapabilityOfferingRevision.implementationRef is the only
 * dispatch key. Capability family, labels and business text never activate an
 * external integration implicitly. Secrets remain captured by the server-side
 * transport and are never added to the product runtime profile.
 */
export function createTalosProductCapabilityTransportResolver(
  env: Environment = process.env,
): TalosProductCapabilityTransportResolver {
  let githubTransport: GitHubIssueCommentCapabilityTransport | undefined;

  return {
    resolve({ implementationRef }) {
      if (implementationRef !== GITHUB_ISSUE_COMMENT_TRANSPORT_REF) return undefined;
      if (!githubTransport) {
        githubTransport = new GitHubIssueCommentCapabilityTransport({
          repository: required(env, TALOS_PRODUCT_CAPABILITY_ENV.githubRepository),
          issueNumber: issueNumber(env),
          token: required(env, TALOS_PRODUCT_CAPABILITY_ENV.githubToken),
          ...(env[TALOS_PRODUCT_CAPABILITY_ENV.githubApiBaseUrl]?.trim()
            ? { apiBaseUrl: env[TALOS_PRODUCT_CAPABILITY_ENV.githubApiBaseUrl]!.trim() }
            : {}),
        });
      }
      return githubTransport;
    },
  };
}
