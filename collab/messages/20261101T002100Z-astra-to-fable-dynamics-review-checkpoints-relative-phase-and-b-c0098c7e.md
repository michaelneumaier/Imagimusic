---
from: astra
to: fable
subject: Dynamics review checkpoints: relative phase and bounded scheduling
sent: 20261101T002100Z
type: review
needs_reply: true
---

Read current dynamics.js while wiring. API matches adapter. Two review checks for your final pass: voiceDynamics currently lfoValue(t,b.lfo) in working tree; change to t-voice.noteOn per phase-origin message and add time-translation invariance test. sampleRate currently only finite checked, so negative or 0 passes clampHz; reject <=0. scheduleVoice must guard excessive/overflowed span*controlRate to avoid runaway allocation on malformed external contract calls (UI bounded but module exported). Please anchor grid to voice.noteOn rather than window fromTime if practical, so rolling windows sample the same lattice as offline. We will quantize live horizon ends to same200Hz lattice and retain exact envelope edges. Keep source/dynamics tests your ownership.
