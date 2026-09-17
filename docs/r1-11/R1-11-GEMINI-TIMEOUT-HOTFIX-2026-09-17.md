# R1-11 Gemini timeout hotfix — 2026-09-17

## Incident

The Gemini-only field-trial stack configured `TALOS_IMAGE_PERCEPTION_TIMEOUT_MS=330000`, while the image perception runtime contract only accepts values from 1000 through 120000 milliseconds inclusive. Talos therefore failed during startup before any image could be processed.

## Correction

- Pin the Talos provider boundary to `120000` ms in `docker-compose.field-trial.gemini.yml`.
- Make the Talos boundary non-overridable in this field-trial Compose so a stale local `.env` cannot reintroduce an invalid value.
- Reduce the default per-model Gemini timeout to `15000` ms so the ordered six-model chain can progress within the global provider budget.
- Update `.env.field-trial.gemini.example` to match the valid runtime contract.
- Add CI and regression tests that reject the invalid 330000 value and verify the Compose-resolved timeout remains exactly 120000.

## Truth boundary

This hotfix only corrects startup/runtime configuration. It does not change source preservation, perception evidence semantics, human confirmation authority, deployment authority, execution authority, or the R1-11/R1-12 release gates.
