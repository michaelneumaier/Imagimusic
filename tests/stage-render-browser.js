import { DEFAULT_PATCH, encodeWav } from '../src/model.js';
import { createPerformance } from '../src/stage/performance.js';
import { renderPerformanceAudio } from '../src/stage/render-audio.js';
const results = [];
const assert = (value, message) => { if (!value) throw new Error(message); };
async function check(name, run) {
  const row = document.createElement('li'); row.textContent = name + ' — running'; document.getElementById('results').append(row);
  try { const detail = await run(); row.textContent = 'PASS · ' + name; const code = document.createElement('pre'); code.textContent = JSON.stringify(detail, null, 2); row.append(code); results.push({ name, passed: true, detail }); }
  catch (error) { row.textContent = 'FAIL · ' + name + ': ' + error.message; results.push({ name, passed: false, error: error.message }); }
}
const stats = samples => { let peak = 0, sum = 0, tail = 0; const tailStart = samples.length - 2400; for (let i = 0; i < samples.length; i++) { const v = Math.abs(samples[i]); if (!Number.isFinite(v)) throw new Error('Non-finite PCM at ' + i); peak = Math.max(peak, v); sum += v * v; if (i >= tailStart) tail = Math.max(tail, v); } return { seconds: samples.length / 48000, peak, rms: Math.sqrt(sum / samples.length), last50msPeak: tail }; };
let passage = null;
await check('Passage renders finite, bounded, audible audio with a silent tail', async () => {
  const performance = createPerformance(DEFAULT_PATCH, 48000);
  const t0 = window.performance.now();
  passage = await renderPerformanceAudio(performance, 48000);
  const s = stats(passage);
  assert(s.peak > .01 && s.peak < 1, 'Peak outside range: ' + s.peak);
  assert(s.last50msPeak < 1e-3, 'Non-silent tail ' + s.last50msPeak);
  assert(Math.abs(s.seconds - performance.duration) < 1 / 48000 + 1e-9, 'Length does not match passage duration');
  return { ...s, events: performance.events.length, renderMs: Math.round(window.performance.now() - t0) };
});
await check('Same seed renders the identical waveform twice; a different seed differs', async () => {
  const a = await renderPerformanceAudio(createPerformance(DEFAULT_PATCH, 48000), 48000);
  const b = await renderPerformanceAudio(createPerformance(DEFAULT_PATCH, 48000), 48000);
  const c = await renderPerformanceAudio(createPerformance({ ...DEFAULT_PATCH, seed: DEFAULT_PATCH.seed + 1 }, 48000), 48000);
  let same = 0, different = 0; const n = Math.min(a.length, b.length, c.length);
  for (let i = 0; i < n; i++) { same = Math.max(same, Math.abs(a[i] - b[i])); different = Math.max(different, Math.abs(a[i] - c[i])); }
  assert(same < 1e-6, 'Same-seed render differed by ' + same); assert(different > 1e-3, 'Different seed did not change the audio');
  return { sameSeedError: same, differentSeedDifference: different };
});
await check('Air choir passage stays bounded and deterministic', async () => {
  const patch = structuredClone(DEFAULT_PATCH); patch.bellows.source = 'air';
  const a = await renderPerformanceAudio(createPerformance(patch, 48000), 48000), b = await renderPerformanceAudio(createPerformance(patch, 48000), 48000);
  let same = 0; for (let i = 0; i < a.length; i++) same = Math.max(same, Math.abs(a[i] - b[i]));
  const s = stats(a); assert(s.peak > .01 && s.peak < 1, 'Peak outside range'); assert(same < 1e-6, 'Air render not deterministic');
  return { ...s, sameSeedError: same };
});
const passed = results.filter(r => r.passed).length;
document.getElementById('summary').textContent = `${passed}/${results.length} stage render checks passed.`;
if (passage) { const button = document.getElementById('wav'); button.disabled = false; button.onclick = () => { const url = URL.createObjectURL(new Blob([encodeWav(passage, 48000)], { type: 'audio/wav' })); const a = document.createElement('a'); a.href = url; a.download = `imagimusic-stage-${DEFAULT_PATCH.seed}.wav`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000); }; }
