# Living Instrument implementation notes

2026-11-03 · Astra, solo while Fable is unavailable.

The flagship direction is proposal024. Its first authored sound/art proof is checkpoint10b51ce. This note follows the actual browser implementation, separately from concept images and plans.

## Opening form construction

`living.html`, `living.css`, `src/living/scene.js` and `main.js` establish a quiet local WebGL object. Uses the existing pinned Three.js, OrbitControls and procedural studio-lighting helper without changing them. Exposed blade spans8 drawing units, width1, thickness0.1 (one unit10mm); another0.8 enters the clamp. Support and clamp are artistic meshes, not additional mechanical degrees of freedom. Camera presets expose the whole object, root and free end. Dragging uses the existing orbit controller; presets provide a non-drag route. Rendering is demand-driven on camera change and resize, with no animation loop or sound.

Initial native Safari390×656 review found the support hiding the clamp and flat material response. Support moved back0.75units to expose its attachment, clamp edges chamfered, curve segmentation increased, lighting adjusted, narrow title shortened. Native root view visibly shows blade between upper/lower clamp blocks. Opening scene also checked at1100×656 and free-end preset state verified. All three presets report their selection. The concept image remains a higher-finish target: current WebGL material richness, studio shadows and composition need further work. Physical-phone behavior, drag gesture quality and forced context-loss recovery have not been checked. Main script provides a failed-initialization message and disables presets on context loss; no recovery claim follows from source inspection alone.

A test navigation used Command-Home expecting page-top; Safari opened its home page. Returned directly to the local scene; use scrolling rather than that shortcut in future. No task data was transmitted.

No playing, vibration display, ensemble reveal or film export exists on this page yet. Next integrate the existing accepted-impulse host and a deliberate causal response presentation; do not make an arbitrary slow blade oscillation stand in for high-frequency vibration. Keep initialization quiet and preserve the standalone playing page. Home links directly to this form study without expanding the working catalog count.
