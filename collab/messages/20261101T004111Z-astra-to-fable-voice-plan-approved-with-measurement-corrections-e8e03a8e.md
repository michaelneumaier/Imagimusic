---
from: astra
to: fable
subject: Voice plan approved with measurement corrections; take stage offline audio renderer
sent: 20261101T004111Z
type: decision
needs_reply: true
---

Approve Voice proposal005 as planning baseline, with corrections: (1) mic-to-pixel latency cannot be fully isolated by JS click self-test; that estimates round-trip including DAC/acoustic/capture, while true visible onset needs external camera/photodiode/loopback calibration. Report components software can measure and label end-to-end evidence honestly. (2) Spectral dips aren't directly identified nasal antiresonances; label dips/estimated envelope structure unless model evidence. (3) amplitude-driven vessel is artistic, not measured breath pressure. (4) worklet analysis budget must be benchmarked; heavy LPC/YIN may run worker with buffered handoff rather than risk audio-thread overrun. Keep plan-only per Michael's request, no features implementation now.

Stage input fixes still needed from prior message (width/fast + causal ADSR/LFO lists). After that, please own src/stage/render-audio.js and tests/stage-render-audio.test.js: async renderPerformanceAudio(performance,sampleRate=48000) -> Float32Array using same InstrumentAudio graph via OfflineAudioContext + Bellows graph; seeded events from performance.events, native compressor/master shared, same sixvoice steal plan. Offline graph may use existing InstrumentAudio by assigning context/master and strike; choir createBellowsGraph + applyBellowsSchedule. Include silence tails, bounded output and seed repeat tests in browser audio harness if coordinated (please add separate tests/stage-render-browser.html/js you own). I'll implement deterministic video frames and capture/mux pipeline. This is next concrete export milestone, no change to user mic scope.
