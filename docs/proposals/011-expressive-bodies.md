# Proposal 011 (rev. 2): Expressive bodies, a MIDI 2.0 expression event model (planning)

*Fable, 2026-11-01, following Michael's direction ("tie in the new MIDI 2.0
specs") and Astra's brief `collab/notes/astra-midi2-direction.md`. Rev. 2
applies Astra's review
(`collab/reviews/20261101T0442Z-astra-reviews-expression-contract.md`):
lifecycle semantics corrected against 7.4.5 and Appendix C, full
addresses, channel bend independent of detachment, sensitivity latching,
smoothing at detach/reset as a named receiver policy, voice termination
handed to the instrument, a four-voice fixture, and the concrete bellows
mapping. Written against M2-104-UM v1.1.2, sections 7.4.1–7.4.15,
7.4.7.1, Appendices A–D, from the extracted text. Not a claim of MIDI
2.0 support; nothing here is implemented.*

## The experience we are building toward

Three sustained notes, three independently expressive bodies. Bend one
while the other two hold; press on another; brighten the third. Sound and
geometry consume the same timestamped expression state, evaluated by one
function for playback, seeking and export. The mapping from expression to
sound and shape is our instrument design and is labeled as such; it is
not a standardized MIDI visual meaning, vocal anatomy or an acoustic
simulation.

## Supported message subset (first slice)

MIDI 2.0 Channel Voice messages only (UMP Message Type 0x4). Addresses are
always the full tuple **(group, channel, noteNumber)**; the first fixture
uses one group and one channel, the tests use two channels with the same
note numbers.

| Message | Section | What we keep natively | Our use |
| --- | --- | --- | --- |
| Note On | 7.4.2 | noteNumber, velocity 0–0xFFFF (zero is **not** a Note Off), attribute type and 16-bit data | allocates a voice; attribute 0x03 Pitch 7.9 sets that note's pitch (7.4.15.3); 0x01/0x02 kept, "not interpreted"; 0x04+ reserved, reported |
| Note Off | 7.4.1 | noteNumber, velocity, attribute | ends the voice's gate (subject to sustain); release is the instrument's |
| Poly Pressure | 7.4.3 | 32-bit | the voice's **pressure** |
| Registered Per-Note Controller | 7.4.4, App. A | index, 32-bit | #3 Pitch 7.25 (**pitch**, stepped), #74 Brightness, #71 Timbre/Harmonic Intensity; other defined indices kept, "not mapped"; reserved indices reported |
| Per-Note Management | 7.4.5, App. C | D, S | see Lifecycle |
| Per-Note Pitch Bend | 7.4.12 | 32-bit unsigned bipolar, center 0x80000000 | offset from the voice's pitch × the per-note sensitivity latched at its Note On |
| Registered Controller #00/07 | 7.4.13 | Q7.25, units of 100 cents | per-note bend sensitivity for **subsequent** notes on the channel (7.4.13.1); bounded to ±1200 cents as a product choice (7.4.13.3's example) |
| Pitch Bend (channel) | 7.4.11 | 32-bit bipolar | offset applied to every voice on the channel, **detached or not** |
| Registered Controller #00/00 | 7.4.7.1 (p54) | top 7 bits HCU, next 7 bits cents 0–99, low 18 ignored | channel bend sensitivity (`channelBendSensitivityToHcu` in `values.js`; cents 100–127 rejected as unsupported) |
| Control Change | 7.4.6, D.1.4 | index, 32-bit | #64 sustain: on iff value ≥ 0x80000000 (`sustain32IsOn`; D.1.4 discards the low 25 bits, so MIDI 1.0's 64–127 maps exactly to the upper half); a switch, not half-pedal. Indices 0, 6, 32, 38, 98–101 ignored per 7.4.6; CC 121 leaves per-note controllers and per-note bend alone (B.2) and we implement **no** other part of Reset All Controllers, which the report states |

Everything else (Program Change, Channel Pressure, Assignable
controllers, other RPN/NRPN, Flex Data, SysEx, Utility, Stream, MIDI
Tuning Standard) is counted and reported as *unsupported*; messages we
recognize but only partly implement are reported as *partial* with what
is missing. The two are never merged.

## Pitch precedence (7.4.15, as implemented)

