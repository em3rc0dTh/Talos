import { createHash } from 'node:crypto';
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SqliteDocumentStore } from '../../../packages/persistence-sqlite/src/sqlite-document-store.ts';
import {
  resolveTalosPrivatePreviewRuntimeBinding,
} from './private-preview-config.ts';
import {
  startTalosPrivatePreviewFromEnv,
  type TalosPrivatePreviewFromEnvOptions,
} from './private-preview-runtime.ts';

export const TALOS_PRIVATE_PREVIEW_OPERATOR_VERSION = 'talos-private-preview-operator-v0.1';
export const TALOS_PRIVATE_PREVIEW_OPERATOR_ENV = {
  runtimeDir: 'TALOS_PRIVATE_PREVIEW_RUNTIME_DIR',
} as const;

const RECOVERY_KINDS = [
  'ProcessRevision',
  'BusinessProcessConfirmationRecord',
  'SemanticFreezeRecord',
  'CapabilityDesignRevision',
  'ExecutionPlanRevision',
  'AutomationDesignApprovalRecord',
  'TemporalMappingRevision',
  'RuntimePolicyRevision',
  'DeploymentRevision',
  'DeploymentApprovalRecord',
  'DeploymentAttempt',
  'WorkflowExecutionApprovalRecord',
  'WorkflowExecutionObservation',
] as const;

type Environment = Readonly<Record<string, string | undefined>>;
type RecoveryKind = typeof RECOVERY_KINDS[number];

export type TalosPrivatePreviewRecoveryStage =
  | 'EMPTY'
  | 'PROCESS_EVIDENCE'
  | 'AUTOMATION_EVIDENCE'
  | 'DEPLOYMENT_EVIDENCE'
  | 'WORKFLOW_EXECUTION_EVIDENCE';

export interface TalosPrivatePreviewRecoveryKindSummary {
  count: number;
  latestId?: string;
  latestCreatedAt?: string;
}

export interface TalosPrivatePreviewRecoveryDescriptor {
  operatorVersion: typeof TALOS_PRIVATE_PREVIEW_OPERATOR_VERSION;
  runtimeDir: string;
  databasePresent: boolean;
  sourceBytesPresent: boolean;
  stage: TalosPrivatePreviewRecoveryStage;
  kinds: Record<RecoveryKind, TalosPrivatePreviewRecoveryKindSummary>;
  durableDocumentCount: number;
  workflowExecutionObservationCount: number;
  authorityReplayPerformed: false;
  startupMutationPerformed: false;
  midSessionResumption: 'NOT_SUPPORTED_V0_1';
  recoveryContract: 'DURABLE_EVIDENCE_ONLY';
  recoveryDigest: string;
}

interface OperatorLockRecord {
  operatorVersion: typeof TALOS_PRIVATE_PREVIEW_OPERATOR_VERSION;
  pid: number;
  startedAt: string;
  configurationFingerprint: string;
  runtimeDir: string;
}

function requiredEnv(env: Environment, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new TypeError(`R0_OPERATOR_CONFIG_MISSING: ${name}`);
  return value;
}

function digest(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function blankKinds(): Record<RecoveryKind, TalosPrivatePreviewRecoveryKindSummary> {
  return Object.fromEntries(RECOVERY_KINDS.map((kind) => [kind, { count: 0 }])) as Record<RecoveryKind, TalosPrivatePreviewRecoveryKindSummary>;
}

function recoveryStage(kinds: Record<RecoveryKind, TalosPrivatePreviewRecoveryKindSummary>): TalosPrivatePreviewRecoveryStage {
  if (kinds.WorkflowExecutionObservation.count > 0) return 'WORKFLOW_EXECUTION_EVIDENCE';
  if (kinds.DeploymentAttempt.count > 0 || kinds.DeploymentApprovalRecord.count > 0) return 'DEPLOYMENT_EVIDENCE';
  if (
    kinds.AutomationDesignApprovalRecord.count > 0
    || kinds.ExecutionPlanRevision.count > 0
    || kinds.TemporalMappingRevision.count > 0
    || kinds.RuntimePolicyRevision.count > 0
  ) return 'AUTOMATION_EVIDENCE';
  if (kinds.ProcessRevision.count > 0 || kinds.BusinessProcessConfirmationRecord.count > 0) return 'PROCESS_EVIDENCE';
  return 'EMPTY';
}

export function resolveTalosPrivatePreviewRuntimeDir(env: Environment = process.env): string {
  return path.resolve(requiredEnv(env, TALOS_PRIVATE_PREVIEW_OPERATOR_ENV.runtimeDir));
}

export function inspectTalosPrivatePreviewRecovery(runtimeDirInput: string): TalosPrivatePreviewRecoveryDescriptor {
  const runtimeDir = path.resolve(runtimeDirInput);
  const dbPath = path.join(runtimeDir, 'talos-one-app.sqlite');
  const sourceBytesPresent = existsSync(path.join(runtimeDir, 'source-bytes'));
  const kinds = blankKinds();

  if (existsSync(dbPath)) {
    const store = new SqliteDocumentStore(dbPath);
    try {
      for (const kind of RECOVERY_KINDS) {
        const documents = store.listByKind(kind);
        const latest = documents.at(-1);
        kinds[kind] = {
          count: documents.length,
          ...(latest ? { latestId: String(latest.id), latestCreatedAt: latest.createdAt } : {}),
        };
      }
    } finally {
      store.close();
    }
  }

  const durableDocumentCount = RECOVERY_KINDS.reduce((total, kind) => total + kinds[kind].count, 0);
  const safe = {
    operatorVersion: TALOS_PRIVATE_PREVIEW_OPERATOR_VERSION,
    runtimeDir,
    databasePresent: existsSync(dbPath),
    sourceBytesPresent,
    stage: recoveryStage(kinds),
    kinds,
    durableDocumentCount,
    workflowExecutionObservationCount: kinds.WorkflowExecutionObservation.count,
    authorityReplayPerformed: false as const,
    startupMutationPerformed: false as const,
    midSessionResumption: 'NOT_SUPPORTED_V0_1' as const,
    recoveryContract: 'DURABLE_EVIDENCE_ONLY' as const,
  };
  return {
    ...safe,
    recoveryDigest: digest(safe),
  };
}

function lockPath(runtimeDir: string): string {
  return path.join(runtimeDir, '.talos-private-preview.lock.json');
}

function readLock(filePath: string): OperatorLockRecord | undefined {
  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as Partial<OperatorLockRecord>;
    if (
      parsed.operatorVersion !== TALOS_PRIVATE_PREVIEW_OPERATOR_VERSION
      || typeof parsed.pid !== 'number'
      || !Number.isSafeInteger(parsed.pid)
      || parsed.pid < 1
      || typeof parsed.startedAt !== 'string'
      || typeof parsed.configurationFingerprint !== 'string'
      || typeof parsed.runtimeDir !== 'string'
    ) return undefined;
    return parsed as OperatorLockRecord;
  } catch {
    return undefined;
  }
}

