# Inverse spatial preview — 2026-11-02

A silent prototype now draws the workshop's actual fitted chain and triangle through the Grove visual vocabulary: `tests/inverse-anatomy-preview.html`. It searches the same rounded seed-3 target, with the same fixed-base/seed/budget contract, and builds the three-mass instrument for response frames. It creates no AudioContext and changes no sound model.

`src/inverse/picture.js` sums active strike envelopes at one fixed gain of 1800 and caps the display level at 1. Width is 1 + 0.14×level, halo opacity 0.15 + 0.65×level, shell emission 0.025 + 0.5×level, core emission 0.1 + level. Reduced motion holds width at 1. Marks retain actual body/age but sit at the midpoint because this model has no strike-position dimension. Silent input restores the baseline; no candidate or neighbour is normalized separately. Two focused tests pass against actual instrument frames, overlap, silent/reset, reduced motion, display saturation and malformed input.

`src/inverse/scene.js` reuses the existing shells, supports and bridges, with no partial bands or hand controls. It preserves the existing artistic bridge radius 0.012 + 0.04×sqrt(coupling/0.04), mass-to-volume and tuning-to-aspect mappings. These forms do not simulate hollow acoustic shells. Fixed bounds include maximum widening and maximum touch-ring extent; a 0.35-unit margin surrounds them. Fable independently checked containment with three largest rings for seeds 3, 7 and 11 and approved the mapping/bounds in `collab/reviews/20261102T0720Z-fable-reviews-inverse-anatomy-preview.md`.

## Native findings

The first preview needed its local Three.js import map. After that, the candidates prepared but canvases remained blank until explicit rendering was added. The final frozen-state diagnostic renders on preparation, selection, resize and return, using ResizeObserver rather than a continuous animation loop. This is a static diagnostic and does not establish the eventual live-loop behavior. Current buffer dimensions and draw calls are exposed in the diagnostic captions.

Native Safari at 320×656 showed the fitted chain at rest and triangle at the artificial maximum display state; the support, shells, labels and connections were visible and contained. At 1000×656 the two maximum-state views rendered side by side without clipping their instrument structures. The stage floor is decorative and extends beyond the view. The artificial maximum is expressly labelled a framing fixture, not a measured response.

The narrow view is legible as an overview, but its full support frame makes the bodies small as direct touch targets. That is a design finding, not a shipping endorsement. Before integration, explore a closer body-and-connection view or retain the whole-instrument overview with an explicit close view and accessible numbered strike controls. Preserve fixed framing over a ring; do not chase the moving response with the camera.

## Next

The production inverse workshop is unchanged. The next slice is a transactional spatial mount, retaining its previous instrument/view if preparation fails, direct body taps through the explicit listening gate, and bridge inspection that highlights a connection without scheduling a strike. A repeated-touch invitation can then help compare the same gesture across fitted candidates. Native touch, resize, reduced-motion and live-loop checks remain required. No claim about appeal, device output or acoustic-body recovery follows from this preview.

## Closer framing and selection checkpoint

The preview now offers a fixed body-and-connections view, three individual body views, and the two connections shared by both fitted candidates. Fable supplied `src/inverse/focus-bounds.js` in 9ac4951; it measures the forms at maximum widening before their silent reset, includes the halo, label and largest touch mark, and pads each final box once. A connection view contains both endpoint bodies and its actual curve. Other bodies and ornamental supports may be cropped, as the preview states. These bounds assume the current identity scene root.

The combined bounds/picker/focus suite passes 6/6. The playing-bounds test covers five generated seeds, maximum response geometry and four camera aspects. Fable approved the playing bounds and picker in the 0720Z and 0730Z spatial reviews. The picker targets real shell/core meshes and bridge tubes, with stable identities per scene; ornaments cannot take a hit. The existing deliberate-tap adapter reports body identity or highlights a connection, with no audio side effects.

Additional native Safari inspection: the closer overall chain at its artificial limit fits at 320×656; the rest view renders at 1000×656. At 320×656 the body-1 close-up visibly enlarges the body and retains its floor halo while cropping the neighbour. This is a more useful inspection scale. Native coordinate tap attempts failed with the automation service's `noWindowsAvailable` error while accessibility reads continued to work. Actual pointer selection is therefore **not yet native-verified**; automated raycast tests and source review do not substitute for it. Connection close-up, remaining body views and live production integration still need native checks.
