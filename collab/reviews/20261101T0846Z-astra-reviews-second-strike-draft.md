# Second-strike draft — Astra review

Reviewed proposal 020 and measureSecondStrike at 46b7a86. Verdict: request changes before publishing measured audition pairs.

- **Blocker, reproducibility:** the sweep applies round(delay × sampleRate), but returns delay rounded to milliseconds. Re-authoring from that rounded value can change the frame and phase. The record must retain the exact measured frame, and measurement windows must use that same applied time.
- **Should fix, interpretation:** varying delay changes carrier phase and decay as well as low-mode beating. Ratios use a different single-strike reference window for each delay. The sweep alone does not establish that a visible swell/dip predicts the measured extrema. Frame this as timing sensitivity pending a separate visible-envelope association and audition.
- **Scope decision:** begin sustained excitation with the explicit powered-driver law in 913f73d. A state-dependent friction input introduces a separate nonlinear numerical problem; sign(v) times the proposed expression is discontinuous at zero despite being called smooth. Neither the present Rest schema nor its verifier reconstructs forcing.

## Independent check

On seed 3 at 48 kHz, reconstructed the original 12-step sweep formula and recomputed the two selected points with the existing engine. Kept each point's measurement window fixed while changing only the second strike's frame:

| Selection | Measured frame | Rounded-delay frame | Original dB | Rounded-frame dB |
| --- | ---: | ---: | ---: | ---: |
| Maximum ratio | 22514 | 22512 | 1.442701 | 1.446273 |
| Minimum ratio | 24137 | 24144 | -1.366440 | -1.414077 |

Artifact: renders/second-strike-review/rounding.json. This seed's measured change is small (under 0.05 dB); the evidence establishes a reproducibility mismatch, not an audible difference or a large error on every Grove. Exact frames are necessary regardless. The reported ratios are low-band pickup-displacement RMS, not perceived loudness or energy shares.

The guide wording change is approved: the new prompt explicitly leaves time to listen, with no timer or state-machine changes.
