import test from 'node:test';
import assert from 'node:assert/strict';
import { composeGrove, GROVE_SEEDS } from '../src/score/grove.js';
import { DEFAULT_VOICE_CONFIG } from '../src/score/grove-voice.js';
import { createGroveRestRecipe, renderRestRecord, measureSecondStrike, validateRestRecord } from '../src/score/grove-rest.js';
import { composeOnPulsePhrase, onPulseRecord, onPulsePrompt, PULSE_BOUNDS, PULSE_PHRASE_VERSION, MIN_MODE_SPLIT_HZ } from '../src/score/grove-pulse.js';

const sr = 8000;
test('on-pulse phrase: a bounded opening on the measured swell with no Quiet, the expected entrance stated and not scheduled, on every curated grove', () => {
  for (const seed of GROVE_SEEDS) {
    const recipe = createGroveRestRecipe(composeGrove({ seed }), DEFAULT_VOICE_CONFIG, { sampleRate: sr }), p = composeOnPulsePhrase(recipe), ref = measureSecondStrike(recipe);
    assert.equal(p.version, PULSE_PHRASE_VERSION); assert.equal(p.sampleRate, sr);
    assert.deepEqual(p.commands.map(c => c.kind), ['strike', 'strike', 'strike']); assert.ok(!p.commands.some(c => c.kind === 'quiet'), 'no scheduled Quiet');
    assert.deepEqual(p.commands.map(c => c.body), [0, ref.neighbor, 0]); assert.equal(p.commands[1].frame, ref.best.frame, 'the answer sits at the measured reference delay');
    assert.equal(p.reference.beatPeriodSeconds, ref.beatPeriodSeconds); assert.equal(p.reference.rangeDb, ref.rangeDb);
    assert.equal(p.physicalPeriodSeconds, ref.beatPeriodSeconds); assert.equal(p.pulseUnitSeconds, p.unit.seconds); assert.equal(p.referenceDelaySeconds, ref.best.delaySeconds); assert.equal(p.endFrame, p.commands.at(-1).frame);
    assert.equal(p.unit.multiple, ref.beatPeriodSeconds < PULSE_BOUNDS.minUnitSeconds ? 2 : 1); assert.equal(p.unit.frames, Math.round(p.unit.seconds * sr)); assert.equal(p.commands[2].frame, 3 * p.unit.frames);
    assert.ok(p.commands[1].frame > 0 && p.commands[1].frame < p.commands[2].frame, 'answer between the call and its return'); assert.ok(p.openingSeconds <= PULSE_BOUNDS.maxOpeningSeconds);
    assert.equal(p.expectedEntranceFrame, p.commands[2].frame + p.commands[1].frame); assert.equal(p.lastCommandId, 'pulse-return');
    assert.deepEqual(p.sections.map(s => s.id), ['call', 'answer', 'return', 'yours']); assert.equal(p.sections.at(-1).open, true); assert.equal(p.sections.at(-1).frames[1], null);
    for (let i = 1; i < p.sections.length - 1; i++) assert.equal(p.sections[i].frames[0], p.sections[i - 1].frames[1]);
    assert.deepEqual(composeOnPulsePhrase(recipe), p, 'deterministic');
    for (const id of ['call', 'answer', 'return', 'yours']) assert.ok(onPulsePrompt(p, id).length > 10); assert.equal(onPulsePrompt(p, 'yours'), 'The bodies are yours. Answer whenever, or let the ring finish.'); assert.doesNotMatch(onPulsePrompt(p, 'yours'), /\bbest\b|\bshould\b/);
    assert.match(p.reference.note, /not a measured outcome of this phrase/); assert.match(p.claims, /not established/);
    console.log(`seed ${seed}: period ${p.physicalPeriodSeconds} s, unit ${p.pulseUnitSeconds} s ×${p.unit.multiple}, answer at ${p.reference.delaySeconds} s, return at ${p.openingSeconds} s, expected entrance ${p.expectedEntranceSeconds} s, reference range ${p.reference.rangeDb} dB`);
  }
});
test('on-pulse record: the cumulative phrase is admitted as its own history, with and without an authored answer, and renders', () => {
  for (const seed of GROVE_SEEDS) {
    const recipe = createGroveRestRecipe(composeGrove({ seed }), DEFAULT_VOICE_CONFIG, { sampleRate: sr }), p = composeOnPulsePhrase(recipe);
    const alone = onPulseRecord(recipe, p), expected = onPulseRecord(recipe, p, { answer: 'expected' }), half = onPulseRecord(recipe, p, { answer: 'half' }), exact = onPulseRecord(recipe, p, { answer: p.commands[2].frame + 1, ringSeconds: 2 });
    assert.equal(alone.record.events.length, 3); assert.equal(alone.answerFrame, null); assert.equal(alone.record.ended.frame, p.commands[2].frame + 4 * sr);
    assert.equal(expected.record.events.length, 4); assert.equal(expected.answerFrame, p.expectedEntranceFrame); assert.equal(expected.record.events[3].body, p.neighbor);
    assert.equal(half.answerFrame, p.expectedEntranceFrame + Math.round(p.unit.frames / 2)); assert.equal(exact.answerFrame, p.commands[2].frame + 1); assert.equal(exact.record.ended.frame, exact.answerFrame + 2 * sr);
    for (const r of [alone, expected, half]) { validateRestRecord(r.record, recipe); const pcm = renderRestRecord(r.record, recipe); assert.equal(pcm.channels[0].length, r.record.ended.frame + r.record.ended.fadeFrames); assert.ok(pcm.channels[0].some(v => v !== 0)); }
    assert.throws(() => onPulseRecord(recipe, p, { answer: p.commands[2].frame }), /after the return/); assert.throws(() => onPulseRecord(recipe, p, { ringSeconds: 0.5 }), /ringSeconds/);
    assert.throws(() => onPulseRecord(createGroveRestRecipe(composeGrove({ seed }), DEFAULT_VOICE_CONFIG, { sampleRate: 16000 }), p), /belong/);
    const otherSeed = GROVE_SEEDS.find(s => s !== seed); assert.throws(() => onPulseRecord(createGroveRestRecipe(composeGrove({ seed: otherSeed }), DEFAULT_VOICE_CONFIG, { sampleRate: sr }), p), /belong/, 'same rate, different grove');
    const otherVoice = { ...DEFAULT_VOICE_CONFIG, positions: [DEFAULT_VOICE_CONFIG.positions[1]] }; assert.throws(() => onPulseRecord(createGroveRestRecipe(composeGrove({ seed }), otherVoice, { sampleRate: sr }), p), /belong/, 'same grove, different voice');
    assert.equal(p.grove, JSON.parse(JSON.stringify(p.grove)) && p.grove, 'canonical grove carried'); assert.ok(p.grove.includes('"seed"')); assert.ok(typeof p.voice === 'string');
  }
  assert.throws(() => composeOnPulsePhrase(createGroveRestRecipe(composeGrove({ seed: 3 }), DEFAULT_VOICE_CONFIG, { sampleRate: sr }), { body: 7 }), /index the grove/);
  // The period floor in measureSecondStrike is never used silently: a recipe whose two lowest modes coincide is refused.
  const tight = createGroveRestRecipe(composeGrove({ seed: 3 }), DEFAULT_VOICE_CONFIG, { sampleRate: sr }), v = tight.visual, [r0, r1] = v.lowBand; const saved = v.omegaD[r1]; v.omegaD[r1] = v.omegaD[r0] + 2 * Math.PI * (MIN_MODE_SPLIT_HZ / 2);
  assert.throws(() => composeOnPulsePhrase(tight), /closer than/); v.omegaD[r1] = saved;
});
