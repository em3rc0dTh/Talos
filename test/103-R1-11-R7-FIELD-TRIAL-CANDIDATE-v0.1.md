# R1-11 — Talos 1.0 Real-User Field Candidate r7

Status: **READY FOR REAL-USER RETEST — R1-11 OPEN**  
Date: **2026-08-27 (America/Lima)**  
Branch: `release/talos-1.0-rc-local`  
Launcher identity: `talos-private-preview-product-v0.9`  
Primary non-fixture source: `Car-Wash.bpmn`

## Why r7 exists

r6 advanced the real Car-Wash journey far enough to expose a release-blocking ExecutionPlan rebuild persistence defect.

That defect is now protected by two executable local regressions with a 2/2 PASS receipt. r7 is the first real-user candidate that contains that repair.

r7 is not a new product scope and is not a synthetic replacement for the field trial. It resumes the same R1-11 product question:

> Can the normal Talos product take this genuine process through governed automation and execution without invented meaning or authority?

## Evidence preservation rule

Preserve the r6 runtime/evidence exactly as observed.

Do not reuse its SQLite database as a way to skip the repaired journey and do not delete it to make the historical defect disappear.

For r7 use a fresh runtime directory:

```text
.runtime-local-release-r7
```

The only intended field-candidate identity change from r6 at launcher level is:

```text
talos-private-preview-product-v0.8
→ talos-private-preview-product-v0.9
```

## Start r7

From `build/reference-vertical-slice`, first update the RC branch normally.

Keep the same already-verified private-preview configuration used for the field trial, including the Temporal execution target when exercising the complete R1-11 journey. Change the runtime directory to the r7 directory instead of reusing r6 state.

PowerShell runtime-directory selection:

```powershell
$env:TALOS_PRIVATE_PREVIEW_RUNTIME_DIR = (Resolve-Path .).Path + '\\.runtime-local-release-r7'
npm run product
```

The launcher output must identify:

```text
launcherVersion: talos-private-preview-product-v0.9
```

If the configured profile is `DESIGN_ONLY`, deployment/execution remaining unavailable is correct product behavior, but that mode alone cannot close the complete execution field trial.

No credential or bearer-token value belongs in this evidence document.

## r7 journey rule

Use Talos normally. Do not manually recreate internal records or special-case the source.

Follow the existing runbook:

`test/103-TALOS-1.0-REAL-USER-FIELD-TRIAL-RUNBOOK-v0.1.md`

For the formerly failing ExecutionPlan stage, specifically observe this sequence:

```text
ExecutionPlan review
↓
BLOCKED_EXECUTION_DESIGN if explicit decisions are still needed
↓
user chooses the offered explicit execution treatment
↓
Rebuild ExecutionPlan
↓
new child ExecutionPlan revision
↓
READY_FOR_AUTOMATION_APPROVAL when blockers are resolved
↓
explicit automation approval remains a separate user action
```

Unacceptable outcomes include:

- immutable document conflict;
- capability bindings being created again by plan rebuild;
- an unchanged duplicate rebuild manufacturing a third revision;
- plan rebuild silently authorizing automation, Temporal design, deployment or execution.

## Do not repeat engineering-only work

The following defect-level regression receipt is already green and does not need to be rerun as part of ordinary product use unless a new failure gives reason to diagnose it:

```text
R1-11 execution-plan rebuild lineage        PASS
R1-11 One-App HTTP rebuild persistence      PASS
2 tests / 2 pass / 0 fail
```

The r7 task is now product behavior, not plumbing verification.

## Field checkpoint after the repaired point

If r7 passes `Rebuild ExecutionPlan`, continue the same journey. Do not stop merely because Defect 02 is fixed.

The intended remaining path is:

```text
explicit automation approval
→ Temporal mapping
→ explicit runtime policy
→ deployment design
→ environment realization
→ explicit deployment approval
→ deployment attempt
→ exact Workflow-start approval
→ one Workflow start
→ human/wait outcome where applicable
→ terminal durable evidence
→ restart/resume check when the process provides a waiting point
```

A new P0/P1/P2 product defect keeps R1-11 open and becomes a new append-only field-trial defect record.

## PASS boundary

r7 does not pass because the launcher starts and does not pass merely because the repaired button works.

R1-11 passes only when at least one genuine non-fixture process completes the supported product journey without a release-blocking defect and without implementation changes that special-case the source.

Even after R1-11 passes, Talos 1.0 remains not certified until R1-12 exact-SHA executable certification is also green.