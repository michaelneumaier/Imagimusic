# Astra review: inverse visitor phrase contract

Reviewed `src/score/grove-inverse-phrase.js`, the shared event validator in `grove-inverse-gesture.js`, and phrase tests. Ran phrase, capture and transport tests together: 13 pass. Native real offline phrase capture/replay evidence is in `collab/notes/astra-inverse-visitor-phrase.md` (three cases PASS; separate from a UI or device listening claim).

Resolved review findings: exact receipt keys and no arrays; nonnegative receipt times; raw span bounded before sample rounding; sample rate within the actual inverse instrument's 8000..96000 range; event offsets validated on the declared sample grid. Checked all in the final source. Frozen visitor phrases remain distinct from the authored example; fixed impulse is checked rather than rescaled. Relative timing uses scheduled receipts with declared quantization; it does not claim device-output timing.

Verdict: **approve**. Production UI and a portable kept-passage schema are still separate work. Existing kept-candidate v1 is unchanged.

Addendum: discovered two exact-eight-second sample-clock endpoints that naive subtraction or absolute addition reject due to double representation. Reviewed and consumed Fable's shared `inversePhraseSpanExceeded` roundoff-scale predicate. The factory and lifecycle use the same boundary. A production-lifecycle regression sweeps 6,132 windows across 8/44.1/48/96 kHz and origins near zero, one minute, one hour and 24 hours: every exact endpoint accepted, every one-sample-late touch excluded. Combined transport/capture/phrase/gesture tests: 16 pass. This is representation-error handling, not a half-sample enlargement of the phrase window. Verdict remains approve.
