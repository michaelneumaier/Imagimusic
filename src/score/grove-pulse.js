// Proposal 023: an authored opening paced by the period between the instrument's two lowest modes, leaving the next entrance to the player (Fable).
// Pure score composition over the Rest model. No scheduled Quiet in the opening: the passage continues in the same capture until the player ends it.
// Reference delays come from isolated second-strike trials (measureSecondStrike); they are not outcomes of this cumulative phrase, which is why
// onPulseRecord renders and admits the phrase as its own history. No claim about what is heard.
import { REST_QUIET_FADE_SECONDS, REST_RECORD_KIND, REST_RECORD_VERSION, measureSecondStrike, validateRestAdmission } from './grove-rest.js';

export const PULSE_PHRASE_VERSION = 1;
/** The physical period is 1/(f₂ − f₁) of the two lowest low-band modes (the same period measureSecondStrike sweeps); the authored unit is that
 *  period, doubled once when it is shorter than minUnitSeconds (a 0.4 s count is fast), never more. The two are reported separately. */
export const PULSE_BOUNDS = Object.freeze({ minUnitSeconds: 0.6, maxOpeningSeconds: 12, minRingSeconds: 1, maxRingSeconds: 20 });

/** The opening: call (body a), answer on the measured reference delay (neighbour b), call again at three units. The expected next entrance
 *  (three units plus the reference delay) is stated, not scheduled. Commands carry exact frames at the recipe's sample rate and no Quiet. */
export function composeOnPulsePhrase(recipe, { body = 0, velocity = 0.6, steps = 12 } = {}) {
  if (!Number.isInteger(body) || body < 0 || body >= recipe.bodies) throw new Error('body must index the grove.');
  if (!Number.isFinite(velocity) || velocity <= 0 || velocity > 1) throw new Error('velocity must be in (0, 1].');
  const sr = recipe.sampleRate, ref = measureSecondStrike(recipe, { body, steps, velocity });
  const period = ref.beatPeriodSeconds, multiple = period < PULSE_BOUNDS.minUnitSeconds ? 2 : 1, unitSeconds = +(period * multiple).toFixed(3);
  const unitFrames = Math.round(unitSeconds * sr), returnFrame = 3 * unitFrames, answerFrame = ref.best.frame;
  if (answerFrame <= 0 || answerFrame >= returnFrame) throw new Error('the reference delay must fall between the call and its return.');
  const openingSeconds = +(returnFrame / sr).toFixed(3);
  if (openingSeconds > PULSE_BOUNDS.maxOpeningSeconds) throw new Error(`opening lasts ${openingSeconds} s; bound is ${PULSE_BOUNDS.maxOpeningSeconds} s.`);
  const position = 1;
  const commands = [
    { id: 'pulse-call', kind: 'strike', frame: 0, body, position, velocity },
    { id: 'pulse-answer', kind: 'strike', frame: answerFrame, body: ref.neighbor, position, velocity },
    { id: 'pulse-return', kind: 'strike', frame: returnFrame, body, position, velocity },
  ];
  const expectedEntranceFrame = returnFrame + answerFrame;
  const sections = [
    { id: 'call', frames: [0, answerFrame] }, { id: 'answer', frames: [answerFrame, returnFrame] }, { id: 'return', frames: [returnFrame, expectedEntranceFrame] },
    { id: 'yours', frames: [expectedEntranceFrame, null], open: true },
  ];
  return {
    version: PULSE_PHRASE_VERSION, body, neighbor: ref.neighbor, position, velocity, sampleRate: sr,
    physicalPeriodSeconds: period, pulseUnitSeconds: unitSeconds, referenceDelaySeconds: ref.best.delaySeconds, endFrame: returnFrame,
    reference: { beatPeriodSeconds: period, lowModesHz: ref.lowModesHz, delaySeconds: ref.best.delaySeconds, delayFrame: answerFrame, rangeDb: ref.rangeDb, steps,
      note: 'reference delay from isolated second-strike trials on a single ring (measureSecondStrike); a reference for placing the authored answer, not a measured outcome of this phrase, whose state is cumulative.' },
    unit: { seconds: unitSeconds, frames: unitFrames, multiple, reason: multiple === 2 ? `the modal swell period ${period} s is below ${PULSE_BOUNDS.minUnitSeconds} s, so the authored unit is two swells` : 'the authored unit is one modal swell period' },
    commands, lastCommandId: 'pulse-return', expectedEntranceFrame, expectedEntranceSeconds: +(expectedEntranceFrame / sr).toFixed(3), openingSeconds, sections,
    claims: 'the physical period and the reference delay are measured in the model; whether the period is heard as a count, and what an answer at any time is like, are not established and not claimed.',
  };
}

