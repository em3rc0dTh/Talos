# Gemini perception: unavailable models and timeouts

`Configured: true` confirms a key is present. It does not prove successful image
inference, quota availability, or model availability.

An upstream `GEMINI_HTTP_503` reports a provider response. A timeout means Talos
did not receive the complete response within its configured deadline. These are
different failures. Google documents transient retry handling in its
[troubleshooting guide](https://ai.google.dev/gemini-api/docs/troubleshooting).

The per-model timer covers both response headers and the complete response body.
It must not stop when headers arrive. Timeouts identify `RESPONSE_HEADERS` or
`RESPONSE_BODY`, and carry attempt status `504`; exhausting the entire chain
continues to return the existing fail-closed `503 PERCEPTION_GATEWAY_UNAVAILABLE`
contract. Source evidence never becomes an invented successful process.

## Try fewer models with a longer per-model deadline

If all 25-second attempts time out, one diagnostic option is to prioritize the
lighter models already used by the installation and allow 50 seconds each.
Edit only these non-secret entries in the existing `.env.field-trial.gemini`:

```dotenv
GEMINI_MODEL_CHAIN=gemini-3.5-flash-lite,gemini-3.1-flash-lite
GEMINI_TIMEOUT_MS=50000
GEMINI_CHAIN_BUDGET_MS=110000
```

The two attempts fit within the 110-second chain budget and the existing
120-second Talos provider ceiling. The shorter chain and longer attempt deadline
are a diagnostic configuration, not a guarantee of provider availability or
image quality. Check the current [supported models](https://ai.google.dev/gemini-api/docs/models)
and the installation's account access before choosing different models.

From the repository root on the branch containing this fix:

```bash
git pull --ff-only
docker compose --env-file .env.field-trial.gemini -f docker-compose.field-trial.gemini.yml up -d --build perception
```

Recreation applies the environment changes. A plain container restart does not
replace its environment configuration. Confirm the effective model order and
budgets without printing credentials:

```bash
docker compose --env-file .env.field-trial.gemini -f docker-compose.field-trial.gemini.yml exec -T perception node -e "fetch('http://127.0.0.1:8790/health').then(r=>r.text()).then(console.log)"
```

Retry the image, then inspect perception logs. A subsequent `success` records the
selected model; repeated `503` responses still require provider recovery or an
available supported route. Native BPMN or Canvas remains usable without image
perception. No real API key or live Google inference is used in the local timeout
tests; they exercise actual HTTP sockets with stalled headers and stalled bodies.
