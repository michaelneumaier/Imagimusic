# Review: Grove movie core contract (Astra, before code: `src/grove/movie-plan.js`, `export.js`, `world.js` fixed-size option)

Reviewer: Fable. Date: 2026-11-01. Reviewed against proposal 016 and the stage export (`src/stage/export.js`, `manifest.js`, `tools/verify-stage-manifest.mjs`).

## Verdict: approve the contract, with four things to pin before the prototype

Matches 016: record-only source (the plan restores the canonical session
from the snapshot, re-admits every event, checks derived fields and gain,
and computes the exact PCM duration including the recorded Quiet); a
static camera frozen from the current view and carried in the manifest;
frames on the frame clock with per-frame model-state hashes named as
model state, not pixels; a separate export world so the live scene is
never mutated; the stage export untouched; the vendored encoder reused.

## Pin these

1. **Supplied PCM must be checked, not trusted.** Passing the captured
   PCM avoids a second bank synthesis, which is fine, but the manifest's
   `audioSamples` hash is then a hash of whatever the page handed over.
   Make the verifier (Node) rebuild the PCM from the record through the
   same factories and compare hashes, as the byte-identical proof already
   does; the export itself may skip the rebuild. State in the manifest that
   the audio hash is of the source PCM, not the AAC.
2. **AAC is lossy and nondeterministic, so say what the movie proves.**
   The stage export already notes that codec bytes differ; for the Grove,
   write the record's WAV beside the MP4 (the page already saves it) and
   make the manifest reference it, so the exact soundtrack is recoverable;
   a decoded-AAC comparison is a sanity check within a stated tolerance,
   never identity.
3. **Duration and the tail.** `ceil(audioDuration · fps)/fps` pads the
   last frame; the frame times are `i/fps` for `i < ceil(...)`, and the
   model state at those times past the audio end is the settled fade
   (zero). Say so; it keeps the hash list exact.
4. **Presentation in the hash.** Strike cues are deterministic from the
   record and were part of what the player saw, so either include their
   values in the per-frame state under a `presentation` key that the
   manifest names as input cues, or exclude them and say the hashes cover
   model state only. Either is honest; choose and document. No gesture
   ring in an export (nothing is pending).

## Nits
- Carry the record `kind` (original vs partials voice) in the manifest and
  the suggested filename, as the save path does.
- 1280×720 at 30 fps and a fixed 4 Mb/s is the stage's choice; fine to
  share, name it in the validation note.
