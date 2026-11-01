# Review: MIDI mapping desk → stage (Astra, working tree: `src/midi/mapping-desk.js`, `src/midi/stage-transfer.js`, `src/stage/main.js`, `midi.html`, `README.md`, `tests/midi-stage-transfer.test.js`)

Reviewer: Fable. Date: 2026-11-01. Astra: 248/248 tests; Safari: example → bellows assignment → exact 3 notes → stage shows Imported MIDI, 3 entrances, no children → Play entered PLAYING; movie rendering.

## Verdict: approve (nits only)

## What I checked
- **Preview is the real compiler.** The desk builds an ImportedScore from
  the intake plus the form, runs `compileImportedScore` at the default
  patch and 48 kHz, and shows counts, planner reach, every row with its
  destination and cents, and every warning. Any edit invalidates the
  shown report; nothing persists or sounds until "Use".
- **Use is explicit and refuses the right things.** `saveMidiStage`
  re-canonicalizes, recompiles, and refuses unassigned rows and
  zero-onset mappings with named messages; each handoff gets its own
  UUID key under a namespaced prefix, so another desk cannot overwrite
  it; `readMidiStage` re-canonicalizes on the way back. The button is
  disabled under the same conditions the save refuses.
- **Ensemble follows the mapping.** `midiComposition` enables exactly the
  children the compiled report produced (FM settings default), so the
  adapter's "enable before use" error cannot trigger from the desk path
  and `childrenDisabledByImport` stays empty; the stage locks the child
  toggles for imported passages so the user cannot drift from the
  mapping without going back to the desk.
- **Stage builds at the real rate.** `buildPerformance(sampleRate)` with
  the audio context's rate for playback and the export's rate for the
  movie, the imported record forwarded to `exportMovie`, the passage
  reset to the default instrument and no generated score. Switching the
  passage selector away from Imported removes the `midi` query, and a
  missing session entry disables Play and Render with the recovery
  instruction instead of a blank stage.
- **Honesty on the pages:** "The mechanisms interpret the notes; this does
  not reconstruct the original instruments"; the passage stays in this
  browser session; unplanned strikes "still sound with their original
  mallets".

## Nits
- The desk previews at 48 kHz and the default patch while the stage
  compiles at the context's rate; the two can differ only through the
  Nyquist drop (MIDI 96 ≈ 2093 Hz, far below any real rate) and the
  planner (rate-independent), so the preview is faithful in practice. A
  line on the desk saying "at 48 kHz" is already there; fine.
- `sessionStorage` is per tab; opening the stage link in a new tab yields
  the "not available" message with the recovery instruction. Expected.
- The initial excerpt end of 119.65 s assumes the default 0.35 s lead;
  raising the lead with a full-length excerpt produces the compiler's
  named endpoint error on preview, which is acceptable.

## Commit check (9b456a6)

The commit matches the reviewed working tree plus two additions I accept: an initialization guard that treats a stored import which fails to compile like a missing one (Play and Render disabled, recovery text), and a header link from the stage to the MIDI desk. Evidence in `collab/notes/midi-stage-validation.md`: 248/248, Safari desk → stage → PLAYING → export, triad movie 153/153, harness v16 imported row 1/1 at 48 kHz. Verdict stands: approve.
