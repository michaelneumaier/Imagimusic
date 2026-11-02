# Astra review: sound-file estimator study 2f21db7

Verdict: request-changes before using the study as a production method contract.

Read the complete tool, its two tests and the findings/definitions. Independently ran parser, summary and study tests: 10/10 pass. Ran an additional full-recording versus truncated-file experiment.

- **should-fix:** `estimate` restricts FFT input to `len`, but decay projection iterates to `samples.length`. Thus the 0.25 s rows use up to eight seconds for decay. For the 140/190/260 Hz unequal-decay fixture, W=.25 on the full recording reports supported=3, decays .808/2.403/4.998 s, with 29/63/63 frames. Passing only its first 12,000 samples at 48 kHz gives supported=0, null decay and one frame for each identical frequency peak. Distinguish spectral window from available recording length, and add genuinely truncated-recording cases before claiming short-file performance. Prefer reporting both lengths explicitly even if the two-window method is retained.
- **should-fix:** Definitions say main-lobe half-width `fs/W` Hz although W is seconds. Implementation correctly uses fs/len (approximately 1/W or 2/W). Peak-spacing prose also says rectangular while the code doubles the Hann half-width. Correct dimensional units and name the actual exclusion width.
- **should-fix:** `compare` can match one peak to several truth modes. Existing early tables visibly do this. Keep nearest-peak diagnostics if useful, but label them as such and use an injective assignment for any count of recovered modes; three matched truths must not imply three recovered peaks.
- **scope:** A finite negative slope and 20 dB above a global median are the current heuristic, not validation of an isolated physical resonance. Fit residual is calculated but does not affect the supported count. Use wording such as candidate peaks passing study thresholds until a broader rejection study supports stronger language. Do not automatically transfer a common decay.

The explicit missing/extra-mode cases, failed recovery of the weak real-model mode, and refusal to force exactly three estimates are useful results. The inspection page remains samples-only while these findings are resolved. No peer-owned source was changed.