```
base   = note's Attribute #3 Pitch 7.9 (that note only)                         if present
       else the address's Registered Per-Note Controller #3 Pitch 7.25 state    if ever set
       else the note number (12-TET, 69 = 440 Hz)
pitch  = base + perNoteBend(t) · perNoteSensitivityLatchedAtNoteOn + channelBend(t) · channelSensitivity   // HCUs
hz     = 440 · 2^((pitch − 69) / 12)
```

Attribute pitch overrides persistent per-note pitch for one note; per-note
pitch state persists for subsequent notes on that address (7.4.15.2).
Pitch 7.25 changes are **stepped** by choice; bends are smoothed (below).

## Lifecycle (corrected to 7.4.5 and Appendix C)

Per-note state (pressure, pitch 7.25, brightness, timbre, per-note bend)
is keyed by the full address and **shared by every live voice on that
address** (C.1) until detached.

| Message | Effect on live attached voices on that address | Effect on the address's state for future voices |
| --- | --- | --- |
| D only | detached: their per-note values are **frozen** for the rest of their life | unchanged; the next Note On inherits the current state (C.2 "might optionally reset") |
| S only | **they follow the reset**: the shared state goes to defaults and attached voices see it (7.4.5: "all Per-Note Controllers on the referenced Note Number should be reset") | defaults |
| D + S | detach first (frozen at pre-reset values), then reset | defaults (7.4.5: "default value and any further changes … apply to future notes only") |
| D = S = 0 | none | none; reported "no defined function" |

- **Channel bend and channel sensitivity are not per-note state**: a
  detached voice still follows channel Pitch Bend. Detachment freezes
  per-note expression only.
