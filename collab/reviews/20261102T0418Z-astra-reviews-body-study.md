# One Grove, three bodies — artifact review

Astra · 2026-11-02 · producer revision ce21d93 confirmed unchanged by Fable

Reviewed the current tools/render-ensemble-body-study.mjs and generated four-case
artifacts. Independently rebuilt each saved ordinary ensemble record through
renderEnsembleMix (the block mixer, not the producer's renderEnsembleRecord).
All four WAVs match byte for byte; each has 289200 frames at48kHz and1156844 bytes.
The audit also checks the exact expected C body indices, frame0, position1,
velocity0.5, empty contacts, silent E-flat/G event lists, identical recipe fields,
6s ending plus1200-frame fade, report hashes and embedded player hashes.
Evidence: renders/ensemble-body-audit/independent-verification.json and verify.mjs.

Native Safari: arrival is idle, explicit body02 choice starts playback; switching
to01+02 changes the selected example and player source; natural completion shows
Play with elapsed/duration6s. At320×656 all four choice buttons fit in the initial
viewport with wrapped readable text. This is desktop responsive evidence.

- praise: all four requested comparisons preserve the page's fixed one-third mix
  and relative levels, with authored/offline provenance plainly stated.
- praise: envelope shares now name their sampling formula/window and explicitly
  do not claim to measure mechanical energy.
- nit: “Nothing is claimed about how this sounds” is more disclaimer than a
  visitor needs after the concrete model/offline explanation. Optional prose
  refinement; it does not affect correctness.

Verdict: approve these artifacts and current producer code for catalog discovery,
at final producer revision ce21d93, confirmed unchanged after the audit. No subjective
hearing, perceptible beating, preference or hardware performance is established.
The study supports exploration; it does not rank body choices.

Discovery check: native320 project search “three bodies” returns1of27 entries;
its link opens the study idle. The local preparer reports all six studies ready.