/** The phrase as a Rest record for offline audition: the opening, an optional authored answer, and an ending `ringSeconds` after the last strike.
 *  answer: null (opening alone), 'expected' (at the expected entrance), 'half' (half a unit later), or an exact frame after the return.
 *  Validated with the cumulative admission check, so the phrase is admitted as its own history, not by its isolated references. */
export function onPulseRecord(recipe, phrase, { answer = null, ringSeconds = 4 } = {}) {
  if (phrase?.version !== PULSE_PHRASE_VERSION || phrase.sampleRate !== recipe.sampleRate) throw new Error('phrase does not belong to this recipe.');
  if (!Number.isFinite(ringSeconds) || ringSeconds < PULSE_BOUNDS.minRingSeconds || ringSeconds > PULSE_BOUNDS.maxRingSeconds) throw new Error(`ringSeconds must be in ${PULSE_BOUNDS.minRingSeconds}..${PULSE_BOUNDS.maxRingSeconds}.`);
  const sr = recipe.sampleRate, events = phrase.commands.map((c, order) => ({ frame: c.frame, order, body: c.body, position: c.position, velocity: c.velocity }));
  let answerFrame = null;
  if (answer === 'expected') answerFrame = phrase.expectedEntranceFrame;
  else if (answer === 'half') answerFrame = phrase.expectedEntranceFrame + Math.round(phrase.unit.frames / 2);
  else if (answer !== null) { if (!Number.isInteger(answer) || answer <= phrase.commands.at(-1).frame) throw new Error('answer must be null, "expected", "half", or an integer frame after the return.'); answerFrame = answer; }
  if (answerFrame !== null) events.push({ frame: answerFrame, order: events.length, body: phrase.neighbor, position: phrase.position, velocity: phrase.velocity });
  const last = events.at(-1).frame, ended = { frame: last + Math.round(ringSeconds * sr), fadeFrames: Math.round(REST_QUIET_FADE_SECONDS * sr) };
  const record = { version: REST_RECORD_VERSION, kind: REST_RECORD_KIND, grove: recipe.grove, voice: recipe.voice, sampleRate: sr, outputGain: recipe.outputGain, zones: recipe.zones,
    strengths: recipe.strengths.map(st => ({ name: st.name, c: st.c })), events, contacts: [], ended };
  validateRestAdmission(record, recipe);
  return { record, answerFrame, seconds: +(ended.frame / sr + REST_QUIET_FADE_SECONDS).toFixed(3) };
}

/** Factual lines for a surface; no instruction to answer at a time, no judgment. The end cue is Astra's agreed wording. */
export function onPulsePrompt(phrase, sectionId) {
  const a = phrase.body + 1, b = phrase.neighbor + 1;
  switch (sectionId) {
    case 'call': return `Body ${a} is struck once. The count is this instrument's own: ${phrase.pulseUnitSeconds} s, ${phrase.unit.multiple === 2 ? 'twice' : 'once'} the period between its two lowest modes.`;
    case 'answer': return `Body ${b} answers at the measured reference delay, ${phrase.reference.delaySeconds} s after the call.`;
    case 'return': return `Body ${a} is struck again, three units after the first call.`;
    case 'yours': return 'The bodies are yours. Answer whenever, or let the ring finish.';
    default: throw new Error(`unknown section ${sectionId}.`);
  }
}
