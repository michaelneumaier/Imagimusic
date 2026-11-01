import { DEFAULT_PATCH, encodeWav } from '../src/model.js';
import { createPerformance } from '../src/stage/performance.js';
import { renderPerformanceAudio, compareRenders } from '../src/stage/render-audio.js';
const results = [];
const assert = (value, message) => { if (!value) throw new Error(message); };
async function check(name, run) {
  const row = document.createElement('li'); row.textContent = name + ' — running'; document.getElementById('results').append(row);
  try { const detail = await run(); row.textContent = 'PASS · ' + name; const code = document.createElement('pre'); code.textContent = JSON.stringify(detail, null, 2); row.append(code); results.push({ name, passed: true, detail }); }
  catch (error) { row.textContent = 'FAIL · ' + name + ': ' + error.message; results.push({ name, passed: false, error: error.message }); }
}
const stats = samples => { let peak = 0, sum = 0, tail = 0; const tailStart = samples.length - 2400; for (let i = 0; i < samples.length; i++) { const v = Math.abs(samples[i]); if (!Number.isFinite(v)) throw new Error('Non-finite PCM at ' + i); peak = Math.max(peak, v); sum += v * v; if (i >= tailStart) tail = Math.max(tail, v); } return { seconds: samples.length / 48000, peak, rms: Math.sqrt(sum / samples.length), last50msPeak: tail }; };
const render = (patch, options) => renderPerformanceAudio(createPerformance(patch, 48000), 48000, options);
const environment = { userAgent: navigator.userAgent, hardwareConcurrency: navigator.hardwareConcurrency ?? null, seed: DEFAULT_PATCH.seed };
let passage = null;

await check('Passage renders finite, bounded, audible audio with a silent tail', async () => {
  const performance = createPerformance(DEFAULT_PATCH, 48000), t0 = window.performance.now();
  passage = await renderPerformanceAudio(performance, 48000);
  const s = stats(passage);
  assert(s.peak > .01 && s.peak < 1, 'Peak outside range: ' + s.peak);
  assert(s.last50msPeak < 1e-3, 'Non-silent tail ' + s.last50msPeak);
  assert(Math.abs(s.seconds - performance.duration) < 1 / 48000 + 1e-9, 'Length does not match passage duration');
  return { ...s, events: performance.events.length, renderMs: Math.round(window.performance.now() - t0), ...environment };
});

// Repeatability diagnostic matrix. Each variant is rendered twice from the same seed and compared sample by sample.
// Reading the table: if "full" differs but "full, keepNodes:false" differs MORE and "full, keepNodes:true" is
// identical, the cause is main-thread disconnect timing; if only variants with the compressor differ, it is the
// compressor's state handling; if a single family differs on its own, it is that engine.
const variants = [
  ['full (default: keepNodes)', {}],
  ['full, keepNodes:false (live-style disconnects)', { keepNodes: false }],
  ['full, no compressor', { compressor: false }],
  ['full, no compressor, keepNodes:false', { compressor: false, keepNodes: false }],
  ['garden only', { families: ['garden'] }],
  ['tine only', { families: ['tine'] }],
  ['choir only', { families: ['bellows'] }],
  ['garden only, no compressor', { families: ['garden'], compressor: false }],
];
const matrix = {};
await check('Repeatability matrix: same seed rendered twice per variant (report, never relaxed thresholds)', async () => {
  for (const [name, options] of variants) {
    const a = await render(DEFAULT_PATCH, options), b = await render(DEFAULT_PATCH, options);
    matrix[name] = compareRenders(a, b, 48000);
  }
  return { ...matrix, ...environment };
});
// Summation-order experiments. Hypothesis: the engine sums a node's inputs in an order that can vary between runs,
// and float32 addition is not associative, so renders differ by a rounding unit wherever several voices overlap.
// Prediction: a lone garden strike (one input everywhere) is bit-identical; two simultaneous strikes into the same
// master (two inputs summed) can differ by one float32 unit; neither differs after 16-bit PCM quantization.
await check('Summation-order experiments: lone strike vs two simultaneous strikes', async () => {
  const base = createPerformance(DEFAULT_PATCH, 48000), first = base.snapshots.garden.voices[0];
  const mk = voices => ({ ...base, events: voices.map(voice => ({ family: 'garden', voice })), duration: first.end + 0.05, snapshots: { garden: { voices, dampers: [] } } });
  const lone = mk([first]), pair = mk([first, { ...first, id: 'g1b', slot: 1 }]);
  const trio = mk([first, { ...first, id: 'g1b', slot: 1 }, { ...first, id: 'g1c', slot: 2 }]);
  const run = async p => { const a = await renderPerformanceAudio(p, 48000, { compressor: false }), b = await renderPerformanceAudio(p, 48000, { compressor: false }); return compareRenders(a, b, 48000); };
  const out = { loneStrike: await run(lone), twoSimultaneous: await run(pair), threeSimultaneous: await run(trio) };
  matrix['lone strike, no compressor'] = out.loneStrike; matrix['two simultaneous strikes, no compressor'] = out.twoSimultaneous; matrix['three simultaneous strikes, no compressor'] = out.threeSimultaneous;
  return out;
});
await check('All variants are identical after 16-bit PCM quantization (the shipped format)', async () => {
  const failing = Object.entries(matrix).filter(([, r]) => !r.pcm16Identical).map(([k, r]) => `${k}: ${r.pcm16Differing} samples, max step ${r.pcm16MaxStep}`);
  assert(failing.length === 0, failing.join('; '));
  return Object.fromEntries(Object.entries(matrix).map(([k, r]) => [k, { maxUlps32: r.maxUlps32, pcm16Differing: r.pcm16Differing }]));
});
await check('Default full render is bit-identical across two runs', async () => {
  const r = matrix['full (default: keepNodes)']; assert(r, 'matrix did not run');
  assert(r.identical, `max diff ${r.maxDiff} at ${r.atSeconds}s`); return r;
});
await check('Different seed produces different audio', async () => {
  const a = await render(DEFAULT_PATCH), c = await render({ ...DEFAULT_PATCH, seed: DEFAULT_PATCH.seed + 1 });
  const r = compareRenders(a, c, 48000); assert(r.maxDiff > 1e-3, 'Different seed did not change the audio'); return r;
});
await check('Air choir passage stays bounded and repeatable', async () => {
  const patch = structuredClone(DEFAULT_PATCH); patch.bellows.source = 'air';
  const a = await render(patch), b = await render(patch), r = compareRenders(a, b, 48000), s = stats(a);
  assert(s.peak > .01 && s.peak < 1, 'Peak outside range'); assert(r.identical, `air render differed: max ${r.maxDiff} at ${r.atSeconds}s`);
  return { ...s, ...r };
});
const passed = results.filter(r => r.passed).length;
document.getElementById('summary').textContent = `${passed}/${results.length} stage render checks passed.`;
if (passage) { const button = document.getElementById('wav'); button.disabled = false; button.onclick = () => { const url = URL.createObjectURL(new Blob([encodeWav(passage, 48000)], { type: 'audio/wav' })); const a = document.createElement('a'); a.href = url; a.download = `imagimusic-stage-${DEFAULT_PATCH.seed}.wav`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000); }; }
const reportText = JSON.stringify({ generated: new Date().toISOString(), ...environment, results, matrix }, null, 2);
const report = document.createElement('pre'); report.textContent = reportText; document.body.append(report);
{ const button = document.getElementById('report'); button.disabled = false; button.onclick = () => { const url = URL.createObjectURL(new Blob([reportText], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = `stage-render-report-${DEFAULT_PATCH.seed}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000); }; }
