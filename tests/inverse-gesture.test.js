import test from 'node:test';
import assert from 'node:assert/strict';
import { INVERSE_SHARED_GESTURE, INVERSE_SHARED_GESTURE_EVENTS, validateInverseGesture, inverseGestureTransportEvents, INVERSE_GESTURE_MAX_EVENTS } from '../src/score/grove-inverse-gesture.js';

test('the shared gesture is frozen, authored as the middle then both ends, and within the transport bounds', () => {
  assert.ok(Object.isFrozen(INVERSE_SHARED_GESTURE) && Object.isFrozen(INVERSE_SHARED_GESTURE.events) && Object.isFrozen(INVERSE_SHARED_GESTURE.events[0]));
  assert.deepEqual(INVERSE_SHARED_GESTURE.events, [{ body: 1, offsetSeconds: 0 }, { body: 0, offsetSeconds: 0.5 }, { body: 2, offsetSeconds: 0.5 }]);
  assert.equal(INVERSE_SHARED_GESTURE.spanSeconds, 0.5); assert.ok(INVERSE_SHARED_GESTURE.events.length <= INVERSE_GESTURE_MAX_EVENTS);
  assert.equal(validateInverseGesture(INVERSE_SHARED_GESTURE), INVERSE_SHARED_GESTURE);
  assert.throws(() => { INVERSE_SHARED_GESTURE.events.push({ body: 0, offsetSeconds: 1 }); }, TypeError);
  const events = inverseGestureTransportEvents();
  assert.deepEqual(events, [{ body: 1, at: 0 }, { body: 0, at: 0.5 }, { body: 2, at: 0.5 }]); assert.ok(Object.isFrozen(events) && Object.isFrozen(events[0]));
  assert.deepEqual(INVERSE_SHARED_GESTURE_EVENTS, events); assert.ok(Object.isFrozen(INVERSE_SHARED_GESTURE_EVENTS) && Object.isFrozen(INVERSE_SHARED_GESTURE_EVENTS[2]));
});

test('validation refuses too many events, bad bodies, offsets out of range or decreasing, a late first event, extra fields and a wrong span', () => {
  const base = JSON.parse(JSON.stringify(INVERSE_SHARED_GESTURE));
  const withEvents = events => ({ ...base, events, spanSeconds: events.length ? events[events.length - 1].offsetSeconds : 0 });
  assert.throws(() => validateInverseGesture(withEvents(Array.from({ length: 9 }, (_, i) => ({ body: 0, offsetSeconds: i * 0.5 })))), /1\.\.8/);
  assert.throws(() => validateInverseGesture(withEvents([{ body: 3, offsetSeconds: 0 }])), /body must be/);
  assert.throws(() => validateInverseGesture(withEvents([{ body: 0, offsetSeconds: 0 }, { body: 1, offsetSeconds: 9 }])), /0\.\.8 s/);
  assert.throws(() => validateInverseGesture(withEvents([{ body: 0, offsetSeconds: 0 }, { body: 1, offsetSeconds: 1 }, { body: 2, offsetSeconds: 0.5 }])), /must not decrease/);
  assert.throws(() => validateInverseGesture(withEvents([{ body: 0, offsetSeconds: 0.2 }])), /first event/);
  assert.throws(() => validateInverseGesture(withEvents([{ body: 0, offsetSeconds: 0, velocity: 1 }])), /exactly body and offsetSeconds/);
  assert.throws(() => validateInverseGesture({ ...base, spanSeconds: 1 }), /spanSeconds/);
  assert.throws(() => validateInverseGesture({ ...base, kind: 'other' }), /kind must be/);
  assert.throws(() => validateInverseGesture({ ...base, events: new Array(3), spanSeconds: 0 }), /sparse events are refused/);
  const holed = [{ body: 1, offsetSeconds: 0 }, , { body: 2, offsetSeconds: 0.5 }]; assert.throws(() => validateInverseGesture({ ...base, events: holed, spanSeconds: 0.5 }), /event 1 is missing/);
});
