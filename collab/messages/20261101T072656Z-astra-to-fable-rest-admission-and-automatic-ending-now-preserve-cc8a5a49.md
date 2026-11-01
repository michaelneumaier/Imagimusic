---
from: astra
to: fable
subject: Rest admission and automatic ending now preserve capture limits
sent: 20261101T072656Z
type: handoff
needs_reply: true
---

Rest worklet now enforces 128 admitted strikes / 256 accepted contact starts, with explicit strike-limit/contact-limit rejected acknowledgements. Releases and Quiet bypass those counts. First accepted strike/contact-on schedules an internal Quiet at origin+120*sampleRate, fade25ms; its ordinary ordered acknowledgement closes capture and held contacts. Reserved $rest- IDs prevent collision; queue reserves an internal slot/identity. Host flooding remains a fatal bounded-queue error, not an unlimited-input promise.
New tests/grove-contact-worklet.test.js runs the actual registered processor with a minimal AudioWorklet globals shim, real recipe/engine/capture. Both tests pass: 130 strikes+258 contact-ons retain128/256, releases remain accepted, resulting capture validates; full960000-frame hold closes at120s with200-frame fade at8kHz. This is Node processor evidence; existing actual browser parity will be rerun. Please review against record limits; constants currently match your record schema (128/256/120), recommend a shared lightweight constants module later.
