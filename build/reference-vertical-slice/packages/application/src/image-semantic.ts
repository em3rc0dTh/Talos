import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import type { SourceId } from '../../source-intake/src/types.ts';
import { validateProcessRevision } from '../../semantic-core/src/validation.ts';
import type { NormalizationBundle, ValidationBundle } from '../../semantic-core/src/types.ts';
import { normalizeCommonAdapterResult } from './common-normalization.ts';
import { persistValidationBundle } from './validation-persistence.ts';

export interface ImageSemanticBundle {
  normalization: NormalizationBundle;
  validation: ValidationBundle;
}

function explicitDurationWait(label: string | undefined) {
  if (!label) return undefined;
  const normalized = label.trim().toLowerCase();
  const waitCue = /\b(wait|delay|pause|hold|espera(?:r)?|aguarda(?:r)?|dejar\s+actuar|reposar)\b/i.test(normalized);
  if (!waitCue) return undefined;
  const match = normalized.match(/\b(\d+(?:[.,]\d+)?)\s*(seconds?|secs?|segundos?|mins?|minutes?|minutos?|hours?|hrs?|horas?|days?|d[ií]as?)\b/i);
  if (!match) return undefined;
  const amount = match[1].replace(',', '.');
  const unitRaw = match[2].toLowerCase();
  const unit = /^(second|sec|segundo)/.test(unitRaw)
    ? 'seconds'
    : /^(hour|hr|hora)/.test(unitRaw)
      ? 'hours'
      : /^(day|d[ií]a)/.test(unitRaw)
        ? 'days'
        : 'minutes';
  return {
    kind: 'WAIT' as const,
    details: {
      waitKind: 'DURATION',
      expression: `${amount} ${unit}`,
      sourceTemporalLiteral: label,
      temporalDerivation: 'EXPLICIT_DURATION_LITERAL',
    },
  };
}

export function normalizeAndValidateImageResult(
  repo: ImmutableDocumentRepository,
  adapterResultId: SourceId,
  options: { normalizedAt?: string; assessedAt?: string } = {},
): ImageSemanticBundle {
  const resultDocument = repo.get<any>(adapterResultId);
  if (!resultDocument || resultDocument.aggregateKind !== 'AdapterResult') {
    throw new TypeError(`Image AdapterResult not found: ${adapterResultId}`);
  }
  const result = resultDocument.payload;
  const attempt = repo.listByKind<any>('AdapterAttemptStart').map((item) => item.payload)
    .find((item) => item.id === result.adapterAttemptId);
  if (!attempt) throw new TypeError(`AdapterAttemptStart missing for result=${adapterResultId}`);
  if (attempt.extractionMode !== 'VISUAL_PERCEPTION' || attempt.adapterId !== 'ImagePerceptionAdapter') {
    throw new TypeError(`Image semantic handoff requires VISUAL_PERCEPTION ImagePerceptionAdapter evidence; got ${attempt.adapterId}/${attempt.extractionMode}`);
  }

  const normalization = normalizeCommonAdapterResult(
    repo,
    adapterResultId,
    {
      sourceFamily: 'IMAGE_PERCEPTION',
      extractionMethod: 'VISUAL_PERCEPTION',
      interpretationMethod: 'PERCEPTION_COMMON_EVIDENCE_NORMALIZATION',
      interpreterVersion: 'image-common-normalizer-reference-v0.2',
      defaultTruthClass: 'INFERRED',
      resolveNode: ({ candidateSemanticType, literalLabel }) => {
        const explicitWait = explicitDurationWait(literalLabel);
        if (candidateSemanticType === 'ACTION' && explicitWait) return explicitWait;
        return undefined;
      },
      perspective: 'BUSINESS_INTENT',
      evidenceType: 'VISUAL_PERCEPTION_EVIDENCE',
      nodeFragmentKind: 'IMAGE_REGION',
    },
    { normalizedAt: options.normalizedAt },
  );

  const validation = validateProcessRevision(
    normalization.processRevision,
    'AUTOMATION_DESIGN_READINESS',
    { assessedAt: options.assessedAt ?? options.normalizedAt },
  );
  persistValidationBundle(repo, validation);

  return { normalization, validation };
}
