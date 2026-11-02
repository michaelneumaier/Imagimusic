# Next encounter: a passage, seen across time

This is a proposed next slice, not a shipped feature or a change to the sound model. The current local checkpoint is 437b16d: listening position survives the trip into Touch; original and comparison passages can be reopened, heard and kept; the return page offers a still picture. Latest Touch/WAV/UI reviews remain pending. Michael has been asked which of playing, sound-to-body inference, or immersive scenes he most wants deepened; work need not wait for that preference.

## Why this direction

A returned passage is currently visible only at its current time. A person can compare connections, but must remember the shape of a whole response from one playback to the next. The next question is whether a modest, optional history can make recurrence and relationship legible while the sounding bodies remain the main encounter. This connects Michael's interest in music and consciousness through attention and transformation with continuity, without making a claim about inner states.

A useful prototype should answer a concrete question: can the visitor tell which body was touched, and where each body's visible response grew or settled? Success is not the mere presence of an attractive trail. No user evidence for that reading yet exists.

## Proposed implementation and ownership

Astra: an isolated Touch return history sampler and diagnostic view, followed by the product presentation only if the diagnostic is intelligible. Fable: review the quantity represented, timing, sampling limitations and the comparison wording; existing model and estimator ownership stays unchanged. No edit to the shared physics is needed for the first study.

Use createTouchSession's existing analytic visual envelopes, including saved Quiet fade and the fast-beating averaged-mode flag. Sample at deterministic times in a worker; separately mark every exact saved gesture. A whole-passage display must not be sampled from browser frame rate, because skipped frames would erase history. Keep the source and comparison histories separate and identify the shown connection. Keep source settings/record unmodified.

First diagnostic: two labeled strips sharing a seconds axis, with gesture ticks by body and a stated fixed envelope scale. A static overview can be inspected before sound starts; it must explicitly say it shows the whole prepared passage, including later events. Test an isolated strike, delayed neighbour strike, simultaneous strikes, a dense admitted record, natural decay, and a saved Quiet that precedes a scheduled gesture. Compare original and target on one consistent time and value scale. Do not normalize each strip to its own maximum.

Sampling is a design problem to measure before choosing a visual treatment. Uniform sparse points can miss a brief peak or imply a false slow modulation. Compare a candidate grid with a denser analytic reference, report sampled extrema and error, retain event boundaries, and either show ranges per bin or clearly label sampled points. A connected smooth curve is not justified solely because it looks pleasing. No claim of captured acoustic waveform, physical energy or propagation speed follows from an envelope history.

Only after the strip is readable, try a reversible circular layout as a perceptual presentation of the exact same samples. Name its time direction, start/end and radial mapping. It must remain separate from causal inspection, start off, honor the still-picture choice, and add no audio. Touch return currently exports sound and gesture records only; no visual presentation metadata belongs in those v1 files. Any future film export would need its own explicit presentation metadata.

## Gates and a useful stopping point

1. Numerical study: deterministic samples; endpoints/Quiet semantics; bounded work on longest admitted input; comparison scales fixed; sampled error reported rather than hidden.
2. Diagnostic: inspectable original and comparison traces with exact gesture markers and readable units. Existing player/export behavior unchanged.
3. Real review: Fable responds to the concrete sampler and diagnostic evidence. No silence-as-approval claim.
4. Visitor reading: ask which body was touched and where the response changed; preserve the person's words about feeling without turning them into a consciousness score.
5. Product choice: promote only the treatment supported by the preceding evidence, or keep it as a workshop study if it distracts.

The resumable milestone is the diagnostic and its repeatable sample report, not an assumed immersive effect. It remains useful if the circular presentation is rejected. This work can proceed independently while Fable's recording-analysis corrections and current implementation reviews are pending; it does not bypass the samples-only boundary on the public WAV study.
