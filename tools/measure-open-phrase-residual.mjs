#!/usr/bin/env node
// Residual ring at the hand-off of the open phrase (proposal 023), measured from the actual cumulative opening record on each curated grove.
// Measure: fixed-window RMS (100 ms, starting at the stated instant) of the LOW-BAND DISPLACEMENT at each body's virtual pickup, from the model
// state; reported in dB relative to the same window starting 100 ms after the first call on body 1 (body 2 also relative to 100 ms after its own
// authored answer). This is a model response measure, not loudness and not a hearing claim; no "best time" is identified.
// Usage: node tools/measure-open-phrase-residual.mjs [outDir=renders/open-phrase-residual] [sampleRate=8000]
import { writeFileSync, mkdirSync } from 'node:fs';
import { composeGrove, GROVE_SEEDS } from '../src/score/grove.js';
import { DEFAULT_VOICE_CONFIG } from '../src/score/grove-voice.js';
import { createGroveRestRecipe } from '../src/score/grove-rest.js';
import { composeOnPulsePhrase, onPulseRecord } from '../src/score/grove-pulse.js';
import { createRestEngine } from '../src/rest/engine.js';
const outDir = process.argv[2] ?? 'renders/open-phrase-residual', sr = Number(process.argv[3] ?? 8000), WINDOW = 0.1;
mkdirSync(outDir, { recursive: true });
const results = [];
function measure(seed, cycles) {
  const recipe = createGroveRestRecipe(composeGrove({ seed }), DEFAULT_VOICE_CONFIG, { sampleRate: sr });
  let phrase; try { phrase = composeOnPulsePhrase(recipe, { cycles }); } catch (error) { return { seed, cycles, refused: error.message }; }
  const { record } = onPulseRecord(recipe, phrase, { ringSeconds: 6 }), v = recipe.visual, frames = record.ended.frame, bodies = recipe.bodies;
  const low = (x, b) => { let s = 0; for (const r of v.lowBand) { let q = 0; for (let k = 0; k < recipe.n; k++) q += v.modeVectors[r][k] * x[k]; s += v.pickupByMode[r][b] * q; } return s; };
  const series = Array.from({ length: bodies }, () => new Float64Array(frames)), e = createRestEngine(recipe);
  for (let i = 0; i < frames; i++) { for (const k of record.events) if (k.frame === i) e.strike(k.position, k.body, k.velocity); const x = e.state; for (let b = 0; b < bodies; b++) series[b][i] = low(x, b); e.step(); }
  const rms = (b, t, w = WINDOW) => { const a = Math.round(t * sr), n = Math.round(w * sr); let s = 0, c = 0; for (let i = a; i < a + n && i < frames; i++) { s += series[b][i] ** 2; c++; } return c ? Math.sqrt(s / c) : 0; };
  const db = (x, ref) => +(20 * Math.log10(Math.max(x, 1e-15) / ref)).toFixed(1);
  // Window starts come from exact record frames (Astra's note), never from rounded seconds; the before-final window ends before the strike frame.
  const end = phrase.endFrame / sr, unit = phrase.unit.frames / sr, firstAnswer = phrase.commands[1].frame / sr, entrance = phrase.expectedEntranceFrame / sr;
  const refs = [rms(0, WINDOW), rms(1, firstAnswer + WINDOW), rms(0, WINDOW)];   // body 1 and 3 vs body 1's first call; body 2 vs its first answer
  const instants = [['before the final authored strike', end - WINDOW], ['hand-off (100 ms after the final strike)', end + WINDOW], ['expected entrance', entrance], ['one unit after the final strike', end + unit], ['two units after the final strike', end + 2 * unit]];
  const rows = instants.map(([label, t]) => ({ label, seconds: +t.toFixed(3), dB: Array.from({ length: bodies }, (_, b) => db(rms(b, t), refs[Math.min(b, 2)])) }));
  const trace = []; for (let t = end; t < end + 3 * unit && t < frames / sr; t += 0.02) trace.push([t, rms(0, t, 0.02)]);
  const extrema = []; for (let i = 1; i < trace.length - 1; i++) { const a = trace[i - 1][1], [t, b] = trace[i], c = trace[i + 1][1]; if (b > a && b > c) extrema.push({ kind: 'peak', seconds: +t.toFixed(2) }); else if (b < a && b < c) extrema.push({ kind: 'dip', seconds: +t.toFixed(2) }); }
  return { seed, cycles, physicalPeriodSeconds: phrase.physicalPeriodSeconds, pulseUnitSeconds: unit, referenceDelaySeconds: phrase.referenceDelaySeconds, finalStrikeSeconds: +end.toFixed(3), expectedEntranceSeconds: phrase.expectedEntranceSeconds, lowDecaySeconds: +(1 / v.gammas[v.lowBand[0]]).toFixed(2), rows, body1WindowedRmsExtremaAfterFinalStrike: { windowSeconds: 0.02, stepSeconds: 0.02, note: 'extrema of a 20 ms windowed RMS trace, not of an analytic envelope', extrema: extrema.slice(0, 16) } };
}
for (const seed of GROVE_SEEDS) for (const cycles of [1, 2]) results.push(measure(seed, cycles));
const report = { sampleRate: sr, windowSeconds: WINDOW, measure: 'fixed-window RMS of low-band displacement at each pickup from the cumulative opening record; dB relative to the 100 ms window after the first call on body 1 (body 2 relative to the window after its first authored answer); model response, not loudness; no best-time claim', results };
writeFileSync(`${outDir}/report.json`, JSON.stringify(report, null, 2));
const lines = ['# Residual ring at the hand-off (model response, not loudness)', '', `Window ${WINDOW * 1000} ms fixed RMS of low-band displacement at each pickup; dB relative to the window after the first call (body 2: after its first answer). Sample rate ${sr}.`, ''];
for (const r of results) {
  if (r.refused) { lines.push(`## grove ${r.seed}, cycles ${r.cycles}: refused (${r.refused})`, ''); continue; }
  lines.push(`## grove ${r.seed}, cycles ${r.cycles}: period ${r.physicalPeriodSeconds} s, unit ${r.pulseUnitSeconds} s, reference delay ${r.referenceDelaySeconds} s, final strike ${r.finalStrikeSeconds} s, expected entrance ${r.expectedEntranceSeconds} s, low decay ${r.lowDecaySeconds} s`, '', '| instant | s | body 1 | body 2 | body 3 |', '|---|---|---|---|---|');
  for (const row of r.rows) lines.push(`| ${row.label} | ${row.seconds} | ${row.dB.map(d => `${d} dB`).join(' | ')} |`);
  lines.push('', `Body 1, extrema of 20 ms windowed RMS after the final strike (not an analytic envelope): ${r.body1WindowedRmsExtremaAfterFinalStrike.extrema.map(x => `${x.kind} ${x.seconds}`).join(', ')}`, '');
}
writeFileSync(`${outDir}/report.md`, lines.join('\n'));
console.log(lines.join('\n'));
