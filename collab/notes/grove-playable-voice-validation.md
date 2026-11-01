# Optional playable Grove voice · Astra · 2026-11-01

The Grove retains Original as its default. `grove.html?seed=3&voice=partials` opens an optional three-partial-per-body exploration built from Fable's shared `createGroveVoice` factory. The nine normal modes are coupled beam-family coordinates with assigned classical damping, not a finite-element model of the pictured shells. The scene shows the coherent low band below 1.5 times the lowest body tuning.

There are three discrete strike zones (.3, .6, 1), with one pickup scale and output gain shared across every zone and body. Shell position increases downward toward the visible lower bridge attachment. The pending gesture ring follows that same convention. Pads and keyboard use the explicit position selector; direct shell hits choose the nearest zone. The shell mapping remains an artistic control map. The three-position normalization can differ from the single-position A/B study's normalization.

## Verification

- Full Node suite: 311/311 passed; after the orientation assertion was strengthened, all four picking/interaction tests passed again.
- Safari 26.6.2: `tests/grove-voice-audio.html`, six OfflineAudioContext cases (seeds 3/7/11; 48 kHz and 44.1 kHz; complete tails and Quiet endings). Authored gestures alternate all three positions. Maximum browser-scheduler versus saved-mix difference: 7.450580596923828e-9. Maximum repeated-render difference: the same. Maximum absolute peak: 0.06133146211504936. Report: ignored `renders/grove-voice-audio-report.json`.
- Actual Safari keyboard/pad capture at 48 kHz: middle on body 1 and bridge tip on body 2, then Quiet, WAV/JSON save, Listen back, and natural replay completion. Rebuilding the complete saved WAV from JSON plus the shared factory yielded byte-identical 2,208,300-byte output. Evidence: ignored `renders/grove-voice-first-play.json` and `.wav`.
- Safari responsive viewport 320 × 656: voice selector, scene, strike-position selector, pads and replay/save controls fit the width and remain scrollable. This is desktop responsive inspection, not iOS or physical multitouch validation.
- Fable reviewed routing, adapters, shared-basis renderer and page. The final page approval followed verification of the downward-toward-bridge orientation (`20261101T063114Z` mailbox response; review commit 4bacc10).

## Cost and limits

Seed 3 at 48 kHz produces nine stereo PCM responses occupying 66,143,592 bytes. Browser AudioBuffers require additional storage. Sharing the nine time-dependent modal basis values across all output channels reduced measured local Node preparation from 12,085.5 ms to 2,553.6 ms; these are individual local measurements, not mobile performance guarantees. Independent analytic samples agree within 1e-8. The browser six-case evidence uses the optimized renderer.

No subjective listening-quality judgment, speaker recording, measured shell acoustics, continuous strike-position interpolation, nonlinear contact, or altered-consciousness claim is made. Captures use the separate `imagimusic-grove-voice` format with full grove and voice configuration, sample-frame events and derived position/buffer fields. Import is not implemented.
