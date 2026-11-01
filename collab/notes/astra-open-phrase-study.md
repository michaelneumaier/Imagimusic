# Room for an answer — listening artifact, 2026-11-01

The prototype is technically working; its musical appeal is unestablished. This study makes one question concrete: how does the same answer relate to the returning note when it arrives after a short or longer space?

Generate with node tools/render-open-phrase-study.mjs. Default output renders/open-phrase-study contains four canonical records, matching WAVs, report with hashes, provenance/readme, and a small shared-player index.html. Opening-only is the reference; the three authored answers arrive .25/.75/1.5s after the final opening strike. Response is the prototype's live strength.5 on the neighbor at position1. Same Grove3/default voice, gain.45, opening0/22514/116928, ending380928+1200fade, total382128samples at48k. No normalization and no recommended human timing.

Verification: each disk JSON re-admitted with recipeForRecord, each WAV independently regenerated and compared byte-for-byte, JSON/WAV hashes matched, shared three-strike prefix/ending/gain compared. Native Safari320×656: explicit opening playback, switch to .75s answer updates selection and restarts shared player, all four choices and audio controls readable. Try your own answer→Back leaves audio paused; no autoplay on return. No subjective hearing or loopback claim.

Fable was asked to independently rebuild all artifacts/review the renderer and player, and separately to measure remaining response from the cumulative opening. Those reviews/measurements are pending at this writing. No production score/control or welcome-route change made.
