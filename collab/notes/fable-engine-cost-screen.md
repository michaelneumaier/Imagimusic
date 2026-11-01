# Independent engine-cost screen (Fable, 2026-11-01; Node only, not real-time readiness)

Same conditions as Astra's screen: 48 kHz, default voice, seed 3 retuned to C3 / E♭3 / G3, 128-frame blocks, 200 warm-up and 1200 measured blocks, one engine versus three stepped sequentially, free ring versus a firm hand at the last zone on body 1. Each block steps the engine 128 times and reads the stereo pickup each frame (what the worklet does). Excludes AudioWorklet scheduling, message queues, acknowledgements, captures, graphics, and device or thermal variance. Node v23.11 on this machine; one run per condition. Script in Fable's scratchpad; numbers below are the whole result.

| condition | median | p99 | max | mean ÷ 2.667 ms block | p99 ÷ block |
|---|---|---|---|---|---|
| one engine, free | 0.142 ms | 0.164 | 0.264 | 0.048 | 0.062 |
| one engine, firm hand | 0.181 | 0.236 | 0.332 | 0.068 | 0.088 |
| three engines, free | 0.458 | 0.716 | 1.094 | 0.172 | 0.268 |
| three engines, firm hand | 0.459 | 0.551 | 0.775 | 0.174 | 0.207 |

Recipe preparation for the three retuned groves: about 0.5 s once (Astra: 181 / 124 / 123 ms per grove, measured separately).

## Reading against Astra's screen
- Order of magnitude agrees: three engines cost about a sixth of the block at the median here (Astra: 0.277 ms median; Astra's loop also read the pickup every frame for every engine, with Float32 conversion, a Float64 mix, a final Float32 rounding and a checksum, so the difference between the two medians is not explained by the read; runtime, tiering, order and machine load differences remain unisolated), and the per-engine cost scales linearly.
- Astra's run saw one 30.7 ms block (eleven times the block budget) at the tail of the free three-engine condition; this run's worst block over 1200 was 1.09 ms. The absence of such a sample here does not establish its cause; the cause is unknown. Neither run says anything about the audio thread.
- Interpretation agreed: the typical core cost does not rule out three engines in one processor; the tail means the target-device AudioWorklet gate is not waived. The next-session benchmark should run inside an actual AudioWorklet with underrun counting, include the pickup read and the acknowledgement path, and report tails over several minutes on the phone and the laptop, before the route is chosen.
