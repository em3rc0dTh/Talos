# TALOS — I7C-03 Arbitrary Image → Common Source Evidence v0.1

Status: **PASS — CLOSED**  
Date: **2026-08-20**

## Exact proven implementation head

```text
36193d265ae8e7450ff4334beadd7a3733d40282
```

## Exact CI

```text
Image vertical slice              run 262 ✅
B7-B9 Temporal reference runtime  run 277 ✅
B10 Restart safety                run 174 ✅
```

The Image run completed every historical image/BPMN/confirmation/freeze gate and the current movable edge gate.

## Proven path

```text
previously unregistered PNG
→ exact source intake
→ credential-safe configured HTTP route
→ exact request/response correlation
→ MODEL_PROVIDER / MODEL_INFERENCE
→ VisualEvidenceAnchor / PerceptionObservation
→ explicit alternatives / unresolved relation endpoint
→ SourceOccurrenceDescriptor / SourceRelationshipDescriptor
→ SourceEvidenceGraph
→ CandidateSemanticScope
```

The test image digest is explicitly distinct from the known Quarry-01 identities used in historical proofs.

## Image provenance

At the common-evidence boundary, visual geometry is intentionally retained through `sourceExtensionRefs`, which pin:

```text
ImageCoordinateSpace
VisualEvidenceAnchor
PerceptionObservation
PerceptionAlternativeSet
PerceptionRelationCandidate
```

`SourceEvidenceGraph.evidenceFragmentIds` remains empty at this stage. Canonical `EvidenceFragment` records are created by the later common normalization step. I7C-03 pressure-tested this distinction rather than fabricating an earlier provenance layer.

## Ambiguity stays explicit

The provider fixture used by the HTTP contract returns a relation with:

```text
source endpoint  SET_CANDIDATE
target endpoint  UNRESOLVED
role alternatives CONTROL_FLOW vs MESSAGE_RELATIONSHIP
```

Talos preserves the unresolved endpoint and the model preference does not create a `PerceptionAlternativeDecision`.

## Authority

The entire result remains:

```text
truth class                    INFERRED
semanticAuthority              NONE
automaticFreezeAuthorized      false
automaticExecutionAuthorized   false
```

No ProcessRevision, SemanticFreezeRecord, capability design, ExecutionPlan, Temporal mapping, or deployment revision is produced by the source-evidence step.

## CI evolution

I7C-03 introduces the `image:edge:test` script and converts the Image workflow's final step into a movable edge gate. Historical gates remain explicit; later slices advance only the current edge test instead of rewriting the complete workflow for every version.
