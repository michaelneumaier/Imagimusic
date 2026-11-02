import test from 'node:test';
import assert from 'node:assert/strict';
import { composeExpressiveStudy, composeExpressiveChord, canonicalExpressionScore, compileExpression } from '../src/midi2/expression.js';
import { noteOnlyExpressionScore, composedVersusNoteOnly, EXPRESSIVE_EVENT_TYPES } from '../src/midi2/expression-compare.js';
import { DEFAULT_PATCH } from '../src/model.js';

test('the note-only score keeps the notes, velocities, attributes, lifecycle and bounds and removes only expressive messages', () => {
  const study = composeExpressiveStudy(), before = canonicalExpressionScore(study), { score, removed, kept, pitchAttributesKept } = noteOnlyExpressionScore(study);
  assert.equal(canonicalExpressionScore(study), before, 'the source is untouched');
  assert.equal(removed + kept, study.events.length); assert.ok(removed > 0);
  assert.deepEqual(score.events.map(e => e.type).filter(t => EXPRESSIVE_EVENT_TYPES.includes(t)), []);
  const notes = s => s.events.filter(e => e.type === 'noteOn' || e.type === 'noteOff').map(({ time, type, noteNumber, velocity16, attributeType8, attributeData16 }) => [time, type, noteNumber, velocity16, attributeType8, attributeData16]);
  assert.deepEqual(notes(score), notes(study), 'same notes, velocities and attributes at the same times');
  assert.deepEqual(score.events.map(e => e.order), score.events.map((_, i) => i)); assert.deepEqual(score.bounds, study.bounds); assert.deepEqual(score.mapping, study.mapping);
  assert.equal(score.source.name, study.source.name + ' · note-only'); assert.equal(pitchAttributesKept, 0);
  const neutral = x => x / 0xffffffff, final = compileExpression(score).at(score.events.at(-1).time);
  assert.ok(final.voices.length === 3 && final.voices.every(v => v.pressure01 === 0 && Math.abs(v.brightness01 - neutral(score.mapping.neutral.brightness32)) < 1e-12 && Math.abs(v.timbre01 - neutral(score.mapping.neutral.timbre32)) < 1e-12 && v.pitchHcu === v.address.noteNumber), 'without expressive messages every voice sits at the evaluator\'s defaults: no pressure, neutral brightness and timbre, the note\'s own pitch');
});

test('the comparison reports where the composed controls depart from note-only, voice by voice, and is zero when nothing was removed', () => {
  const { composed, noteOnly, derivation, comparison } = composedVersusNoteOnly(composeExpressiveStudy(), DEFAULT_PATCH, 48000);
  assert.equal(composed.duration, noteOnly.duration); assert.equal(derivation.kept + derivation.removed, composed.score.events.length);
  const a3 = comparison.voices.find(v => v.noteNumber === 57), e4 = comparison.voices.find(v => v.noteNumber === 64), a2 = comparison.voices.find(v => v.noteNumber === 45);
  assert.ok(a3.controls.gain.maxAbs > 0 && a3.controls.cutoffHz.maxAbs > 0 && a3.controls.frequencyHz.maxAbs > 0, 'A3 had breath, light and a bend');
  assert.ok(e4.controls.cutoffHz.maxAbs > 0 && e4.controls.frequencyHz.maxAbs === 0, 'E4 changed light only');
  assert.ok(a2 && Object.values(a2.controls).every(c => c.maxAbs === 0), 'the plain lower voice is identical in both');
  assert.ok(comparison.voices.every(v => v.controls.q.maxAbs === 0), 'no timbre message in the study, so Q never differs');
  const plain = noteOnlyExpressionScore(composeExpressiveStudy()).score, again = composedVersusNoteOnly(plain, DEFAULT_PATCH, 48000);
  assert.ok(again.comparison.voices.every(v => Object.values(v.controls).every(c => c.maxAbs === 0 && c.rms === 0)), 'note-only of note-only differs nowhere');
  assert.equal(again.derivation.removed, 0);
});

test('a note with a pitch attribute keeps it in the note-only score and the count says so', () => {
  const chord = composeExpressiveChord(), withAttribute = JSON.parse(canonicalExpressionScore(chord));
  const first = withAttribute.events.find(e => e.type === 'noteOn'); first.attributeType8 = 3; first.attributeData16 = 60 << 9;
  const { score, pitchAttributesKept } = noteOnlyExpressionScore(withAttribute);
  assert.equal(pitchAttributesKept, 1); assert.equal(score.events.find(e => e.type === 'noteOn').attributeType8, 3);
});
