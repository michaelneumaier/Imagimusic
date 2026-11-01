# Proposal 010 (rev. 2): MIDI import onto the explicit-score contract (M4, planning)

*Fable, 2026-11-01. Rev. 2 applies Astra's review (seven points) and
settles the function signatures. Planning only; the parser is the first
isolated slice after this revision is confirmed, and it begins by reading
the SMF 1.0 specification and the control-change table from midi.org
(running status, meta and SysEx rules, CC64 thresholds), not a summary.
Direction, ownership and bounds were approved in the first review.*

## What it is

A local Standard MIDI File (format 0 or 1) is parsed in the browser into
a canonical `NoteList`; the user assigns each track/channel to a mechanism
in a `MappingPlan`; a `MappingReport` accounts for **every input note in
exactly one row** and every ignored message in a warning, before anything
sounds; the result compiles to the same recipe the conversation uses. The
saved `ImportedScore` is canonical and deterministic, so an export's
manifest reconstructs the passage from the parsed data alone.

## Boundaries per mechanism (unchanged from rev. 1)

| Family | From a MIDI note | Report class |
| --- | --- | --- |
| Bellows | exact pitch (36–96 → `noteHz`), velocity, gate from note-off (CC64 may extend) | exact; `stolen` warning when a 7th voice steals |
| Garden | only the 8 slot pitches (48 51 55 58 60 63 67 70); other pitches are **unassigned** until the track chooses `drop` or `nearest` (flagged `mapped`, cents shown); note-off ignored (warning `gateIgnored`) | exact / mapped / dropped / unassigned |
| Tine | timing and velocity only, the tine's own fundamental from the actual patch; note-off ignored | timingOnly |
| Loom | timing and velocity only; body by rule | timingOnly |
| FM | **at most one** entrance (the first note of the assigned track; the rest dropped) | timingOnly / dropped |

No GM drum convention: channel 10 is a channel like any other and maps
only where the plan says.

## Parser policies (`parseSMF`)

- **Accepted:** header chunk `MThd` with format 0 or 1, metrical division
  (bit 15 clear, PPQ 1–32767). **Rejected with a named error:** format 2,
  SMPTE division (bit 15 set), VLQ longer than 4 bytes, chunk length past
  end of file, track without End of Track, a data byte where a status byte
  is required and no running status is active, file over 256 KiB, more
  than 4096 notes or 65536 events. Unknown chunk types are skipped (per
  spec) and counted.
- **Running status** persists for channel messages (0x80–0xEF); meta
  (0xFF) and SysEx (0xF0/0xF7) do not carry it and, per spec, cancel it.
  SysEx payloads are skipped by their length and counted.
- **Events** are merged across tracks and ordered by `tick`, then track
  index, then file order; each gets a stable `eventOrder`. Notes get
  `noteId` = eventOrder of their note-on.
- **Note pairing** per (track, channel, pitch): note-on with velocity 0 is
  a note-off; a second note-on while held closes the first at the new tick
  (warning `retrigger`); note-off with nothing held is ignored (warning
  `unmatchedOff`); a note still held at End of Track closes there (warning
  `danglingOn`); a note whose off tick equals its on tick is kept with
  `offTick = onTick` (warning `zeroGate`; compile gives it the minimum
  gate, see below).
- **Tempo and time signature** from any track are merged by tick (format 1
  files should keep them in track 0; others are accepted). Two tempo
  events at the same tick: the later in merge order wins and a
  `tempoConflict` warning names both. Default 500000 µs per quarter when
  no tempo event precedes tick 0. Tempo 1–16777215 µs, numerator 1–255,
  denominator a power of two ≤ 128.
- **Controllers:** CC64 (sustain) events are kept in order with their
  value (`≤ 63` off, `≥ 64` on, per the control-change table). Every other
  message kind is counted in `ignored` by kind (other CC by number,
  program change, pitch bend, channel/poly aftertouch, SysEx, unknown
  meta) so the report can list exactly what was ignored.
- Seconds are computed from ticks through the tempo map and stored
  **only as derived values**; `validateNoteList` recomputes them and
  rejects a mismatch, so saved seconds can never override ticks.

## Data (strict keys everywhere; all numbers finite and in range)

```js
NoteList = {
  version: 1, format: 0 | 1, ppq, endTick, durationSeconds,
  tempoMap: [{ tick, usPerQuarter, eventOrder }],
  timeSignatures: [{ tick, numerator, denominator, eventOrder }],
  tracks: [{ index, name /* ≤ 120 chars */, channels: [int] }],
  notes: [{ noteId, track, channel, pitch, velocity, onTick, offTick, onSeconds, offSeconds }],   // sorted by onTick, eventOrder
  sustain: [{ eventOrder, tick, seconds, track, channel, value }],                                // CC64 only, ordered
  markers: [{ tick, seconds, text /* ≤ 120 chars */ }],
  warnings: [{ kind: 'retrigger'|'unmatchedOff'|'danglingOn'|'zeroGate'|'tempoConflict', eventOrder, detail }],
  ignored: { controllers: { [number]: count }, programChange, pitchBend, channelAftertouch, polyAftertouch, sysEx, unknownMeta, unknownChunks },
}
MappingPlan = {
  version: 1,
  window: { startSeconds, endSeconds },            // [start, end): a note is in the window iff start ≤ onSeconds < end
  lead: 0.35, tailSeconds: 4,                      // tail 0–30; compiled onset = lead + (onSeconds − start)
  velocityCurve: 'linear' | 'quiet' | 'lift',      // linear v; quiet 0.7·v (attenuates loud files); lift v^0.7 (raises soft notes)
  assignments: [{ track, channel: int | 'all', family: 'garden'|'tine'|'bellows'|'loom'|'fm'|'none',
                  gardenUnplayable: 'drop' | 'nearest',           // garden only; required iff any assigned note is off the slot table
                  loomBody: { rule: 'parity' } | { rule: 'pitches', body0, body1 },   // loom only
                  sustainPedal: boolean }],                        // bellows only
}
ImportedScore = { version: 1, source: { name, bytes, sha256 }, notes: NoteList, plan: MappingPlan }
```

