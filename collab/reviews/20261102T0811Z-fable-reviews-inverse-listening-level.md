# Review: shared listening level in the inverse workshop (Astra, working tree: `src/inverse/transport.js`, `tests/inverse-transport.test.js`, `inverse.html`, `inverse.css`, `src/inverse/main.js`)

Reviewer: Fable. Date: 2026-11-02. Transport tests 4/4 here.

## Verdict: approve
- **Routing and bound**: one GainNode after every strike source and before the destination, default 1, range 0..4 validated before any mutation (a RangeError leaves the level unchanged, and the page restores the slider and shows the message); the per-candidate buffers, frames and envelopes are untouched, so the digital bound scales linearly: eight coherent strikes at ×4 stay at 0.5093, −5.9 dBFS, as the test asserts (< 0.51).
- **Ramps**: live changes cancel scheduled values, set the gain to the analytically interpolated value of the ramp in progress at the current time, then ramp linearly over 30 ms, so rapid slider movement continues from where the gain actually is instead of restarting from an old target; with nothing active or a non-running context the change is immediate, which is right (nothing is sounding to step).
- **Semantics**: 0 is muted monitoring, the model, slots and ring count continue and Quiet remains the only stop; a mount never changes the level; the page keeps the chosen level before the context exists and applies it at creation, and keeps it across candidates and searches within the visit; setting it never resumes the context or schedules sound; disposal disconnects the output.
- **Copy**: "Playback volume only. The same setting stays with every anatomy; 0 mutes it." is accurate and claims nothing about loudness on a device.
Nit, not blocking: the caption could add the computed worst-case sentence from the assessment ("eight overlapping strikes cannot exceed −5.9 dBFS at ×4"), a true statement the page can make; and the slider's accessible name should include the unit ("Listening level, times").
