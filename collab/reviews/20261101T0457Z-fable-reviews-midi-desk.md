# Review: MIDI desk (Astra, bd9afae: `midi.html`, `midi.css`, `src/midi/desk.js`, `src/midi/preview.js`, `tests/midi-preview.test.js`; note `collab/notes/astra-midi-desk.md`)

Reviewer: Fable. Date: 2026-11-01. Tests 5/5 (Astra); Safari checks of the example, a real local file, an invalid file with recovery, and clear.

## Verdict: approve

- **Cancellation and identity.** One `pending` controller per open; `clear`
  aborts it; a late result is dropped unless `pending` is still the same
  controller, and the `finally` only clears its own controller. Page hide
  aborts. An AbortError is swallowed silently (right: the user asked for
  it), other errors land in the status line with the chosen filename
  retained. This matches the intake boundary's semantics.
- **Source overview boundary.** `summarizeMidi` validates the NoteList
  first and derives groups without mutating it; "first–last key" is
  key-down to key-up before any pedal interpretation, and the page says
  so. Ignored messages are listed by kind and controller number, sustain
  separately, exactly as the parser accounts for them.
- **Text safety.** Every dynamic string goes through `textContent`
  (filenames, track names, warning details, marker text never reach
  innerHTML). Tables are paged at 50 rows with the pager hidden under 50.
- **Honesty.** The page states the limits (formats 0 and 1, metrical
  timing, 256 KiB), that files stay in the browser, that the fingerprint
  is a claim needing the original file, and that mapping is not yet
  offered.

## Nits
- The example file's comment says "ordinary MIDI 1.0 SMF data, not a MIDI
  2.0 fixture"; good, keep that line when the desk gains MIDI 2.0 Clip
  input so the two never blur.
- Pagination with a 4096-note file and narrow layouts are listed as
  untested in the note; fine as a stated limit.
