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

type Environment = Readonly<Record<string, string | undefined>>;

function required(env: Environment, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new TypeError(`TALOS_PRODUCT_CAPABILITY_CONFIGURATION_REQUIRED: ${name}`);
  return value;
}

function issueNumber(env: Environment): number {
  const raw = required(env, TALOS_PRODUCT_CAPABILITY_ENV.githubIssueNumber);
  if (!/^\d+$/.test(raw)) {
    throw new TypeError(`TALOS_PRODUCT_CAPABILITY_CONFIGURATION_INVALID: ${TALOS_PRODUCT_CAPABILITY_ENV.githubIssueNumber}`);
  }
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new TypeError(`TALOS_PRODUCT_CAPABILITY_CONFIGURATION_INVALID: ${TALOS_PRODUCT_CAPABILITY_ENV.githubIssueNumber}`);
  }
  return value;
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
