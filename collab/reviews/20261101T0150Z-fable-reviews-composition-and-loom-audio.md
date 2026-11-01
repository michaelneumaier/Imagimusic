# Review: ensemble composition contract and live Loom adapter (Astra, `src/stage/composition.js`, `src/stage/loom-audio.js`, tests)

Reviewer: Fable. Date: 2026-11-01. Suite: 143/143 with the offline adapter in.

## Verdict: approve-with-fixes (one should-fix for when the UI exposes the duet)

## Contract (what I checked)
- **Old artifacts survive by construction.** `attachLoomPerformance` returns
  the identical passage object when the duet is disabled (tested with
  `assert.equal`), and when enabled it leaves `events` and `snapshots` the
  same objects, adds `loom` and `composition`, and extends `duration` to the
  longer of the two. Default-trace frames therefore cannot change; the
  1007-hash artifact stays valid.
- **Settings validated through the model.** `validateComposition` runs the
  Loom settings through `makeLoom`'s bounds and strips extras; the
  composition is a separate v1 object, the v4 instrument is untouched.
- **Score aligned to the ensemble.** Eight strikes on odd beats from the
  Conservatory's tempo, alternating bodies with seed parity: deterministic,
  tempo-coupled, and honest about being a fixed-system passage (no retuning
  mid-passage).
- **Live and offline agree on the sound path.** Both adapters run
  `renderLoomPerformance` at the context's sample rate (worker live, direct
  offline), copy both channels into a 2-channel buffer, route source → gain
  (`LOOM_MIX_GAIN`) → the shared master → compressor, and let the engine do
  the 2ch→mono downmix. Live starts at the ensemble origin, offline at 0,
  which is the same score clock. The offline adapter now imports
  `LOOM_MIX_GAIN` from `composition.js` so the two cannot drift.
- `prepareLoomAudio`: abort before, during (job cancel), and after the
  await are all handled; one-shot start guarded; stop fades 25 ms and
  releases nodes; natural end disconnects. Matches the worker job's
  single-settlement contract.

## Findings

### should-fix (before the duet is exposed in the UI / exported)
1. **Composed exports are not yet verifiable.** `verifyStageManifest`
   rebuilds from `saved.instrument` alone, so a manifest exported with the
   duet enabled would fail (extra `stage.loom` hashes, longer duration) or,
   worse, a disabled-duet rebuild could be compared against a duet
   artifact. The exporter should save `composition` in the manifest and the
   verifier should `validateComposition` it and `attachLoomPerformance`
   before recomputing. Same canonical-equality rule as the instrument.

### nit
- Two copies of "render → 2-channel buffer → source → gain → master"
  (`loom-audio.js` live, `render-audio.js` offline). They are intentionally
  separate (worker vs direct), but a tiny shared `loomBufferFrom(context,
  pcm)` would make the buffer construction one function.
- `prepareLoomAudio` renders even when the duet is attached but the user
  never presses play; fine for a passage, worth a lazy path if the duet
  ever becomes a default.
- The duet's PCM is deterministic JS, so the offline render's identity
  (decision 004) is unaffected; still, the harness's shipping rows render
  the base passage only. Add a composed-passage row when the UI enables
  the duet so identity is asserted on what ships.

## Praise
- Separating composition from instrument is the right cut: the instrument
  describes a sound, the composition describes who plays with whom. It is
  also what lets every existing trace stay byte-identical.
