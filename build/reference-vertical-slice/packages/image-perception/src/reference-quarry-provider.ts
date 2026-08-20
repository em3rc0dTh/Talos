import type {
  ImagePerceptionProvider,
  ImagePerceptionProviderRequest,
  ImagePerceptionProviderResult,
  ProviderObservation,
  ProviderOccurrenceCandidate,
  ProviderPropertyCandidate,
  ProviderRelationCandidate,
} from './perception-types.ts';

export const QUARRY_02_VERIFIED_SHA256 = '219584f07852ac7a473018272e935f02c819b1c2fb4aedebd2fff4cd63aa8da9';

const labels = [
  ['customer', 'Customer'],
  ['company', 'The Aqua Distilled Water Company'],
  ['customer-service-assistant', 'Customer Service Assistant'],
  ['manager', 'Manager'],
  ['worker', 'Worker'],
  ['place-order', 'Place Order'],
  ['verify-customer-identity', 'Verify Customer Identity'],
  ['customer-exist', 'Customer Exist?'],
  ['create-customer-account', 'Create Customer Account'],
  ['on-next-wednesday', 'On Next Wednesday'],
  ['forward-order', 'Forward Order'],
  ['arrange-delivery', 'Arrange Delivery'],
  ['deliver-water', 'Deliver Water'],
  ['po-create', 'Purchase Order [Create]'],
  ['po-to-be-assigned', 'Purchase Order [To be Assigned]'],
  ['po-to-be-delivered', 'Purchase Order [To be Delivered]'],
  ['po-completed', 'Purchase Order [Completed]'],
  ['channel-annotation', 'Over 90% of requests are made by phone call, 10% by email.'],
] as const;

const relationSpecs = [
  ['start-to-place-order', 'customer-start', 'place-order', 'FLOW_CANDIDATE'],
  ['place-order-to-verify', 'place-order', 'verify-customer-identity', 'MESSAGE_INTERACTION_CANDIDATE'],
  ['verify-to-exists', 'verify-customer-identity', 'customer-exist', 'FLOW_CANDIDATE'],
  ['exists-no-to-create', 'customer-exist', 'create-customer-account', 'CONDITIONAL_FLOW_CANDIDATE'],
  ['exists-yes-to-wednesday', 'customer-exist', 'on-next-wednesday', 'CONDITIONAL_FLOW_CANDIDATE'],
  ['create-to-wednesday', 'create-customer-account', 'on-next-wednesday', 'FLOW_CANDIDATE'],
  ['wednesday-to-forward', 'on-next-wednesday', 'forward-order', 'FLOW_CANDIDATE'],
  ['forward-to-arrange', 'forward-order', 'arrange-delivery', 'FLOW_CANDIDATE'],
  ['arrange-to-deliver', 'arrange-delivery', 'deliver-water', 'FLOW_CANDIDATE'],
  ['deliver-to-end', 'deliver-water', 'company-end', 'FLOW_CANDIDATE'],
] as const;

function textObservations(): ProviderObservation[] {
  return labels.map(([key, text]) => ({
    providerObservationKey: `text:${key}`,
    anchorKey: 'whole-image',
    observationKind: 'TEXT_LITERAL_CANDIDATE',
    observedValue: text,
    confidence: 1,
    notes: 'TEST_ONLY fixture expectation derived from the reviewed Quarry-02 Mining Site record; not a production OCR claim.',
  }));
}

function connectorObservations(): ProviderObservation[] {
  return relationSpecs.map(([key]) => ({
    providerObservationKey: `stroke:${key}`,
    anchorKey: 'whole-image',
    observationKind: 'CONNECTOR_STROKE',
    observedValue: { fixtureRelationKey: key },
    confidence: 1,
    notes: 'TEST_ONLY fixture expectation; this provider does not assert a region-level polyline.',
  }));
}

function property(propertyPath: string, literalValue: unknown, supportingObservationKeys: string[], notes: string): ProviderPropertyCandidate {
  return { propertyPath, sourceState: 'SET', literalValue, supportingObservationKeys, confidence: 1, notes };
}