- **Sensitivity latching:** the per-note bend sensitivity in force at a
  voice's Note On is that voice's for life (7.4.13.1 "all Notes which
  follow"); a later #00/07 changes subsequent voices only. Tested
  explicitly.
- **Sustain** (CC64) holds a voice's effective Note Off until the pedal
  releases, evaluated at the Note Off event in stream order; a pedal
  pressed after the effective off never resurrects the voice.
- **Defaults** (initialization/reset values, not an unconditional Note
  On reset): pressure 0, brightness and timbre at the instrument's saved
  neutral values, per-note bend center, pitch per the precedence above.
- **Voice termination is the instrument's.** The evaluator returns, per
  voice, `noteOn`, `effectiveNoteOff` (sustain applied, or null while
  held), `gate: 'held' | 'released'` and the expression values; it never
  says `ended`. The bellows adapter decides completion from the saved
  patch's release, and released voices stay evaluable until it says so.
  The score bounds total voices and events (defaults 64 and 4096).

## Smoothing (receiver policy, one rule for sound and picture)

Raw native values and smoothed instrument values are distinct. Pressure,
brightness, timbre and both bends approach their targets by a declared
first-order rule with τ (default 5 ms), computed **analytically** from the
event list, so any time evaluates directly and seeks in any order agree.
At **detach**, a voice's smoothed per-note values are frozen at their
current evaluated values, in-flight ramp included, while the raw record
keeps the last message; at **reset**, attached voices' targets change and
approach with the same τ. Pitch 7.25 and attribute pitch are stepped.
Jitter Reduction timestamps (7.2.2) are ignored in fixtures; Delta
Clockstamps (7.2.3) carry time in MIDI Clip files (next milestone).

## Data (strict keys, native widths preserved)

```js
ExpressionEvent = { order, time,            // seconds; fixture-authored or derived from clockstamps
  group, channel, type: 'noteOn'|'noteOff'|'polyPressure'|'perNoteController'|'perNoteManagement'|'perNotePitchBend'|'pitchBend'|'controlChange'|'registeredController',
  noteNumber?, velocity16?, attributeType8?, attributeData16?, index8?, bank8?, data32?, flags?: { detach: boolean, reset: boolean } }
ExpressionScore = { version: 1, protocol: 'midi2', source: { kind: 'fixture' | 'clip', name }, events: ExpressionEvent[],
  bounds: { maxVoices: 64, maxEvents: 4096 }, mapping: BodyMapping }
BodyMapping = { version: 1, instrument: 'bellows', smoothingSeconds: 0.005,
  neutral: { brightness32, timbre32 },                                   // saved, so defaults are reproducible
  // proposed numeric mappings (Astra), labeled as instrument design:
  frequencyHz: '440·2^((hcu−69)/12)',
  amplitude:   'ADSR × velocity01 × (0.5 + 0.5 × pressure01)',          // pressure 0 still sounds
  cutoffHz:    'min(0.45 × sampleRate, 200 × 2^(6 × brightness01))',
  q:           '0.5 × 36^timbre01' }
```

Raw integers stay in the events; unit conversion happens only at the
instrument boundary through `src/midi2/values.js` (`velocity16ToUnit`,
`controller32ToUnit`, `pitch725ToHcu`, `pitch79ToHcu`,
`perNoteBendToHcu`, `channelBendSensitivityToHcu`, `sustain32IsOn`,
`hcuToHz`). A control pair whose 32-bit values collapse to one 7-bit value
remains distinct in state and in the inspector.

## Function (Fable)

```js
evaluateExpression(score, t) -> {
  voices: [{ voiceId, address: { group, channel, noteNumber }, noteOn, effectiveNoteOff, gate: 'held'|'released', detached,
             sensitivityHcu, pitchHcu, hz, pressure01, brightness01, timbre01, raw: { ...last native values } }],
  reported: { unsupported: [{ type, count }], partial: [{ type, missing }] },
}   // pure, analytic in t; released voices remain until the instrument retires them
```

The bellows adapter already exposes per-voice gain, cutoff and pitch
(Astra's finding); the FM study does not qualify (fixed closed-form
phase), and no dynamic FM is implied.

## Fixture ("expressive chord", four voices at the overlap)

Voices A, B, C on channel 0, note numbers 60, 64, 67, starting together
with sensitivity 2.0 set before them: A gets Per-Note Pitch Bend up to
+200 cents and back; B gets Poly Pressure rising to 0xC0000000; C gets
Brightness #74 from neutral to 0xF0000000. Then on 64: **D + S** followed
by a new Note On 64 (voice B′): B keeps its pressure frozen and B′ starts
at defaults; B is still releasing, so four voices exist at the overlap
and the fixture declares `maxVoices: 4`, with the allocation reported, not
truncated. A second scene sends **D only** and expects B′ to inherit the
current state; a third sends **S only** and expects an attached B to
follow the reset. A control pair 0x40000000 / 0x40000001 is sent to
brightness on two voices and must remain distinct. A channel Pitch Bend
after the detach must move B as well as the others.

## Evidence

- **Independence:** B and C's evaluated values are bit-identical with and
  without A's bend, pairwise.
- **Lifecycle:** D-only, S-only, D+S and zero-flag cases as in the table;
  sensitivity latching; sustain in stream order; MIDI 2.0 Note On
  velocity 0 starts a voice; two channels with equal note numbers never
  share state.
- **Precision:** the collapsing control pair stays distinct; 7-bit
  downconversion shown as "would collapse".
- **Determinism:** shuffled-time sampling equals in-order sampling;
  repeated offline renders identical.
- **Pitch precedence:** attribute pitch for one note; per-note pitch
  persists; bends are offsets; Hz anchors at 69 → 440.
- **Smoothing policy:** detach freezes an in-flight ramp at its current
  evaluated value; reset ramps attached voices.
- Visual and audio parity: the stage frame and the audio schedule read the
  same evaluator (Astra's integration), with scene parity like today.

## Ownership and order

- Fable: `src/midi2/expression.js` (score validation, canonical form,
  evaluator, fixture generator) and tests; proposal upkeep.
- Astra: bellows adapter (the numeric mapping above, ADSR/release
  completion from the saved patch), the visible bodies, inspector rows,
  export/verifier with the ExpressionScore in the manifest; the MIDI Clip
  parser (M2-116-U v1.0) after the symbolic evaluator and adapter are
  reviewed; live transport research last.
- Order: 011a contract (this) → 011b evaluator + fixture + tests (Fable)
  → 011c bellows adapter + bodies (Astra) → 011d Clip import (Astra) →
  live bridge (research first; no Safari MIDI 2.0 claim).

## Still to read in the PDF before Clip import (text extraction omits figures)

Packet field layouts for Message Type 0x4 (figures 46–68) and the
Clip file's sections; not needed for the symbolic fixture.

## Decisions for Astra (rev. 2)

1. The lifecycle table (S-only resets attached voices; D-only inherits;
   D+S freezes then defaults) and the smoothing policy at detach/reset.
2. The evaluator output without `ended`, voice termination owned by the
   adapter, and the score bounds.
3. The numeric bellows mapping as the first instrument design.
4. The four-voice fixture with reported allocation.
