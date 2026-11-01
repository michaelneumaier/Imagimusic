# Review: Loom ensemble integration (Astra, working tree on 7eb1a1a: `src/stage/main.js`, `export.js`, `tools/verify-stage-manifest.mjs`, `inspector.js`, tests)

Reviewer: Fable. Date: 2026-11-01. Suite: 144/144 (Astra's count) / 143 on my last commit plus the new verifier test.

## Verdict: approve (nits only)

## What I checked
- **Opt-in is explicit and reproducible.** `?loom=1` selects the duet;
  the toggle rewrites the query and reloads, so a URL fully describes what
  plays and what exports. No silent default change: `DEFAULT_COMPOSITION`
  is disabled, `attachLoomPerformance` returns the identical passage when
  disabled, and the manifest omits `composition` in that case, which the
  verifier treats as the default. Old artifacts verify unchanged.
- **Preparation and playback lifecycle.** Play creates an `AbortController`;
  Play again during preparation cancels; the token is re-checked after
  `await prepareLoomAudio`, a stale result is stopped, `AbortError` is not
  shown as an error; `stop()` aborts preparation and stops the duet; the
  duet starts at the same `origin` the garden/choir scheduler uses, computed
  after preparation so the 0.1 s lead holds. The duet and the engines share
  one clock and one master.
- **Export and verification.** `exportMovie` attaches the composition to the
  passage and saves it in the manifest only when present; the verifier
  canonicalizes it (`validateComposition` + deep equality, same rule as the
  instrument) and rebuilds with `attachLoomPerformance`; the new test shows a
  composed manifest verifies, an omitted composition fails on hashes, a
  changed coupling fails, an extra field throws "not canonical". That is
  the should-fix from my composition review, closed.
- **Inspector.** Loom bodies, strikers and the bridge are pickable with
  their declared bindings; `getPatch` exposes `loom.{settings, score}` so
  the `loom.*` inputs the bindings cite resolve.
- **Honesty.** The added caption labels the Loom "modeled / interpreted",
  channels as modeled displacement, width/glow as amplified envelope, and
  the bridge as a coupling indicator, not energy flow.

## Nits
- The `encoding` string in the manifest still names only "default and air
  choir" as verified; after the v9 composed-passage harness row passes,
  append "composed passage" so the manifest's claim matches the evidence.
- Toggling reloads the page and drops the silent-study scrub position;
  acceptable and stated, but a `?t=` in the URL would preserve it for free.
- `prepareLoomAudio` re-renders the duet on every Play although the system
  and score are constant for the session; cache by (settings, score,
  sampleRate) if the "PREPARING ENSEMBLE" pause ever bothers Michael.
- Controls are disabled during export including the toggle: good. During
  live preparation the seek bar stays enabled; harmless, since `stop()` on
  seek aborts preparation, but disabling it would make the state obvious.

## Praise
- Making the composition a URL parameter rather than hidden UI state is
  exactly the right instinct for a system whose whole promise is
  reproducibility: the link is the arrangement.
