// Conservative, state-independent world bounds of the expressive choir row and of one selected voice, for a camera-only close view.
// The box is measured once from an actual choir body posed at the extremes of every display mapping (bellows fill 0 and 1, iris
// aperture 0 and 1, pitch lever ±0.65, chamber scale 0.9 and 1.1, detached halo), so no state-dependent zoom or breathing can follow.
import { Box3, Vector3 } from '../../vendor/three/build/three.module.js';
import { createExpressionScene, applyExpressionScene } from './scene.js';

export const VOICE_SPACING = 2.25;                       // scene.js: body i at x = (i − (count − 1) / 2) × 2.25
export const VIEW_BOUNDS_PADDING = 0.08;                // beyond the measured extremes, for antialiasing and line widths
export const RESPONSE_EXTREMES = Object.freeze([
  { fill: 0, aperture: 0, level: 0, pitchLever: -0.65, resonanceScale: 0.9, active: true, detached: false },
  { fill: 1, aperture: 1, level: 1, pitchLever: 0.65, resonanceScale: 1.1, active: true, detached: true },
  { fill: 0, aperture: 1, level: 1, pitchLever: 0.65, resonanceScale: 0.9, active: true, detached: false },
  { fill: 1, aperture: 0, level: 0, pitchLever: -0.65, resonanceScale: 1.1, active: false, detached: false },
]);

let localBounds = null;
/** The union of one body's bounds across the response extremes, in the body's own frame (position 0). Computed once. */
export function voiceLocalBounds() {
  if (localBounds) return localBounds.clone();
  const scene = createExpressionScene(1), union = new Box3();
  for (const state of RESPONSE_EXTREMES) {
    applyExpressionScene({ bodies: [{ voiceId: 0, ...state }] }, scene);
    scene.bodies[0].fastArc.visible = true;              // the lever's travel arc, even though the display hides it
    scene.root.updateMatrixWorld(true);
    union.union(new Box3().setFromObject(scene.bodies[0].root));
  }
  union.expandByScalar(VIEW_BOUNDS_PADDING);
  localBounds = union; return union.clone();
}

/** World bounds of the row of `count` voices, or of the selected voice (0..count-1) alone; the row sits at the scene root's origin. */
export function expressionViewBounds(count, selected = null) {
  if (!Number.isInteger(count) || count < 1 || count > 64) throw new Error('expressionViewBounds needs a voice count of 1..64.');
  if (selected !== null && (!Number.isInteger(selected) || selected < 0 || selected >= count)) throw new Error('selected must be null or an integer 0..count-1.');
  const local = voiceLocalBounds(), at = i => local.clone().translate(new Vector3((i - (count - 1) / 2) * VOICE_SPACING, 0, 0));
  if (selected !== null) return at(selected);
  const row = at(0); for (let i = 1; i < count; i++) row.union(at(i)); return row;
}
