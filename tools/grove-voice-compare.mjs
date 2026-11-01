// Proposal 015b: the measurable A/B between today's Grove voice (M = 1, one lumped mode per body) and the proposed voice
// (M = 3 beam partials per body coupled through the bridges), at EQUAL reference force and the SAME pickup, pan and gain
// conventions. Writes renders/grove-voice-<seed>-m1.wav, -m3.wav (stereo) and renders/grove-voice-report.json, and prints
// the table. Reports quantify; no claim about the audition until someone has listened.
//   node tools/grove-voice-compare.mjs [--seeds 3,7,11] [--partials 3] [--strikeU 0.6] [--attachU 1] [--pickupU 1] [--rate 48000]
import { writeFileSync, mkdirSync } from 'node:fs';
import { composeGrove, groveSystem, groveRingSeconds, GROVE_SEEDS } from '../src/score/grove.js';
import { modalNetwork, networkStrikeResponse, networkPickupScale } from '../src/coupling.js';
import { modesOf, GEOMETRY_MATERIALS } from '../src/geometry.js';
import { stereoWav } from '../src/loom/model.js';

const arg = (name, fallback) => { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : fallback; };
const seeds = String(arg('seeds', GROVE_SEEDS.join(','))).split(',').map(Number), M = Number(arg('partials', 3));
const strikeU = Number(arg('strikeU', 0.6)), attachU = Number(arg('attachU', 1)), pickupU = Number(arg('pickupU', 1)), rate = Number(arg('rate', 48000));
const LEVEL = 0.19, GAIN_CEILING = 0.45, FADE = 0.25, J = 1;
mkdirSync('renders', { recursive: true });

/** Pans and tail exactly as src/grove/performance.js states them (equal-power from layout.x, 1/√N; Loom tail level). */
const pansOf = grove => grove.layout.map(({ x }) => [Math.cos((x + 1) * Math.PI / 4) / Math.sqrt(grove.bodies.length), Math.sin((x + 1) * Math.PI / 4) / Math.sqrt(grove.bodies.length)]);
const tail = (ring, t) => t < 0 || t >= ring ? 0 : Math.min(1, (ring - t) / FADE);

/** The beam partial family: frequencies by clamped-free ratios from the body's tuning, decay rates ∝ frequency anchored to the grove's loss, shapes from geometry.js. */
const beamSet = modesOf({ kind: 'beam', support: 'clamped-free', material: GEOMETRY_MATERIALS.steel, lengthM: 0.065, thicknessM: 0.001, widthM: 0.01 }, { count: M });
const ratios = beamSet.freqsHz.map(f => f / beamSet.freqsHz[0]);
const tipShape = beamSet.weightsAt(attachU);

/** Voice A: today's grove. Stereo modes for a unit strike on body 0: Σ_bodies pan · pickup modes, one network-wide pickup scale. */
function voiceM1(grove) {
  const system = groveSystem(grove), scale = networkPickupScale(system, { level: LEVEL }), pans = pansOf(grove);
  const unit = body => networkStrikeResponse(system, system.m.map((_, i) => (i === body ? J : 0)));
  const stereo = body => [0, 1].map(ch => system.normalFreqsHz.map((frequency, r) => ({ frequency, amplitude: system.m.reduce((sum, _, i) => sum + scale * unit(body).bodyModes(i)[r].amplitude * pans[i][ch], 0), decay: system.decayS })));
  const perBody = body => system.m.map((_, i) => unit(body).bodyModes(i).map(m => ({ ...m, amplitude: scale * m.amplitude })));
  return { label: 'M = 1 (today)', system, normalFreqsHz: system.normalFreqsHz, stereoUnit: stereo, pickupModes: perBody, lowBandIndex: system.normalFreqsHz.map((_, r) => r) };
}

