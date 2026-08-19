# TALOS — Reference Vertical Slice Plan v0.3 Recipient-Input Regression v0.1

Status: **PLAN REGRESSION PASS**  
Date: **2026-08-19**

## Trigger

B5 implementation preparation found that plan v0.2 required:

```text
COMMUNICATION / SEND_NOTIFICATION / EMAIL
→ REFERENCE_EMAIL_SINK
```

but did not specify how the required destination email address entered capability/execution/runtime design.

Implementing `requesterEmail` or another concrete business field without authority would violate source/semantic discipline.

## Resolution

`plan/09-REFERENCE-VERTICAL-SLICE-IMPLEMENTATION-PLAN-v0.3.md` adds only the missing cross-stage input rule:

```text
B5 logical CapabilityInputContract
recipientEmail
basis = SEMANTIC_DERIVED
state = REQUIRED

B5 binding
recipientEmail → REFERENCE_EMAIL_SINK.input.to

B6 execution input
notificationRecipientEmail
→ capability-use recipientEmail

B8/B9
concrete .test address supplied only at runtime
```

No source/business actor/recipient identity is inferred.

## V01–V40 compatibility

The v0.3 amendment does not alter any v0.2 fixture expectation:

```text
V01–V40                         ✅ RETAINED
```

In particular it does not alter:

```text
initial actor UNKNOWN
runtime policy fixture values
provider DB isolation
server-backed Temporal evidence
bounded build path/non-scope
```

## V41 — Notification recipient input provenance

Assertions:

```text
1. capability-design input exists because EMAIL execution needs a destination        PASS
2. designBasis = SEMANTIC_DERIVED                                                    PASS
3. no requester/customer/reviewer recipient identity is invented                    PASS
4. B5 mapping target is REFERENCE_EMAIL_SINK.input.to                                PASS
5. no concrete recipient value belongs in CapabilityBindingRevision                 PASS
6. B6 owns execution data dependency                                                  PASS
7. B8/B9 supply concrete value only at runtime                                       PASS
8. no worker/provider fallback recipient is permitted                                PASS
```

Result:

```text
V41                              8 / 8 PASS
V01–V40 compatibility           40 / 40 RETAINED

PLAN v0.3                       ✅ PASS
```

## Contract impact

```text
Phase-1–5 frozen DESIGN/ARCH     unchanged
BUILD scope                       unchanged
broad product BUILD               closed
```

This is implementation-plan evolution only.
