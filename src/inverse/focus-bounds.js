// Static per-body and per-connection bounds for the inverse workshop's close framings. Called on a scene whose forms already sit at the
// maximum widening (the scene constructor measures that way) with world matrices updated; this helper mutates nothing and reads only.
// A body box holds its form, its floor halo, its label and the analytic largest midpoint touch ring; a connection box unions its two
// (unpadded) body boxes with the bridge's actual curve geometry. Padding is applied once, on each final box.
import { Box3, Vector3 } from '../../vendor/three/build/three.module.js';

export const FOCUS_PADDING = 0.35;
export const TOUCH_RING_RADIUS = 0.67 * 1.35;   // strike ring radius 0.65 plus its tube, at the marker's largest scale (age 0.3 s)
export const TOUCH_RING_HALF_HEIGHT = 0.03;     // the ring lies flat at the anchor's height for the midpoint position

const unpaddedBodyBox = body => {
  const box = new Box3();
  for (const part of [body.form, body.halo, body.label]) box.union(new Box3().setFromObject(part));
  const center = body.anchor.getWorldPosition(new Vector3());
  box.expandByPoint(center.clone().add(new Vector3(-TOUCH_RING_RADIUS, -TOUCH_RING_HALF_HEIGHT, -TOUCH_RING_RADIUS)));
  box.expandByPoint(center.clone().add(new Vector3(TOUCH_RING_RADIUS, TOUCH_RING_HALF_HEIGHT, TOUCH_RING_RADIUS)));
  return box;
};

/** { bodies: Box3[], bridges: [{ a, b, bounds }] } in world space; every box padded once by FOCUS_PADDING; nothing in the scene is changed. */
export function inverseFocusBounds(scene) {
  if (!scene || !Array.isArray(scene.bodies) || !Array.isArray(scene.bridges)) throw new Error('inverseFocusBounds needs a scene with bodies and bridges.');
  const raw = scene.bodies.map(unpaddedBodyBox);
  const bridges = scene.bridges.map(bridge => {
    const { a, b } = bridge.spec;
    if (!Number.isInteger(a) || !Number.isInteger(b) || !raw[a] || !raw[b]) throw new Error('bridge endpoints must index the scene\'s bodies.');
    const bounds = raw[a].clone().union(raw[b]).union(new Box3().setFromObject(bridge.curve));
    return { a, b, bounds: bounds.expandByScalar(FOCUS_PADDING) };
  });
  return { bodies: raw.map(box => box.clone().expandByScalar(FOCUS_PADDING)), bridges };
}
