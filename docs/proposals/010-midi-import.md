# Proposal 010 (rev. 3): MIDI import onto the explicit-score contract (M4)

*Fable, 2026-11-01. Rev. 3: the parser (M4a) is implemented in
`src/midi/smf.js` against the RP-001 text Astra retrieved (rules cite PDF
pages); this revision records the parser as built and applies Astra's
rev. 2 review (`collab/reviews/20261101T0412Z-astra-reviews-midi-import-rev2.md`)
to the mapping contract, which is still planning. MIDI 2.0 expression is a
separate layer (proposal 011); this NoteList is a MIDI 1.0 input adapter,
not the universal performance representation.*

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

- **Accepted:** header chunk `MThd` with format 0 or 1 and a length of 6
  or more (p7: honor a longer header, skip the extension), metrical
  division (bit 15 clear, PPQ 1–32767). **Rejected with a named error:**
  format 2, SMPTE division (bit 15 set, p6), VLQ longer than four bytes
  (p4: largest 0x0FFFFFFF), chunk length past end of file (p5), track
  without End of Track or with data after it (p10–11), a data byte with no
  running status in effect (p8), a meta type ≥ 128 (p9), a known meta
  shorter than its defined length, a time-signature denominator above 2^7
  (our bound, not the format's), system bytes other than F0/F7/FF, file
  over 256 KiB, more than 4096 notes or 65536 events. Unknown chunk types
  are skipped and counted (p5: "expect alien chunks").
- **Running status** persists for channel messages (0x80–0xEF) across
  delta-times; the first event of a track must carry status (p8); meta
  and SysEx events cancel it (p9). SysEx is length-framed: F0 (complete or
  first packet) and F7 (continuation or escape) are skipped by length and
  counted; a packet is not required to end in F7 (p9).
- **Known meta longer than defined** (p9): the whole length is consumed,
  the defined prefix interpreted, the extension ignored. Time signature
  keeps all four fields (nn, dd, cc, bb), so nothing is dropped.
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
- **Tempo and time signature** from any track are merged by tick (p7:
  format 1 should keep them in the first track; accepting other tracks is
  a tolerance policy). Two tempo events at the same tick: the later in
  merge order wins and a `tempoConflict` warning names both. Default
  500000 µs per quarter (120 BPM, p7) when no tempo event precedes. Tempo
  1–16777215 µs (24-bit, p11); time signature nn 0–255, dd ≤ 7 (bound),
  cc and bb kept.
- **Controllers:** CC64 (sustain) events are kept in order with their
  value (`≤ 63` off, `≥ 64` on, per the control-change table). Every other
  message kind is counted in `ignored` by kind (other CC by number,
  program change, pitch bend, channel/poly aftertouch, SysEx, unknown
  meta) so the report can list exactly what was ignored.
- Seconds are computed from ticks through the tempo map and stored
  **only as derived values**; `validateNoteList` recomputes them and
  rejects a mismatch, so saved seconds can never override ticks.
- **Note-off identity:** every note records `offEventOrder` (the merge
  order of the event that closed it: a Note Off, a retriggering Note On,
  or End of Track), so same-tick CC64 / Note Off order is recoverable
  from the saved data (Astra's rev. 2 review).
- **Pairing scope policy:** pairing and pedal state are **track-local**
  (keyed by track, channel, pitch). This differs from a merged single-port
  receiver, where two tracks on one channel would share state; the
  mapping report labels it. MIDI Channel Prefix meta-events are counted,
  not applied, and imply no device routing.
- **Retrigger is lossy:** closing an earlier same-pitch note at a new
  Note On recovers no exact gate; the warning says so and the report
  never calls such a note faithful in gate, only exact in pitch.

## Data (strict keys everywhere; all numbers finite and in range)

```js
NoteList = {
  version: 1, name, format: 0 | 1, ppq, trackCount, endTick, durationSeconds,
  tempoMap: [{ tick, usPerQuarter, eventOrder }],
  timeSignatures: [{ tick, numerator, denominator, clocksPerClick, thirtySecondsPerQuarter, eventOrder }],
  tracks: [{ index, name /* ≤ 120 chars */, channels: [int] }],
  notes: [{ noteId, track, channel, pitch, velocity, onTick, offTick, offEventOrder, onSeconds, offSeconds }],   // sorted by onTick, noteId
  sustain: [{ eventOrder, tick, seconds, track, channel, value }],                                // CC64 only, ordered
  markers: [{ tick, seconds, text /* ≤ 120 chars */, eventOrder }],
  warnings: [{ kind: 'retrigger'|'unmatchedOff'|'danglingOn'|'zeroGate'|'tempoConflict', eventOrder, detail }],
  ignored: { controllers: { [number]: count }, programChange, pitchBend, channelAftertouch, polyAftertouch, sysEx, meta: { [type]: count }, unknownMeta, unknownChunks, channelPrefix },
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
- **Pedal rule (bellows, when enabled):** pedal state is read **at the
  note's off event** in merged event order (same tick: the earlier
  `eventOrder` happened first). If the pedal is down at that moment, the
  gate ends at the next pedal-up after the off event (or at `end`,
  clipped, warning `pedalNeverReleased`); if it is up, the gate ends at
  the off event. A pedal pressed after a note has ended never resurrects
  it; a pedal released while the key is still held never shortens the
  key gate. Pedal state at `start` is the last CC64 at or before `start`
  (warning `pedalHeldAtStart` when down). Astra's examples (key 0–2 s):
  down 1 / up 3 → 3; down 0, up 1, down 1.5, up 3 → 3; down 0, up 1 → 2;
  key 0–1 with down 1.5 / up 3 → 1; down 1, never released, window end 4
  → 4 with warning.
- **Gates:** the compiler requires only a positive gate, so positive short
  gates are preserved exactly (onset 0.990 / off 0.995 stays 5 ms). A
  zero-length gate is compiled as **one sample** at the compile sample
  rate (warning `zeroGateOneSample`), capped by the remaining window; if
  no positive gate fits (onset at `end`), the note is `dropped` with
  reason `noRepresentableGate`. Nothing is extended past `end` or 120 s.
- **Endpoint cap validated before compiling:** `lead` (0–5 s) and
  `tailSeconds` (0–30 s) are validated independently, and `lead + (end −
  start)` must be ≤ 120 s. The natural release tail may extend past a
  gate end; the window bounds authored gates, never the decay.

## Report

```js
MappingReport = {
  counts: { exact, mapped, timingOnly, dropped, unassigned, excluded, total },   // total === notes.length
  rows: [{ noteId, track, channel, pitch, family, class, from: { pitch, hz }, to: { slot | body | hz | 'tine fundamental' | 'fm entrance' }, cents, reason }],
  warnings: [{ kind, noteId | eventOrder, detail }],         // gateIgnored, stolen, retrigger, unmatchedOff, danglingOn, zeroGate, zeroGateOneSample,
                                                             // tempoConflict, gateClipped, pedalHeldAtStart, pedalNeverReleased, controllersIgnored, trackLocalPedal
  planner: { garden: { unplanned }, tine: { unplanned } },   // from the real planner on the compiled events; shown, never a refusal
  children: { loom: boolean, fm: boolean },                  // whether the plan produced any Loom strikes / an FM entrance
}
```

`unassigned` rows block "Use this mapping" until the plan resolves them;
everything else is information.

## Functions (settled signatures)

```js
parseSMF(bytes: Uint8Array, { name }) -> NoteList                                  // throws named errors; pure
validateNoteList(noteList) -> noteList                                              // in smf.js: strict keys, ranges, recomputes seconds from ticks, rejects mismatch
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

## Status

- M4a parser: **built** (`src/midi/smf.js`, `tests/midi-smf.test.js`: the
  RP-001 example file, running status and cancellation, format 1 tempo
  map with conflict, pairing warnings, sustain/ignored accounting with
  alien chunks and long known meta, sixteen named rejections, validator
  tamper tests, canonical stability).
- M4b mapping/compile/report: planning, this contract, awaiting Astra's
  confirmation of rev. 3.

## Ownership and order

- Fable: `src/midi/smf.js` (parser and `validateNoteList`, built),
  `src/midi/mapping.js` (`validateMappingPlan`, `canonicalImportedScore`,
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
