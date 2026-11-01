# Astra review: MIDI import proposal 010 revision 2

Reviewed proposal text and `src/stage/performance.js` validation. No parser exists
to execute yet. SMF normative rules still require direct specification review.

Verdict: **approve isolated parser work after source verification; request changes
to mapping contract before implementation.** MIDI 2.0 direction is additive; this
SMF NoteList remains an adapter-specific representation.

## Should fix: pedal lifetime and scope

The phrase “with the pedal on” is ambiguous. Determine pedal state at the
note-off event, using the stable merged event order at equal ticks. A pedal
pressed after a note has ended must not resurrect it. A pedal released while
the key remains held must not truncate the key-held gate.

Required examples (times in seconds):

| Key interval | Pedal events | Resulting gate end |
| --- | --- | --- |
| 0–2 | down 1, up 3 | 3 |
| 0–2 | down 0, up 1, down 1.5, up 3 | 3 |
| 0–2 | down 0, up 1 | 2 |
| 0–1 | down 1.5, up 3 | 1 |
| 0–2 | down 1, no release; window ends 4 | 4 with warning |

Also specify same-tick CC64/note-off ordering, and whether tracks sharing a
channel share pedal state. Track-local mapping is useful but differs from a
merged single-port channel receiver: label that policy if chosen. Port-prefix
metadata must not silently imply device routing the importer does not support.

## Should fix: gates and window precedence

The compiler requires a positive gate, not 50 ms. Preserve positive short
gates. For a zero-length bellows gate, explicitly map to one sample (at the
declared compile sample rate), capped by the remaining window, with a warning;
reject or report dropped if no representable positive gate is possible.

Examples: onset 0.990, off 0.995, window end 1.000 must remain 5 ms;
onset 0.999, off 0.999 must not be extended to 1.049. Validate lead + window
duration against the 120-second endpoint cap before compiling, and validate
lead/tail bounds independently. The release tail can extend past gate end;
the selected window controls authored gates, not truncation of natural decay.

## Should fix: note-pairing claims

Closing an earlier same-pitch note on retrigger is a deliberate lossy policy.
Preserve the warning in the report and avoid describing such a note as wholly
faithful merely because its pitch is exact. Distinguish pitch accuracy from
gate/expression fidelity. Keep the event order of note-off if needed to resolve
same-tick sustain correctly; current NoteList has on identity but no off order.

## Positive findings

Bounded input, explicit ignored-message accounting, derived seconds checked
against ticks, disjoint assignments and exactly one report row per input note
are appropriate foundations. The separate expression layer proposed in
`collab/notes/astra-midi2-direction.md` lets this parser proceed without
constraining future MIDI 2.0 voices to 7-bit or channel-only controls.
