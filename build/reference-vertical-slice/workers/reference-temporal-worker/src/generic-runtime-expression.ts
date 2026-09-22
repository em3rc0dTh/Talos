import type {
  GenericRuntimeConditionExpression,
  GenericRuntimeComparisonOperator,
  GenericRuntimeValue,
} from './generic-contracts.ts';

const COMPARISON_OPERATORS = new Set<GenericRuntimeComparisonOperator>([
  'EQUALS',
  'NOT_EQUALS',
  'GREATER_THAN',
  'GREATER_THAN_OR_EQUAL',
  'LESS_THAN',
  'LESS_THAN_OR_EQUAL',
  'IN',
  'NOT_IN',
]);

const RUNTIME_CONTEXT_ROOTS = new Set([
  'initialInputs',
  'processVariables',
  'humanOutputs',
  'activityOutputs',
  'externalEvents',
  'systemValues',
  'executionMetadata',
]);

function record(value: unknown, code: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(code);
  }
  return value as Record<string, unknown>;
}

function nonEmptyString(value: unknown, code: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(code);
  return value.trim();
}

function runtimeReferencePath(raw: string): string {
  const path = raw.trim();
  const [root] = path.split('.');
  return RUNTIME_CONTEXT_ROOTS.has(root) ? path : `initialInputs.${path}`;
}

function valueExpression(value: unknown, code: string): GenericRuntimeValue {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const candidate = value as Record<string, unknown>;
    if (candidate.kind === 'REFERENCE') {
      return {
        kind: 'REFERENCE',
        path: runtimeReferencePath(nonEmptyString(candidate.path, `${code}:REFERENCE_PATH_REQUIRED`)),
      };
    }
    if (candidate.kind === 'LITERAL') {
      return { kind: 'LITERAL', value: candidate.value };
    }
  }
  return { kind: 'LITERAL', value };
}

function compileStructured(
  expression: Record<string, unknown>,
  ruleRef: string,
): GenericRuntimeConditionExpression {
  const kind = nonEmptyString(expression.kind, `RUNTIME_EXPRESSION_KIND_REQUIRED:${ruleRef}`);
  if (kind === 'COMPARE') {
    const operator = nonEmptyString(
      expression.operator,
      `RUNTIME_CONDITION_OPERATOR_REQUIRED:${ruleRef}`,
    ) as GenericRuntimeComparisonOperator;
    if (!COMPARISON_OPERATORS.has(operator)) {
      throw new TypeError(`RUNTIME_CONDITION_OPERATOR_UNSUPPORTED:${ruleRef}:${operator}`);
    }
    return {
      kind: 'COMPARE',
      left: valueExpression(expression.left, `RUNTIME_EXPRESSION_INVALID:${ruleRef}:LEFT`),
      operator,
      right: valueExpression(expression.right, `RUNTIME_EXPRESSION_INVALID:${ruleRef}:RIGHT`),
    };
  }
  if (kind === 'EXISTS') {
    return {
      kind: 'EXISTS',
      value: valueExpression(expression.value, `RUNTIME_EXPRESSION_INVALID:${ruleRef}:EXISTS`),
    };
  }
  if (kind === 'AND' || kind === 'OR') {
    if (!Array.isArray(expression.expressions) || expression.expressions.length === 0) {
      throw new TypeError(`RUNTIME_EXPRESSION_INVALID:${ruleRef}:${kind}_REQUIRES_EXPRESSIONS`);
    }
    return {
      kind,
      expressions: expression.expressions.map((item, index) =>
        compileRuntimeConditionExpression(item, `${ruleRef}#${kind.toLowerCase()}-${index + 1}`)),
    };
  }
  if (kind === 'NOT') {
    return {
      kind: 'NOT',
      expression: compileRuntimeConditionExpression(
        expression.expression,
        `${ruleRef}#not`,
      ),
    };
  }
  if (kind === 'DECISION_INPUT') {
    return {
      kind: 'DECISION_INPUT',
      decisionRef: nonEmptyString(
        expression.decisionRef ?? ruleRef,
        `RUNTIME_DECISION_REF_REQUIRED:${ruleRef}`,
      ),
      prompt: nonEmptyString(
        expression.prompt,
        `RUNTIME_DECISION_PROMPT_REQUIRED:${ruleRef}`,
      ),
    };
  }
  throw new TypeError(`RUNTIME_EXPRESSION_KIND_UNSUPPORTED:${ruleRef}:${kind}`);
}

function compileLegacy(
  expression: Record<string, unknown>,
  ruleRef: string,
): GenericRuntimeConditionExpression | undefined {
  if (typeof expression.fact !== 'string' || !expression.fact.trim()) return undefined;
  const operator = nonEmptyString(
    expression.operator,
    `RUNTIME_CONDITION_OPERATOR_REQUIRED:${ruleRef}`,
  );
  const reference: GenericRuntimeValue = {
    kind: 'REFERENCE',
    path: runtimeReferencePath(expression.fact),
  };
  if (operator === 'EXISTS') return { kind: 'EXISTS', value: reference };
  if (!COMPARISON_OPERATORS.has(operator as GenericRuntimeComparisonOperator)) {
    throw new TypeError(`RUNTIME_CONDITION_OPERATOR_UNSUPPORTED:${ruleRef}:${operator}`);
  }
  return {
    kind: 'COMPARE',
    left: reference,
    operator: operator as GenericRuntimeComparisonOperator,
    right: { kind: 'LITERAL', value: expression.value },
  };
}

export function compileRuntimeConditionExpression(
  raw: unknown,
  ruleRef: string,
): GenericRuntimeConditionExpression {
  const expression = record(raw, `RUNTIME_EXPRESSION_NOT_EXECUTABLE:${ruleRef}:OBJECT_REQUIRED`);

  if (typeof expression.kind === 'string') return compileStructured(expression, ruleRef);

  const legacy = compileLegacy(expression, ruleRef);
  if (legacy) return legacy;

  if (expression.language === 'BUSINESS_NATURAL_LANGUAGE') {
    return {
      kind: 'DECISION_INPUT',
      decisionRef: ruleRef,
      prompt: nonEmptyString(
        expression.body,
        `RUNTIME_DECISION_PROMPT_REQUIRED:${ruleRef}`,
      ),
    };
  }

  const language = typeof expression.language === 'string' && expression.language.trim()
    ? expression.language.trim()
    : 'UNKNOWN';
  throw new TypeError(`RUNTIME_EXPRESSION_NOT_EXECUTABLE:${ruleRef}:${language}`);
}

export function materializeRuntimeConditionSource(rule:{
  id:string;
  naturalLanguage?:string;
  expression?:unknown;
}):{ref:string;expression:unknown}{
  if(rule.expression!==undefined)return{ref:rule.id,expression:rule.expression};
  const prompt=typeof rule.naturalLanguage==='string'?rule.naturalLanguage.trim():'';
  if(!prompt)throw new TypeError(`RUNTIME_CONDITION_SOURCE_NOT_EXECUTABLE:${rule.id}`);
  return{
    ref:rule.id,
    expression:{
      language:'BUSINESS_NATURAL_LANGUAGE',
      body:prompt,
    },
  };
}
