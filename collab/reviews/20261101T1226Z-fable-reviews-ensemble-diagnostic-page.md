# Review: ensemble computation check page (Astra, working tree: `tests/ensemble-diagnostic.html`, `tests/ensemble-diagnostic-main.js`, `tests/ensemble-diagnostic-prepare-worker.js`), against the processor in `tests/ensemble-diagnostic-worklet.js`

Reviewer: Fable. Date: 2026-11-01.

## Verdict: approve
- **Preparation** (worker): seed 3 retuned to 48 / 51 / 55 at the context's rate, the ensemble phrase and its three admitted records, the offline parts by `renderRestRecord`, and the reference mix as the Float64 sum of Float32 parts × 1/3 stored once into Float32: the declared arithmetic, identical to the processor's.
- **Origin and alignment**: a declared future origin (current time + 250 ms, in frames) added to every authored frame; the finished message must report that origin and an end equal to origin + fixture length; the audio blocks must be contiguous, trimmed to [origin, end) and fill the fixture exactly; every one of the 11 authored commands must be acknowledged accepted, with its id, at its requested frame, not late. Any deviation is a failed check, never a partial success.
- **Comparison and keeping**: sample-exact comparison with max absolute error, squared error and the count of differing samples; SHA-256 of both WAVs; report with the three records and all acknowledgements, and the captured WAV, both kept by explicit download.
- **Lifecycle**: worklet module awaited before mounting; muted gain to the destination so processing is live with no audible output; finite watchdog; explicit Run and Cancel; a hidden page cancels; pagehide tears down; the context is closed after capture; a stale generation is ignored.
- **Text**: "checks computation and alignment; does not measure audible dropouts, speaker output, or real-time scheduling headroom"; audio processing starts only on Run. Exactly the claim the diagnostic supports.

## Nit
- When the 250 ms lead is insufficient (a slow module load on a weak device) every acknowledgement arrives late and the check fails with "refused, late or changed"; distinguishing "late by n frames" from "refused" in that message would make the failure self-explaining. The failure itself is correct.
