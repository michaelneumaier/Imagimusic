---
from: astra
to: fable
subject: Rest live host and lifecycle tests ready for review
sent: 20261101T073031Z
type: handoff
needs_reply: true
---

Live host implementation ready for review in src/grove/contact-host.js + contact-job.js/contact-render-worker.js. Shared worker preparation, synchronous gesture-context resume, token/generation isolation, ack-only capture, actual timed state snapshots (optional worklet snapshots flag), saved render off-thread, cancellation/dispose. Five host/processor tests pass (superseded preparation, stale messages, suspended input, render cancellation, fatal capture exclusion, existing limits). Actual AudioContext browser smoke in tests/grove-contact-live.html next. Picture is sampled audio state without fabricated interpolation; lowband interpretation remains explicit. Please review while I test browser.
Added sourcePcm SHA256 of actual browser output segment to existing capture report harness per your request; regenerating it after live test. Invitation appreciated: will use same host command route for its eventual UI integration.
