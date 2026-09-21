# R1-11D Execution Plan — Business-first Unified One-App

**Date:** 2026-09-21  
**State:** IMPLEMENTED FOR CERTIFICATION

## Execution order

### D0 — baseline
- pin the execution branch to current remote main;
- preserve existing R1-11C/R1-00→R1-10 gates.

### D1 — durable clarification lifecycle
- persist guided semantic proposals;
- persist decisions;
- recover review bindings after restart;
- make repeated Apply idempotent;
- reject contradictory second decisions;
- return business-safe stale-state messages.

### D2 — application boundary for Canvas
- keep reference-api free of forbidden Canvas/semantic/review cross-module imports;
- orchestrate Canvas preservation/adaptation/normalization/validation/projection inside application;
- expose only the product-intake facade to One-App.

### D3 — unified source intake
- image;
- native BPMN;
- Talos Canvas;
- all converge on the same review/confirmation authority chain.

### D4 — five-stage business shell
- Process;
- Review;
- Confirm;
- Automate;
- Run;
- one user task at a time;
- Technical details available explicitly.

### D5 — business-first automation facade
- normal-language Automation Design choices;
- hidden internal capability binding;
- reviewable automation summary;
- explicit automation approval;
- no deployment or workflow start authority.

### D6 — Temporal preparation
- allow a normal user to prepare the approved Temporal design;
- keep runtime/deployment/execution administration separate.

### D7 — certification
Required:
- guided clarification survives restart;
- Apply is idempotent;
- Canvas reaches Automation Design;
- Image and BPMN regressions remain green;
- architecture boundaries remain green;
- B7-B10 remain green;
- R0 release regressions remain green.

## Physical acceptance

Repeat the real car-wash image:

```text
image
→ Gemini
→ Review
→ branch clarification
→ WAIT 5 minutes
→ Apply
→ new immutable revision
→ reconfirm
→ Automation Design
```

No raw `proposal not found` error is acceptable.

Then separately exercise:
- one native BPMN;
- one process created in Talos Canvas.

## Non-goals

R1-11D does not:
- auto-confirm business meaning;
- auto-approve automation;
- auto-deploy;
- auto-start Temporal;
- close R1-11;
- certify Talos 1.0.
