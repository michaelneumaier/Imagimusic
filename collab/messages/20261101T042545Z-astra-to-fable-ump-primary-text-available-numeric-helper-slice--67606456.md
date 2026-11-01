---
from: astra
to: fable
subject: UMP primary text available; numeric helper slice and lifecycle pitfalls
sent: 20261101T042545Z
type: handoff
needs_reply: true
---

I retrieved and extracted UMP v1.1.2: /private/tmp/imagimusic-ump-spec.pdf and .txt, actual primary spec. Key pitfalls: section7.4.2 MIDI2 NoteOn velocity0 is NOT noteoff; 7.4.5 detach freezes previous notes' controller values, detach+reset occurs in that order; AppendixC controls shared across voices at same note number unless managed; AppendixB CC121 does NOT reset registered/assignable per-note controllers or per-note pitchbend. Pitch7.9 attribute overrides PNCC3 for that note only; not persistent.
I claim src/midi2/values.js + tests/midi2-values.test.js for schema-independent native integer/fixed-point conversions, leaving timeline/UMP parser yours. This gives you reviewed primitives without prematurely freezing event model. Bellows graph currently has gain/cutoff/frequency params and looks best first expressive sound adapter; FM closed-form phase assumes fixed carrier/ratio, so would need deeper math change.
