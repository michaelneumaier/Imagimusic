# Proposal 011: Expressive bodies, a MIDI 2.0 expression event model (planning)

*Fable, 2026-11-01, following Michael's direction ("tie in the new MIDI 2.0
specs") and Astra's brief `collab/notes/astra-midi2-direction.md`. Written
against M2-104-UM "UMP Format & MIDI 2.0 Protocol" v1.1.2 (2023-10-27),
sections 7.4.1–7.4.15 and Appendices A–C, read from the text Astra
extracted. Not a claim of MIDI 2.0 support; nothing here is implemented.
Where the extracted text omits a figure (packet bit layouts), the item is
marked "from figures, to read in the PDF".*

## The experience we are building toward

Three sustained notes, three independently expressive bodies. Bend one
while the other two hold; press on another; brighten the third. Sound and
geometry consume the same timestamped expression state, evaluated by one
function for playback, seeking and export. The mapping from expression to
sound and shape is our instrument design and is labeled as such; it is
not a standardized MIDI visual meaning.

## Supported message subset (first slice)

MIDI 2.0 Channel Voice messages only (UMP Message Type 0x4), on one Group.

| Message | Section | What we keep natively | Our use |
| --- | --- | --- | --- |
| Note On | 7.4.2 | note number, velocity 0–0xFFFF (zero is **not** a Note Off), attribute type and 16-bit data | allocates a voice; attribute type 0x03 Pitch 7.9 sets that note's pitch (7.4.15.3); types 0x01/0x02 kept and reported "not interpreted"; 0x04+ reserved → reported |
| Note Off | 7.4.1 | note number, velocity, attribute | ends the voice's gate; release runs on |
| Poly Pressure | 7.4.3 | 32-bit | the voice's **pressure** |
| Registered Per-Note Controller | 7.4.4, App. A | index, 32-bit | #3 Pitch 7.25 (**pitch**, 7.4.15.2), #74 Brightness (**brightness**), #71 Timbre/Harmonic Intensity (**timbre**); other defined indices kept and reported "not mapped"; reserved indices reported |
| Per-Note Management | 7.4.5, App. C | D and S flags | D: detach current voices on that note number (they freeze their per-note values for the rest of their life); S: reset the number's per-note state to defaults for future voices; D+S: detach first, then reset; D=S=0: no function, reported |
| Per-Note Pitch Bend | 7.4.12 | 32-bit unsigned bipolar, center 0x80000000 | offset from the voice's pitch, scaled by the per-note sensitivity |
| Registered Controller #00/07 | 7.4.13 | Q7.25 in units of 100 cents | per-note bend sensitivity, common to all note numbers on the channel; we honor 7 integer + 25 fractional bits and bound the range to ±1200 cents as a product choice (the spec's own example, 7.4.13.3) |
| Pitch Bend (channel) | 7.4.11 | 32-bit bipolar | offset applied to every voice on the channel; sensitivity from the channel bend sensitivity registered controller (format differs from 7.4.13: "MSB 7 bits HCU, LSB cents", 7.4.13.1 note; **to verify** in 7.4.7.1) |
| Control Change | 7.4.6 | index, 32-bit | #64 sustain only (threshold at the 32-bit midpoint, **to verify against Appendix D translation**); indices 0, 6, 32, 38, 98–101 ignored per 7.4.6 recommendations; CC 121 does **not** reset per-note controllers or per-note bend (App. B.2) |

Everything else (Program Change, Channel Pressure, Assignable
controllers, RPN/NRPN other than #00/07, Flex Data, SysEx, Utility, Stream)
is counted and reported, never approximated.

## Pitch precedence (7.4.15, as implemented)

For a voice at time t:

```
base   = note's Attribute #3 Pitch 7.9 (one note only)   if present
       else the note number's Registered Per-Note Controller #3 Pitch 7.25 state   if ever set
       else the note number (12-TET, A4 = 69 = 440 Hz)
pitch  = base + perNoteBend(t) · perNoteSensitivity + channelBend(t) · channelSensitivity        // HCUs (semitones)
hz     = 440 · 2^((pitch − 69) / 12)
```

Attribute pitch overrides persistent per-note pitch for that one note only;
the per-note pitch controller is persistent state for subsequent notes on
that number (7.4.15.2). MIDI Tuning Standard is not supported (reported).

## Voice model

- **Voice identity is ours, not the protocol's.** A Note On allocates a
  voice id (monotonic integer). The protocol address is (group, channel,
  noteNumber). Two voices may share an address (C.1: a retriggered note
  while the first is still releasing).
- **Per-note state is keyed by note number** and shared by all live voices
  on that number (C.1 default) until a Per-Note Management D detaches
  them: a detached voice carries its values frozen to the end of its life
  (7.4.5). S resets the number's state to defaults for future voices;
  live voices are unaffected unless also detached (7.4.5, D+S order).
- **Lifetime.** A voice is `sounding` from Note On, `releasing` from Note
  Off (or from the next Note On on the same address if the instrument is
  monophonic per number, a policy named in the mapping), and `ended` when
  the instrument's release reaches silence. A releasing voice continues to
  follow its (undetached) per-note controllers until it ends: expression
  survives release by default; detachment is the way to freeze it.
- **Sustain** (CC64) holds Note Off until pedal release, evaluated at the
  Note Off event in stream order (same rule as proposal 010).
- **Defaults** at Note On: pressure 0, brightness and timbre at the
  instrument's declared neutral value (recorded in the mapping), per-note
  bend center, pitch per the precedence above.

## Interpolation (explicit; sound and visuals use the same rule)

Controller values are events, not curves. The evaluator applies a declared
first-order smoothing to pressure, brightness, timbre and bend with time
constant τ (default 5 ms), computed **analytically** from the event list:
between events the value approaches the target as `v(t) = target + (v₀ −
target)·e^{−(t − t₀)/τ}`, so any time can be evaluated directly, seeking in
any order is exact, and offline and live evaluation agree. Pitch from
Note On attributes and per-note pitch controller changes are stepped
(no glide) unless Portamento is implemented later. Jitter Reduction
timestamps (7.2.2) are ignored in fixtures; Delta Clockstamps (7.2.3) are
how a MIDI Clip file carries time (next milestone).

## Data (strict keys, native widths preserved)

```js
ExpressionEvent = { order, time,                                    // seconds; fixture-authored or derived from clockstamps
  group, channel, type: 'noteOn'|'noteOff'|'polyPressure'|'perNoteController'|'perNoteManagement'|'perNotePitchBend'|'pitchBend'|'controlChange'|'registeredController',
  noteNumber?, velocity16?, attributeType8?, attributeData16?, index8?, bank8?, data32?, flags?: { detach, reset } }
ExpressionScore = { version: 1, protocol: 'midi2', source: { kind: 'fixture' | 'clip', name }, events: ExpressionEvent[],
  sensitivities: { perNoteBendQ7_25: uint32 /* RC #00/07 */ }, mapping: BodyMapping }
BodyMapping = { version: 1, instrument: 'bellows', voices: 3,
  pitch: 'chamber pitch (continuous)', pressure: 'air pressure → gain', brightness: 'filter cutoff', timbre: '<declared secondary parameter>',
  neutral: { brightness32, timbre32 }, smoothingSeconds: 0.005, polyphonyPerNoteNumber: 'retrigger-releases' | 'independent' }
```

Raw integers stay in the events; unit conversion happens only at the
instrument boundary through Astra's `src/midi2/values.js` (linear unit
values, Q7.25/Q7.9 pitch, Hz). A control pair whose 32-bit values collapse
to one 7-bit value remains distinct in the state and is shown distinct in
the inspector.

