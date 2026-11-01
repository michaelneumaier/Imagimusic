# Playable ensemble: minimal record contract, failure behaviour, and a simpler route (Fable, 2026-11-01; note only, no source)

Astra's constraints: three intact Groves, one shared AudioContext, one fixed 1/3 downstream mix, a common origin and common Quiet, independent per-part admission with accepted/rejected decisions, an ensemble recording that preserves alignment and local reproducibility. Astra's audit: `createRestCapture` sets its origin at the part's first accepted gesture and refuses a snapshot with no strikes; Quiet acknowledgements can differ across processors; a shared requested Quiet is not proof of a simultaneous actual Quiet.

## The simpler route: one processor, three engines, one acknowledgement stream
Run the three Rest engines inside one AudioWorklet processor (an ensemble variant of the contact processor that instantiates three recipes), with one command channel whose commands carry a part index, one `process()` loop stepping all three engines on the same frames, the 1/3 mix applied inside the processor in Float64 before the stereo output, and one acknowledgement stream tagged by part. Then:
- the origin is common by construction (one capture clock), so per-part alignment needs no offsets and no cross-processor reconciliation;
- Quiet is simultaneous by construction: one command ends all three engines at the same frame with the same fade;
- late delivery affects all parts identically, and the acknowledgement timing semantics Astra already proved (processed frame, lateBy) carry over unchanged;
- per-part admission stays independent: each engine keeps its own headroom and contact-state limits and answers accepted or rejected for its own commands;
- reproducibility is the existing one: three canonical Rest records rebuilt by the existing renderer and summed, which the harmonic study already verifies offline.
Cost: one new processor file and one capture adapter that demultiplexes by part; three engines of the present size in one thread are well within the budget the single-engine worklet leaves. The three separate hosts route needs none of this but needs everything in the next section instead.

## The record: three canonical Rest records on one clock, plus silence
`kind: 'imagimusic-grove-ensemble'`, `version: 1`, `sampleRate`, `mixGain: 1/3` (fixed; validated equal), `parts: [ … ]` ordered by index, `ended: { frame, fadeFrames }` common.
- A struck part is a complete canonical Rest record whose frame 0 is the ensemble origin (so its first event may sit at any frame ≥ 0, as the harmonic study's parts already do), validated and admitted on its own recipe via `recipeForRecord`, with `ended` equal to the common ending.
- A never-struck part is `{ silent: true, grove, voice, zones, strengths }`: identity only, no record, never a synthesized strike. It renders as zeros of the common length.
- Validation refuses: parts not exactly three; differing sample rates or voices; a mix gain other than 1/3; any struck part whose ending differs from the common one; any struck part that fails admission. Each part's grove validates on its own (any garden base, so retuned clusters are admitted by the ordinary rule).
- Rendering: per-part PCM by the existing `renderRestRecord`, the mix accumulated in Float64, hashes per part and for the mix, as in the harmonic study. A verifier rebuilds every part and the sum from the file alone.
- If the three-hosts route is taken instead, add `offsetFrames` per struck part (that part's capture origin minus the common origin, integer ≥ 0, at least one part at 0) and render to the maximum of offset + ending + fade with silence padding, and keep each part's actual ending rather than the requested one; everything else above is unchanged.

## Failure behaviour
- A part whose capture reaches `error` makes the ensemble snapshot refuse with that part named; no partial file is written and no part is padded as if complete.
- A part with no accepted strikes is a silent part, not an error.
- A rejected command (headroom, contact bound) is that part's decision and is reported with its part index; the other parts are unaffected.
- Quiet during preparation cancels the whole ensemble, as the single-instrument pages do; Quiet during a passage ends all parts (one command in the single-processor route; three requests with actual per-part endings kept in the three-hosts route).
- The ensemble file is a new kind: `reopen.html` and the ordinary readers refuse it with a plain message until an ensemble reader exists, so it can never be misread as one Rest record.

## Live scheduling
One shared lookahead for every command (the 35 ms lead measured for the powered page is the reference), so a strike surface's press reaches the processor as one requested frame; actual acknowledgement frames are kept, and the record is built from acknowledgements, never from requests.

## Addendum after Astra's restart checklist (collab/notes/astra-harmonic-groves.md, "Resumable milestone boundary")
Read against this note. Agreements: the record is versioned and bound to three canonical groves and one voice at one sample rate with the fixed 1/3 mix; never a placeholder strike; actual endings kept; fail-all on processor failure with no apparently complete recording; the artistic question stays open. Items to settle at the checklist's step 2, where the two documents differ or are silent:
1. **Route**: the checklist's step 3 assumes one AudioContext with three nodes; this note proposes one processor running three engines with one acknowledgement stream. The record contract is the same except that the three-node route needs `offsetFrames` per struck part. Decide the route first; everything else follows.
2. **Contacts without strikes**: a part with hand contacts and no accepted strike has no sound and no canonical Rest record (snapshot refuses it). Represent it as a silent part and record that its contacts were not kept (`silent: true, droppedContacts: n`), so nothing is invented and nothing is silently lost.
3. **Common ending policy**: each processor schedules a 120 s auto-Quiet from its own first gesture. In the single-processor route there is one auto-Quiet from the first accepted gesture of any part; in the three-node route the wrapper must issue the common Quiet itself before any part's own timer can fire, so that idle nodes never run on and the parts never end on different timers.
4. **Declared mix arithmetic in the record**: the ensemble record carries `mixArithmetic` (Float32 parts × 1/3 accumulated in Float64, one Float32 rounding, PCM16) exactly as the harmonic study's report does, so a verifier rebuilds the mix byte-exact; this review found the mismatch that an undeclared arithmetic causes.
