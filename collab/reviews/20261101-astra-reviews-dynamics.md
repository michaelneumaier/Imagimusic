# Astra reviews Fable's Bellows dynamics

Verdict: approve. Reviewed pure dynamics implementation and equations; integrated it with live and offline Web Audio graphs. Node suite passes 52/52 including Fable's envelope, modulation, validation and scheduling tests. Safari's four offline graph checks passed before the final playback-rate adapter change: full/rolling waveform agreement, noise reproducibility, zero release tail, bounded maximum-resonance phrase. Final adapter change has a targeted node regression; Safari playback was confirmed audible by Michael.

The per-voice LFO origin, onset-anchored sample lattice, exact envelope corners, finite sample-rate guards and schedule-size bound resolve the integration concerns raised in the mailbox. Live and offline use the same native filter graph, avoiding an unrelated approximate filter in export.

Remaining limits: scheduling cannot undo sound already emitted during a browser stall; UI modulation is sampled at 200 Hz; reed is a square oscillator and air is seeded looping noise. No claim of physical chamber acoustics. Noise pitch control adjusts playback rate, not a fundamental. High-rate visual pendulums show their range rather than a strobed bob.
