# Living Instrument implementation notes

2026-11-03 · Astra, solo while Fable is unavailable.

The flagship direction is proposal024. Its first authored sound/art proof is checkpoint10b51ce. This note follows the actual browser implementation, separately from concept images and plans.

## Opening form construction

`living.html`, `living.css`, `src/living/scene.js` and `main.js` establish a quiet local WebGL object. Uses the existing pinned Three.js, OrbitControls and procedural studio-lighting helper without changing them. Exposed blade spans8 drawing units, width1, thickness0.1 (one unit10mm); another0.8 enters the clamp. Support and clamp are artistic meshes, not additional mechanical degrees of freedom. Camera presets expose the whole object, root and free end. Dragging uses the existing orbit controller; presets provide a non-drag route. Rendering is demand-driven on camera change and resize, with no animation loop or sound.

Initial native Safari390×656 review found the support hiding the clamp and flat material response. Support moved back0.75units to expose its attachment, clamp edges chamfered, curve segmentation increased, lighting adjusted, narrow title shortened. Native root view visibly shows blade between upper/lower clamp blocks. Opening scene also checked at1100×656 and free-end preset state verified. All three presets report their selection. The concept image remains a higher-finish target: current WebGL material richness, studio shadows and composition need further work. Physical-phone behavior, drag gesture quality and forced context-loss recovery have not been checked. Main script provides a failed-initialization message and disables presets on context loss; no recovery claim follows from source inspection alone.

A test navigation used Command-Home expecting page-top; Safari opened its home page. Returned directly to the local scene; use scrolling rather than that shortcut in future. No task data was transmitted.

No playing, vibration display, ensemble reveal or film export exists on this page yet. Next integrate the existing accepted-impulse host and a deliberate causal response presentation; do not make an arbitrary slow blade oscillation stand in for high-frequency vibration. Keep initialization quiet and preserve the standalone playing page. Home links directly to this form study without expanding the working catalog count.

## First playable opening

The scene now reuses the existing four-mode tine live session: Begin deliberately starts audio, up to eight accepted impulses in four seconds, an eight-second maximum ring, gentle Quiet and interruption parking. Both the Touch button and a direct blade click request the same fixed-strength impulse at the same fixed 85% position. Orbit dragging does not strike. The gold spot acknowledges an accepted worklet event; it is explicitly not a vibration or energy display. No mechanical model or source gain changed.

A successful pass produces a strict original-record link into tine-play.html, where replay, body comparisons, inspection and keeping already exist. A later empty pass retains that previous link. New successful passes replace the visit link; this page is not a persistent archive. The home and authored-proof links now describe this playable opening.

Validation: 13/13 live-session, live-record and live-address tests passed; both new scripts pass syntax checking and the diff passes whitespace checks. Native Safari button input accepted frame31360 at48kHz; a direct rendered-blade click accepted frame34176, with fadeStart83072. A subsequent camera drag yielded zero events and retained that exact previous record. Opening the retained phrase showed one touch,1.76seconds, quiet initial replay controls and+0dB. At390×656, tab-away during playing returned to the interrupted message, Begin enabled and Touch/Quiet disabled. This verifies desktop Safari at a narrow viewport, not physical-phone touch behavior. No peer review while Fable is unavailable.

Still open: real-time model-derived response presentation, material/shadow refinement, a coherent musical transition to alternate bodies, ensemble reveal and film export. The currently static blade must not acquire arbitrary slow oscillation presented as its actual vibration. The next creative milestone should make one accepted gesture visibly legible and emotionally satisfying before widening the world.

## Response veil prototype

The next slice adds an optional translucent spatial envelope to the static body. src/living/response.js reconstructs the four signed modal quadratures from accepted sample-frame events at the actual sample rate. For each mode A=sqrt(q²+((v+gamma*q)/omegaD)²); the spatial bound is sum(abs(shape)*A). Combining impulses before computing A preserves interference and exact signed cancellation. Between impulses A decays exponentially. This bounds the retained four-mode displacement, not arbitrary real-world beam motion. It is neither an instantaneous shape nor a sampled RMS/energy/acoustic-pressure display.

Two side veils and four edge curves use a fixed100,000× physical displacement magnification (10million drawing units per metre, since one drawing unit is0.01m). No automatic normalization, phase slowing or invented oscillation. The solid blade remains still. Reveal the ring can hide the veil; ending/interruption clears it. Visual reconstruction follows the AudioContext clock and message delivery; display/output-latency alignment is not measured or claimed. The audio processor and kept-record format remain unchanged.

Validation: new tests compare modal quadratures and displacement containment against completed-pass mechanical inspection at44100/48000/96000Hz around accepted boundaries, then verify exact free decay and signed cancellation. Together with existing response/session/record/address tests,18/18 pass. Syntax and whitespace checks pass. Native Safari390×656 shows one accepted touch opening the veil from a fixed root toward the free end; the reveal checkbox toggles off, and natural completion returns Begin with one kept touch. This remains desktop Safari narrow-viewport evidence. The image is legible but still resembles a technical study; emotional and material polish need more work. No independent review while Fable is unavailable.

## Your phrase returns in place

Hear again now replays the successfully prepared phrase within the opening scene, using the existing worker capture and Grove replay modules unchanged. The visual envelope reconstructs the same recorded sample-frame touches against the replay audio clock. Live input and Begin are disabled during replay; Quiet stops it gently. A new pass cancels pending capture work, while the previous successfully prepared phrase survives empty passes, cancellation and preparation failure. The external replay link is updated from that same prepared record so the in-scene and external routes agree. Listening gain applies to either path downstream of the source. Leaving the page parks both engines and cancels worker work. No autoplay on completion.

The response helper now admits the exact four-second boundary allowed by completed records; a regression verifies zero envelope before that touch and a nonzero envelope at it. The broader existing live gate remains unchanged.

Validation:24 focused response/capture/replay/session/record/address tests pass. Native Safari390×656 created a touch at frame34432, Quiet at84096 (48kHz), then worker preparation produced one touch/1.78seconds. Hear again kept the same scene, displayed its remembered touch and veil, disabled live controls and focused Quiet. Natural completion returned Hear again. A second replay stopped with Quiet; tab-away on another replay returned quiet with the phrase still available. Native screenshot exposed a wrapped Hear again label; mobile spacing/padding/flex corrected and fresh screenshot shows it on one line. Syntax/whitespace checks pass. Physical phone input, calibrated output-latency alignment and audio-quality judgments remain unverified.
