import { DEFAULT_PATCH } from '../src/model.js';
import { InstrumentAudio } from '../src/audio.js';
import { BellowsAudio } from '../src/bellows-audio.js';
import { createPerformance } from '../src/stage/performance.js';
import { createProjection } from '../src/stage/projection.js';
import { collectState } from '../src/state.js';
import { liveSnapshotsFromEngines, compareBusTraces, canonicalFrame, orderVoices, normalizeSnapshots, diffFrames } from '../src/stage/equivalence.js';

const $ = id => document.getElementById(id);
const row = (text, detail) => { const li = document.createElement('li'); li.textContent = text; if (detail) { const pre = document.createElement('pre'); pre.textContent = JSON.stringify(detail, null, 2); li.append(pre); } $('results').append(li); };
let reportText = null;

$('run').onclick = async () => {
  $('run').disabled = true; $('summary').textContent = 'Playing silently and sampling…';
  try {
    const context = new AudioContext(); await context.resume();
    const audio = new InstrumentAudio(); audio.context = context;
    audio.master = context.createGain(); audio.master.gain.value = 0;              // muted: the engines run, nothing is heard
    audio.limiter = context.createDynamicsCompressor(); audio.master.connect(audio.limiter).connect(context.destination);
    const choir = new BellowsAudio(context, audio.master);
    const passage = createPerformance(DEFAULT_PATCH, context.sampleRate);
    const events = [...passage.events].sort((a, b) => a.voice.noteOn - b.voice.noteOn);
    const origin = context.currentTime + 0.1, lookahead = 0.24;
    let cursor = 0; const pageVoices = [], pageBreaths = [], samples = [];
    const schedule = () => {
      choir.tick();
      const now = context.currentTime - origin;
      while (cursor < events.length && events[cursor].voice.noteOn < now + lookahead) {
        const { family, voice } = events[cursor++];
        if (family === 'bellows') { const v = choir.noteOn(voice.noteHz, passage.patch, voice.velocity, origin + voice.noteOn, origin + voice.noteOff, (passage.patch.seed + voice.id * 997) >>> 0); if (v) pageBreaths.push(v); }
        else { const v = audio.strike(voice.slot, passage.patch, voice.velocity, origin + voice.noteOn, voice.position); if (v) pageVoices.push(v); }
      }
    };
    const timer = setInterval(schedule, 25);
    await new Promise(resolve => {
      const frame = () => {
        const t = context.currentTime - origin;
        if (t >= 0) {
          const now = origin + t;
          samples.push({ t, snapshots: liveSnapshotsFromEngines({ garden: { voices: pageVoices.filter(v => v.end > now), dampers: [...audio.dampers] }, choir: { voices: pageBreaths.filter(v => v.end > now) }, originTime: origin, sampleRate: context.sampleRate }) });
          $('summary').textContent = `Sampling… ${t.toFixed(1)} s of ${passage.duration.toFixed(1)} s, ${samples.length} frames`;
        }
        if (t < passage.duration) requestAnimationFrame(frame); else resolve();
      };
      requestAnimationFrame(frame);
    });
    clearInterval(timer); audio.stop(); choir.stop(); await context.close();
    const byTime = new Map(samples.map(s => [s.t, s.snapshots])), times = samples.map(s => s.t);
    const raw = compareBusTraces(times, passage.snapshots, t => byTime.get(t));
    const projected = compareBusTraces(times, passage.snapshots, t => byTime.get(t), { project: createProjection(passage.patch, { performance: passage }) });
    const explain = r => r.identical ? null : diffFrames(canonicalFrame(orderVoices(collectState(r.firstDifferenceSeconds, normalizeSnapshots(passage.snapshots)))), canonicalFrame(orderVoices(collectState(r.firstDifferenceSeconds, normalizeSnapshots(byTime.get(r.firstDifferenceSeconds)))))).slice(0, 10);
    const report = { generated: new Date().toISOString(), userAgent: navigator.userAgent, sampleRate: context.sampleRate, seed: DEFAULT_PATCH.seed, frames: times.length, duration: passage.duration,
      raw: { identical: raw.identical, equal: raw.equal, firstDifference: raw.firstDifference, firstDifferenceSeconds: raw.firstDifferenceSeconds, firstDifferingPaths: explain(raw) },
      projected: { identical: projected.identical, equal: projected.equal, firstDifference: projected.firstDifference, firstDifferenceSeconds: projected.firstDifferenceSeconds } };
    row(`${raw.identical ? 'PASS' : 'FAIL'} · raw bus frames: engine voices vs planned score at ${times.length} sampled timestamps`, report.raw);
    row(`${projected.identical ? 'PASS' : 'FAIL'} · projected stage frames (bodies, Keepers, chambers) at the same timestamps`, report.projected);
    $('summary').textContent = `${(raw.identical ? 1 : 0) + (projected.identical ? 1 : 0)}/2 engine parity checks passed over ${times.length} frames.`;
    reportText = JSON.stringify(report, null, 2);
    $('report').disabled = false; $('report').onclick = () => { const url = URL.createObjectURL(new Blob([reportText], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = `engine-parity-${DEFAULT_PATCH.seed}-${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000); };
  } catch (error) { $('summary').textContent = 'Engine parity failed to run: ' + error.message; }
  finally { $('run').disabled = false; }
};
