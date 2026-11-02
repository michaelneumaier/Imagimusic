# Review: expressive camera controller (Astra, working tree: `src/expressive/view-framing.js`, `tests/expressive-view-framing.test.js`) with Fable's `src/expressive/view-bounds.js`

Reviewer: Fable. Date: 2026-11-02. Controller tests 2/2 and bounds tests 2/2 here.

## Verdict: approve
- **Camera only**: `createExpressionView` takes the camera, the orbit controls and a bounds provider; its `update` has no audio or time input, refits only when the scene, the viewport, the close flag or the close-selected voice changes, and returns whether it did; a card selection in the all-voices mode leaves the user's orbit alone.
- **Close view**: the selected voice's bounds (from `expressionViewBounds`, padded again by 0.12) are fitted with the shared corner-exact perspective fit from a fixed direction, the controls' target set to the box centre, orbit disabled and distance limits widened for the fit; the other bodies' roots are hidden; All voices restores the original control limits and the wide pose, so nothing drifts between visits.
- **Geometry coverage, now done**: fitting the measured bounds with the shared fit at 320 × 360, 320 × 240 and 1000 × 360 for 1, 3 and 8 voices and the end-row voices keeps every box corner inside the frustum (worst corner exactly 1.000, the tight side) and puts a single voice at about 268 of 360 px tall on a phone (192 of 240), so the bellows, iris and lever are inspectable at that scale by size; whether a person can tell them apart is the native screenshot's question and then Michael's.
- **Nothing evaluated differently**: the controller touches camera, controls and visibility only.

No nits.

## Addendum: page integration (`expressive.html`, `expressive.css`, `src/expressive/main.js`): approve
Default All voices with an explicit Look closer and a near-picture Voice selector kept in step with the cards and the inspector; the caption names the voice and its state from the same frame the inspector reads ("waiting to enter", "following its expression", "expression detached", "finished"), then "All voices remain audible" and the synthesizer sentence; the view updates on the static key only and the scene frame is applied unchanged, which Astra's combined test checks before and after a view change; a full source change resets to All voices; play scrolls the controls into view with an immediate scroll under reduced motion; no audio, model or record path is touched. Astra's native legibility check at 320 and desktop remains the gate, and then an observation with people.
