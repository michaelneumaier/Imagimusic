// Study: the numeric ranges of the Grove's visual envelope and of the display values applyGroveScene derives from it, for one admitted touch on
// body 2 at velocity 0.5 and 1, original voice and default partials voice, seeds 3, 7 and 11, over the first 4 s. Numbers and relationships
// only; no perceptual conclusion and no threshold recommendation. Reads the same session code the page uses; edits nothing.
//   usage: node tools/measure-grove-visual-ranges.mjs
import { composeGrove } from '../src/score/grove.js';
import { DEFAULT_VOICE_CONFIG } from '../src/score/grove-voice.js';
import { createGroveSession } from '../src/grove/session.js';
import { createGroveVoiceSession } from '../src/grove/voice-session.js';
import { haloOpacity } from '../src/grove/scene.js';

export const MAPPING = Object.freeze({
  sampling: 'peaks and their times are sampled maxima on the study grid (default every 50 ms), not exact extrema; the marks at 0.1, 0.5, 1, 2 and 4 s are the nearest grid samples',
  pulse: 'form widening factor = min(0.2, level × 0.6)',
  shell: 'shell emissive = 0.025 + min(0.7, level × 2)',
  core: 'core emissive = 0.1 + min(1.2, level × 3)',
  haloBaseline: 'halo opacity = 0.15 + min(0.65, level × 2) (Follow the ring off)',
  haloFollow: 'halo opacity = 0.15 + min(0.65, level × 10) (Follow the ring on, opt-in)',
  level: 'the session\'s visual(time).envelope[body], sampled every 50 ms from 0 to 4 s after one admitted strike at frame 0: for the original voice this is the full three-mode network envelope (createGroveSession, grovePerformanceFrame); for the partials voice it is the voice\'s declared low-band envelope (createGroveVoiceSession, groveVoiceEnvelope, lowBand: true). The two are not the same quantity and are compared only as what each page draws.',
});
const display = level => ({ pulse: Math.min(.2, level * .6), shell: .025 + Math.min(.7, level * 2), core: .1 + Math.min(1.2, level * 3), haloBaseline: haloOpacity(level, false), haloFollow: haloOpacity(level, true) });

export function measureGroveVisual({ seed, voice, velocity, body = 1, sampleRate = 48000, seconds = 4, step = 0.05 }) {
  const grove = composeGrove({ seed });
  const session = voice === 'partials' ? createGroveVoiceSession({ grove, voice: DEFAULT_VOICE_CONFIG }, sampleRate) : createGroveSession(grove, sampleRate);
  const receipt = session.strike({ frame: 0, body, velocity });
  if (!receipt || receipt.accepted !== true) throw new Error(`study strike not admitted: ${receipt?.reason ?? 'no receipt'}`);   // the study claims an admitted touch, so it checks
  const n = grove.bodies.length, peak = Array(n).fill(0), peakAt = Array(n).fill(0), at = {};
  if (!Number.isFinite(step) || step <= 0 || !Number.isFinite(seconds) || seconds <= 0) throw new Error('study needs finite positive step and seconds');
  const count = Math.floor(seconds / step + 1e-9), marks = [0.1, 0.5, 1, 2, 4];
  for (let i = 0; i <= count; i++) {                                   // index-based so any positive step advances (Astra's review)
    const t = i * step, env = session.visual(t).envelope;
    env.forEach((v, k) => { if (v > peak[k]) { peak[k] = v; peakAt[k] = t; } });
    for (const m of marks) if (Math.abs(t - m) < step / 2 && !(m in at)) at[m] = env.slice();
  }
  return { seed, voice, velocity, body, admitted: true, envelopeKind: voice === 'partials' ? 'voice low-band envelope' : 'full three-mode network envelope', peak, peakAt, at, displayAtPeak: peak.map(display), neighbourToStruck: peak.map(p => p / peak[body]) };
}
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('| seed | voice | v | body | peak level | at s | level 0.5 s | 1 s | 2 s | 4 s | pulse | shell | core | halo base | halo follow |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const seed of [3, 7, 11]) for (const voice of ['original', 'partials']) for (const velocity of [0.5, 1]) {
    const r = measureGroveVisual({ seed, voice, velocity });
    r.peak.forEach((p, i) => { const d = r.displayAtPeak[i]; console.log(`| ${seed} | ${voice} | ${velocity} | ${i + 1}${i === r.body ? ' (struck)' : ''} | ${p.toFixed(4)} | ${r.peakAt[i].toFixed(2)} | ${r.at[0.5][i].toFixed(4)} | ${r.at[1][i].toFixed(4)} | ${r.at[2][i].toFixed(4)} | ${r.at[4][i].toFixed(4)} | ${d.pulse.toFixed(3)} | ${d.shell.toFixed(3)} | ${d.core.toFixed(3)} | ${d.haloBaseline.toFixed(3)} | ${d.haloFollow.toFixed(3)} |`); });
  }
  console.log('\nMapping:'); for (const [k, v] of Object.entries(MAPPING)) console.log(`- ${k}: ${v}`);
}
