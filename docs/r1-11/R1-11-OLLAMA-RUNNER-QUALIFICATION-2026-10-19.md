# R1-11 — Real Ollama hardware qualification finding

**Observed:** 2026-10-19 Lima / 2026-10-20 UTC  
**Exact candidate:** `bec90bec4ba8294f11d4520be3f3683d98716064`  
**GitHub Action:** https://github.com/em3rc0dTh/Talos/actions/runs/39354817657

## Result

The real `qwen2.5vl:7b` E2E did **not** pass on the standard GitHub-hosted CPU runner.

- Ollama installation, model pull and warm-up completed.
- The real gateway reported `READY` with `OLLAMA` primary and Gemini fallback disabled.
- Talos One-App reported `READY` and preserved the incoming real PNG exactly.
- The `/api/input/image` request took approximately 300 seconds and returned HTTP 200 with `SAFE_STOP_BEFORE_CANONICAL`, `providerStatus:NO_RESULT`, provider HTTP 503.
- No canonical meaning, approval or execution was invented. The fail-closed truth boundary worked.
- GitHub's runner had about 15 GiB RAM. This result establishes a provider E2E performance/reliability gap **on that class of runner**; it does not prove the code is wrong or that Qwen 7B cannot run on a properly equipped machine.
- The installer also attempted to start a second Ollama process and logged an address-in-use warning. The existing Ollama API did answer; treat this as bootstrap noise to clean up separately if still reproducible.

## Certification rule

Do not count this as R1-11 customer evidence, real-vision positive certification or Talos 1.0 PRODUCT READY.

The workflow is now manually invoked, with a configurable `TALOS_OLLAMA_RUNNER` repository variable for an appropriately provisioned runner (GPU preferred). It retains exact model `qwen2.5vl:7b`, the real source->gateway->One-App->BPMN review assertion and strict no-auto-authority assertions, with a longer bounded upstream timeout.

Run and attach a **passing** real-model workflow on a qualified runner before describing Qwen 7B as certified for the intended field-trial hardware. If CPU hardware is an intended user target, separately establish its measured latency, resource envelope and user-facing timeout/limitations.

Independently, R1-11 requires two real processes involving external participants and R1-12 requires exact-SHA certification. Never substitute synthetic tests for either.
