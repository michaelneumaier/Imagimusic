// The inverse workshop's one shared listening gesture: "One touch, then two" (body 2, then bodies 1 and 3 together). Bodies are named by
// number, not by place: in the drawn scene body 1 sits front and centre and the triangle has no middle, so "middle" would mislead. The same bodies, impulse and timing on any fitted or kept
// anatomy, so what changes between anatomies is the anatomy. Authored events only; the page schedules them on the audio clock from one
// explicit choice after Start listening, and they never become the visitor's last-touch comparison. Pacing is an authored choice (half a
// second), not a beat match: the default target's slowest beats are 2.34 Hz (0.427 s) and 1.04 Hz (0.96 s).
export const INVERSE_GESTURE_KIND = 'imagimusic-inverse-gesture';
export const INVERSE_GESTURE_VERSION = 1;
export const INVERSE_GESTURE_MAX_EVENTS = 8;        // the transport's overlap cap
export const INVERSE_GESTURE_MAX_SPAN_SECONDS = 8;  // between the first and the last authored touch

const deepFreeze = v => { if (v && typeof v === 'object') { for (const k of Object.keys(v)) deepFreeze(v[k]); Object.freeze(v); } return v; };

/** Bodies are 0-based (body 2 of the page is index 1). Offsets are seconds from the gesture's first touch. */
export const INVERSE_SHARED_GESTURE = deepFreeze({
  kind: INVERSE_GESTURE_KIND, version: INVERSE_GESTURE_VERSION,
  id: 'one-touch-then-two', title: 'One touch, then two',
  events: [{ body: 1, offsetSeconds: 0 }, { body: 0, offsetSeconds: 0.5 }, { body: 2, offsetSeconds: 0.5 }],
  spanSeconds: 0.5,
  rationale: 'Body 2 is not a pickup, so its touch is heard only through its connections; then bodies 1 and 3 are struck together and the whole instrument settles. The half-second pacing is an authored choice.',
  invitation: 'Hear a gesture: body 2, then bodies 1 and 3 together. About twenty seconds to settle, or choose Quiet.',
});

/** The shared core: 1..8 events, bodies 0..2, offsets finite within 0..8 s, first at 0, non-decreasing, no holes; returns the last offset.
 * `offsetKey` names the time field ('offsetSeconds' for a gesture, 'at' for a phrase). */
export function validateTouchEvents(events, { what = 'events', offsetKey = 'offsetSeconds', maxEvents = INVERSE_GESTURE_MAX_EVENTS, maxSpanSeconds = INVERSE_GESTURE_MAX_SPAN_SECONDS } = {}) {
  const fail = m => { throw new Error(`${what}: ${m}`); };
  if (!Array.isArray(events) || events.length < 1 || events.length > maxEvents) fail(`events must be 1..${maxEvents}.`);
  let last = 0;
  for (let i = 0; i < events.length; i++) {                           // indexed, so a sparse array (holes) cannot pass: forEach would skip holes
    if (!Object.hasOwn(events, i)) fail(`event ${i} is missing (sparse events are refused).`);
    const e = events[i];
    if (!e || typeof e !== 'object' || Object.keys(e).sort().join() !== ['body', offsetKey].sort().join()) fail(`event ${i} must have exactly body and ${offsetKey}.`);
    if (![0, 1, 2].includes(e.body)) fail(`event ${i}: body must be 0, 1 or 2.`);
    const t = e[offsetKey];
    if (typeof t !== 'number' || !Number.isFinite(t) || t < 0 || t > maxSpanSeconds) fail(`event ${i}: offset must be within 0..${maxSpanSeconds} s.`);
    if (i === 0 && t !== 0) fail('the first event must be at offset 0.');
    if (t < last) fail(`event ${i}: offsets must not decrease.`);
    last = t;
  }
  return last;
}

/** Shape and bounds of a gesture: kind and version, the shared event rules, span consistent. */
export function validateInverseGesture(g) {
  const fail = m => { throw new Error(`Inverse gesture: ${m}`); };
  if (!g || typeof g !== 'object') fail('must be an object.');
  if (g.kind !== INVERSE_GESTURE_KIND || g.version !== INVERSE_GESTURE_VERSION) fail(`kind must be ${INVERSE_GESTURE_KIND} v${INVERSE_GESTURE_VERSION}.`);
  const last = validateTouchEvents(g.events, { what: 'Inverse gesture', offsetKey: 'offsetSeconds' });
  if (g.spanSeconds !== last) fail('spanSeconds must equal the last offset.');
  return g;
}
/** The gesture as the transport's playGesture takes it: frozen [{ body, at }] with `at` in seconds from the first touch. */
export function inverseGestureTransportEvents(gesture = INVERSE_SHARED_GESTURE) {
  return deepFreeze(validateInverseGesture(gesture).events.map(e => ({ body: e.body, at: e.offsetSeconds })));
}
validateInverseGesture(INVERSE_SHARED_GESTURE);
/** The same events as a bare frozen array, the name Astra's page and harness consume. */
export const INVERSE_SHARED_GESTURE_EVENTS = inverseGestureTransportEvents();

