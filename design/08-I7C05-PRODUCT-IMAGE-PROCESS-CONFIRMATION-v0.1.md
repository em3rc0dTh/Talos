# I7C-05 — Product Image → Process Confirmation v0.1

Status: **CLOSED DESIGN**  
Date: **2026-08-20**

## Purpose

I7C-05 closes the product bridge between the arbitrary-image interpretation pipeline and the existing BPMN Process Confirmation workspace.

The user-facing route is now:

```text
USER PNG
  ↓ exact byte preservation
CONFIGURED + CORRELATED MODEL PERCEPTION
  ↓ MODEL_INFERENCE
COMMON SOURCE EVIDENCE
  ↓
INFERRED CANONICAL PROCESS REVISION
  ↓ semantic validation
DRAFT BPMN — IMAGE_INTERPRETATION
  ↓
GRAPH / XML / NL PROPOSAL REVIEW
  ↓ source-aware structured BPMN reconciliation on semantic edits
INFERRED CANONICAL REVISION
  ↓
CONFIRM PROCESS — HUMAN AUTHORITY
  ↓
HUMAN_CONFIRMATION CANONICAL REVISION
  ↓
CONFIRMED BPMN REVISION
  ↓
SEPARATE AUTOMATION-DESIGN APPROVAL
  ↓
SEMANTIC FREEZE
```

The final two transitions are deliberately separate. Process confirmation never authorizes deployment or execution.

## Truth transition

Image perception begins as model inference:

```text
MODEL_PROVIDER / MODEL_INFERENCE
           ↓
INFERRED canonical claims
           ↓
DRAFT BPMN review representation
```

Valid BPMN serialization does not change truth class.

When the business owner confirms the exact BPMN, Talos reuses the I5A source-family-neutral semantic confirmation contract:

```text
all current INFERRED claims
        ↓ ReviewCommand CONFIRM + authorityRef
applyClaimConfirmation
        ↓
new ProcessRevision
  derivationKind = HUMAN_CONFIRMATION
  parent = exact inferred ProcessRevision
  accepted claims = CONFIRMED
        ↓ revalidate
same BPMN XML/digest aligned to new canonical revision
        ↓
BusinessProcessConfirmationRecord
```

The previous inferred revision remains immutable.

## Structured BPMN reconciliation

The historical `NativeBpmnCanonicalReconciliationService` remains native-BPMN-only.

I7C-05 adds `BpmnCanonicalReconciliationService` for BPMN revisions produced by:

```text
NATIVE_BPMN
IMAGE_INTERPRETATION
TALOS_CANVAS
```

Its truth policy is source-aware:

```text
NATIVE_BPMN          → SOURCE_TRUTH
TALOS_CANVAS         → SOURCE_TRUTH
IMAGE_INTERPRETATION → INFERRED
```

Therefore a semantic graphical/XML/NL edit to an image-derived BPMN can be reconciled without pretending the model interpretation was source truth.

## Product server contract

`startTalosProcessConfirmationProduct` resolves the image perception runtime through the I7C-01 credential-safe binding.

### Provider disabled

```text
Upload PNG
→ exact source preserved
→ interpretation NOT_CONFIGURED
→ no BPMN fabricated
```

### Provider configured

```text
Upload PNG
→ I7C-02 exact request/response correlation
→ I7C-04 image BPMN review service
→ DRAFT BPMN + canonical validation returned to browser
```

The public status surface may expose provider/model/version/pipeline identity and whether authentication is configured. It never returns the bearer credential.

## Browser contract

The Process Confirmation page now displays:

```text
ORIGINAL IMAGE
        ↕
BPMN — WHAT TALOS UNDERSTANDS
        ↕
BPMN XML + SEMANTIC VALIDATION
        ↕
USER AUTHORITY
```

Before confirmation the image panel is explicitly labeled `IMAGE · MODEL INFERENCE`.

The user can:
- save graphical BPMN edits;
- apply XML edits;
- request natural-language correction proposals when configured;
- confirm the exact current process;
- separately approve the confirmed process for automation design.

## Authority invariants

```text
image upload                     ≠ confirmation
provider success                 ≠ confirmation
BPMN validity                    ≠ confirmation
BPMN edit                        ≠ source truth
Process Confirmation             ≠ automation-design approval
SemanticFreezeRecord             ≠ deployment approval
SemanticFreezeRecord             ≠ execution approval
```

Hard state at the end of I7C-05:

```text
automaticConfirmationAuthorized = false
automaticFreezeAuthorized       = false

deploymentAuthorized            = false
executionAuthorized             = false
```

The freeze is created only after the second explicit human gate.

## Non-claims

I7C-05 does **not** prove:
- a live external commercial vision-vendor call;
- model quality across unseen business-process diagrams;
- adversarial/no-fabrication performance across ambiguous diagrams;
- automatic capability binding for arbitrary confirmed image processes;
- end-user Temporal deployment from this browser surface.

Those are subsequent gates.
