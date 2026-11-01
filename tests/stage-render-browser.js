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
export const HARNESS_VERSION = 4;   // bump on every change to the experiments so reports are comparable
const environment = { harnessVersion: HARNESS_VERSION, userAgent: navigator.userAgent, hardwareConcurrency: navigator.hardwareConcurrency ?? null, seed: DEFAULT_PATCH.seed };
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
// Engine floor and per-source experiments. A single OscillatorNode → GainNode → destination has exactly one input at
// every node: if this differs between runs, the oscillator itself is nondeterministic and no mixing change helps.
// Two oscillators into one gain is the smallest summing junction. Air-only and reed-only isolate the choir's sources.
await check('Engine floor: one oscillator alone, two oscillators summed, choir by source', async () => {
  const osc = async count => {
    const run = async () => { const ctx = new OfflineAudioContext(1, 48000 * 2, 48000), g = ctx.createGain(); g.gain.value = 0.2 / count; g.connect(ctx.destination);
      for (let k = 0; k < count; k++) { const o = ctx.createOscillator(); o.frequency.value = 220 * (k + 1) * 1.37; o.connect(g); o.start(0); o.stop(1.9); }
      return (await ctx.startRendering()).getChannelData(0); };
    return compareRenders(await run(), await run(), 48000);
  };
  const source = async kind => { const patch = structuredClone(DEFAULT_PATCH); patch.bellows.source = kind; const a = await render(patch, { families: ['bellows'] }), b = await render(patch, { families: ['bellows'] }); return compareRenders(a, b, 48000); };
  const out = { oneOscillator: await osc(1), twoOscillatorsSummed: await osc(2), fiveOscillatorsSummed: await osc(5), choirOnlyAir: await source('air'), choirOnlyReed: await source('reed'), choirOnlySaw: await source('saw') };
  Object.assign(matrix, { 'engine: one oscillator': out.oneOscillator, 'engine: two oscillators summed': out.twoOscillatorsSummed, 'engine: five oscillators summed': out.fiveOscillatorsSummed, 'choir only, air': out.choirOnlyAir, 'choir only, reed': out.choirOnlyReed, 'choir only, saw': out.choirOnlySaw });
  return out;
});
// Fixed-topology control. Render the first seconds of the garden one voice per OfflineAudioContext (every node has a
// single input except the five modes at the voice gain), then sum the voices in JS in a fixed order. Run twice.
// If the per-voice renders are identical run to run, the engine's single-voice rendering is deterministic and any
// remaining drift in the full graph comes from how it mixes many inputs; the JS sum is then a deterministic reference
// the single-graph render can be compared against (expect float32 rounding-order differences only, if that is all).
await check('Fixed-topology control: per-voice renders summed in JS, twice, vs the single graph', async () => {
  const base = createPerformance(DEFAULT_PATCH, 48000), span = 6, voices = base.snapshots.garden.voices.filter(v => v.noteOn < span);
  const one = async voice => { const p = { ...base, events: [{ family: 'garden', voice }], duration: span, snapshots: { garden: { voices: [voice], dampers: [] } } }; return renderPerformanceAudio(p, 48000, { compressor: false }); };
  const sumAll = async () => { const acc = new Float64Array(Math.ceil(span * 48000)); let perVoiceIdentical = true; let worst = 0;
    for (const voice of voices) { const a = await one(voice), b = await one(voice); const c = compareRenders(a, b, 48000); if (!c.identical) { perVoiceIdentical = false; worst = Math.max(worst, c.maxDiff); } for (let i = 0; i < acc.length; i++) acc[i] += a[i]; }
    return { sum: Float32Array.from(acc), perVoiceIdentical, worstPerVoiceDiff: worst }; };
  const first = await sumAll(), second = await sumAll();
  const graph = { ...base, events: voices.map(voice => ({ family: 'garden', voice })), duration: span, snapshots: { garden: { voices, dampers: [] } } };
  const g1 = await renderPerformanceAudio(graph, 48000, { compressor: false }), g2 = await renderPerformanceAudio(graph, 48000, { compressor: false });
  const out = { voices: voices.length, seconds: span, perVoiceRendersIdentical: first.perVoiceIdentical && second.perVoiceIdentical, worstPerVoiceDiff: Math.max(first.worstPerVoiceDiff, second.worstPerVoiceDiff),
    jsSumRunToRun: compareRenders(first.sum, second.sum, 48000), singleGraphRunToRun: compareRenders(g1, g2, 48000), jsSumVsSingleGraph: compareRenders(first.sum, g1, 48000) };
  matrix['control: per-voice JS sum run-to-run'] = out.jsSumRunToRun; matrix['control: single graph (same voices) run-to-run'] = out.singleGraphRunToRun; matrix['control: JS sum vs single graph'] = out.jsSumVsSingleGraph;
  return out;
});
// Source-finish experiments (v4). Observation from v3: every 6 s control was identical, and the lone strike's
// residual began at 10.03 s, which is when that strike's shortest mode stops (onset 0.35 s + 9.65 s lifetime).
// Prediction if source finishing is the cause: (1) the lone strike over 12 s drifts from ~10.0 s; (2) with sources
// never stopped it is identical over 12 s; (3) with damping = 1 (modes stop within ~2.3 s) a 6 s render drifts;
// (4) the garden over 12 s drifts when stopped and not when never stopped. Each row is rendered twice.
await check('Source-finish experiments: stopped vs never-stopped over 12 s; first finish moved inside 6 s', async () => {
  const base = createPerformance(DEFAULT_PATCH, 48000), first = base.snapshots.garden.voices[0];
  const span12 = 12, garden12 = base.snapshots.garden.voices.filter(v => v.noteOn < span12);
  const mk = (voices, duration, patch = base.patch) => ({ ...base, patch, events: voices.map(voice => ({ family: 'garden', voice })), duration, snapshots: { garden: { voices, dampers: [] } } });
  const twice = async (p, options) => compareRenders(await renderPerformanceAudio(p, 48000, options), await renderPerformanceAudio(p, 48000, options), 48000);
  const loneStopped = await twice(mk([first], span12), { compressor: false });
  const loneNever = await twice(mk([first], span12), { compressor: false, neverStop: true });
  const gardenStopped = await twice(mk(garden12, span12), { compressor: false });
  const gardenNever = await twice(mk(garden12, span12), { compressor: false, neverStop: true });
  const damped = createPerformance({ ...DEFAULT_PATCH, damping: 1 }, 48000), dFirst = damped.snapshots.garden.voices[0];
  const dp = { ...damped, events: [{ family: 'garden', voice: dFirst }], duration: 6, snapshots: { garden: { voices: [dFirst], dampers: [] } } };
  const earlyFinish = await twice(dp, { compressor: false }), earlyNever = await twice(dp, { compressor: false, neverStop: true });
  const out = { firstModeStopsAt: first.noteOn + Math.min(...first.modes.map(m => m.decay * 9)), loneStopped12s: loneStopped, loneNeverStopped12s: loneNever, gardenStopped12s: gardenStopped, gardenNeverStopped12s: gardenNever, dampedFirstModeStopsAt: dFirst.noteOn + Math.min(...dFirst.modes.map(m => m.decay * 9)), dampedLoneStopped6s: earlyFinish, dampedLoneNeverStopped6s: earlyNever };
  Object.assign(matrix, { 'finish: lone strike 12 s, stopped': loneStopped, 'finish: lone strike 12 s, never stopped': loneNever, 'finish: garden 12 s, stopped': gardenStopped, 'finish: garden 12 s, never stopped': gardenNever, 'finish: damped lone strike 6 s, stopped': earlyFinish, 'finish: damped lone strike 6 s, never stopped': earlyNever });
  return out;
});
await check('WAV resolution: every variant identical after 16-bit quantization (WAV path only; AAC takes float32 and is lossy)', async () => {
  const failing = Object.entries(matrix).filter(([, r]) => !r.pcm16Identical).map(([k, r]) => `${k}: ${r.pcm16Differing} samples, max step ${r.pcm16MaxStep}`);
  assert(failing.length === 0, failing.join('; '));
  return Object.fromEntries(Object.entries(matrix).map(([k, r]) => [k, { identical: r.identical, maxUlps32: r.maxUlps32, quietMaxDiff: r.quietMaxDiff, pcm16Differing: r.pcm16Differing }]));
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
{ const button = document.getElementById('report'); button.disabled = false; const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15); button.onclick = () => { const url = URL.createObjectURL(new Blob([reportText], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = `stage-render-report-v${HARNESS_VERSION}-${DEFAULT_PATCH.seed}-${stamp}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000); }; }
