# Review: stage manifest verifier (Astra, `tools/verify-stage-manifest.mjs`, `tests/verify-stage-manifest.test.js`, exporter wording)

Reviewer: Fable. Date: 2026-11-01. Suite: 131/131 plus the verifier test.

## Verdict: approve-with-fixes (one should-fix, small)

## What I checked
- **Never trusts the saved hashes.** The verifier rebuilds the passage,
  projection (with Keepers), and director from the saved instrument and
  camera, recomputes the manifest via `createTraceManifest`, and compares
  every metadata field, the hash count, and the first differing frame.
  Mutation tests reject a changed hash, camera mode, frame count, audio
  sample count, video duration, and dimensions, and a non-finite duration
  throws. The real artifact verifies 1007/1007. This is the artifact proof
  decision 002 §4 asked for.
- **Consistency with the exporter.** Fixed 30 fps / 48 kHz / 1280×720
  mirror `exportMovie`; `videoDuration` is recomputed with the identical
  expression (`frames / fps`) so strict equality is safe; follow/establish/
  detail modes ignore the saved pose exactly as the exporter does, manual
  uses it.
- **Exporter wording** now states the verified scope (Safari 26.6.2, 48 kHz,
  seed 731, default and air) and keeps the codec caveat. Matches decision 004.

## Findings

### should-fix
1. **Canonicalize the saved instrument before using it.**
   `createPerformance(saved.instrument)` runs on raw JSON. Pass it through
   `validatePatch` first and require `validatePatch(saved.instrument)` to
   deep-equal `saved.instrument` (the exporter saved a validated patch, so
   any difference means the file was edited or is malformed). That turns
   deep, confusing throws from `modesForVoice`/`validateBellows` on a bad
   file into one clear "instrument is not a canonical patch", and it keeps
   hostile keys (`__proto__`, extra fields) out of the recomputation path.

### nit
- Width/height/fps/sample rate are hardcoded in both `export.js` and the
  verifier; one exported `EXPORT_PROFILE` keeps them from drifting apart.
- Check `saved.v === MANIFEST_VERSION` explicitly and say "manifest version
  unsupported" rather than reporting a `v` mismatch among the fields.
- The verifier proves the manifest; the MP4 is proven by ffprobe by hand.
  An optional `--mp4 <file>` that runs ffprobe (when present) and compares
  stream frame count and durations to the manifest would make the whole
  artifact one command. Later.
- Report `expected.duration` and `saved.duration` in the result so a
  truncated-export mismatch is self-explanatory from the CLI output.

## Praise
- Rebuilding from the instrument rather than diffing saved numbers is the
  only kind of verification that catches a stale manifest with internally
  consistent lies. Good choice.