function occurrences(): ProviderOccurrenceCandidate[] {
  const participant = (key: string, actorKind: string): ProviderOccurrenceCandidate => ({
    providerOccurrenceKey: key,
    anchorKeys: ['whole-image'],
    occurrenceKind: 'PARTICIPANT',
    literalLabelObservationKey: `text:${key}`,
    candidateSemanticType: 'ACTOR',
    sourcePlaneKind: 'RESPONSIBILITY_COLLABORATION',
    supportingObservationKeys: [`text:${key}`],
    propertyCandidates: [property('propertyValues.actorKind', actorKind, [`text:${key}`], 'Role/participant kind is an interpretation candidate from the reviewed source record, not native structured source truth.')],
    confidence: 1,
    notes: 'Fixture occurrence candidate; ACTOR is an inferred semantic candidate, not source truth.',
  });
  const node = (key: string, candidateSemanticType: string, propertyCandidates: ProviderPropertyCandidate[] = [], extraSupporting: string[] = []): ProviderOccurrenceCandidate => ({
    providerOccurrenceKey: key,
    anchorKeys: ['whole-image'],
    occurrenceKind: 'NODE',
    literalLabelObservationKey: labels.some(([labelKey]) => labelKey === key) ? `text:${key}` : undefined,
    candidateSemanticType,
    sourcePlaneKind: 'BUSINESS_GRAPH',
    supportingObservationKeys: unique([...(labels.some(([labelKey]) => labelKey === key) ? [`text:${key}`] : []), ...extraSupporting]),
    ...(propertyCandidates.length ? { propertyCandidates } : {}),
    confidence: 1,
    notes: 'Fixture occurrence candidate; semantic type remains inferred until later review/normalization.',
  });
  const object = (key: string): ProviderOccurrenceCandidate => ({
    providerOccurrenceKey: key,
    anchorKeys: ['whole-image'],
    occurrenceKind: 'OBJECT_NODE',
    literalLabelObservationKey: `text:${key}`,
    candidateSemanticType: 'DATA_OBJECT',
    sourcePlaneKind: 'OBJECT_DATA',
    supportingObservationKeys: [`text:${key}`],
    confidence: 1,
  });

  return [
    participant('customer', 'EXTERNAL_PARTY'),
    participant('company', 'ORGANIZATION'),
    participant('customer-service-assistant', 'HUMAN_ROLE'),
    participant('manager', 'HUMAN_ROLE'),
    participant('worker', 'HUMAN_ROLE'),
    node('customer-start', 'EVENT', [property('propertyValues.eventRole', 'START', ['shape:customer-start'], 'The reviewed source record explicitly describes a visible START marker; this remains a perception-derived candidate for the current fixture.')], ['shape:customer-start']),
    node('place-order', 'ACTION'),
    node('verify-customer-identity', 'ACTION'),
    node('customer-exist', 'DECISION'),
    node('create-customer-account', 'ACTION'),
    node('on-next-wednesday', 'WAIT', [property('propertyValues.waitKind', 'CALENDAR_TIME', ['shape:on-next-wednesday'], 'The reviewed source record identifies this as a time-based intermediate event; exact instant/timezone remain unresolved.')], ['shape:on-next-wednesday']),
    node('forward-order', 'ACTION'),
    node('arrange-delivery', 'SUBPROCESS', [property('propertyValues.boundaryMeaning', 'COLLAPSED_SUBPROCESS', ['shape:arrange-delivery'], 'The reviewed source record identifies the visible collapsed subprocess marker; internal subprocess semantics remain unknown.')], ['shape:arrange-delivery']),
    node('deliver-water', 'ACTION', [property('propertyValues.actor', 'Worker', ['attachment:worker-deliver'], 'The reviewed source record explicitly places Deliver Water in the Worker lane; completion observation remains unresolved.')], ['attachment:worker-deliver']),
    node('company-end', 'END', [property('propertyValues.eventRole', 'END', ['shape:company-end'], 'The reviewed source record explicitly describes a visible END marker; this remains a perception-derived candidate for the current fixture.')], ['shape:company-end']),
    object('po-create'),
    object('po-to-be-assigned'),
    object('po-to-be-delivered'),
    object('po-completed'),
    {
      providerOccurrenceKey: 'channel-annotation',
      anchorKeys: ['whole-image'],
      occurrenceKind: 'ANNOTATION',
      literalLabelObservationKey: 'text:channel-annotation',
      sourcePlaneKind: 'NOTATION_ANNOTATION',
      supportingObservationKeys: ['text:channel-annotation'],
      confidence: 1,
      notes: 'The phone/email statement is preserved as annotation evidence, not converted into routing semantics.',
    },
  ];
}

