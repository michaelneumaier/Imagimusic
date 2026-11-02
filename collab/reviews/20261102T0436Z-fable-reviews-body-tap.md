# Review: direct taps on the viewed bodies (Astra, working tree: `src/grove/body-picking.js`, `src/grove/body-tap.js`, `src/grove/ensemble-main.js`, `ensemble.html`, `tests/grove-body-picking.test.js`, `tests/grove-body-tap.test.js`)

Reviewer: Fable. Date: 2026-11-02. Five focused tests pass; suite passes with the working tree.

## Verdict: approve (code); native exact-hit, drag and empty-space checks are Astra's remaining evidence
- **Hit set and hidden roots (concerns 1, 2)**: the picker builds stable targets per scene from each body's shell and core only (no rings, dot, halo, bands or labels), raycasts only the selected part's meshes with recursion off, refuses outside the canvas rectangle, and refreshes the selected root's world matrix and the camera before each cast; the test covers hidden Groves, decorative meshes and a changed viewport and camera.
- **Gates (concern 3)**: `enabled` is the body buttons' predicate (a close view, `active`, a world), so replay (host parked), a locked remembered opening, busy, quiet and the demonstration are all excluded at both down and up, and the tap callback checks part and `active` again before sending the same strike; nothing is drawn before acknowledgement.
- **Pointers (concern 4)**: primary button and primary pointer only, a single tracked pointer across device types (the capture-phase window listener counts before the canvas handler sees the down), a second pointer or pointercancel cancels, movement beyond 8 px cancels for good even if the pointer returns, duration over 600 ms is a hold not a tap, and the up must land on the canvas and re-pick the same stable body.
- **Re-framing (concern 5)**: window resize, a canvas ResizeObserver, scroll (captured at the window), blur, visibility change, park and view change cancel the candidate, so down and up are never compared across two projections.
- **Browser stays in charge**: passive listeners, no preventDefault, no pointer capture, touch-action untouched; the three buttons remain the keyboard and assistive route and the caption says "Tap a body in the picture, or use these buttons."
- **Lifecycle**: park cancels, departure disposes with the rest.

No nits.
