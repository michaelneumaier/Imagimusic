# MIDI 2.0: expressive bodies

Astra, 2026-11-01. Research and proposed experiment following Michael's request;
not a claim of implemented MIDI 2.0 support. Fable owns the formal proposal update.

## First experience

Three sustained notes, three independently expressive bodies. Bend one while
the other two hold pitch; increase pressure on another; change the third's
brightness. Sound and geometry consume the same timestamped expression state.
The mapping is our artistic instrument design, not a standardized MIDI visual
meaning or an anatomical simulation. Start with a short reproducible fixture,
then a bounded MIDI Clip import, then investigate live device access.

The existing bellows and FM studies suggest useful visual vocabulary, but their
current fixed-parameter voices need explicit synthesis work before continuous
pitch/timbre changes can honestly be shown as sounding changes.

## Architecture to preserve now

- Keep the SMF parser as a MIDI 1.0 input adapter. Its NoteList is not the universal
  future performance representation. Do not put UMP bytes into an SMF track.
- Preserve native controller integers, bit width, source protocol, group/channel,
  message ordering and time in a future expression event layer. Convert to
  physical units at the instrument boundary; never reduce everything to 7 bits.
- Keep application voice-instance identity separate from protocol addressing.
  Review retriggers, overlapping same-pitch notes, per-note controller lifetime,
  reset/detach and voice stealing against the actual UMP specification.
- Use one expression evaluator for synthesis, visible mechanism state, seeking
  and offline export. Define interpolation explicitly; MIDI messages alone do
  not guarantee smooth sound or deterministic resampling.
- Report unsupported or reduced expression. No silent claim of faithful mapping.
- Existing score/SMF manifests remain versioned and reproducible. Add a versioned
  expression format rather than weakening current validators with optional fields.

## Milestones and review gates

1. **Contract:** Fable proposes the expression event model and exact supported
   message subset after reading UMP v1.1.2. Astra reviews voice lifetime and stage
   integration. Existing bounded SMF work can continue independently.
2. **Expressive chord:** implement three voices and shared audio/visual state.
   Verify one-note modulation cannot affect the others; pitch, pressure and a
   declared timbre mapping survive release and seek according to explicit rules.
   Include a control pair whose distinct native values would collapse to one
   7-bit value, and verify they remain distinct internally.
3. **Recorded interchange:** parse a bounded MIDI Clip fixture with known expected
   events/timing; validate malformed lengths and unsupported messages. Repeat
   offline renders and shuffled-time visual sampling must reproduce results.
4. **Live bridge:** investigate actual OS/browser transport capabilities and real
   hardware before selecting a bridge. MIDI-CI, Profiles and Property Exchange
   are a later interoperability track, not prerequisites for the fixture.

Voice Observatory remains planning only. Later, estimated vocal pitch/energy/
spectral features could feed the same expressive instruments. Confidence and
unpitched sounds must remain available; MIDI is not a full description of a
human vocal tract or every beatboxing sound.

## Primary references checked

- [MIDI Association musician overview](https://midi.org/what-musicians-artists-need-to-know-about-midi-2-0):
  16-bit velocity, 32-bit controllers/pressure/pitch bend, per-note pitch.
- [UMP and MIDI 2.0 protocol](https://midi.org/universal-midi-packet-ump-and-midi-2-0-protocol-specification):
  current download names v1.1.2; UMP can carry both MIDI 1.0 and MIDI 2.0.
  [Public specification download](https://drive.google.com/file/d/1l2L5ALHj4K9hw_LalQ2jJZBMXDxc9Uel/view).
- [Core collection](https://midi.org/midi-2-0-core-specification-collection):
  Clip v1.0; Property Exchange v1.2; change history lists MIDI-CI v1.2.1
  (2025-12-18), although its summary list still says v1.2. Verify individual
  documents before choosing implementation versions.
- [MMA/AMEI Clip specification v1.0](https://amei.or.jp/midistandardcommittee/MIDI2.0/MIDI2.0-DOCS/M2-116-U_v1-0_MIDI_Clip_File_Specification.pdf):
  UMP sequence interchange, distinct from legacy SMF; includes delta clockstamps,
  configuration and sequence sections. Exact parsing requires full spec review.

No native Safari MIDI 2.0 connectivity or MIDI-CI conformance has been verified.
