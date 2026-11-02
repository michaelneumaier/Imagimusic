# Review: seeded ensemble wrapper at 215cd5e

Reviewer: Astra. Verdict: request-changes before reader/keeping/UI integration.
Read the builder, validator, canonicalizer, verifier and four tests. Ran four
independent counterexamples against the module; all returned verified:true,
contentMatches:true, mismatches:[] despite contradicting the source/continuation.

## Blockers: verification does not establish the declared relationship

1. An extra strike on another body at a remembered strike's existing part/frame
   passes. Positive .some checks and the part:frame set lose multiplicity and
   the complete gesture identity. Evidence:
   renders/ensemble-seeded-review/extra-same-frame-strike.json.
2. An extra contact interval before the boundary passes; no comparison excludes
   unremembered contacts. Evidence: renders/ensemble-seeded-review/contact-boundary.json.
3. A completed boundary at0 passes for a source whose handoff is500. Compare
   boundary to max(sourceStartFrame+plan.handoffFrame, every applied ledger frame).
   Evidence: the same contact-boundary report.
4. Replacing the first instrument's Grove with seed4 (source is seed3) passes.
   Matching gesture positions is insufficient: continuation must preserve each
   instrument's Grove, voice, gain, rate, zones and strengths. Evidence:
   renders/ensemble-seeded-review/changed-instrument.json.

Use reconstructed expected canonical histories from the accepted ledger edges,
with actual same-frame order and contact interval closure at the kept Quiet.
Compare complete remembered content (including multiplicity and contacts) and
instrument metadata. A completed handoff permits personal content strictly after
its boundary. An aborted handoff permits no personal content anywhere. Positive
membership checks cannot prove this and also risk rejecting legitimate contacts
that collapse to zero duration when late edges apply at one frame.

## Builder and coverage findings

- **should-fix:** new Map(c.ledger.map(...)) overwrites duplicate ids, ignores
  foreign entries and the lookup does not check the decision's part. Reject
  contradictory metadata instead of silently normalizing it.
- **should-fix:** the fabricated all-refused test checks signed field acceptance,
  not a coherent capture of all-refused remembered material followed by personal
  playing. Its inner ensemble still contains the remembered gestures. Add a
  coherent signed-offset/negative-boundary case and verify the full relationship.
- **positive:** input snapshots precede the hash await; unprocessed/null triples,
  exact fields and effective strike/set semantics are explicit. These are useful
  foundations but do not compensate for the false-positive verification cases.

No UI currently exposes this wrapper. Re-review the corrected verifier and its
new regression cases before integration. These findings concern provenance and
canonical content, not device playback performance.

## Recheck at 7c32ad3

All four saved false-positive fixtures now return verified:false with specific
mismatches (recheck.json in the same local evidence directory). The revised
five-test seeded suite passes. Instrument identity and boundary comparisons,
full content counts and builder ledger joins address the initial findings.

Approval remains pending two concrete follow-ups sent to Fable:
- zero-contact-at-quiet.json: a set accepted on Quiet's actual frame leaves no
  captured interval, but aborted expected content keeps a zero-length interval;
  a valid partial/timingChanged capture therefore fails verification.
- reordered-same-frame-strikes.json: reversing the two kept same-frame strikes
  still verifies true because sorted-key comparison ignores their sequence.
  Compare ordered projections, preserving relative stored order without requiring
  identical raw order counters from the source.
Also require processed frames to remain monotone in each part's planned queue
order; sorting an inverted ledger is not proof of an executable opening.

## Final verdict: approve at d93a776

ce0a461 applies the positive-duration rule when aborted Quiet closes remaining
contacts and rejects inverted per-part processed frames. d93a776 compares ordered
strike/contact projections rather than bags, preserving same-frame sequence.
Astra independently reran all seven seeded tests (pass) and the saved fixtures:
the original four false positives and reversed-strike case now fail; the valid
zero-contact-at-Quiet case verifies as partial with changed timing. The final
commit named by Fable is d93a776. The requested changes are resolved.

This approval concerns the bounded seeded-record relationship and the reviewed
cases. It is not a browser/device-output clearance or a musical appeal verdict.
