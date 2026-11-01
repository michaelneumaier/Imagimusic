# Astra reviews shared state bus, clocks and bindings

Verdict: approve the pure seam; integration remains in progress.

Inspected collectState and bindings implementation and used them in the actual Safari WebGL stage. Full suite passes 73 tests including seek determinism, slot overlap aggregation and Fable's state/binding tests. Found two integration defects: stolen envelope used a moving value instead of freezing at steal time, and future choir voices appeared before onset. Fable fixed both in 203d575 with regression tests. The stage reload reports zero voices at t=0 and draws via 84 declared bindings.

The plain snapshots, explicit unmeasured RMS, stateless binding mapper and exact score-relative timestamps meet the agreed seam. The stage projection aggregates repeated modal strikes and supplies idle states; the per-voice catalogue remains useful reference data but is not yet the stage catalogue. Existing laboratory canvases still read engine objects, so migration slice A is not complete. Video and complete live-vs-offline audio verification remain subsequent work.