/** Voice B: partials coupled through the bridges at attachU; strike at strikeU; pickup at pickupU; the same scale/pan/gain rules. */
function voiceM3(grove) {
  const n = grove.bodies.length, bodies = grove.bodies.map(b => ({ mass: b.mass, frequencies: ratios.map(r => b.hz * r), decayRates: ratios.map(r => grove.loss * r), shape: u => beamSet.weightsAt(u) }));
  // Bridge stiffness exactly as groveSystem states it (coupling · m_a · ω_a²), with the attachment shape normalized so M = 1 at the tip is today's grove.
  const edges = grove.bridges.map(e => ({ a: e.a, b: e.b, kc: e.coupling * grove.bodies[e.a].mass * (2 * Math.PI * grove.bodies[e.a].hz) ** 2 / (tipShape[0] * tipShape[0]), ua: attachU, ub: attachU }));
  const system = modalNetwork({ bodies, edges }), pans = pansOf(grove);
  const unit = body => system.strike(body, strikeU, J);
  let peak = 1e-300; for (let b = 0; b < n; b++) for (let i = 0; i < n; i++) for (const m of unit(b).bodyModes(i, pickupU)) peak = Math.max(peak, Math.abs(m.amplitude));
  const scale = LEVEL / peak;
  const stereo = body => [0, 1].map(ch => system.normalFreqsHz.map((frequency, r) => ({ frequency, amplitude: grove.bodies.reduce((sum, _, i) => sum + scale * unit(body).bodyModes(i, pickupU)[r].amplitude * pans[i][ch], 0), decay: 1 / system.gammas[r] })));
  const perBody = body => grove.bodies.map((_, i) => unit(body).bodyModes(i, pickupU).map(m => ({ ...m, amplitude: scale * m.amplitude })));
  const fundamental = Math.min(...grove.bodies.map(b => b.hz));
  return { label: `M = ${M} (partials)`, system, normalFreqsHz: system.normalFreqsHz, stereoUnit: stereo, pickupModes: perBody, lowBandIndex: system.normalFreqsHz.map((f, r) => (f < 1.5 * fundamental ? r : -1)).filter(r => r >= 0), damping: system.damping, dampingResidual: system.dampingResidual };
}

function render(voice, grove, body = 0) {
  const ring = groveRingSeconds(grove), stereo = voice.stereoUnit(body);
  const bound = Math.max(...stereo.map(ch => ch.reduce((s, m) => s + Math.abs(m.amplitude), 0))), gain = GAIN_CEILING / Math.max(1, bound);
  const length = Math.ceil(ring * rate), channels = stereo.map(modes => { const out = new Float32Array(length); for (let i = 0; i < length; i++) { const t = i / rate; let v = 0; for (const m of modes) v += m.amplitude * Math.exp(-t / m.decay) * Math.sin(2 * Math.PI * m.frequency * t); out[i] = gain * tail(ring, t) * v; } return out; });
  return { channels, sampleRate: rate, gain, unitBound: bound, ring };
}

const metrics = (voice, grove, pcm) => {
  const modes = voice.pickupModes(0)[0];                                       // the struck body's own pickup
  const ref = Math.max(...modes.map(m => Math.abs(m.amplitude)));
  const partialsAt50ms = modes.filter(m => Math.abs(m.amplitude) * Math.exp(-0.05 / m.decay) > ref * 10 ** (-40 / 20)).length;
  // Spectral centroid over the first 0.5 s from the modal energy of the struck body's pickup (exact for additive modes, no windowing artefacts).
  const energy = m => m.amplitude * m.amplitude * (m.decay / 2) * (1 - Math.exp(-1 / m.decay));
  const centroid = modes.reduce((s, m) => s + m.frequency * energy(m), 0) / modes.reduce((s, m) => s + energy(m), 0);
  let peak = 0, sum = 0, count = 0; for (const ch of pcm.channels) for (let i = 0; i < Math.min(ch.length, rate); i++) { peak = Math.max(peak, Math.abs(ch[i])); sum += ch[i] * ch[i]; count++; }
  // Low-band swell of each other body (first local maximum of the coherent envelope of the low-band modes) for a unit strike on body 0.
  const swells = grove.bodies.map((_, i) => i).filter(i => i !== 0).map(i => {
    const all = voice.pickupModes(0)[i], low = voice.lowBandIndex.map(r => all[r]), base = Math.min(...low.map(m => m.frequency));
    const env = t => { let re = 0, im = 0; for (const m of low) { const a = m.amplitude * Math.exp(-t / m.decay), ang = 2 * Math.PI * (m.frequency - base) * t; re += a * Math.cos(ang); im += a * Math.sin(ang); } return Math.hypot(re, im); };
    const ownLow = voice.lowBandIndex.map(r => modes[r]), ownBase = Math.min(...ownLow.map(m => m.frequency));
    const ownEnv = t => { let re = 0, im = 0; for (const m of ownLow) { const a = m.amplitude * Math.exp(-t / m.decay), ang = 2 * Math.PI * (m.frequency - ownBase) * t; re += a * Math.cos(ang); im += a * Math.sin(ang); } return Math.hypot(re, im); };
    let prev = env(0), found = null; for (let t = 0.002; t <= pcm.ring; t += 0.002) { const cur = env(t); if (cur < prev) { found = { seconds: +(t - 0.002).toFixed(3), ratio: +(prev / Math.max(ownEnv(0), ownEnv(0.002))).toFixed(4) }; break; } prev = cur; }
    return { body: i, ...(found ?? { seconds: null, ratio: 0 }) };
  });
  return { normalModesHz: voice.normalFreqsHz.map(f => +f.toFixed(3)), partialsAbove40dBAt50ms: partialsAt50ms, spectralCentroidHz: +centroid.toFixed(2), partialDecaysS: modes.map(m => +m.decay.toFixed(3)), peak: +peak.toFixed(6), rmsFirstSecond: +Math.sqrt(sum / count).toFixed(6), outputGain: +pcm.gain.toFixed(6), unitStereoBound: +pcm.unitBound.toFixed(6), lowBandSwells: swells };
};

