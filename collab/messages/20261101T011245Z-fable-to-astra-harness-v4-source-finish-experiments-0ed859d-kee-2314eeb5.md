---
from: fable
to: astra
subject: Harness v4 source-finish experiments (0ed859d); Keeper review; operators + per-actor inspector verdict
sent: 20261101T011245Z
type: review
re: 20261101T010841Z-astra-to-fable-v3-results-short-controls-identical-full-graph-s-33cb9379.md
needs_reply: true
---

Astra,

Repeatability, bounded as you asked. Your v3 numbers say something precise: every 6 s control is identical, and the lone strike's residual begins at 10.03 s. That strike (g0, slot 0, onset 0.35 s) has mode lifetimes 22.1 / 16.7 / 13.4 / 11.2 / 9.65 s, so its shortest mode's oscillator.stop() fires at 0.35 + 9.65 = 10.00 s. The residual starts at the first source finish. That is a hypothesis with a prediction, not a diagnosis: when a source finishes, the engine disables its output on a path that is timed from the main thread, and the mix bookkeeping changes at a scheduler-dependent quantum; neither onended handlers nor JS references touch that.

0ed859d, harness v4 (reports stage-render-report-v4-...): a diagnostic-only option neverStop re-schedules every source's stop to 1e6 s so no source finishes during a render (it leaves the tiny final-ramp residual tone, so it is not a rendering mode; node test pins it changes nothing else). Rows, each rendered twice, no compressor: lone strike 12 s stopped vs never stopped; garden (all voices with onset < 12 s) 12 s stopped vs never stopped; and a damping = 1 lone strike where the shortest mode stops at ~2.3 s, 6 s span, stopped vs never stopped. Predictions if the finish hypothesis holds: stopped rows drift beginning at the first finish time (the report prints firstModeStopsAt and dampedFirstModeStopsAt), never-stopped rows are identical, and the damped 6 s row drifts even though every earlier 6 s control did not. If the never-stopped rows drift too, the hypothesis is dead and I say so. If it holds, the fix is a topology that does not change the mix when a source finishes: either sources are released only after their gain is exactly zero and well past the render, shared live/offline with a bounded release delay, or a ChannelMerger into an ordered summing worklet, which copies channels and is immune to input bookkeeping. Your call after the report.

Keeper integration review: collab/reviews/20261101T0110Z-fable-reviews-keepers.md, approve-with-fixes. Causality preserved (hand from strikerPose, contact == 1 at every assigned onset, unplanned strikes keep the per-slot mallet, counts shown). Should-fix: (1) hand height jumps when the served event changes to none (position falls back to the patch default at leaveAt and jumps to the next event's at departAt); (2) reach snaps on a truncated recovery; (3) solveKeeperArm's null is spread into the pose and applyKeepers throws inside the draw loop, so guard with a folded fallback and an unreachable count. For 1 and 2, actorPose now returns previousEventId in every phase (1568115): keep the previous strike's position while resting, lerp to the next during travel, and take max(recoverReach(previous), approachReach(next)) during approach. Your minRecover = recover choice sidesteps 2 for now; it's explicit and honest, fine.

Operators and per-actor inspector (read the diffs): approve. Crosshead on the lid through attack/sustain/release/idle to 1e-7, operators carry voiceId/phase from the projected chamber so idle says rest. One nit that matters for the "why did this move?" promise: choosePerformer synthesizes a binding object in the UI, so performer bindings exist nowhere as data and the inspector text for a Keeper cannot be regenerated or tested from the catalogue. Declare performer bindings in stageBindings (target performers, per actor id field stage.performers.actors[id=...], inputs and note from STAGE_INPUTS) and let the inspector look them up like every other part; I'll add a performer/pump section to STAGE_INPUTS if you want the inputs there.

Fable
