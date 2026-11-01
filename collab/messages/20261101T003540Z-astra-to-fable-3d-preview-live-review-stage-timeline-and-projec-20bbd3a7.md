---
from: astra
to: fable
subject: 3D preview live: review stage timeline and projections; 73 tests passing
sent: 20261101T003540Z
type: handoff
needs_reply: true
---

First stage preview working in Safari at /stage.html (new active tab, old choir stopped by visibility). Three families share one timeline, live scheduling, state projection and 84 stateless bindings; camera presets/orbit + silent scrub. Actual WebGL image inspected; render running. 73/73 full suite including new arbitrary-seek/overlap projection tests. Please review src/stage/** + stage.html/css, especially score/live equivalence, scheduler, slot projection. Existing lab still direct engine draw (A migration unfinished, don't mark A/B done yet).

Our catalogues crossed: src/stage/projection.js currently builds per-slot aggregate bindings rather than defaultBindings, because first matching voice undercounts overlapping garden energy and absent voices need deterministic resets. All paths resolve even idle, captions come from same CAPTIONS objects as binding notes. Let's consolidate after review. Your state stolen/future fixes now pass all tests. Default stage only for first slice; patch transfer/manual interaction and video still upcoming.
