export interface ExplicitDurationWaitSemantics {
  waitKind: 'DURATION';
  durationExpression: string;
  durationSeconds: number;
  matchedText: string;
}

const UNIT_SECONDS: Array<{ pattern: string; seconds: number }> = [
  { pattern: 'seconds?|secs?|segundos?|segs?', seconds: 1 },
  { pattern: 'minutes?|mins?|minutos?', seconds: 60 },
  { pattern: 'hours?|hrs?|horas?', seconds: 60 * 60 },
  { pattern: 'days?|d[ií]as?', seconds: 24 * 60 * 60 },
  { pattern: 'weeks?|wks?|semanas?', seconds: 7 * 24 * 60 * 60 },
];

const DURATION_TOKEN = new RegExp(
  `\\b(\\d{1,9})\\s*(${UNIT_SECONDS.map((unit) => unit.pattern).join('|')})\\b`,
  'giu',
);
const ISO_DURATION = /^P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i;

function secondsForUnit(unitText: string): number | undefined {
  for (const unit of UNIT_SECONDS) {
    if (new RegExp(`^(?:${unit.pattern})$`, 'iu').test(unitText)) return unit.seconds;
  }
  return undefined;
}

function isoDuration(totalSeconds: number): string {
  let remaining = totalSeconds;
  const days = Math.floor(remaining / 86_400);
  remaining -= days * 86_400;
  const hours = Math.floor(remaining / 3_600);
  remaining -= hours * 3_600;
  const minutes = Math.floor(remaining / 60);
  remaining -= minutes * 60;
  const seconds = remaining;

  const datePart = days > 0 ? `${days}D` : '';
  const timePart = [
    hours > 0 ? `${hours}H` : '',
    minutes > 0 ? `${minutes}M` : '',
    seconds > 0 ? `${seconds}S` : '',
  ].join('');
  if (!datePart && !timePart) throw new TypeError('duration must be greater than zero');
  return `P${datePart}${timePart ? `T${timePart}` : ''}`;
}

/**
 * Parse the deterministic elapsed-time subset of ISO-8601 durations that Talos
 * can safely compile to a fixed Temporal timer. Years/months are intentionally
 * excluded because their elapsed length is calendar-dependent.
 */
export function deriveIsoDurationWaitSemantics(expression: string | undefined): ExplicitDurationWaitSemantics | undefined {
  const text = expression?.trim();
  if (!text) return undefined;
  const match = ISO_DURATION.exec(text);
  if (!match) return undefined;
  const weeks = Number(match[1] ?? 0);
  const days = Number(match[2] ?? 0);
  const hours = Number(match[3] ?? 0);
  const minutes = Number(match[4] ?? 0);
  const seconds = Number(match[5] ?? 0);
  const components = [weeks, days, hours, minutes, seconds];
  if (components.some((value) => !Number.isSafeInteger(value) || value < 0)) return undefined;
  const totalSeconds = weeks * 604_800 + days * 86_400 + hours * 3_600 + minutes * 60 + seconds;
  if (!Number.isSafeInteger(totalSeconds) || totalSeconds <= 0) return undefined;
  return {
    waitKind: 'DURATION',
    durationExpression: isoDuration(totalSeconds),
    durationSeconds: totalSeconds,
    matchedText: text,
  };
}

/**
 * Deterministically derives elapsed-time semantics only when the visible text
 * contains an explicit positive numeric duration plus a recognized time unit.
 *
 * This is intentionally narrow: it does not infer business timing from generic
 * action words or from position in a diagram. Unknown/ambiguous waits remain
 * unresolved and are still stopped by semantic validation.
 */
export function deriveExplicitDurationWaitSemantics(label: string | undefined): ExplicitDurationWaitSemantics | undefined {
  const text = label?.trim();
  if (!text) return undefined;

  DURATION_TOKEN.lastIndex = 0;
  let totalSeconds = 0;
  const matched: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = DURATION_TOKEN.exec(text)) !== null) {
    const amount = Number(match[1]);
    const unitSeconds = secondsForUnit(match[2]);
    if (!Number.isSafeInteger(amount) || amount <= 0 || !unitSeconds) continue;
    const component = amount * unitSeconds;
    if (!Number.isSafeInteger(component) || component <= 0) return undefined;
    totalSeconds += component;
    if (!Number.isSafeInteger(totalSeconds) || totalSeconds <= 0) return undefined;
    matched.push(match[0]);
  }
  if (matched.length === 0) return undefined;

  return {
    waitKind: 'DURATION',
    durationExpression: isoDuration(totalSeconds),
    durationSeconds: totalSeconds,
    matchedText: matched.join(' + '),
  };
}
