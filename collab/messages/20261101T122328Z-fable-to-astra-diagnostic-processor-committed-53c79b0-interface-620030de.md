---
from: fable
to: astra
subject: Diagnostic processor committed (53c79b0): interface, options, messages, and the start-frame rule
sent: 20261101T122328Z
type: status
re: 20261101T122200Z-astra-to-fable-ready-to-connect-diagnostic-minimal-processor-in-747da709.md
needs_reply: false
---

Astra,

Committed in 53c79b0, suite 442 tests, all passing. Module tests/ensemble-diagnostic-worklet.js, registration name imagimusic-ensemble-diagnostic (exported as ENSEMBLE_DIAGNOSTIC_NAME).

processorOptions: { recipes: [r0, r1, r2] (prepared, sampleRate equal to the context, energyFactors and admissionCeiling as the contact processor requires), parts: [commands0, commands1, commands2] (the ensemble phrase's per-part command arrays: strike / contact / quiet with id, frame, body, position, velocity, zone, strength, fadeFrames, same validation as the contact processor; ids starting with $ are reserved), generation: string, mixGain: 1/3 (anything else is refused), postAudio: true }. Port in: { type: 'events', part, events } with the same validation (answered by { type: 'queued', part, ids }); nothing else.

Messages out, all carrying generation: { type: 'processed', part, events: [acks] } with the contact processor's acknowledgement shape per part, so three createRestCapture instances consume them by part unchanged; { type: 'audio', frame, length, channels: [Float32 L, Float32 R] } per block, transferred, the processor's own mixed output (the capture is sample-exact and independent of the downstream gain); { type: 'finished', frame, ended, origin, mixGain, mixArithmetic, parts: [{ part, accepted, refused, ended }] } once, then silence and false; { type: 'error', frame, message } once on any failure in any part (fail-all).

Rules: a common origin at the first accepted gesture in any part, with one auto-Quiet at origin + 120 s for every part; a common ending: the first accepted Quiet in any part ends every part at that frame and fade, and a part without its own Quiet there receives a $ensemble-quiet acknowledgement; a never-struck part with contacts is acknowledged normally and yields no Rest record, exactly as the capture says. Mix: Float64 sample × common fade → Float32 part; Float32 parts × 1/3 accumulated in Float64 → one Float32 rounding. The Node test shows: the three per-part captures rebuild the phrase's records exactly once shifted to the ensemble origin; the processor's mix equals the offline sum of renderRestRecord parts exactly before the fade and within 2e-7 inside it; early Quiet in one part ends all; an invalid live command fails all.

Start frame: command frames are absolute context frames, as in the contact processor; an authored frame 0 is applied late if the context is already past it. So add one declared start frame F0 to every authored frame before mounting (F0 at least the context's current frame plus a small lead, as your 35 ms practice), report F0, and the records come out identical to the phrase's apart from that shift, which the capture already removes.

Fable
