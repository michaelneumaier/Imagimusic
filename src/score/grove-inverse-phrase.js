// A visitor's phrase on an inverse anatomy: the touches the transport actually admitted, timed by the audio clock's scheduling receipts, never
// by pointer events. Page memory first (no file); a record kind that embeds the anatomy comes later and separately. The phrase holds touches
// only: replay ends with the model's natural tail, and nothing says how the visitor stopped. The authored gesture keeps its own kind; a phrase
// is always source "visitor", so the two cannot be confused.
import { validateTouchEvents, INVERSE_GESTURE_MAX_EVENTS, INVERSE_GESTURE_MAX_SPAN_SECONDS } from './grove-inverse-gesture.js';
import { INVERSE_IMPULSE_NS } from '../inverse/instrument.js';

export const INVERSE_PHRASE_KIND = 'imagimusic-inverse-phrase';
export const INVERSE_PHRASE_VERSION = 1;
export const INVERSE_PHRASE_MAX_TOUCHES = INVERSE_GESTURE_MAX_EVENTS;
export const INVERSE_PHRASE_MAX_SPAN_SECONDS = INVERSE_GESTURE_MAX_SPAN_SECONDS;
export const INVERSE_PHRASE_SAMPLE_RATES = Object.freeze([8000, 96000]);   // the inverse instrument's own integer bounds

const fail = m => { throw new Error(`Inverse phrase: ${m}`); };
const validRate = r => Number.isInteger(r) && r >= INVERSE_PHRASE_SAMPLE_RATES[0] && r <= INVERSE_PHRASE_SAMPLE_RATES[1];
const isoTime = v => typeof v === 'string' && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString() === v;
const deepFreeze = v => { if (v && typeof v === 'object') { for (const k of Object.keys(v)) deepFreeze(v[k]); Object.freeze(v); } return v; };

/** From the transport's receipts ({ body, time } in audio-clock seconds, in admission order) to a frozen phrase; `at` is the ISO capture time. Times become offsets from the
 * first receipt, rounded to the sample period of the capture context so replay at that rate lands on the same frames. Refuses more than eight
 * touches, a span over eight seconds, times that go backwards, or anything that is not a receipt. */
export function createInversePhrase(receipts, { at, sampleRate } = {}) {
  const capturedAt = at;
  if (!Array.isArray(receipts) || receipts.length < 1 || receipts.length > INVERSE_PHRASE_MAX_TOUCHES) fail(`a phrase holds 1..${INVERSE_PHRASE_MAX_TOUCHES} admitted touches.`);
  if (!validRate(sampleRate)) fail(`sampleRate must be an integer within ${INVERSE_PHRASE_SAMPLE_RATES[0]}..${INVERSE_PHRASE_SAMPLE_RATES[1]}.`);
  if (!isoTime(capturedAt)) fail('capturedAt must be an ISO-8601 UTC time of the form YYYY-MM-DDTHH:MM:SS.sssZ.');
  for (let i = 0; i < receipts.length; i++) {
    if (!Object.hasOwn(receipts, i)) fail(`receipt ${i} is missing.`);
    const r = receipts[i];
    if (!r || typeof r !== 'object' || Array.isArray(r) || Object.keys(r).sort().join() !== 'body,time') fail(`receipt ${i} must be a transport receipt with exactly body and time.`);
    if (!Number.isInteger(r.body) || r.body < 0 || r.body > 2) fail(`receipt ${i}: body must be 0, 1 or 2.`);
    if (typeof r.time !== 'number' || !Number.isFinite(r.time) || r.time < 0) fail(`receipt ${i}: time must be a finite non-negative audio-clock time.`);
    if (i && r.time < receipts[i - 1].time) fail(`receipt ${i} is earlier than the one before it.`);
  }
  const origin = receipts[0].time;
  if (receipts[receipts.length - 1].time - origin > INVERSE_PHRASE_MAX_SPAN_SECONDS) fail(`a phrase spans at most ${INVERSE_PHRASE_MAX_SPAN_SECONDS} s between its first and last touch (checked before rounding).`);
  const events = receipts.map(r => ({ body: r.body, at: Math.round((r.time - origin) * sampleRate) / sampleRate }));
  const phrase = { kind: INVERSE_PHRASE_KIND, version: INVERSE_PHRASE_VERSION, source: 'visitor', events, spanSeconds: events[events.length - 1].at, impulseNs: INVERSE_IMPULSE_NS, sampleRate, capturedAt };
  return deepFreeze(validateInversePhrase(phrase));
}

/** Own fields exactly; source visitor; the shared touch rules; span consistent; the instrument's impulse; an integer rate within the instrument's bounds; every offset on that rate's sample grid; an exact ISO time. */
export function validateInversePhrase(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) fail('must be an object.');
  const keys = Object.keys(p).sort().join(), expected = ['kind', 'version', 'source', 'events', 'spanSeconds', 'impulseNs', 'sampleRate', 'capturedAt'].sort().join();
  if (keys !== expected) fail(`must have exactly the fields ${expected.split(',').join(', ')} (got ${keys || 'none'}).`);
  if (p.kind !== INVERSE_PHRASE_KIND || p.version !== INVERSE_PHRASE_VERSION) fail(`kind must be ${INVERSE_PHRASE_KIND} v${INVERSE_PHRASE_VERSION}.`);
  if (p.source !== 'visitor') fail('source must be "visitor"; the authored gesture keeps its own kind.');
  const last = validateTouchEvents(p.events, { what: 'Inverse phrase', offsetKey: 'at', maxEvents: INVERSE_PHRASE_MAX_TOUCHES, maxSpanSeconds: INVERSE_PHRASE_MAX_SPAN_SECONDS });
  if (p.spanSeconds !== last) fail('spanSeconds must equal the last offset.');
  if (p.impulseNs !== INVERSE_IMPULSE_NS) fail(`impulseNs must equal the instrument's fixed impulse ${INVERSE_IMPULSE_NS}; a phrase from another impulse is refused rather than rescaled.`);
  if (!validRate(p.sampleRate)) fail(`sampleRate must be an integer within ${INVERSE_PHRASE_SAMPLE_RATES[0]}..${INVERSE_PHRASE_SAMPLE_RATES[1]}.`);
  for (let i = 0; i < p.events.length; i++) if (Math.round(p.events[i].at * p.sampleRate) / p.sampleRate !== p.events[i].at) fail(`event ${i}: at must lie on the declared sample grid (${p.sampleRate} Hz).`);
  if (!isoTime(p.capturedAt)) fail('capturedAt must be an ISO-8601 UTC time of the form YYYY-MM-DDTHH:MM:SS.sssZ.');
  return p;
}

/** The phrase as the transport's playGesture takes it: frozen [{ body, at }]. */
export function inversePhraseTransportEvents(phrase) {
  return deepFreeze(validateInversePhrase(phrase).events.map(e => ({ body: e.body, at: e.at })));
}

/** Earlier name of createInversePhrase, kept so both spellings resolve to one function. */
export const phraseFromReceipts = createInversePhrase;
