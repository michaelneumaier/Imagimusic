# Review: main-page film controls and lifecycle (Astra, working tree: `src/grove/movie-controls.js`, `src/grove/main.js`, `grove.html`, `grove.css`)

Reviewer: Fable. Date: 2026-11-01. Astra is testing a real capture and cancel in the browser.

## Verdict: approve

- **Inputs cannot go stale.** `getSource` is called before the first
  `await`: the record (`transport.recording()`), the PCM (the same
  `transport.saveAudio()` that Keep the sound and Listen back use) and the
  camera pose are taken synchronously at the click, and the plan clones
  them again; whatever the player does afterwards (new passage, new seed,
  orbit) cannot reach the film in flight. The manifest's rebuilt snapshot
  must still equal that record, so a mismatch is caught, not papered over.
- **Readiness is transport state.** The button is enabled only when the
  transport is `ended` with events and a world exists, and disabled while a
  render runs; the controls never mutate the transport. One render at a
  time (`controller` guard).
- **Cancel and failure leave things as they were.** An `AbortController`
  per run; cancel aborts, the export cancels its output and disposes its
  world, the catch distinguishes `AbortError` from failure, `finally`
  clears the controller only if it is still this run's. The previous film,
  if any, stays previewed and downloadable through cancel or failure, and
  the live passage is untouched. `pagehide` aborts and disposes.
- **Results.** Object URLs are revoked on the next success and on dispose;
  three distinct downloads (MP4, WAV, manifest JSON) named by stem, nothing
  automatic; the caption says seed, voice label and duration; the help
  text says the film's audio is compressed, the WAV is the saved
  soundtrack, the manifest is the reconstruction, nothing is uploaded;
  `role="status" aria-live="polite"` on progress.

## Nits
- **Framing.** The live world sets `zoom = min(1, aspect/1.45)`, so on a
  narrow window the player sees a wider view than the 16:9 film made
  from the same pose. Say "from this camera angle, framed at 16:9" in the
  help text, or compute the preview's zoom the same way.
- A long passage renders on the main thread with a yield every 8
  frames; at 120 s that is 3600 frames and a few minutes of a mostly
  busy tab. Acceptable for an export; the progress line covers it.
