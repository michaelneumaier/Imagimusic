# Review: explicit-event compiler and lab-instrument link round trip (Astra, `src/stage/performance.js` working tree, `src/stage/composition-link.js` at 92302fc)

Reviewer: Fable. Date: 2026-11-01.

## Verdict: approve-with-fixes (two small additions the phrase score needs; nothing blocking the foundation)

## `createPerformanceFromEvents(patch, score, sampleRate)`
- **Strict schema, no silent coercion.** Unknown family, unsupported
  field, duplicate or empty id, time outside 0–120 s, velocity outside
  (0, 1], garden slot outside 0–7, bellows pitch outside (0, Nyquist) or
  note-off not after onset: each throws with a named reason. Pitch fields
  on modal families are rejected, which is the "no arbitrary retuning"
  rule made mechanical.
- **Order and identity.** Events sort by time with the input order as a
  stable tie-break; `scoreId` travels on every voice while bellows keep
  chronological numeric ids so noise seeds and stealing behave exactly as
  the default path (`planBellowsVoices` unchanged). Garden/tine voices come
  from the extracted modal helper, so the default `createPerformance`'s
  shape and hashes are untouched (your regeneration confirms).
- Empty score → a 0.05 s rest; duration is the last voice end plus the
  same tail as before.

### should-fix (for the phrase score; small)
1. **Per-event strike position.** The engine already takes a position per
   strike (`audio.strike(slot, patch, velocity, when, position)`), and
   proposal 008's `character` variants rely on it (central vs near-tip
   strikes). Accept an optional `position` (finite, 0–1) on garden and tine
   events, defaulting to `patch.strikePosition`; the modal helper can pass
   it through. Rejecting it today is correct for strictness; adding it
   keeps strictness and unlocks the score.
2. **Timed damper holds.** The snapshots carry `dampers` as a static slot
   list (idle held dampers), so a score cannot say "hold slot 4 from bar 14
   to 15". Proposal 008's release uses exactly that. Suggest
   `dampers: [{ slot, start, end }]` intervals in the snapshot (static lists
   stay valid as `start: 0, end: Infinity`), with `collectState` honoring
   intervals; that part is mine (`state.js`) and I'll do it on your word.
   The compiler would then accept `{ family: 'damper', target, slot, time,
   duration }`.

### nit
- `attachComposition` hardcodes the Loom strike pattern and the FM entrance;
  proposal 008 asks for optional overrides (`loomScore`, `fmTime`) so the
  phrase score places the exchange and the turn; defaults unchanged when
  absent.
- The 256-event cap and 120 s bound are fine for the conversation (≈ 60
  events, 46 s); MIDI import will need them to grow, with the same
  validator.

## `compositionPageURL`
- Preserves `instrument=lab` when moving stage → study → stage, so the
  session-backed laboratory instrument survives the trip; canonical
  arrangement links unchanged; four link tests. Approve.

## Reconciliation with proposal 008
Done in the proposal (new "Compiler boundary" section): the Score is one
layer up and compiles onto your input, with bellows pitch pinned to the
slot table for the reason that a chamber is a visible body; the
compiler's general `noteHz` stays for MIDI import with a "mapped" flag.
