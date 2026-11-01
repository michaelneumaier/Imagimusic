// Proposal 015b: the measurable A/B between today's Grove voice (M = 1, one lumped mode per body) and the proposed voice
// (M = 3 beam partials per body coupled through the bridges), at EQUAL reference force and the SAME pickup, pan and gain
// conventions. Writes renders/grove-voice-<seed>-m1.wav, -m3.wav (stereo) and renders/grove-voice-report.json, and prints
// the table. Reports quantify; no claim about the audition until someone has listened.
//   node tools/grove-voice-compare.mjs [--seeds 3,7,11] [--partials 3] [--strikeU 0.6] [--attachU 1] [--pickupU 1] [--rate 48000]
import { writeFileSync, mkdirSync } from 'node:fs';
import { composeGrove, groveRingSeconds, GROVE_SEEDS } from '../src/score/grove.js';
import { createGroveVoice } from '../src/score/grove-voice.js';
import { stereoWav } from '../src/loom/model.js';

const arg = (name, fallback) => { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : fallback; };
const seeds = String(arg('seeds', GROVE_SEEDS.join(','))).split(',').map(Number), M = Number(arg('partials', 3));
const strikeU = Number(arg('strikeU', 0.6)), attachU = Number(arg('attachU', 1)), pickupU = Number(arg('pickupU', 1)), rate = Number(arg('rate', 48000));
const LEVEL = 0.19, GAIN_CEILING = 0.45, FADE = 0.25, J = 1;
mkdirSync('renders', { recursive: true });

const tail = (ring, t) => t < 0 || t >= ring ? 0 : Math.min(1, (ring - t) / FADE);


/** Both voices come from the shared factory (src/score/grove-voice.js): A is partials 1 at the tip (today's Grove, tested identical to
 *  createGroveInstrument), B is the richer voice; for the comparison each voice uses ONE strike position (strikeU) so its pickup scale is
 *  taken over that position only, exactly as reported in conventions. */
function voiceOf(grove, partials) {
  const voice = createGroveVoice(grove, { version: 1, family: 'clamped-free', partials, attachU, pickupU, positions: [partials === 1 ? 1 : strikeU] });
  return { label: partials === 1 ? 'M = 1 (today)' : `M = ${partials} (partials)`, pickupScale: voice.pickupScale, normalFreqsHz: voice.normalFreqsHz, stereoUnit: body => voice.stereoModes[0][body], pickupModes: body => voice.pickupModes[0][body], lowBandIndex: voice.lowBandIndex, dampingResidual: voice.dampingResidual, voice };
}
const voiceM1 = grove => voiceOf(grove, 1), voiceM3 = grove => voiceOf(grove, M);

function render(voice, grove, body = 0) {
  const ring = groveRingSeconds(grove), stereo = voice.stereoUnit(body);
  // Fixed gain per voice from the WORST unit stereo modal bound over every struck body and both channels (src/grove/performance.js rule).
  const bound = Math.max(...grove.bodies.map((_, b) => voice.stereoUnit(b)).flat().map(ch => ch.reduce((s, m) => s + Math.abs(m.amplitude), 0))), gain = GAIN_CEILING / Math.max(1, bound);
  const length = Math.ceil(ring * rate), channels = stereo.map(modes => { const out = new Float32Array(length); for (let i = 0; i < length; i++) { const t = i / rate; let v = 0; for (const m of modes) v += m.amplitude * Math.exp(-t / m.decay) * Math.sin(2 * Math.PI * m.frequency * t); out[i] = gain * tail(ring, t) * v; } return out; });
  return { channels, sampleRate: rate, gain, unitBound: bound, ring };
}

