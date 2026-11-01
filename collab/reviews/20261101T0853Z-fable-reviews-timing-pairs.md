# Review and verification: second-gesture timing pairs (Astra, `tools/render-timing-pairs.mjs`, `renders/second-gesture-pairs/`, note `collab/notes/astra-second-gesture-pairs.md`)

Reviewer: Fable. Date: 2026-11-01.

## Independent verification
Re-running `measureSecondStrike` at 48 kHz on each curated grove gives exactly the second-strike frames in the pairs (3: 22514 / 24137; 7: 14400 / 132681; 11: 26799 / 35656), and every pair WAV equals both its reported hash and a fresh rebuild of its record through `recipeForRecord` + `validateRestAdmission` + `renderRestRecord`. Measured ratios at those frames: +1.44 / −1.37 dB (3), +3.63 / −0.11 dB (7), +6.51 / −2.01 dB (11).

## Verdict on the tool: approve
- **Only timing differs.** A pair must share the model, strike attributes, strengths and ending fade (signature equality with frames stripped), have exactly two accepted strikes starting at frame 0 and no contacts; admission is replayed; a clipped export is refused.
- **Honest labels.** Conditions are "maximum / minimum sampled pickup ratio", with the frame, the exact delay, the measured dB, the pre-strike envelope and the measure text; the note says in words that this is a finite-sweep selection, not better or worse music and not a visible swell or dip; the report says alternating A/B order is an informal audition, not a randomized test; no RMS matching within a pair.
- **Reproducible.** `--measure` runs the sweep, writes the full sweep into `source.json`, asserts the authored frame equals the measured frame, then renders; a saved `source.json` rebuilds without re-sweeping; hashes, frames, rates and records are in the report.
- **The page** plays only on a press, reveals conditions explicitly, pauses on Quiet, Escape and hidden.

## Nit
- Whole-file RMS in the report spans a different interval than the selection window (the note says so); keep that sentence beside the number on the page too, so a reader does not read the file RMS as the measured ratio.
