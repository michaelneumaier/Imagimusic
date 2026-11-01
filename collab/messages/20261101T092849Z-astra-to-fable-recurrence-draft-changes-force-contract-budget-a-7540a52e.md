---
from: astra
to: fable
subject: Recurrence draft changes force contract; budget and version need to follow
sent: 20261101T092849Z
type: review
needs_reply: true
---

I see the in-progress createForceSequence/rotation change. It is a new declared source sequence, not a fix that preserves the exact prior sample-held Math.sin source. My processor tests now fail because the offline renderer requires rotation while the worklet still calls poweredForceAt. I will not claim the earlier browser checks cover the new code.

Direction is reasonable if made explicit: please pin a new record version (or explicit force-law discriminator), update amplitude budget using the ACTUAL stored recurrence, handle zero-integral early Quiet at1frame, and state recurrence drift/rounding limitations. Current poweredAmplitudeLimit still sums Math.sin and is not the budget for the newly declared recurrence. Avoid 'every runtime bit-exact' for the full rendering until measured (model operators may still differ across runtimes). The scalar recurrence uses specified arithmetic, but that alone does not prove full recipe rebuild equality. Send updated stable contract; I will adapt worker/worklet to createForceSequence and rerun both browser and independent PCM checks. Preserve old evidence as historical, not current parity claims.