const metrics = (voice, grove, pcm) => {
  const modes = voice.pickupModes(0)[0];                                       // the struck body's own pickup
  const ref = Math.max(...modes.map(m => Math.abs(m.amplitude)));
  const partialsAt50ms = modes.filter(m => Math.abs(m.amplitude) * Math.exp(-0.05 / m.decay) > ref * 10 ** (-40 / 20)).length;
  // Modal centroid ESTIMATE: normal-mode frequencies weighted by each mode's envelope energy over the first 0.5 s (∫ a² e^(−2t/τ) dt); it ignores
  // sinusoidal cross terms between nearby modes, so it is not a finite-window audio spectral centroid of the PCM.
  const energy = m => m.amplitude * m.amplitude * (m.decay / 2) * (1 - Math.exp(-1 / m.decay));
  const centroid = modes.reduce((s, m) => s + m.frequency * energy(m), 0) / modes.reduce((s, m) => s + energy(m), 0);
  let peak = 0, sum = 0, count = 0; for (const ch of pcm.channels) { for (let i = 0; i < ch.length; i++) peak = Math.max(peak, Math.abs(ch[i])); for (let i = 0; i < Math.min(ch.length, rate); i++) { sum += ch[i] * ch[i]; count++; } }
  // Low-band swell of each other body (first local maximum of the coherent envelope of the low-band modes) for a unit strike on body 0.
  const swells = grove.bodies.map((_, i) => i).filter(i => i !== 0).map(i => {
    const all = voice.pickupModes(0)[i], low = voice.lowBandIndex.map(r => all[r]), base = Math.min(...low.map(m => m.frequency));
    const env = t => { let re = 0, im = 0; for (const m of low) { const a = m.amplitude * Math.exp(-t / m.decay), ang = 2 * Math.PI * (m.frequency - base) * t; re += a * Math.cos(ang); im += a * Math.sin(ang); } return Math.hypot(re, im); };
    const ownLow = voice.lowBandIndex.map(r => modes[r]), ownBase = Math.min(...ownLow.map(m => m.frequency));
    const ownEnv = t => { let re = 0, im = 0; for (const m of ownLow) { const a = m.amplitude * Math.exp(-t / m.decay), ang = 2 * Math.PI * (m.frequency - ownBase) * t; re += a * Math.cos(ang); im += a * Math.sin(ang); } return Math.hypot(re, im); };
    let prev = env(0), found = null; for (let t = 0.002; t <= pcm.ring; t += 0.002) { const cur = env(t); if (cur < prev) { found = { seconds: +(t - 0.002).toFixed(3), ratio: +(prev / Math.max(ownEnv(0), ownEnv(0.002))).toFixed(4) }; break; } prev = cur; }
    return { body: i, ...(found ?? { seconds: null, ratio: 0 }) };
  });
  return { normalModesHz: voice.normalFreqsHz.map(f => +f.toFixed(3)), partialsAbove40dBAt50ms: partialsAt50ms, modalCentroidEstimateHz: +centroid.toFixed(2), partialDecaysS: modes.map(m => +m.decay.toFixed(3)), peakFullRender: +peak.toFixed(6), rmsFirstSecond: +Math.sqrt(sum / count).toFixed(6), outputGain: +pcm.gain.toFixed(6), worstUnitStereoBound: +pcm.unitBound.toFixed(6), pickupScale: +voice.pickupScale.toExponential(6), lowBandSwells: swells };
};

const report = { version: 1, generated: new Date().toISOString(), conventions: { referenceForce: J, pickupLevel: LEVEL, pan: 'equal-power from layout.x, 1/√N (src/grove/performance.js convention)', gain: 'GAIN_CEILING / max(1, worst unit stereo modal bound over every struck body and both channels), per voice: the same RULE for both voices, so the two output gains can differ; both are reported', pickup: 'the 0.19 level is mapped to the largest |modal amplitude| over all unit strikes and pickups separately for each voice: the same normalization RULE, not an identical physical pickup gain; each voice\'s pickupScale is reported', strikeU, attachU, pickupU, partials: M, partialFamily: 'clamped-free beam ratios and shapes (geometry.js); decay rates ∝ frequency anchored to the grove loss', damping: 'M = 1: proportional; M = 3: classical-damping approximation (see src/coupling.js modalNetwork)', sampleRate: rate, metricsNote: 'modalCentroidEstimateHz is an envelope-energy-weighted estimate from the struck body\'s pickup modes over the first 0.5 s (cross terms ignored), not a PCM spectral centroid; partial counts from the same modes; peakFullRender over the whole render, rmsFirstSecond over the first second; swells on the low band (modes below 1.5× the lowest tuning) so the relationship readout stays comparable; no energy claims; no listening judgment' }, seeds: {} };
for (const seed of seeds) {
  const grove = composeGrove({ seed }), a = voiceM1(grove), b = voiceM3(grove), pa = render(a, grove), pb = render(b, grove);   // gain from the worst bound over all struck bodies for THIS voice's single position
  writeFileSync(`renders/grove-voice-${seed}-m1.wav`, Buffer.from(stereoWav(pa)));
  writeFileSync(`renders/grove-voice-${seed}-m${M}.wav`, Buffer.from(stereoWav(pb)));
  report.seeds[seed] = { topology: grove.topology, m1: metrics(a, grove, pa), [`m${M}`]: { ...metrics(b, grove, pb), dampingResidual: +b.dampingResidual.toExponential(3) } };
  const r = report.seeds[seed];
  console.log(`seed ${seed} (${grove.topology}): pickupScale m1 ${r.m1.pickupScale} / m${M} ${r[`m${M}`].pickupScale}; gain m1 ${r.m1.outputGain} / m${M} ${r[`m${M}`].outputGain}\n  M=1  modes ${r.m1.normalModesHz.join('/')} Hz · modal centroid est. ${r.m1.modalCentroidEstimateHz} Hz · partials@50ms ${r.m1.partialsAbove40dBAt50ms} · peak(full) ${r.m1.peakFullRender} rms ${r.m1.rmsFirstSecond} · swells ${r.m1.lowBandSwells.map(s => `${s.body}:${s.seconds}s×${s.ratio}`).join(' ')}\n  M=${M}  modes ${r[`m${M}`].normalModesHz.join('/')} Hz · modal centroid est. ${r[`m${M}`].modalCentroidEstimateHz} Hz · partials@50ms ${r[`m${M}`].partialsAbove40dBAt50ms} · peak(full) ${r[`m${M}`].peakFullRender} rms ${r[`m${M}`].rmsFirstSecond} · swells ${r[`m${M}`].lowBandSwells.map(s => `${s.body}:${s.seconds}s×${s.ratio}`).join(' ')} · decays ${r[`m${M}`].partialDecaysS.join('/')}`);
}
writeFileSync('renders/grove-voice-report.json', JSON.stringify(report, null, 1));
console.log('wrote renders/grove-voice-<seed>-m1.wav, -m' + M + '.wav and renders/grove-voice-report.json');