function unique<T>(items: T[]): T[] { return [...new Set(items)]; }

function relations(): ProviderRelationCandidate[] {
  return relationSpecs.map(([key, source, target, role]) => ({
    providerRelationKey: key,
    strokeObservationKeys: [`stroke:${key}`],
    anchorKeys: ['whole-image'],
    existenceConfidence: 1,
    sourceEndpointCandidates: [{ occurrenceCandidateKey: source, anchorKey: 'whole-image', endpointState: 'SET_CANDIDATE', confidence: 1 }],
    targetEndpointCandidates: [{ occurrenceCandidateKey: target, anchorKey: 'whole-image', endpointState: 'SET_CANDIDATE', confidence: 1 }],
    directionCandidates: [{ value: 'SOURCE_TO_TARGET', confidence: 1 }],
    roleAlternativeSetKey: `role:${key}`,
    notes: `TEST_ONLY fixture expectation for ${role}; provider preference is not confirmed business truth.`,
  }));
}

function noResult(providerId: string, providerVersion: string, code: string, description: string): ImagePerceptionProviderResult {
  return {
    providerId,
    providerVersion,
    providerClass: 'FIXTURE_PROVIDER',
    modelRef: 'fixture:quarry-02-reviewed-source-record',
    modelVersion: 'source-02.md@b4f9355b2f7039cf292bf38dea2770bbaef2675b',
    pipelineVersion: 'image-fixture-v0.2',
    evidenceMode: 'FIXTURE_EXPECTATION',
    status: 'NO_RESULT',
    anchors: [],
    observations: [],
    occurrenceCandidates: [],
    alternativeSets: [],
    relationCandidates: [],
    diagnostics: [{ code, description }],
  };
}

export class ReferenceQuarryPerceptionProvider implements ImagePerceptionProvider {
  readonly providerId = 'REFERENCE_QUARRY_PERCEPTION';
  readonly providerVersion = '1.1.0-reference';

