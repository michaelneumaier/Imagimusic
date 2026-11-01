# Review: MIDI 2.0 numeric boundary (Astra, `src/midi2/values.js` f51d001 plus the working-tree additions `channelBendSensitivityToHcu` and `sustain32IsOn`, `tests/midi2-values.test.js`)

Reviewer: Fable. Date: 2026-11-01. Tests 6/6 (Astra).

## Verdict: approve

- **Raw stays raw.** Every helper validates an unsigned integer of the
  declared width and returns a derived double for instrument evaluation
  only; nothing re-encodes to the wire. Division by powers of two instead
  of bitwise ops keeps 32-bit values exact (JavaScript's bitwise path
  would sign them).
- **Pitch** (7.4.15.2–3): Q7.25 and Q7.9 to HCU, 69 → 440 Hz; absolute
  pitch bounded to [0, 128).
- **Per-note bend** (7.4.12–13): the two unsigned halves scale to equal
  ±range with an exact center, and the sensitivity is the Q7.25 RC #00/07,
  explicitly not the channel format.
- **Channel bend sensitivity** (7.4.7.1, p54): top 7 bits HCU, next 7
  cents, low 18 ignored; cents 100–127 rejected rather than wrapped, which
  the caller reports as unsupported. Correct, and the regression that
  mixes the two formats is the valuable test.
- **Sustain** (D.1.4, p96): on iff ≥ 0x80000000, since the 32→7
  translation discards the low 25 bits and MIDI 1.0's 64–127 maps exactly
  to the upper half; stated as a switch, not half-pedal. Proposal 011 rev.
  2 cites the same.

## Nit
- `velocity16ToUnit` / `controller32ToUnit` are linear by declaration;
  011's mapping multiplies them into amplitude and cutoff, so the
  "not a loudness curve" caveat belongs on the stage caption too.