const report = { version: 1, generated: new Date().toISOString(), conventions: { referenceForce: J, pickupLevel: LEVEL, pan: 'equal-power from layout.x, 1/√N (src/grove/performance.js convention)', gain: 'GAIN_CEILING / max(1, worst unit stereo modal bound), per voice, same rule for both', strikeU, attachU, pickupU, partials: M, partialFamily: 'clamped-free beam ratios and shapes (geometry.js); decay rates ∝ frequency anchored to the grove loss', damping: 'M = 1: proportional; M = 3: classical-damping approximation (see src/coupling.js modalNetwork)', sampleRate: rate, metricsNote: 'centroid and partial counts from the struck body\'s pickup modes; swells on the low band (modes below 1.5× the lowest tuning) so the relationship readout stays comparable; no energy claims; no listening judgment' }, seeds: {} };
for (const seed of seeds) {
  const grove = composeGrove({ seed }), a = voiceM1(grove), b = voiceM3(grove), pa = render(a, grove), pb = render(b, grove);
  writeFileSync(`renders/grove-voice-${seed}-m1.wav`, Buffer.from(stereoWav(pa)));
  writeFileSync(`renders/grove-voice-${seed}-m${M}.wav`, Buffer.from(stereoWav(pb)));
  report.seeds[seed] = { topology: grove.topology, m1: metrics(a, grove, pa), [`m${M}`]: { ...metrics(b, grove, pb), dampingResidual: +b.dampingResidual.toExponential(3) } };
  const r = report.seeds[seed];
  console.log(`seed ${seed} (${grove.topology}):\n  M=1  modes ${r.m1.normalModesHz.join('/')} Hz · centroid ${r.m1.spectralCentroidHz} Hz · partials@50ms ${r.m1.partialsAbove40dBAt50ms} · peak ${r.m1.peak} rms ${r.m1.rmsFirstSecond} · swells ${r.m1.lowBandSwells.map(s => `${s.body}:${s.seconds}s×${s.ratio}`).join(' ')}\n  M=${M}  modes ${r[`m${M}`].normalModesHz.join('/')} Hz · centroid ${r[`m${M}`].spectralCentroidHz} Hz · partials@50ms ${r[`m${M}`].partialsAbove40dBAt50ms} · peak ${r[`m${M}`].peak} rms ${r[`m${M}`].rmsFirstSecond} · swells ${r[`m${M}`].lowBandSwells.map(s => `${s.body}:${s.seconds}s×${s.ratio}`).join(' ')} · decays ${r[`m${M}`].partialDecaysS.join('/')}`);
}
writeFileSync('renders/grove-voice-report.json', JSON.stringify(report, null, 1));
console.log('wrote renders/grove-voice-<seed>-m1.wav, -m' + M + '.wav and renders/grove-voice-report.json');
