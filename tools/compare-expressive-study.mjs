// Composed versus note-only: the shipped expressive study and its note-only derivation as canonical ExpressionScores, with the analytic
// control comparison, for Astra's browser renders (renderExpressionAudio needs an OfflineAudioContext, which Node lacks). No audio here.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { composeExpressiveStudy, canonicalExpressionScore } from '../src/midi2/expression.js';
import { composedVersusNoteOnly } from '../src/midi2/expression-compare.js';
import { DEFAULT_PATCH, validatePatch } from '../src/model.js';

const out = process.argv[2] ?? 'renders/expressive-compare', sampleRate = 48000, sha = text => crypto.createHash('sha256').update(text).digest('hex');
const patch = validatePatch(DEFAULT_PATCH), patchText = JSON.stringify(patch);   // the exact validated patch both renders must use: plain JSON, nested fields intact, no newline, so the file bytes hash equals patchSha256
const study = composeExpressiveStudy(), result = composedVersusNoteOnly(study, patch, sampleRate);
const composedText = canonicalExpressionScore(result.composed.score) + '\n', noteOnlyText = canonicalExpressionScore(result.noteOnly.score) + '\n';
await fs.mkdir(out, { recursive: true });
await fs.writeFile(path.join(out, 'composed.json'), composedText);
await fs.writeFile(path.join(out, 'note-only.json'), noteOnlyText);
await fs.writeFile(path.join(out, 'patch.json'), patchText);
const report = {
  version: 1, sampleRate, name: 'Composed versus note-only', patchSnapshot: patch, patchSha256: sha(patchText), patch: { file: 'patch.json', description: 'the validated DEFAULT_PATCH at authoring time, written as JSON.stringify(patchSnapshot) with no newline; the harness renders both scores from this snapshot, never from the live source default' },
  scores: { composed: { file: 'composed.json', sha256: sha(composedText), events: result.composed.score.events.length }, noteOnly: { file: 'note-only.json', sha256: sha(noteOnlyText), events: result.noteOnly.score.events.length } },
  derivation: { ...result.derivation, attributes: 'pitchAttributesKept counts Note On attribute type 0x03 (Pitch 7.9) only; otherAttributesKept counts any other non-zero attribute type', rule: 'remove polyPressure, perNoteController, perNotePitchBend and pitchBend; keep notes with their velocity and attributes, per-note management, control change (sustain) and registered controllers; renumber' },
  sameNotes: true, duration: result.composed.duration, voices: result.composed.voices.map(v => ({ voiceId: v.voiceId, noteNumber: v.address.noteNumber, noteOn: v.noteOn, noteOff: v.noteOff, end: v.end })),
  comparison: { ...result.comparison, note: 'sampled on the union control timeline including left limits before steps; sampled extrema, not exact' },
  interpretation: result.composed.interpretation,
  disclosure: 'Both are the same notes, velocities, attributes, durations and patch; only ongoing expression messages differ. Not a MIDI 1.0 versus MIDI 2.0 comparison. The comparison is of the adapter\'s control values before rendering; the renders are Astra\'s browser harness, with no normalisation; nothing is claimed about how either sounds.',
};
await fs.writeFile(path.join(out, 'comparison.json'), JSON.stringify(report, null, 2) + '\n');
console.log('Composed versus note-only → ' + out + ': removed ' + result.derivation.removed + ' of ' + (result.derivation.removed + result.derivation.kept) + ' events; ' + result.comparison.voices.map(v => `note ${v.noteNumber}: gain Δmax ${v.controls.gain.maxAbs.toFixed(3)}, cutoff Δmax ${v.controls.cutoffHz.maxAbs.toFixed(0)} Hz, pitch Δmax ${v.controls.frequencyHz.maxAbs.toFixed(2)} Hz`).join(' | '));
