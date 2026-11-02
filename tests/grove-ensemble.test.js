import test from 'node:test';
import assert from 'node:assert/strict';
import { composeGrove } from '../src/score/grove.js';
import { DEFAULT_VOICE_CONFIG } from '../src/score/grove-voice.js';
import { createGroveRestRecipe, renderRestRecord } from '../src/score/grove-rest.js';
import { retuneGroveCluster } from '../src/score/grove-tuning.js';
import { composeEnsemblePhrase, ensembleRecords, ENSEMBLE_BOUNDS } from '../src/score/grove-ensemble.js';

test('ensemble phrase: identical per-part commands on all-C3 and on C3/E♭3/G3, each part admitted on its own grove, common ending', () => {
  const sr = 8000, c3 = composeGrove({ seed: 3 }), recipe = g => createGroveRestRecipe(g, DEFAULT_VOICE_CONFIG, { sampleRate: sr });
  const unison = [recipe(c3), recipe(c3), recipe(c3)], triad = [recipe(c3), recipe(retuneGroveCluster(c3, 51)), recipe(retuneGroveCluster(c3, 55))];
  const pu = composeEnsemblePhrase(unison), pt = composeEnsemblePhrase(triad);
  assert.deepEqual(pu.parts, pt.parts, 'commands depend on the beat grid, not the tuning'); assert.deepEqual(pt.bases, [48, 51, 55]); assert.deepEqual(pu.bases, [48, 48, 48]);
  assert.ok(pt.seconds >= ENSEMBLE_BOUNDS.minSeconds && pt.seconds <= ENSEMBLE_BOUNDS.maxSeconds); assert.equal(pt.parts.length, 3);
  for (const [recipes, phrase] of [[unison, pu], [triad, pt]]) {
    const records = ensembleRecords(recipes, phrase);
    assert.deepEqual(records.map(r => r.events.length), [2, 2, 2]); assert.deepEqual(records.map(r => r.contacts.length), [1, 0, 0]); assert.ok(records.every(r => r.ended.frame === phrase.endFrame));
    assert.deepEqual(records.map(r => r.grove.cluster.baseMidi), phrase.bases); assert.ok(records.every(r => r.outputGain === recipes[0].outputGain), 'all canonical gains equal');
    records.forEach((r, i) => { const pcm = renderRestRecord(r, recipes[i]); assert.equal(pcm.channels[0].length, phrase.endFrame + r.ended.fadeFrames); assert.ok(pcm.channels[0].some(v => v !== 0)); });
    // The third and fifth parts carry the same gesture shape one beat apart: same count, same ending, arrival frames differ by one beat.
    const beat = b => Math.round(b * 60 / phrase.tempo * sr); assert.equal(records[1].events[0].frame, beat(1)); assert.equal(records[2].events[0].frame, beat(2)); assert.equal(records[1].events[1].frame, records[2].events[1].frame);
  }
  // The same records differ only in grove across arrangements.
  const ru = ensembleRecords(unison, pu), rt = ensembleRecords(triad, pt); for (let i = 0; i < 3; i++) { const a = { ...ru[i], grove: null }, b = { ...rt[i], grove: null }; assert.deepEqual(a, b); }
  assert.throws(() => composeEnsemblePhrase([recipe(c3), recipe(c3)]), /3 parts/); assert.throws(() => composeEnsemblePhrase([recipe(c3), recipe(c3), createGroveRestRecipe(c3, DEFAULT_VOICE_CONFIG, { sampleRate: 16000 })]), /sample rate/);
  assert.throws(() => ensembleRecords(unison, pt), /differs from the phrase|does not match/); assert.throws(() => composeEnsemblePhrase(triad, { tempo: 30 }), /tempo/);
});

test('demonstration variant: the same arrivals and hand at the page press, no chord, Quiet at beat 8; defaults unchanged', () => {
  const sr = 8000, c3 = composeGrove({ seed: 3 }), recipe = g => createGroveRestRecipe(g, DEFAULT_VOICE_CONFIG, { sampleRate: sr });
  const triad = [recipe(c3), recipe(retuneGroveCluster(c3, 51)), recipe(retuneGroveCluster(c3, 55))], study = composeEnsemblePhrase(triad), demo = composeEnsemblePhrase(triad, { together: false, velocity: 0.5 });
  // Defaults: the study phrase is exactly what it was (together, 0.6 arrivals, chord at 8, Quiet at 12, five sections).
  assert.equal(study.together, true); assert.equal(study.velocity, 0.6); assert.deepEqual(study.parts.map(p => p.commands.length), [5, 3, 3]); assert.equal(study.endFrame, Math.round(12 * 60 / 72 * sr)); assert.deepEqual(study.sections.map(s => s.id), ['arrive', 'hand', 'ring', 'together', 'quiet']);
  assert.deepEqual(study.parts[0].commands.map(c => [c.id, c.frame, c.velocity ?? c.zone ?? null]), [['ensemble-arrive-1', 0, 0.6], ['ensemble-hand', Math.round(3.5 * 60 / 72 * sr), recipe(c3).zones.length - 1], ['ensemble-lift', Math.round(6 * 60 / 72 * sr), null], ['ensemble-together-1', Math.round(8 * 60 / 72 * sr), 0.5], ['ensemble-quiet', study.endFrame, null]]);
  // Demonstration: no together strikes, arrivals at 0.5, Quiet at beat 8, about 6.7 s, four sections, the same beat grid.
  assert.equal(demo.together, false); assert.equal(demo.velocity, 0.5); assert.deepEqual(demo.parts.map(p => p.commands.length), [4, 2, 2]); assert.ok(!demo.parts.some(p => p.commands.some(c => c.id.startsWith('ensemble-together'))));
  assert.ok(demo.parts.every(p => p.commands.filter(c => c.kind === 'strike').every(c => c.velocity === 0.5 && c.position === study.position))); assert.equal(demo.endFrame, Math.round(8 * 60 / 72 * sr)); assert.equal(demo.seconds, +(demo.endFrame / sr + 0.025).toFixed(3)); assert.ok(demo.seconds > 6.6 && demo.seconds < 6.8);
  assert.deepEqual(demo.sections.map(s => s.id), ['arrive', 'hand', 'ring', 'quiet']); assert.deepEqual(demo.parts.map(p => p.commands[0].frame), study.parts.map(p => p.commands[0].frame)); assert.equal(demo.parts[0].commands[1].frame, study.parts[0].commands[1].frame);
  assert.ok(demo.parts.every(p => p.commands.at(-1).kind === 'quiet' && p.commands.at(-1).frame === demo.endFrame), 'every part ends with the common Quiet');
  const records = ensembleRecords(triad, demo); assert.deepEqual(records.map(r => [r.events.length, r.contacts.length]), [[1, 1], [1, 0], [1, 0]]); records.forEach((r, i) => { const pcm = renderRestRecord(r, triad[i]); assert.equal(pcm.channels[0].length, demo.endFrame + r.ended.fadeFrames); });
  assert.throws(() => composeEnsemblePhrase(triad, { together: 'no' }), /boolean/); assert.throws(() => composeEnsemblePhrase(triad, { velocity: 1.5 }), /velocity/);
});