function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ESRCH') return false;
    return true;
  }
}

function acquireOperatorLock(runtimeDir: string, configurationFingerprint: string): { filePath: string; record: OperatorLockRecord } {
  mkdirSync(runtimeDir, { recursive: true });
  const filePath = lockPath(runtimeDir);

  try {
    const fd = openSync(filePath, 'wx', 0o600);
    closeSync(fd);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    const existing = readLock(filePath);
    if (existing && pidAlive(existing.pid)) {
      throw new TypeError(`R0_OPERATOR_RUNTIME_ALREADY_LOCKED: pid=${existing.pid}`);
    }
    try {
      unlinkSync(filePath);
    } catch (unlinkError) {
      if ((unlinkError as NodeJS.ErrnoException).code !== 'ENOENT') throw unlinkError;
    }
    const fd = openSync(filePath, 'wx', 0o600);
    closeSync(fd);
  }

  const record: OperatorLockRecord = {
    operatorVersion: TALOS_PRIVATE_PREVIEW_OPERATOR_VERSION,
    pid: process.pid,
    startedAt: new Date().toISOString(),
    configurationFingerprint,
    runtimeDir,
  };
  writeFileSync(filePath, `${JSON.stringify(record, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  return { filePath, record };
}

function releaseOperatorLock(filePath: string): void {
  try {
    unlinkSync(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

export interface TalosPrivatePreviewOperatorOptions extends Omit<TalosPrivatePreviewFromEnvOptions, 'runtimeDir'> {}

export async function startTalosPrivatePreviewOperator(
  env: Environment = process.env,
  options: TalosPrivatePreviewOperatorOptions = {},
) {
  const runtimeBinding = resolveTalosPrivatePreviewRuntimeBinding(env);
  const runtimeDir = resolveTalosPrivatePreviewRuntimeDir(env);
  const recoveryBeforeStart = inspectTalosPrivatePreviewRecovery(runtimeDir);
  const acquired = acquireOperatorLock(runtimeDir, runtimeBinding.descriptor.configurationFingerprint);

  let app: Awaited<ReturnType<typeof startTalosPrivatePreviewFromEnv>> | undefined;
  try {
    app = await startTalosPrivatePreviewFromEnv(env, {
      ...options,
      runtimeDir,
    });
  } catch (error) {
    releaseOperatorLock(acquired.filePath);
    throw error;
  }

  let closed = false;
  return {
    ...app,
    runtimeDir,
    operatorLock: {
      filePath: acquired.filePath,
      pid: acquired.record.pid,
      configurationFingerprint: acquired.record.configurationFingerprint,
      secretMaterialPersisted: false as const,
    },
    recoveryBeforeStart,
    async close() {
      if (closed) return;
      closed = true;
      try {
        await app?.close();
      } finally {
        releaseOperatorLock(acquired.filePath);
      }
    },
  };
}

async function main(): Promise<void> {
  const runtimeDir = resolveTalosPrivatePreviewRuntimeDir(process.env);
  if (process.argv.includes('--inspect')) {
    process.stdout.write(`${JSON.stringify(inspectTalosPrivatePreviewRecovery(runtimeDir), null, 2)}\n`);
    return;
  }

  const app = await startTalosPrivatePreviewOperator(process.env);
  process.stdout.write(`${JSON.stringify({
    status: 'READY',
    releaseGate: 'R0-03_OPERATOR_STARTUP_RECOVERY',
    baseUrl: app.baseUrl,
    runtimeDir: app.runtimeDir,
    runtimeMode: app.runtimeDescriptor.runtimeMode,
    configurationFingerprint: app.runtimeDescriptor.configurationFingerprint,
    recoveryBeforeStart: app.recoveryBeforeStart,
    secretMaterialExposed: false,
  }, null, 2)}\n`);

  let stopping = false;
  const stop = async () => {
    if (stopping) return;
    stopping = true;
    await app.close();
  };
  process.once('SIGINT', () => { void stop().then(() => process.exit(0)); });
  process.once('SIGTERM', () => { void stop().then(() => process.exit(0)); });
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : undefined;
if (entry && entry === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${JSON.stringify({ status: 'FAILED', releaseGate: 'R0-03_OPERATOR_STARTUP_RECOVERY', error: message })}\n`);
    process.exitCode = 1;
  });
}
