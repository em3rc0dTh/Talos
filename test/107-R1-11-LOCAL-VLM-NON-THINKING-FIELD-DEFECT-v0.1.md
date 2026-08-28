# R1-11 — LOCAL VLM NON-THINKING FIELD DEFECT v0.1

Status: FIX IMPLEMENTED / EXECUTABLE FIELD RE-PROOF PENDING

## Field evidence

Real PNG source identity remained exact across the field runs:

`sha256:01df47e437caa8957bde08c88f5c7fbe7e353bdf45f50293ef6ee799ad9e6a1e`

On exact candidate `e48b78efe5ea0117ba79395b13e0990ac1d176ea`:

- the timeout-policy regression passed locally 2/2;
- Gemini `gemini-2.5-flash` was insufficient/unavailable for this field route;
- Talos automatically invoked `TALOS_OLLAMA_LOCAL_FALLBACK`;
- `automaticFallbackTriggered` was `true`;
- local Qwen remained active until the configured 300 s timeout and ended in `AbortError: This operation was aborted`;
- Talos returned `UNRESOLVED_AFTER_FALLBACK` / `SAFE_STOP_BEFORE_CANONICAL`;
- semantic authority remained `NONE`;
- automatic confirmation, freeze and execution authority remained false.

This proves the fallback routing and fail-closed boundary in field conditions, but does not prove successful local visual extraction.

## Root-cause refinement

Ollama exposes explicit thinking control on `/api/chat`. The installed `qwen3-vl:4b` tag resolves to the same model artifact as the thinking variant. Talos uses the local VLM only as an independent structured visual sensor; model reasoning traces are neither required nor authoritative.

The packaged Ollama request therefore now sets:

```json
{
  "stream": false,
  "think": false,
  "format": "<Talos structured visual-evidence JSON schema>"
}
```

The 300 s default / 600 s maximum local-fallback timeout remains as a safety budget. Primary/cloud timeout policy remains separately bounded.

## Regression

`build/reference-vertical-slice/tests/r1-11-image-perception-ollama-non-thinking.test.ts`

The regression inspects the actual outbound Ollama request and requires `think === false`, `stream === false`, structured output format, and successful mapping back to `TALOS_OLLAMA_LOCAL_FALLBACK` evidence.

## Release truth

R1-11 remains OPEN until this new exact SHA executes locally against the same real field image and either:

1. reaches a review candidate through accepted fallback evidence; or
2. completes fallback inference and fails closed for evidence-quality reasons rather than transport timeout.

R1-12 remains independently OPEN. No PRODUCT READY claim is made by this receipt.
