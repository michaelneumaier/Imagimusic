// Composed versus note-only: the same ExpressionScore with every expressive message removed, and an analytic comparison of what the
// adapter's controls do with and without them. Independent of parser and evaluator semantics: it only removes events and re-evaluates.
// Not a MIDI 1.0 versus MIDI 2.0 comparison (MIDI 1.0 can carry expression too); it isolates what this score's per-note expression adds.
import { validateExpressionScore, canonicalExpressionScore } from './expression.js';
import { createExpressionPerformance, expressionFrame, expressionControlTimeline } from '../expressive/performance.js';

/** Event types that carry ongoing expression; everything else (notes with their velocity and attributes, lifecycle, sustain, sensitivity) stays. */
export const EXPRESSIVE_EVENT_TYPES = Object.freeze(['polyPressure', 'perNoteController', 'perNotePitchBend', 'pitchBend']);

/** The note-only score: same notes, velocities, attributes, lifecycle and bounds; expressive messages removed and events renumbered.
 * A Note On's pitch attribute, if any, is kept: that pitch belongs to the note, and the page must say so. */
export function noteOnlyExpressionScore(input) {
  const score = JSON.parse(canonicalExpressionScore(input));
  const events = score.events.filter(e => !EXPRESSIVE_EVENT_TYPES.includes(e.type)).map((e, order) => ({ ...e, order }));
  const removed = score.events.length - events.length, pitchAttributes = events.filter(e => e.type === 'noteOn' && e.attributeType8 !== 0).length;
  const derived = validateExpressionScore({ ...score, source: { ...score.source, name: `${score.source.name} · note-only`.slice(0, 120) }, events });
  return { score: derived, removed, kept: events.length, pitchAttributesKept: pitchAttributes };
}

const CONTROLS = Object.freeze(['gain', 'cutoffHz', 'frequencyHz', 'q']);
/** Evaluate both performances at the union of their control timelines and report, per voice and control, the largest and RMS difference. */
export function compareExpressionPerformances(composed, noteOnly, { controlRate = 1000 } = {}) {
  const same = (a, b) => a.voiceId === b.voiceId && a.noteOn === b.noteOn && a.noteOff === b.noteOff && a.address.noteNumber === b.address.noteNumber && a.address.channel === b.address.channel && a.address.group === b.address.group;
  if (composed.voices.length !== noteOnly.voices.length || !composed.voices.every((v, i) => same(v, noteOnly.voices[i]))) throw new Error('The two performances must have the same voices with the same note on, note off and address.');
  if (composed.duration !== noteOnly.duration || composed.sampleRate !== noteOnly.sampleRate) throw new Error('The two performances must share duration and sample rate.');
  const times = [...new Set([...expressionControlTimeline(composed, controlRate), ...expressionControlTimeline(noteOnly, controlRate)].map(p => p.time))].sort((a, b) => a - b);
  const acc = composed.voices.map(v => ({ voiceId: v.voiceId, noteNumber: v.address.noteNumber, samples: 0, controls: Object.fromEntries(CONTROLS.map(c => [c, { maxAbs: 0, sumSq: 0, composedMax: 0, noteOnlyMax: 0 }])) }));
  for (const t of times) {
    const a = expressionFrame(composed, t), b = expressionFrame(noteOnly, t), byId = new Map(b.voices.map(v => [v.voiceId, v]));
    for (const va of a.voices) { const vb = byId.get(va.voiceId), row = acc.find(r => r.voiceId === va.voiceId); if (!vb || !row) continue; row.samples++;
      for (const c of CONTROLS) { const d = va[c] - vb[c], s = row.controls[c]; s.maxAbs = Math.max(s.maxAbs, Math.abs(d)); s.sumSq += d * d; s.composedMax = Math.max(s.composedMax, va[c]); s.noteOnlyMax = Math.max(s.noteOnlyMax, vb[c]); } }
  }
  return { version: 1, controlRate, samples: times.length, duration: composed.duration, controls: [...CONTROLS],
    voices: acc.map(r => ({ voiceId: r.voiceId, noteNumber: r.noteNumber, samples: r.samples, controls: Object.fromEntries(Object.entries(r.controls).map(([c, s]) => [c, { maxAbs: s.maxAbs, rms: r.samples ? Math.sqrt(s.sumSq / r.samples) : 0, composedMax: s.composedMax, noteOnlyMax: s.noteOnlyMax }])) })),
    interpretation: 'Differences of the adapter\'s per-voice control values (gain, lowpass cutoff Hz, oscillator Hz, filter Q) between the composed score and its note-only derivation, sampled on the union control timeline; analytic, before any audio rendering; not a loudness, spectral or listening measure.' };
}

/** Both performances from one composed score, for a study tool or a page. */
export function composedVersusNoteOnly(score, patch, sampleRate = 48000, options) {
  const noteOnly = noteOnlyExpressionScore(score), composed = createExpressionPerformance(score, patch, sampleRate), plain = createExpressionPerformance(noteOnly.score, patch, sampleRate);
  return { composed, noteOnly: plain, derivation: { removed: noteOnly.removed, kept: noteOnly.kept, pitchAttributesKept: noteOnly.pitchAttributesKept }, comparison: compareExpressionPerformances(composed, plain, options) };
}
