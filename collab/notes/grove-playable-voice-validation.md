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

## Causal scene follow-up

The tendrils previously curved low but ended at the body centers. Their endpoints now explicitly meet the lower shell tips, matching the downward strike-position convention; their sag stays below both endpoints. Safari seed 7 was reloaded and visually inspected at 320 × 656. A separate warm ring projects recent recorded strike locations for live playing, authored greeting and replay; its .3-second decay uses event age, with no accumulated animation state. It remains an input cue, not a simulated traveling wave. Focused anatomy and cue tests pass (2/2). Fable's follow-up review was requested; no approval is claimed yet.

## Positional invitation

The richer voice now uses Fable's dedicated 15-strike greeting: the same body at upper, middle and bridge tip twice each; the neighbor answers; the third enters; a shared middle touch; silence. The page adapter preserves position and rounds only the audio-clock event time to sample frames. Original retains its own 12-strike recipe. All events are admitted for both voices across all three curated seeds at 44.1 and 48 kHz. Full suite: 314/314 passed.

The browser six-case harness now uses this actual positional greeting, rather than cycling positions over the earlier phrase. Safari 26.6.2: all six passed, maximum saved-mix and repeated-render difference both 7.450580596923828e-9; maximum absolute peak 0.04650016874074936. Report: ignored `renders/grove-voice-greeting-audio-report.json`, generated 2026-11-01T06:36:22.401Z. Earlier first-play and audio reports remain separate evidence.

Fable approved the bridge-endpoint and strike-marker slice in review 2dd3f8f, superseding the pending status above. Astra approved the three-position greeting recipe following its explicit exactly-three-position contract correction; review `collab/reviews/20261101T0637Z-astra-reviews-positional-greeting.md`.

Safari page flow additionally verified: Enter → Hear its greeting → “LET THE RESPONSE FINISH” → “THE GREETING HAS SETTLED” → save gestures → Your turn → keyboard A → Quiet. The downloaded `renders/grove-voice-greeting-capture.json` has all 15 frames/body/position/velocity fields exactly matching the authored plan. Fable approved the page adapter and integration in f55fc47. These checks verify interaction and scheduling, not subjective musical appeal.

## Direct greeting handoff · November 2

The authored greeting now exposes Your turn in the existing top action while its transport is ready/playing. This calls the existing fresh-passage operation: stop the authored sequence, clear its recording, and keep the instrument prepared for a visitor response. It is an explicit handoff, not automatic continuation or a mixture of authored and visitor events. Quiet still ends the example and exposes its listening/keeping controls. Suspended audio continues to use Resume; preparation remains disabled.

Why: native inspection found a visitor had to choose Quiet and then Your turn despite the invitation to hear a greeting and respond. Removing that intermediate step preserves agency and the separation of records while making the response easier to begin. No new control or audio-model change.

Native Brave, localhost:8081: Grove7 with partials → Enter → greeting showed enabled Your turn and disabled pads. Your turn enabled pads, disabled Quiet for the empty passage, restored Hear its greeting, and announced the visitor's turn. Body1 → Quiet exposed Listen back/Keep. Grove3 Original was checked separately: greeting → Your turn opened fresh pads; another greeting → Quiet still exposed Listen back, Your turn, Keep sound and Keep gestures. Browser audio state/controls were observed; no acoustic or preference judgment is claimed.

Targeted tests: 10/10 across touch transport and Grove greetings. New regression exercises a scheduled future authored strike, resets before it starts, verifies stop times precede that start, asserts an empty fresh recording, then admits only the visitor's body1/frame0/velocity.4 response with its source unstopped. Existing tests cover interruption/resume and both voice greeting schedules. Native OS audio interruption was not induced in this pass. Syntax and whitespace checks pass.

Peer review: Fable approved the exact implementation and regression in `collab/reviews/20261102T1039Z-fable-reviews-grove-greeting-handoff.md` (72d2918). The existing stop uses a short fade/30 ms source-stop interval; the handoff is not a sample-instant cutoff.
