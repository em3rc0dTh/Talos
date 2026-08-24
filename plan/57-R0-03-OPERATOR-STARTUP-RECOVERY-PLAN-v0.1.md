# R0-03 — Operator Startup / Shutdown / Recovery — Closure Plan v0.1

Status: ACTIVE  
Date: 2026-08-24

## Objective

Certify an honest operator lifecycle for Talos v0.1 Private Technical Preview using one durable runtime directory.

## Build checklist

```text
R0-03-A  required runtime-directory contract                   ✅
R0-03-B  single-writer safe operator lock                      ✅
R0-03-C  stale-lock recovery                                   ✅
R0-03-D  read-only durable evidence inspector                  ✅
R0-03-E  graceful close / SIGINT / SIGTERM                     ✅
R0-03-F  explicit mid-session limitation                       ✅
R0-03-G  adversarial restart/operator tests                    ✅ code added
R0-03-H  operator runbook                                      ✅ code added
R0-03-I  CI + exact-head certification                         ⏳
R0-03-J  clean PR merge                                        ⏳
```

## Required proof

1. one live operator owns the runtime directory
2. second operator is rejected before app startup
3. operator lock contains no secret values
4. clean close removes the lock
5. stale dead-PID lock can be recovered
6. process/confirmation evidence survives stop/start
7. recovery descriptor is identical before and after fresh startup when no domain action occurs
8. startup itself appends no domain/authority evidence
9. recovery inspection replays no authority action
10. prior in-memory authority session cannot be falsely resumed after restart
11. rejected mid-session continuation appends nothing
12. R0-01/R0-02/Image/Temporal/B10 regressions remain green

## Release truth

For v0.1:

```text
restart-safe durable persistence       SUPPORTED
restart-safe evidence inspection       SUPPORTED
same runtime directory reuse           SUPPORTED
single-writer operation                SUPPORTED
mid-session HTTP authority resumption  NOT_SUPPORTED_V0_1
```

The limitation must be visible in operator/recovery output and runbook.

## Merge gates

```text
R0-01 access regression             ✅ required
R0-02 config/secret regression      ✅ required
R0-03 operator/recovery             ✅ required
Image / full authority              ✅ required
B7–B9 real Temporal                 ✅ required
B10 restart                         ✅ required
exact diff/evidence-only audit      ✅ required
```

Unknown is not pass.

## Next

R0-04 — certify one real image-perception provider and one real external capability/integration transport, and package the corresponding full TEMPORAL_EXECUTION operator adapters.
