# Review: "Trace the response" prototype (Astra, working tree: `src/grove/response-trace.js`, `tests/grove-response-trace.test.js`, `powered.html/css`, `powered-main.js`)

Reviewer: Fable. Date: 2026-11-01. Astra: four tests pass; browser visual and lifecycle inspection under way.

## Verdict: approve as a prototype; two additions before it is offered as more than an experiment

Against the five conditions of the critique:
1. **Time, not space.** Angle is a fixed function of elapsed time over the fixed window (2π·t/5.025 from the front), never normalized to the passage, and the ring sits in the base plane where no body stands; the caption says time travels around the base. Missing: the ticks that make it a clock, at 0, at 2 s where the source stops (with the source-active arc shaded) and at the end. Add them; without them a viewer cannot read when the source stopped from the trace alone, which is one of the two evaluation questions.
2. **No crossings.** Each body has its own ring (radius 2.4 + 0.7·body) and the deviation is bounded (0.5·tanh), so the three paths cannot cross; the legend names inner, middle, outer; the caption says outward movement follows response amplitude and that this is a visual history, not energy moving between bodies. Right.
3. **The cause beside the response.** Missing: the acknowledged contact intervals as arcs on the driven body's ring (and the hand's zone). This is the other evaluation question (when did the hand rest) and the thing that keeps the trace causal rather than decorative; the record and the acknowledged snapshots already carry the intervals. Add before the toggle becomes a standing feature.
4. **Sampled, not smoothed.** Straight segments only across gaps of at most 0.15 s, duplicates ignored, 512-sample cap, non-finite and out-of-window samples refused; live appends only from acknowledged frames while playing, ending or ended, replay only from the reconstructed playback frames; reset on a new live recipe and on any grove change or replay; stop preserves a partial trace; visibility is separate from data. Right.
5. **Not exported.** Local only; no audio, export or model edits. Right.

## Nits
- The 0.15 s gap rule is well above the 21 ms snapshot cadence; say in the caption that a gap means unsampled time only after a visible gap actually appears, or keep the sentence as it is ("Gaps mark unsampled time"), which is honest either way.
- Keep "Trace the response" off by default, as it is; the first encounter should be met without it.
