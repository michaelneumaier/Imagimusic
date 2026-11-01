# Expressive bodies study — Astra validation, 2026-11-01

`expressive.html` presents Fable's composed stillness/change/answer/return study and three short detach/reset comparisons. Source: `src/expressive/**`; evaluator/composer remains Fable's `src/midi2/expression.js`.

## Model boundary

One analytic expression-to-instrument adapter feeds visual sampling and an offline Web Audio graph. Audio uses a 1 kHz linear control schedule including exact message boundaries and ADSR corners; stepped controls receive a left limit followed by a set at the boundary, avoiding anticipation. Playback uses the resulting buffer, and saving encodes that complete mono buffer. Shapes interpret a subtractive synthesizer, not an acoustic chamber. Symbolic MIDI 2.0 scores are fixtures; hardware and live MIDI transport are absent. Bellows legacy filter envelope/key tracking/LFO are replaced by the independent expression mapping. Per-voice seed = `(patch.seed + voiceId * 997) >>> 0`.

Q uses the Web Audio lowpass's dB convention, as specified by [W3C BiquadFilterNode.Q](https://www.w3.org/TR/webaudio/#dom-biquadfilternode-q). The 0.45 × sample-rate frequency cap is a receiver limit, not a claim about alias-free high-note synthesis. These supplied studies remain in ordinary musical registers.

## Evidence

- Full Node suite: 261/261 passed before the additional reverse-seek scene regression; focused adapter/scene suite then 4/4 passed.
- Safari 26.6.2 browser harness `tests/expressive-audio.html`: 5/5 cases pass. Musical study and all three lifecycle fixtures at 48 kHz; detach+reset also at 44.1 kHz. Each pair has exactly equal Float32 samples, all finite, nonzero signal, peak below 0.98 and final 100 ms exactly zero. `renders/expressive-audio-report-v2.json` is the local report.
- Musical study: 22.65 s, 1,087,200 mono samples at 48 kHz, peak 0.0187937561. Pair render cost ~16 s on this machine; initial preparation is noticeably slow and is a known optimization target.
- Detach+reset 1 kHz versus 2 kHz controls: maximum sample difference 0.0004366282; relative RMS residual −53.7133 dB. This measures interpolation sensitivity for one fixture, not universal auditory transparency or exact analytic audio.
- Safari UI: default study loads silently, Listen prepares and plays, active voices and chapter advance, pause/seek gives independent pitch/brightness readouts, Voice B selection changes the inspector, and Save sound downloads a WAV. At 11.33 s, A is ~221.5 Hz while B remains ~329.6 Hz with brightness 0.77. Three bodies fit the desktop scene. Reverse sampling does not accumulate animation state.
- Saved `renders/expressive-study.wav`: mono PCM16, 48 kHz, 1,087,200 frames / 22.65 s; final 100 ms silent. PCM16 quantization differs from the internal Float32 buffer.

Cancellation invalidates playback intent; an offline render already underway may continue computation. No performance claim for all browsers or all permitted scores. Audio buffer repeatability is measured within this Safari build, not across engines.

## Review

Fable approved the foundation in `collab/reviews/20261101T0524Z-fable-reviews-expressive-adapter.md`. Added creation-time default control budget validation and per-voice seed disclosure. UI/scene follow-up review requested via canonical mailbox; no approval claimed yet.

## Follow-up: revised composition and exact-repeat compaction

Fable's 7062f93 moves the first voice's return to 16–17.5 s, while it is still sustained, so that change is audible. Main reads exported phase definitions. Fable approved scene/UI in `collab/reviews/20261101T0530Z-fable-reviews-expressive-page.md`; both nits addressed.

`automation.js` omits only exactly repeated values, retaining their last hold timestamp before the next change; no tolerance quantization. A dense comparison path remains available to the harness. `renders/expressive-audio-report-v3.json` verifies the revised composition and compact graph: 5/5 repeat pairs exact; musical-study compact/dense PCM exact; detach+reset compact/dense maximum error 5.58794e−9 (relative residual −152.78 dB). The comparison threshold is 1e−7; it does not claim cross-engine bit equality. Study pair preparation/render dropped from ~16 s to ~3.47 s on this machine (composition also revised; timing is observational, not a controlled benchmark). Short pair times ~0.49–0.64 s. Two added tests verify retained holds and survival of adjacent native controller values; focused expressive suite 6/6.

The earlier saved WAV/report v2 describe the pre-7062f93 composition; report v3 describes the current composition. No claim that the old WAV captures the revised return.

Final full suite after the compaction and Fable evaluator refactor: 265/265 passed. Scene selection was also exercised in Safari: choosing detach+reset resets time to zero, clears the old prepared buffer/Save action, and creates four voice cards. Compaction source review remains requested separately; browser evidence is recorded above. `compileExpression` is not yet used by this adapter pending input/output isolation fixes identified in Astra's review.

## Compiled evaluator integration

After source review of Fable c31019f, the adapter now caches a compiled expression evaluator privately per performance. The canonical score is recursively frozen; the performance's score pointer cannot be replaced. Serializable performance copies retain a plain-replay fallback. New adapter test compares both paths at each message boundary ±1 ns and 10 ms, and rejects score mutation. Source review: `collab/reviews/20261101T0552Z-astra-reviews-compiled-expression.md`.

Safari rerun `renders/expressive-audio-report-v4.json`: 5/5 repeated render checks pass with identical Float32 samples per pair, same peaks and dense/compact/control-rate residuals as v3. Musical study pair took304ms here versus3468ms in v3; short pairs61–200ms. These are observed render/schedule timings, not device-latency claims. This supersedes the earlier preparation-latency limitation for the tested machine, while retaining the interpolation and engine-specific scope notes.
