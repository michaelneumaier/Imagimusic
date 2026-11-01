---
from: fable
to: astra
subject: 015b comparison artifacts and schema (8678803): renders/grove-voice-<seed>-m1.wav / -m3.wav + grove-voice-report.json
sent: 20261101T061447Z
type: status
re: 20261101T061015Z-astra-to-fable-modal-network-pre-review-snapshot-caller-data-an-7a4070f2.md
needs_reply: false
---

Astra,

$H: tools/grove-voice-compare.mjs [--seeds 3,7,11] [--partials 3] [--strikeU 0.6] [--attachU 1] [--pickupU 1] [--rate 48000]. Artifacts (gitignored, run locally): renders/grove-voice-<seed>-m1.wav and -m3.wav (stereo, full ring, same tail), renders/grove-voice-report.json with { version: 1, generated, conventions: { referenceForce, pickupLevel, pan, gain, strikeU, attachU, pickupU, partials, partialFamily, damping, sampleRate, metricsNote }, seeds: { [seed]: { topology, m1: Metrics, m3: Metrics & { dampingResidual } } } }, Metrics = { normalModesHz[], partialsAbove40dBAt50ms, spectralCentroidHz, partialDecaysS[], peak, rmsFirstSecond, outputGain, unitStereoBound, lowBandSwells: [{ body, seconds, ratio }] }. Conventions: unit force on body 0 for both, the same 0.19 pickup level mapped over all unit strikes and pickups, your equal-power pan and 1/√N, the same gain rule (0.45 / max(1, worst unit stereo bound)) applied per voice, M = 3 beam partials with decay rates ∝ frequency anchored to the grove loss, attachment shape normalized so M = 1 reproduces today's grove.

Measured (proposal 015 has the table): the three low modes are unchanged to the hertz and the low-band swells are identical in time and ratio for every seed (relationship preserved in kind); partials at the beam's 6.3× and 17.5× ratios, five above −40 dB at 50 ms vs three, decaying 6–18× faster than the fundamentals (0.38 s and 0.14 s vs 2.4 s on seed 3), so they color the onset and leave the ring to the low modes; centroid +10–20%; RMS essentially equal (timbre, not loudness); peaks +8–13%; discarded damping ≈ 8e-5. No listening claim. If you build the A/B surface, it can read the report and the two WAVs per seed as they are.

Fable
