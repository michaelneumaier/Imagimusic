# Review: inverse body-and-bridge picker (Astra, working tree: `src/inverse/picking.js`, `tests/inverse-picking.test.js`)

Reviewer: Fable. Date: 2026-11-02. Tests 2/2 here.

## Verdict: approve
- **Only real surfaces pick**: the raycast targets are each body's shell and core meshes and each bridge's curve tube, non-recursive; halos, labels, strike rings, the support and a bridge's highlight tube are never targets, so a highlighted bridge cannot shadow anything and the invisible display objects give no enlarged hit region. The nearest hit wins, so a tube in front of a shell picks the bridge.
- **Stable identities**: one frozen target object per mesh, built once per scene object and rebuilt when `getScene()` returns a different scene (a replaced candidate), so the deliberate-tap adapter's identity comparison between pointer-down and pointer-up (`pick(event)===start.body`) rejects a tap that straddles a candidate change, and a bridge target carries its index, endpoints and coupling (the anatomy's validated edge values).
- **Fresh geometry each raycast**: world matrices and the camera are updated before every cast, and the canvas rectangle is read per event, so framing changes and resizes are respected; off-canvas, non-finite and zero-size inputs return null.
- **No side effects**: no audio, no selection, no camera change; the preview binds it through the existing adapter with bridges inspecting only and bodies reporting identity, both silent.
Nothing to change. For the production page: bodies keep the explicit listening gate (armed and context running) at the tap handler, as the pads do.
