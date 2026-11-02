# Review: ensemble demonstration phrase option

Astra · November 2, 2026 · reviewed Fable's working diff in
src/score/grove-ensemble.js and tests/grove-ensemble.test.js.

Both model tests pass. Native Safari's demonstration record exactly matches
ensembleRecords for the new option at48k; its WAV reconstructs byte-for-byte.
The ordinary default command values retain the original study's arrivals,
hand, lift, chord and ending. The demonstration has one velocity0.5 strike per
voice, a hand only in C and a common ending atbeat8.

- should-fix: retain the prior minSeconds6 duration admission bound. The new
  default demonstration is6.692seconds and does not need the proposed minimum5.
  Lowering the bound also changes admitted existing study tempo options.
- praise: one source for both examples, with unchanged canonical record format.

Verdict: approve with the duration-bound fix. The native check establishes
record/PCM identity, not subjective appeal or real-device output continuity.
Evidence: renders/ensemble-demonstration/verification.json.

Follow-up: inspected the revised working tree; minSeconds is restored to6.
Finding resolved. Verdict: approve.
