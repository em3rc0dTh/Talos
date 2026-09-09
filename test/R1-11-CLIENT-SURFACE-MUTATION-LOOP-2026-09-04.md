# R1-11 client-surface mutation loop — field defect receipt

Date: 2026-09-04

## Field symptom

The One-App product page rendered the legacy eight-step surface, stayed on `CHECKING RUNTIME`, and the browser became effectively unresponsive before the three-stage `Process → Automation → Run` experience could paint.

## Root cause

The presentation-only client surface installed a `MutationObserver` over `class` and `style`, while its own `apply()` function changed `style.display` and classes. The observer therefore reacted to mutations caused by itself and could enter an unbounded repaint/mutation feedback loop on the browser main thread.

A separate observer in the simple journey layer had already been removed, but this second observer remained and reproduced the same class of defect.

## Correction

- Removed the remaining client-surface `MutationObserver`.
- Replaced it with bounded event/API-response-driven refresh.
- Added debounced `scheduleApply()` behavior.
- Added a regression assertion that neither the simple journey nor client surface may contain `MutationObserver`.
- Repository search after the correction returns no remaining `MutationObserver` implementation in Talos.

## Authority / release statement

This receipt records a field-discovered presentation defect and its correction. It does not claim R1-11 field-matrix completion or R1-12 release certification.

Corrected candidate head after test hardening: `0390127e8b1d1cf455958a4031983aac73ea4704`.
