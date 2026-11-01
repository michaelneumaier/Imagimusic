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
const twiceFull = async (patch, options) => compareRenders(await render(patch, options), await render(patch, options), 48000);
export const HARNESS_VERSION = 12;   // bump on every change to the experiments so reports are comparable
// From v7 the renderer's default lifecycle is 'outlive-render' (decision 004). Every negative-control row below
// passes sourceLifetime: 'as-live' explicitly so the controls keep measuring the behavior they were designed to
// expose; they are reported under "negative control" names and never asserted. Shipping assertions use the default.
const AS_LIVE = { sourceLifetime: 'as-live' };
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
  ['negative control: as-live full', { ...AS_LIVE }],
  ['negative control: as-live full, keepNodes:false (live-style disconnects)', { ...AS_LIVE, keepNodes: false }],
  ['negative control: as-live full, no compressor', { ...AS_LIVE, compressor: false }],
  ['negative control: as-live full, no compressor, keepNodes:false', { ...AS_LIVE, compressor: false, keepNodes: false }],
  ['negative control: as-live garden only', { ...AS_LIVE, families: ['garden'] }],
  ['negative control: as-live tine only', { ...AS_LIVE, families: ['tine'] }],
  ['negative control: as-live choir only', { ...AS_LIVE, families: ['bellows'] }],
  ['negative control: as-live garden only, no compressor', { ...AS_LIVE, families: ['garden'], compressor: false }],
  ['shipping default: full passage', {}],
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
  const run = async p => { const a = await renderPerformanceAudio(p, 48000, { ...AS_LIVE, compressor: false }), b = await renderPerformanceAudio(p, 48000, { ...AS_LIVE, compressor: false }); return compareRenders(a, b, 48000); };
  const out = { loneStrike: await run(lone), twoSimultaneous: await run(pair), threeSimultaneous: await run(trio) };
  matrix['negative control: as-live lone strike, no compressor'] = out.loneStrike; matrix['negative control: as-live two simultaneous strikes, no compressor'] = out.twoSimultaneous; matrix['negative control: as-live three simultaneous strikes, no compressor'] = out.threeSimultaneous;
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
  const source = async kind => { const patch = structuredClone(DEFAULT_PATCH); patch.bellows.source = kind; const a = await render(patch, { ...AS_LIVE, families: ['bellows'] }), b = await render(patch, { ...AS_LIVE, families: ['bellows'] }); return compareRenders(a, b, 48000); };
  const out = { oneOscillator: await osc(1), twoOscillatorsSummed: await osc(2), fiveOscillatorsSummed: await osc(5), choirOnlyAir: await source('air'), choirOnlyReed: await source('reed'), choirOnlySaw: await source('saw') };
  Object.assign(matrix, { 'negative control: engine one oscillator': out.oneOscillator, 'negative control: engine two oscillators summed': out.twoOscillatorsSummed, 'negative control: engine five oscillators summed': out.fiveOscillatorsSummed, 'negative control: as-live choir only, air': out.choirOnlyAir, 'negative control: as-live choir only, reed': out.choirOnlyReed, 'negative control: as-live choir only, saw': out.choirOnlySaw });
  return out;
});
// Fixed-topology control. Render the first seconds of the garden one voice per OfflineAudioContext (every node has a
// single input except the five modes at the voice gain), then sum the voices in JS in a fixed order. Run twice.
// If the per-voice renders are identical run to run, the engine's single-voice rendering is deterministic and any
// remaining drift in the full graph comes from how it mixes many inputs; the JS sum is then a deterministic reference
// the single-graph render can be compared against (expect float32 rounding-order differences only, if that is all).
await check('Fixed-topology control: per-voice renders summed in JS, twice, vs the single graph', async () => {
  const base = createPerformance(DEFAULT_PATCH, 48000), span = 6, voices = base.snapshots.garden.voices.filter(v => v.noteOn < span);
  const one = async voice => { const p = { ...base, events: [{ family: 'garden', voice }], duration: span, snapshots: { garden: { voices: [voice], dampers: [] } } }; return renderPerformanceAudio(p, 48000, { ...AS_LIVE, compressor: false }); };
  const sumAll = async () => { const acc = new Float64Array(Math.ceil(span * 48000)); let perVoiceIdentical = true; let worst = 0;
    for (const voice of voices) { const a = await one(voice), b = await one(voice); const c = compareRenders(a, b, 48000); if (!c.identical) { perVoiceIdentical = false; worst = Math.max(worst, c.maxDiff); } for (let i = 0; i < acc.length; i++) acc[i] += a[i]; }
    return { sum: Float32Array.from(acc), perVoiceIdentical, worstPerVoiceDiff: worst }; };
  const first = await sumAll(), second = await sumAll();
  const graph = { ...base, events: voices.map(voice => ({ family: 'garden', voice })), duration: span, snapshots: { garden: { voices, dampers: [] } } };
  const g1 = await renderPerformanceAudio(graph, 48000, { ...AS_LIVE, compressor: false }), g2 = await renderPerformanceAudio(graph, 48000, { ...AS_LIVE, compressor: false });
  const out = { voices: voices.length, seconds: span, perVoiceRendersIdentical: first.perVoiceIdentical && second.perVoiceIdentical, worstPerVoiceDiff: Math.max(first.worstPerVoiceDiff, second.worstPerVoiceDiff),
    jsSumRunToRun: compareRenders(first.sum, second.sum, 48000), singleGraphRunToRun: compareRenders(g1, g2, 48000), jsSumVsSingleGraph: compareRenders(first.sum, g1, 48000) };
  matrix['negative control: as-live per-voice JS sum run-to-run'] = out.jsSumRunToRun; matrix['negative control: as-live single graph (same voices) run-to-run'] = out.singleGraphRunToRun; matrix['negative control: as-live JS sum vs single graph'] = out.jsSumVsSingleGraph;
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
  const OUT = { sourceLifetime: 'outlive-render' };
  const loneStopped = await twice(mk([first], span12), { ...AS_LIVE, compressor: false });
  const loneNever = await twice(mk([first], span12), { compressor: false, ...OUT });
  const gardenStopped = await twice(mk(garden12, span12), { ...AS_LIVE, compressor: false });
  const gardenNever = await twice(mk(garden12, span12), { compressor: false, ...OUT });
  const damped = createPerformance({ ...DEFAULT_PATCH, damping: 1 }, 48000), dFirst = damped.snapshots.garden.voices[0];
  const dp = { ...damped, events: [{ family: 'garden', voice: dFirst }], duration: 6, snapshots: { garden: { voices: [dFirst], dampers: [] } } };
  const earlyFinish = await twice(dp, { ...AS_LIVE, compressor: false }), earlyNever = await twice(dp, { compressor: false, ...OUT });
  const out = { firstModeStopsAt: first.noteOn + Math.min(...first.modes.map(m => m.decay * 9)), loneStopped12s: loneStopped, loneNeverStopped12s: loneNever, gardenStopped12s: gardenStopped, gardenNeverStopped12s: gardenNever, dampedFirstModeStopsAt: dFirst.noteOn + Math.min(...dFirst.modes.map(m => m.decay * 9)), dampedLoneStopped6s: earlyFinish, dampedLoneNeverStopped6s: earlyNever };
  Object.assign(matrix, { 'negative control: as-live lone strike 12 s': loneStopped, 'finish: lone strike 12 s, outlive-render': loneNever, 'negative control: as-live garden 12 s': gardenStopped, 'finish: garden 12 s, outlive-render': gardenNever, 'negative control: as-live damped lone strike 6 s': earlyFinish, 'finish: damped lone strike 6 s, outlive-render': earlyNever });
  return out;
});
// v5: the candidate lifecycle on the full passage, compressor and air included. 'outlive-render' stops every source
// after the render ends. Expected: bit-identical run to run. Also compares the candidate against the as-live render
// of the same passage: once the engine zeroes each mode gain at its intended end, the two differ only where the
// as-live run's finishes perturbed the mix (rounding units); until then the candidate carries the final-ramp residual
// (reported as asLiveVsOutlive so the size of that residual is on record, not hidden).
await check('Candidate lifecycle: full passage with sources outliving the render, twice, with compressor; air choir too', async () => {
  const outlive = { sourceLifetime: 'outlive-render' };
  const full = await twiceFull(DEFAULT_PATCH, outlive);
  const air = structuredClone(DEFAULT_PATCH); air.bellows.source = 'air';
  const fullAir = await twiceFull(air, outlive);
  const asLive = await render(DEFAULT_PATCH, AS_LIVE), candidate = await render(DEFAULT_PATCH, outlive), candidateAir = await render(air, outlive);
  const passage = createPerformance(DEFAULT_PATCH, 48000);
  const out = { fullOutlive: full, fullAirOutlive: fullAir, asLiveVsOutlive: compareRenders(asLive, candidate, 48000), candidateStats: stats(candidate), candidateAirStats: stats(candidateAir), candidateSeconds: candidate.length / 48000, passageDuration: passage.duration };
  Object.assign(matrix, { 'lifecycle: full passage, outlive-render': full, 'lifecycle: full passage air, outlive-render': fullAir, 'negative control: as-live vs outlive-render (same seed)': out.asLiveVsOutlive });
  return out;
});
// v6 assertions on the candidate (added once v5 reported maxDiff 0 for both rows). These must hold before the
// default changes: bit-identical full and air renders, bounded finite audio, a silent last 50 ms, length == duration.
await check('Candidate lifecycle assertions: full and air bit-identical, bounded, silent tail, exact length', async () => {
  const outlive = { sourceLifetime: 'outlive-render' };
  const air = structuredClone(DEFAULT_PATCH); air.bellows.source = 'air';
  const full = matrix['lifecycle: full passage, outlive-render'], fullAir = matrix['lifecycle: full passage air, outlive-render'];
  assert(full && fullAir, 'candidate rows did not run');
  assert(full.identical, `full passage not identical: max ${full.maxDiff} at ${full.atSeconds}s`);
  assert(fullAir.identical, `air passage not identical: max ${fullAir.maxDiff} at ${fullAir.atSeconds}s`);
  const passage = createPerformance(DEFAULT_PATCH, 48000);
  const c = await render(DEFAULT_PATCH, outlive), ca = await render(air, outlive), s = stats(c), sa = stats(ca);
  for (const [name, st, pcm] of [['full', s, c], ['air', sa, ca]]) {
    assert(st.peak > .01 && st.peak < 1, `${name} peak outside range: ${st.peak}`);
    assert(st.last50msPeak < 1e-3, `${name} non-silent tail ${st.last50msPeak}`);
    assert(Math.abs(pcm.length / 48000 - passage.duration) < 1 / 48000 + 1e-9, `${name} length does not match passage duration`);
  }
  return { full: s, air: sa };
});
// v9: the optional Loom duet (composition v1). Shipping rows: the composed passage rendered twice with the default
// lifecycle must be bit-identical, finite, bounded, with a silent tail and the composed duration (the duet's PCM is
// deterministic JS; this checks that joining it to the retained-source graph keeps identity and a finite buffer end).
await check('Shipping default: composed passage (Loom duet enabled) identical, bounded, silent tail, exact length', async () => {
  const { attachLoomPerformance, DEFAULT_COMPOSITION } = await import('../src/stage/composition.js');
  const composition = structuredClone(DEFAULT_COMPOSITION); composition.loom.enabled = true;
  const composed = attachLoomPerformance(createPerformance(DEFAULT_PATCH, 48000), composition);
  assert(composed.loom, 'duet not attached');
  const a = await renderPerformanceAudio(composed, 48000), b = await renderPerformanceAudio(composed, 48000);
  const r = compareRenders(a, b, 48000), s = stats(a);
  matrix['shipping default: composed passage (Loom duet)'] = r;
  assert(r.identical, `composed passage not identical: max ${r.maxDiff} at ${r.atSeconds}s`);
  assert(s.peak > .01 && s.peak < 1, 'composed peak outside range: ' + s.peak);
  assert(s.last50msPeak < 1e-3, 'composed non-silent tail ' + s.last50msPeak);
  assert(Math.abs(a.length / 48000 - composed.duration) < 1 / 48000 + 1e-9, 'composed length does not match composed duration');
  const base = await renderPerformanceAudio(createPerformance(DEFAULT_PATCH, 48000), 48000);
  const vsBase = compareRenders(base, a.subarray(0, base.length), 48000);
  return { ...s, composedDuration: composed.duration, loomDuration: composed.loom.duration, loomStrikes: composed.loom.events.length, differsFromBase: !vsBase.identical, baseVsComposedMaxDiff: vsBase.maxDiff };
});
// v11: composition v2 with the featured FM tensioner (alone, and together with the Loom duet). Shipping rows: identical
// twice with the default lifecycle, finite, bounded, silent tail, composed length; the FM tone's entrance (beat 8) is
// reported so its contribution is visible against the base.
await check('Shipping default: featured FM tensioner (composition v2), alone and with the Loom duet', async () => {
  const { attachComposition, DEFAULT_COMPOSITION } = await import('../src/stage/composition.js');
  const { DEFAULT_TENSIONER } = await import('../src/fm.js');
  const out = {};
  for (const [name, loomEnabled] of [['fm only', false], ['fm + loom', true]]) {
    const composition = { ...structuredClone(DEFAULT_COMPOSITION), version: 2, fm: { enabled: true, settings: { ...DEFAULT_TENSIONER } } };
    composition.loom.enabled = loomEnabled;
    const composed = attachComposition(createPerformance(DEFAULT_PATCH, 48000), composition);
    assert(composed.fm, 'FM tone not attached');
    const a = await renderPerformanceAudio(composed, 48000), b = await renderPerformanceAudio(composed, 48000);
    const r = compareRenders(a, b, 48000), s = stats(a);
    matrix[`shipping default: composition v2 (${name})`] = r;
    assert(r.identical, `${name}: not identical, max ${r.maxDiff} at ${r.atSeconds}s`);
    assert(s.peak > .01 && s.peak < 1, `${name}: peak outside range ${s.peak}`);
    assert(s.last50msPeak < 1e-3, `${name}: non-silent tail ${s.last50msPeak}`);
    assert(Math.abs(a.length / 48000 - composed.duration) < 1 / 48000 + 1e-9, `${name}: length does not match composed duration`);
    // Contribution reference: the SAME composition with only the FM tone disabled, so the Loom's own contribution
    // (when enabled) is in both renders. Asserted: nothing differs before the entrance; something does after it.
    const reference = attachComposition(createPerformance(DEFAULT_PATCH, 48000), { ...composition, fm: { ...composition.fm, enabled: false } });
    const ref = await renderPerformanceAudio(reference, 48000);
    const entrance = Math.round(composed.fm.time * 48000); let before = 0, after = 0;
    for (let i = 0; i < Math.min(entrance, ref.length); i++) before = Math.max(before, Math.abs(a[i] - ref[i]));
    for (let i = entrance; i < Math.min(a.length, entrance + 48000); i++) after = Math.max(after, Math.abs(a[i] - (ref[i] ?? 0)));
    assert(before === 0, `${name}: differs from the FM-disabled reference before the entrance (max ${before})`);
    assert(after > 1e-3, `${name}: no FM contribution after the entrance (max ${after})`);
    out[name] = { ...s, composedDuration: composed.duration, fmEntranceSeconds: composed.fm.time, fmDurationSeconds: composed.fm.duration, maxDiffVsFmDisabledBeforeEntrance: before, maxDiffVsFmDisabledAfterEntrance: after };
  }
  return out;
});
await check('WAV resolution: every SHIPPING row identical after 16-bit quantization (negative controls reported, not asserted)', async () => {
  const failing = Object.entries(matrix).filter(([k, r]) => !k.startsWith('negative control') && !r.pcm16Identical).map(([k, r]) => `${k}: ${r.pcm16Differing} samples, max step ${r.pcm16MaxStep}`);
  assert(failing.length === 0, failing.join('; '));
  return Object.fromEntries(Object.entries(matrix).map(([k, r]) => [k, { identical: r.identical, maxUlps32: r.maxUlps32, quietMaxDiff: r.quietMaxDiff, pcm16Differing: r.pcm16Differing }]));
});
await check('Shipping default: full passage is bit-identical across two runs', async () => {
  const r = matrix['shipping default: full passage']; assert(r, 'matrix did not run');
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
