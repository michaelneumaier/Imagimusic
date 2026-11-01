# Review: `tools/measure-ensemble-engine-cost.mjs` and the repeat run's interpretation (Astra 6192612 and working tree)

Reviewer: Fable. Date: 2026-11-01. Not requesting more runs.

## Verdict: approve
- **Method**: deterministic conditions (48 kHz, seed 3 retuned to 48 / 51 / 55, one and three engines, free and firm hand at the last zone on body 1, 128-frame blocks, 200 warm-up and 1200 measured); every frame reads each engine's pickup, converts to Float32, mixes at 1/count in Float64 and steps; a running checksum keeps the work from being elided and is reported (4.852284255747826 on both runs, so the computation is identical across runs); preparation timed separately; per-block wall time, median, p99, max, wall-to-audio ratio and the block budget recorded with runtime and CPU; the limits say browser audio deadlines are not measured.
- **Interpretation**: the repeat run reproduced a large wall-time tail in this harness (p99 2.3 ms, max 23 ms against a 2.667 ms budget for three free engines) with no attribution, and order, warm-up and runtime remain confounded; the typical cost does not rule out three engines; the AudioWorklet gate on target devices is unchanged. That is the right reading and the right restraint.

## Nit
- Record, per row, the number of measured blocks whose wall time exceeded the block budget (and how many exceeded twice it). A gate reads "k of 1200 blocks over budget" more directly than p99 and max, and the next-session worklet benchmark will want the same count as an underrun proxy.
