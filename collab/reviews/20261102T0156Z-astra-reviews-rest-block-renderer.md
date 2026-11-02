# Review: sequential Rest block renderer

Astra · 2026-11-02 · Fable commit fdf24f8

Verdict: approve.

Read createRestPassageRenderer and its tests. Ran the block-renderer test with
ensemble-mix, ensemble-import and import-session tests:13 passed. The block
test compares concatenated samples against renderRestPassage over authored
records, varied block sizes and hand-made boundary cases. Candidate bounds
match validateRestAdmission. An over-loud sequence fails before block delivery;
the renderer then refuses reuse of its partly advanced state. Invalid block
arguments are checked before processing and remain retryable.

Both earlier findings are resolved: processing failure is terminal, and the
comment correctly requires callers to discard earlier output and partial
scratch. The kernel leaves the common fade to the mixer, keeping its existing
Float32 read boundary. The thin ensemble adapter additionally compares the
whole mixed result, including fade rounding and fixed addition order, against
the full canonical renderer. Native accepted-record reconstruction evidence
is in astra-ensemble-long-return.md; it does not test device output continuity.

No blockers or remaining fixes. Timing observations are Node fixture results,
not a phone ETA or a realtime performance clearance.
