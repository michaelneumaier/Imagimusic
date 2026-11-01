# Proposal 010: MIDI import onto the explicit-score contract (M4, planning)

*Fable, 2026-11-01, at Astra's request. Planning only; no code until the
contract is reconciled. Builds on the explicit-event compiler
(`createPerformanceFromEvents`), the authored assembly
(`createAuthoredPerformance`) and the Score conventions of proposal 008.
Nothing here retunes a fixed resonator or snaps a pitch silently.*

## What it is

A local Standard MIDI File (format 0 or 1) is parsed in the browser into
a plain note list, the user assigns each track or channel to a mechanism
with an explicit **mapping plan**, a **mapping report** shows what every
note will become (exact, mapped, timing-only, or dropped, with the reason)
before anything sounds, and the result compiles to the same recipe the
conversation uses. The saved record is canonical and deterministic, so an
export's manifest reconstructs the passage without the MIDI file.

## Boundaries (what each mechanism can honestly take from MIDI)

| Family | From a MIDI note | Report class | Notes |
| --- | --- | --- | --- |
| Bellows | **exact pitch** (any note 36–96 → `noteHz`), velocity, gate from note-off | exact | 6 chambers allocated by the planner; a 7th simultaneous note steals and the report says which |
| Garden | pitch must equal one of the 8 slot pitches (MIDI 48 51 55 58 60 63 67 70); otherwise the note is **unassigned** until the user picks: nearest slot (flagged `mapped`, with the cents moved) or drop | exact / mapped / dropped | note-off ignored (resonators ring; dampers are not schedulable), stated in the report |
| Tine | timing and velocity only; the tine plays its own fundamental | timing-only | the report shows the pitch the file asked for and the pitch the tine has |
| Loom | timing and velocity only; body chosen by a rule in the plan (two named pitches, or pitch parity) | timing-only | energy exchange, not melody |
| FM | **one** entrance: the first note of the assigned track; every other note on that track is dropped (reported) | timing-only / dropped | one carrier, one entrance (proposal 008) |

No family accepts a pitch it cannot play. "Nearest slot" is never the
default; it is an explicit choice per track with a visible flag on every
affected note and in the manifest.

## Data

```js
NoteList = {                       // output of the parser, pure data, canonical
  version: 1, format: 0 | 1, ppq, durationSeconds,
  tempoMap: [{ tick, usPerQuarter }],           // from Set Tempo events; default 500000 if none
  timeSignatures: [{ tick, numerator, denominator }],
  tracks: [{ index, name, channels: [...] }],
  notes: [{ track, channel, pitch, velocity, onTick, offTick, onSeconds, offSeconds }],   // sorted by onTick, then input order
  markers: [{ tick, seconds, text }],
}
MappingPlan = {
  version: 1,
  window: { startSeconds, endSeconds },         // explicit; files longer than the compiler's 120 s need one
  lead: 0.35, velocityCurve: 'linear' | 'soft',   // soft: v^0.7, for files written loud
  assignments: [{ track, channel: number | 'all', family: 'garden'|'tine'|'bellows'|'loom'|'fm'|'none',
                  gardenUnplayable: 'drop' | 'nearest',          // garden only; must be chosen when any note needs it
                  loomBody: { rule: 'parity' } | { rule: 'pitches', body0: 60, body1: 62 },
                  sustainPedal: boolean }],                       // bellows only: CC64 extends gates (reported)
}
ImportedScore = { version: 1, source: { name, bytes, sha256 }, notes: NoteList, plan: MappingPlan }   // canonical; saved in manifests
MappingReport = { counts: { exact, mapped, timingOnly, dropped, stolen }, rows: [{ noteIndex, family, class, from, to, reason }],
                  planner: { gardenUnplanned, tineUnplanned } }   // reported, never a reason to refuse
```

`compileImportedScore(imported) -> { events, loomScore, fmTime, holdUntil }`
is the recipe `createAuthoredPerformance` already accepts; the hold is the
window end plus a stated tail (default 4 s). The passage carries
`imported` (not `score`), so the camera keeps the legacy follow (no
cadence), and the frame carries no section until markers are mapped to
sections in a later slice.

## Bounds (all validated, all named in errors)

File ≤ 256 KiB; parsed notes ≤ 4096; scheduled compiled events ≤ 256 and
every onset and gate end ≤ 120 s (the compiler's limits; the window is
how a long file fits); bellows polyphony 6 with stealing reported; at
most one FM entrance; no external service, no network; file bytes never
leave the page and are not stored, only their SHA-256 and the parsed
`NoteList`.

## Dynamics and rests

Velocity maps to the engine velocity (0, 1] through the chosen curve;
rests are simply the file's silences; sustain pedal may extend bellows
gates when enabled; aftertouch, pitch bend and other controllers are
ignored and listed in the report as ignored, never approximated.

## Ownership

- Fable: `src/midi/smf.js` (dependency-free parser: header, tracks,
  running status, delta times, meta tempo/time-signature/marker/track
  name, note on/off incl. velocity-0 note-off, CC64), `src/midi/mapping.js`
  (plan validation, assignment, report, `compileImportedScore`,
  `canonicalImportedScore`), tests with hand-built SMF bytes.
- Astra: file input and plan UI, the report table shown before "Use this
  mapping", stage/export/verifier integration (manifest `imported`),
  inspector rows for imported notes, harness fixture row.

## Evidence

- Parser: hand-built format 0 and 1 files with running status, two tempo
  changes, overlapping and zero-length notes, velocity-0 note-offs,
  markers; seconds computed through the tempo map match hand arithmetic.
- Mapping: deterministic report for a fixture plan; every parsed note
  appears in exactly one report row; bounds rejections; garden notes off
  the slot table are unassigned until the plan chooses; FM keeps one.
- Compile: the recipe passes through `createPerformanceFromEvents` and
  `createAuthoredPerformance`; the planner's unplanned counts are reported
  in the mapping report and shown in the preview.
- Manifest: an export's `imported` record rebuilds the identical recipe
  (verifier), without the MIDI file.

## Order

M4a parser + mapping + tests (Fable, after reconciliation); M4b plan UI +
report preview (Astra); M4c export/verifier + inspector + harness row
(Astra, with a Fable fixture); markers → sections and a cadence camera
for imported passages later.

## Decisions for Astra

1. The boundary table (exact bellows pitch; constrained garden with an
   explicit per-track choice; timing-only tine/Loom; one FM entrance).
2. The data shapes, especially saving the parsed `NoteList` rather than
   the file bytes in manifests.
3. Bounds (256 KiB, 4096 parsed, 256 scheduled, 120 s via window).
4. Ownership and order.
