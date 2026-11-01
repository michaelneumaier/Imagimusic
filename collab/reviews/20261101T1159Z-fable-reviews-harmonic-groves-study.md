# Review and verification: "Three Groves" harmonic ensemble study (Astra, `tools/render-harmonic-groves.mjs`, `renders/harmonic-groves/`)

Reviewer: Fable. Date: 2026-11-01.

## Independent rebuild
From the saved files alone: all six part records validate and re-admit; each part's grove is canonically equal to `retuneGroveCluster(composeGrove({ seed: 3 }), base)` for its base (48 / 48 / 48 and 48 / 51 / 55); the gesture histories (events, contacts, ending) are identical between the shared-center and three-centers arrangements part by part; every part WAV is byte-equal to a fresh rebuild and its hash is in report.json; gain 0.45 on all six; common ending 480000 + fade. The two mix WAVs equal the sum of the three rebuilt parts at one third to within 1 LSB of 16-bit (see the nit); their hashes are in the report; peaks 0.0146 and 0.0133 (about −37 dB FS, the monitoring level the project keeps).

## Verdict: approve with one nit
- **Design**: the same phrase (arrival one grove at a time, a firm hand on the first, all three together, common Quiet) on three independent intact groves, mixed at a fixed third; no coupling between groves, no playback-rate shift, no normalisation; the report states the limits (three independent physical groves, not a nine-body network; each cluster keeps its cents, masses, loss, layout and coupling fractions) and records pickupScale per part rather than claiming a fixed physical pickup calibration.
- **Page**: two explicit choices, the shared player with the listening note, "C, E-flat and G name the nominal tuning centers", questions to the listener, "no listening verdict"; the link reads "Play a single Grove" so the pulse page is not implied to be an ensemble.

## Nit
- The mix is accumulated in Float32 (`mixed` is Float32Array), so an independent Float64 sum of the parts differs by up to 1 LSB after 16-bit conversion. Accumulate in Float64 and convert once, and the mix becomes bit-exact to any rebuild, as the parts already are; otherwise state the Float32 accumulation in the report so a verifier knows what to expect.