## Function (Fable)

```js
evaluateExpression(score, t) -> { voices: [{ voiceId, address: { group, channel, noteNumber }, state: 'sounding'|'releasing'|'ended',
                                             pitchHcu, hz, pressure01, brightness01, timbre01, detached, raw: { ...last native values } }],
                                  reported: { unsupported: [...], notInterpreted: [...] } }   // pure, analytic in t
```

One evaluator for synthesis (per-voice parameter schedule), the visible
chamber state, seeking and offline export. The bellows adapter already
exposes per-voice gain, cutoff and pitch (Astra's finding); the FM study
does not qualify (fixed closed-form phase), and no dynamic FM is implied.

## Fixture ("expressive chord")

Three voices on one channel, note numbers 60, 64, 67, starting together:
voice A receives Per-Note Pitch Bend up to +200 cents and back
(sensitivity 2.0 via RC #00/07); voice B receives Poly Pressure rising to
0xC0000000; voice C receives Brightness (#74) from neutral to 0xF0000000.
Then a Per-Note Management D on 64 followed by a new Note On 64: the old
voice keeps its pressure frozen while the new one starts at defaults. A
control pair 0x40000000 / 0x40000001 is sent to brightness on two voices
and must remain distinct internally.

## Evidence

- **Independence:** evaluated pitch, pressure, brightness and timbre of B
  and C are bit-identical with and without A's bend (and each pairwise).
- **Precision:** the collapsing control pair stays distinct in state and
  inspector rows; 7-bit downconversion is shown as "would collapse".
- **Determinism:** shuffled-time sampling equals in-order sampling;
  repeated offline renders identical.
- **Lifecycle:** detach freezes, reset defaults future voices, release
  keeps tracking, sustain holds Note Off in stream order; MIDI 2.0 Note
  On velocity 0 starts a voice.
- **Pitch precedence:** attribute pitch overrides per-note pitch for one
  note; per-note pitch persists; bends are offsets; Hz anchors at 69 →
  440.
- Visual and audio parity: the stage frame and the audio schedule read the
  same evaluator (Astra's integration), with scene parity like today.

## Ownership and order

- Fable: `src/midi2/expression.js` (score validation, canonical form,
  evaluator, fixture generator) and tests; proposal upkeep.
- Astra: bellows adapter synthesis for continuous per-voice pitch,
  pressure, brightness and timbre; the three visible bodies; inspector
  rows for expression state; export/verifier with the ExpressionScore in
  the manifest; later the MIDI Clip parser (M2-116-U v1.0) and live
  transport research.
- Order: 011a contract (this) → 011b evaluator + fixture + tests (Fable)
  → 011c bellows adapter + bodies (Astra) → 011d Clip import (bounded,
  owner to assign) → live bridge (research first; no Safari MIDI 2.0
  claim).

## To verify in the PDF before 011b (text extraction omits figures)

- Packet field layouts for Message Type 0x4 (figures 46–68): needed only
  when packing/unpacking UMP words (Clip import), not for the symbolic
  fixture.
- Appendix D translation thresholds for CC values (sustain on/off at 32
  bits) and the channel bend sensitivity format in 7.4.7.1.

## Decisions for Astra

1. The message subset and the three expression dimensions (pitch,
   pressure, brightness; timbre as a declared secondary).
2. The voice model (shared per-number state by default, detach freezes,
   release keeps tracking, sustain in stream order) and the analytic
   smoothing rule with τ = 5 ms.
3. The data shapes and the boundary rule (raw integers in events, units
   only through `values.js`).
4. Ownership and order, including who takes the Clip parser.
