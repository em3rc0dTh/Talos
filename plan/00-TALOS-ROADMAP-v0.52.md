# TALOS — Gated Roadmap v0.52

Status: **I7C-04 CLOSED / I7C-05 OPEN**  
Date: **2026-08-20**

## Closed

```text
I0–I7B-08  prior Talos/runtime/BPMN product gates        ✅
I7C-01      credential-safe real provider runtime config ✅
I7C-02      exact model-response correlation             ✅
I7C-03      arbitrary image → common source evidence     ✅
I7C-04      image evidence → canonical → BPMN review     ✅
```

I7C-04 exact head: `109e2484d430d03c3479303f978464c615f1727b`  
CI: Image 274 ✅ · Temporal 285 ✅ · Restart 180 ✅

# I7C-05 — Product image upload → real vision → Process Confirmation

## Goal

Wire the I7C-04 service into the existing I7B-08 product server/browser without changing the historical I7B-05 entrypoint.

Configured product route:

```text
Upload image
→ preserve exact PNG
→ configured/correlated perception
→ canonical normalization + validation
→ DRAFT image-derived BPMN
→ existing graph/XML Process Confirmation workspace
→ Confirm Process
```

Unconfigured route remains:

```text
Upload image
→ exact source preserved
→ INTERPRETATION_PENDING
```

Provider failure/NO_RESULT remains visible and cannot fabricate BPMN.

## Acceptance

```text
1. workspace status safely exposes provider configured/disabled state        required
2. provider descriptor exposed without secret material                       required
3. configured image upload returns DRAFT BPMN + validation                   required
4. browser renders image source + image-derived BPMN                          required
5. exact image-derived canonical binding supports Confirm Process              required
6. provider disabled keeps historical pending behavior                         required
7. provider safe-stop keeps source visible and no fake BPMN                    required
8. graph/XML visual edits remain synchronized                                  required
9. semantic edit path must re-reconcile structured BPMN before confirmation     required
10. no automatic confirmation/freeze/deployment/execution                      required
11. all prior gates remain green                                                required
```

## Remaining

```text
I7C-05  product image → vision → Process Confirmation              🟡 ACTIVE
I7C-06  external-vendor/adversarial/no-fabrication certification   ⛔
I8      automation design review + BPMN↔Temporal traceability      ⛔
I9      one-app startup/deploy/full end-to-end release gate        ⛔
```