- Assignment keys must be disjoint: a track with `'all'` may not also
  have per-channel entries; the same (track, channel) may not appear
  twice. Reject, never double-map.
- `source` is provenance **as recorded at import**. A manifest reload
  cannot re-hash a file it does not have, so the UI labels it "recorded at
  import, not re-verified"; what the verifier verifies is NoteList + plan
  → recipe.

## Window and gate policies (all reported, nothing silently discarded)

- Notes with `onSeconds < start` and `offSeconds > start` (held at the
  window start) are **omitted** with class `excluded` and reason
  `activeAtStart`; notes with `onSeconds ≥ end` are `excluded` with reason
  `afterWindow`; notes before the window are `excluded`, `beforeWindow`.
- Bellows gates crossing `end` are clipped to `end` (warning
  `gateClipped`); the passage's hold is `end − start + lead + tailSeconds`.
- Sustain state at `start` is taken from the last CC64 at or before
  `start` (so a pedal pressed before the window applies, warning
  `pedalHeldAtStart`); a pedal never released extends gates to `end`,
  clipped (warning `pedalNeverReleased`). With the pedal on, a bellows
  note's gate ends at the later of its note-off and the next pedal-off.
- Zero gates and gates shorter than 50 ms on bellows are compiled with a
  50 ms minimum (warning `minimumGate`), since the compiler requires
  `noteOff > time`.

## Report

```js
MappingReport = {
  counts: { exact, mapped, timingOnly, dropped, unassigned, excluded, total },   // total === notes.length
  rows: [{ noteId, track, channel, pitch, family, class, from: { pitch, hz }, to: { slot | body | hz | 'tine fundamental' | 'fm entrance' }, cents, reason }],
  warnings: [{ kind, noteId | eventOrder, detail }],         // gateIgnored, stolen, retrigger, unmatchedOff, danglingOn, zeroGate,
                                                             // tempoConflict, gateClipped, pedalHeldAtStart, pedalNeverReleased, minimumGate, controllersIgnored
  planner: { garden: { unplanned }, tine: { unplanned } },   // from the real planner on the compiled events; shown, never a refusal
  children: { loom: boolean, fm: boolean },                  // whether the plan produced any Loom strikes / an FM entrance
}
```

`unassigned` rows block "Use this mapping" until the plan resolves them;
everything else is information.

## Functions (settled signatures)

```js
parseSMF(bytes: Uint8Array, { name }) -> NoteList                                  // throws named errors; pure
validateNoteList(noteList) -> noteList                                              // strict keys, ranges, recomputes seconds from ticks, rejects mismatch
validateMappingPlan(plan, noteList) -> plan                                         // strict keys, disjoint assignments, window inside the file, required choices present
canonicalImportedScore(imported) -> string                                          // sorted keys, array order kept
compileImportedScore(imported, patch, sampleRate = 48000) -> { recipe, report }    // ONE function: validates both parts, assigns, compiles the recipe
   // { events, loomScore, fmTime | null, holdUntil } through createPerformanceFromEvents for chamber allocation and the planner for
   // unplanned counts, so the report describes the actual compiled result for the actual patch (tine fundamental, sample rate)
```

Bounds at compile: scheduled onsets across **all families** (base events +
Loom strikes + FM entrance) ≤ 256; every onset and gate end ≤ 120 s.

## Children (empty Loom / no FM)

`report.children` says which children the plan produced. Astra's imported
wrapper passes the composition with any child that has no events
**explicitly disabled**, records `childrenDisabledByImport: ['loom']` in
the manifest, and never falls back to the legacy pattern. A file has no
reason to need an FM entrance; `fmTime: null` with FM disabled is normal.

## Ownership and order

- Fable: `src/midi/smf.js` (parser), `src/midi/mapping.js`
  (`validateNoteList`, `validateMappingPlan`, `canonicalImportedScore`,
  `compileImportedScore`), tests with hand-built SMF bytes covering both
  formats, running status, SysEx and meta cancelling it, tempo changes and
  conflicts, retrigger / unmatched / dangling / zero gates, CC64 with
  thresholds, SMPTE and format 2 rejection, truncated chunks and bad VLQs.
- Astra: file input, plan UI, report preview before use, imported wrapper
  with explicit child disabling, export/verifier (`imported` in the
  manifest, NoteList recomputed and plan re-validated), inspector rows,
  harness fixture row.
- Order: M4a parser (Fable, after reading the spec pages), M4b mapping +
  compile + report (Fable), M4c UI and preview (Astra), M4d export/verify
  and inspector (Astra). Markers → sections and cadence for imported
  passages later. Voice Observatory stays planning.

## Decisions for Astra (rev. 2)

1. Parser policies as listed (rejections, running status, pairing,
   tempo merge).
2. Window/gate/pedal policies and the report classes and warnings.
3. The single `compileImportedScore(imported, patch, sampleRate)` with the
   report derived from the compiled result; provenance labeled as recorded.
4. Child disabling contract for the imported wrapper.