  perceive(request: ImagePerceptionProviderRequest): ImagePerceptionProviderResult {
    if (request.contentSha256 !== QUARRY_02_VERIFIED_SHA256) {
      return noResult(this.providerId, this.providerVersion, 'NO_PERCEPTION_PROVIDER_RESULT', 'REFERENCE_QUARRY_PERCEPTION only supports the exact verified Quarry-02 fixture digest.');
    }
    if (request.coordinateSpace.width !== 791 || request.coordinateSpace.height !== 451) {
      return noResult(this.providerId, this.providerVersion, 'FIXTURE_DIMENSION_MISMATCH', 'Digest matched but the supplied coordinate space did not match Quarry-02.');
    }

    return {
      providerId: this.providerId,
      providerVersion: this.providerVersion,
      providerClass: 'FIXTURE_PROVIDER',
      modelRef: 'fixture:quarry-02-reviewed-source-record',
      modelVersion: 'source-02.md@b4f9355b2f7039cf292bf38dea2770bbaef2675b',
      pipelineVersion: 'image-fixture-v0.2',
      evidenceMode: 'FIXTURE_EXPECTATION',
      status: 'SUCCEEDED',
      anchors: [{
        providerAnchorKey: 'whole-image',
        geometryKind: 'WHOLE_IMAGE',
        geometry: { x: 0, y: 0, width: 791, height: 451 },
        visibilityState: 'VISIBLE',
        notes: 'Fixture uses whole-image evidence because the reviewed source record does not supply pixel-region annotations.',
      }],
      observations: [
        ...textObservations(),
        ...connectorObservations(),
        { providerObservationKey: 'shape:customer-start', anchorKey: 'whole-image', observationKind: 'SHAPE_CLASS_CANDIDATE', observedValue: 'START_EVENT_LIKE', confidence: 1, notes: 'TEST_ONLY reviewed-source expectation; visible marker interpretation remains INFERRED.' },
        { providerObservationKey: 'shape:customer-exist', anchorKey: 'whole-image', observationKind: 'SHAPE_CLASS_CANDIDATE', observedValue: 'GATEWAY_LIKE', confidence: 1, notes: 'Fixture expectation; geometry-specific inference is not generalized.' },
        { providerObservationKey: 'shape:on-next-wednesday', anchorKey: 'whole-image', observationKind: 'SHAPE_CLASS_CANDIDATE', observedValue: 'TIME_INTERMEDIATE_EVENT_LIKE', confidence: 1, notes: 'Reviewed-source expectation; exact time expression/timezone remain unresolved.' },
        { providerObservationKey: 'shape:arrange-delivery', anchorKey: 'whole-image', observationKind: 'SHAPE_CLASS_CANDIDATE', observedValue: 'ACTIVITY_WITH_COLLAPSED_MARKER', confidence: 1, notes: 'Reviewed-source expectation; internal subprocess semantics remain unresolved.' },
        { providerObservationKey: 'attachment:worker-deliver', anchorKey: 'whole-image', observationKind: 'SPATIAL_ATTACHMENT', observedValue: { role: 'Worker', activity: 'Deliver Water', relation: 'LANE_RESPONSIBILITY_CANDIDATE' }, confidence: 1, notes: 'Reviewed-source expectation that Deliver Water is placed in the Worker lane; not native structured membership.' },
        { providerObservationKey: 'shape:company-end', anchorKey: 'whole-image', observationKind: 'SHAPE_CLASS_CANDIDATE', observedValue: 'END_EVENT_LIKE', confidence: 1, notes: 'TEST_ONLY reviewed-source expectation; visible marker interpretation remains INFERRED.' },
        { providerObservationKey: 'plane:business-graph', anchorKey: 'whole-image', observationKind: 'PLANE_REGION', observedValue: 'BUSINESS_GRAPH', confidence: 1, notes: 'Fixture expectation from the reviewed source record classification.' },
      ],
      occurrenceCandidates: occurrences(),
      alternativeSets: relationSpecs.map(([key, , , role]) => ({
        providerAlternativeSetKey: `role:${key}`,
        propertyPath: 'relationshipRole',
        exclusivityMode: 'MUTUALLY_EXCLUSIVE',
        alternatives: [
          { providerAlternativeKey: `role:${key}:preferred`, value: role, confidence: 0.95, anchorKeys: ['whole-image'], supportingObservationKeys: [`stroke:${key}`], interpretationNotes: 'TEST_ONLY preferred fixture interpretation; preference is not human confirmation.' },
          { providerAlternativeKey: `role:${key}:unknown`, value: 'UNKNOWN_RELATIONSHIP_ROLE', confidence: 0.05, anchorKeys: ['whole-image'], supportingObservationKeys: [`stroke:${key}`], interpretationNotes: 'Retained to prove provider preference does not erase an alternative.' },
        ],
        modelPreferredAlternativeKey: `role:${key}:preferred`,
        modelPreferenceConfidence: 0.95,
      })),
      relationCandidates: relations(),
      diagnostics: [
        { code: 'FIXTURE_PROVIDER_NOT_REAL_VISION', description: 'Output is deterministic conformance evidence derived from the reviewed Quarry-02 Mining Site source record and must not be represented as arbitrary-image perception.' },
        { code: 'FIXTURE_SOURCE_RECORD_BYTE_IDENTITY_MISMATCH', description: 'source-02.md records a different historical byte digest than the current quarry-02.png fixture. The reviewed semantic record is used only as secondary fixture expectation evidence; it does not prove byte identity for the current PNG.' },
      ],
    };
  }
}