// Study, Node only, no estimator in src: what a plain spectral estimator can and cannot recover from a short decaying note, on sounds whose true
// resonances are known. Numbers and refusals only; no admission bound, no three-peak promise; the Smith two-cycle rule is printed as a
// prediction per case and tested, not used as a guarantee. usage: node tools/study-sound-file-target.mjs
import { readFileSync } from 'node:fs';
import { createInverseInstrument } from '../src/inverse/instrument.js';
import { familyRatioBound } from '../src/score/grove-inverse.js';

export const STUDY_DEFINITIONS = Object.freeze({
  window: 'W seconds from the note\'s first sample, either rectangular (no taper; best resolution, main-lobe half-width fs/W, first sidelobe −13 dB) or Hann (half-width 2 fs/W, first sidelobe −31 dB), zero-padded to the next power of two of at least 4 W fs for interpolation; W in {0.25, 0.5, 1, 2, 4, 8} s, limited to the signal length; both windows are run on every case so resolution and dynamic range can be compared',
  peaks: 'local maxima of the magnitude spectrum between 20 Hz and fs/2 that exceed 6 dB above the median magnitude of the window\'s spectrum and are at least one full rectangular main lobe (2 fs/W Hz) from a stronger accepted peak; and exceed every stronger accepted peak\'s sidelobe envelope by 3.5 dB at any distance (rectangular: 1/(π·max(d − 0.5, 0.5)) with d in half-widths; Hann: a flat −31 dB), which is also the study\'s dynamic-range limit: a true mode weaker than a stronger mode\'s skirt at its distance is not certified by that window; frequency refined by quadratic interpolation of log magnitude over the three bins around the maximum; at most eight peaks reported, strongest first',
  decay: 'per accepted peak, the amplitude of a 0.25 s rectangular frame hopped by 0.125 s at the peak\'s refined frequency (projection on the complex exponential), fitted by least squares on log amplitude over frames whose amplitude exceeds 1 % of the first; decay = −1/slope in seconds; reported with the fit\'s RMS residual in dB; frames fewer than three give no decay',
  commonDecay: 'never averaged automatically: each mode\'s decay is reported separately with the spread (max/min); a common decay is a declaration the visitor would make',
  smithPrediction: 'the rectangular-window rule from Smith (SASP, Frequency Resolution): two sinusoids need W ≥ 2 / Δf (Abe and Smith: 1.44 / Δf for accurate peak frequency); printed per case as the predicted minimum W for the case\'s closest true pair, and compared with what the study found',
  evidence: 'supported estimates = accepted peaks at least 20 dB above the window\'s median magnitude that have a decay fit (weaker peaks are listed but not counted); fewer than three means insufficient evidence for a three-resonance target and nothing is invented; because the rectangular window lists beating sidelobes of a merged cluster as peaks, the Hann count is the evidence count and the rectangular pass is the resolution probe',
});

const fail = m => { throw new Error(`sound-file study: ${m}`); };
function fft(re, im) { const n = re.length; for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) { const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang); for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const a = i + k, b = a + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr; re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti; const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr; } } } }

/** Synthetic decaying modes: sum of a·e^{−t/τ}·cos(2πft+φ), optionally with white noise at `noiseDb` below the signal peak. */
export function synthesize({ modes, seconds = 4, sampleRate = 48000, noiseDb = null, seed = 1 }) {
  const n = Math.round(seconds * sampleRate), x = new Float64Array(n);
  for (const m of modes) for (let i = 0; i < n; i++) { const t = i / sampleRate; x[i] += m.amplitude * Math.exp(-t / m.decay) * Math.cos(2 * Math.PI * m.hz * t + (m.phase ?? 0)); }
  if (noiseDb !== null) { let peak = 0; for (const v of x) peak = Math.max(peak, Math.abs(v)); let s = seed >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; const sigma = peak * 10 ** (noiseDb / 20); for (let i = 0; i < n; i++) { const u = Math.max(rnd(), 1e-12), v = rnd(); x[i] += sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); } }
  return { samples: x, sampleRate };
}

export function estimate(samples, sampleRate, W, { window = 'rect' } = {}) {
  const len = Math.min(samples.length, Math.round(W * sampleRate)); if (len < 64) fail('window too short');
  let size = 1; while (size < 4 * len) size <<= 1;
  const re = new Float64Array(size), im = new Float64Array(size);
  for (let i = 0; i < len; i++) re[i] = window === 'hann' ? samples[i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (len - 1))) : samples[i];
  fft(re, im); const bins = size / 2, mag = new Float64Array(bins); for (let k = 0; k < bins; k++) mag[k] = Math.hypot(re[k], im[k]);
  const hzPerBin = sampleRate / size, lo = Math.ceil(20 / hzPerBin), med = [...mag.slice(lo)].sort((a, b) => a - b)[Math.floor((bins - lo) / 2)], floor = med * 2;
  const lobeHz = (window === 'hann' ? 2 : 1) * sampleRate / len, lobe = 2 * lobeHz / hzPerBin;   // main-lobe half-width: fs/len (rectangular) or 2 fs/len (Hann); exclusion one full lobe in padded bins
  const candidates = [];
  for (let k = lo + 1; k < bins - 1; k++) if (mag[k] > floor && mag[k] >= mag[k - 1] && mag[k] > mag[k + 1]) candidates.push(k);
  candidates.sort((a, b) => mag[b] - mag[a]);
  const peaks = [];
  // Sidelobe rejection for the rectangular window: a sinusoid's magnitude at an offset Δ beyond its main lobe falls as 1/(π Δ / lobeHz), so a weaker
  // candidate within 16 lobes of a stronger accepted peak is rejected when its magnitude is below that envelope times 1.5 (a 3.5 dB margin).
  // Sidelobe rejection at any distance d (in half-widths) from a stronger accepted peak, with a 3.5 dB margin: rectangular envelope
  // 1/(π·max(d−0.5, 0.5)) (the first sidelobe sits near d = 1.43 at −13 dB; the −0.5 keeps the envelope above it), Hann envelope a flat −31 dB
  // (its first sidelobe), so a weaker true mode under a stronger mode's skirt is not certified: the study's dynamic-range limit.
  const sidelobe = (strong, k) => { const d = Math.abs(strong.bin - k) * hzPerBin / lobeHz; if (d < 1) return false; const envelope = window === 'hann' ? 10 ** (-31 / 20) : 1 / (Math.PI * Math.max(d - 0.5, 0.5)); return mag[k] < 1.5 * mag[strong.bin] * envelope; };
  for (const k of candidates) { if (peaks.length >= 8) break; if (peaks.some(p => Math.abs(p.bin - k) < lobe)) continue; if (peaks.some(p => sidelobe(p, k))) continue;
    const a = Math.log(mag[k - 1]), b = Math.log(mag[k]), c = Math.log(mag[k + 1]), d = (a - 2 * b + c) === 0 ? 0 : 0.5 * (a - c) / (a - 2 * b + c);
    peaks.push({ bin: k, hz: (k + d) * hzPerBin, magnitudeDb: 20 * Math.log10(mag[k] / (len / 2)), aboveMedianDb: 20 * Math.log10(mag[k] / med) }); }
  for (const p of peaks) {   // decay from frame projections at the refined frequency
    const frame = Math.round(0.25 * sampleRate), hop = Math.round(0.125 * sampleRate), amps = [], times = [];
    for (let start = 0; start + frame <= samples.length; start += hop) { let sr = 0, si = 0; for (let i = 0; i < frame; i++) { const t = (start + i) / sampleRate; sr += samples[start + i] * Math.cos(2 * Math.PI * p.hz * t); si -= samples[start + i] * Math.sin(2 * Math.PI * p.hz * t); } amps.push(2 * Math.hypot(sr, si) / frame); times.push((start + frame / 2) / sampleRate); }
    const used = []; for (let i = 0; i < amps.length; i++) if (amps[i] > 0.01 * amps[0]) used.push(i); else break;
    if (used.length >= 3) { const xs = used.map(i => times[i]), ys = used.map(i => Math.log(amps[i])), mx = xs.reduce((s, v) => s + v) / xs.length, my = ys.reduce((s, v) => s + v) / ys.length; const slope = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / xs.reduce((s, x) => s + (x - mx) ** 2, 0); const res = Math.sqrt(ys.reduce((s, y, i) => s + (y - (my + slope * (xs[i] - mx))) ** 2, 0) / xs.length); p.decay = slope < 0 ? -1 / slope : null; p.decayFitDb = 20 * res / Math.log(10); p.frames = used.length; } else { p.decay = null; p.frames = used.length; } }
  // 'supported' counts only peaks at least 20 dB above the window's median magnitude with a decay fit; weaker listed peaks are shown but not counted
  return { W: len / sampleRate, window, hzPerBin, mainLobeHz: lobeHz, peaks, supported: peaks.filter(p => p.decay !== null && p.aboveMedianDb >= 20).length };
}

export function compare(found, truth) {   // match each true mode to the nearest found peak within the main-lobe half-width fs/W; report cents and decay error
  return truth.map(t => { let best = null; for (const p of found.peaks) { const cents = 1200 * Math.log2(p.hz / t.hz); if (Math.abs(p.hz - t.hz) <= found.mainLobeHz && (!best || Math.abs(cents) < Math.abs(best.cents))) best = { cents, decayErrorPct: p.decay && t.decay ? 100 * (p.decay - t.decay) / t.decay : null, peak: p }; } return { hz: t.hz, decay: t.decay, matched: !!best, ...(best ?? {}) }; });
}

export function smithMinimumWindow(truth) { let min = Infinity; for (let i = 0; i < truth.length; i++) for (let j = i + 1; j < truth.length; j++) min = Math.min(min, Math.abs(truth[i].hz - truth[j].hz)); return Number.isFinite(min) ? { closestPairHz: min, twoCyclesSeconds: 2 / min, abeSmithSeconds: 1.44 / min } : null; }

export function cases() {
  const chain = JSON.parse(readFileSync(new URL('../tests/fixtures/inverse-kept-chain.json', import.meta.url), 'utf8')).grove;
  const inst = createInverseInstrument(chain, { sampleRate: 48000 }), strike = inst.renderStrike(1), mono = Float64Array.from(strike.channels[0], (v, i) => (v + strike.channels[1][i]) / 2);
  const truthChain = inst.normalFrequenciesHz.map(hz => ({ hz, decay: inst.decaySeconds }));
  const f = truthChain.map(t => t.hz), tau = inst.decaySeconds;
  return [
    { name: 'kept chain, rendered strike on body 2 (true resonances known)', samples: mono, sampleRate: 48000, truth: truthChain, expect: 'three modes 2.3 and 1.0 Hz apart with one decay' },
    { name: 'synthetic: the same three resonances, equal amplitudes, one decay', ...synthesize({ modes: f.map(hz => ({ hz, amplitude: 1, decay: tau })), seconds: 8 }), truth: truthChain, expect: 'the controlled version of the chain' },
    { name: 'synthetic: three resonances plus three partials at 802, 813, 820 Hz', ...synthesize({ modes: [...f.map(hz => ({ hz, amplitude: 1, decay: tau })), ...[802.1, 813.2, 819.8].map(hz => ({ hz, amplitude: 0.5, decay: 0.6 }))], seconds: 8 }), truth: [...truthChain, ...[802.1, 813.2, 819.8].map(hz => ({ hz, decay: 0.6 }))], expect: 'a handful of clear partials above the low three' },
    { name: 'synthetic: unequal decays (0.8, 2.4, 5 s) at 140, 190, 260 Hz', ...synthesize({ modes: [{ hz: 140, amplitude: 1, decay: 0.8 }, { hz: 190, amplitude: 1, decay: 2.4 }, { hz: 260, amplitude: 1, decay: 5 }], seconds: 8 }), truth: [{ hz: 140, decay: 0.8 }, { hz: 190, decay: 2.4 }, { hz: 260, decay: 5 }], expect: 'well separated, decays differ: no common decay' },
    { name: 'synthetic: close pair 1 Hz apart (200 and 201 Hz) with 300 Hz, phases 0 and π (cancellation)', ...synthesize({ modes: [{ hz: 200, amplitude: 1, decay: 3 }, { hz: 201, amplitude: 1, decay: 3, phase: Math.PI }, { hz: 300, amplitude: 1, decay: 3 }], seconds: 8 }), truth: [{ hz: 200, decay: 3 }, { hz: 201, decay: 3 }, { hz: 300, decay: 3 }], expect: 'unresolved at short windows; phase cancellation' },
    { name: 'synthetic: missing mode (only two resonances at 150 and 240 Hz)', ...synthesize({ modes: [{ hz: 150, amplitude: 1, decay: 2 }, { hz: 240, amplitude: 1, decay: 2 }], seconds: 8 }), truth: [{ hz: 150, decay: 2 }, { hz: 240, decay: 2 }], expect: 'insufficient evidence for three' },
    { name: 'synthetic: the chain resonances with white noise at −30 dB', ...synthesize({ modes: f.map(hz => ({ hz, amplitude: 1, decay: tau })), seconds: 8, noiseDb: -30 }), truth: truthChain, expect: 'noise' },
    { name: 'negative: four resonances (120, 160, 230, 310 Hz)', ...synthesize({ modes: [120, 160, 230, 310].map(hz => ({ hz, amplitude: 1, decay: 2 })), seconds: 8 }), truth: [120, 160, 230, 310].map(hz => ({ hz, decay: 2 })), expect: 'more than the model holds: report, do not force' },
    { name: 'negative: white noise only', ...synthesize({ modes: [], seconds: 8, noiseDb: null }), truth: [], expect: 'no supported estimates' },
  ].map(c => { if (c.name.includes('noise only')) { const s = synthesize({ modes: [{ hz: 1, amplitude: 1e-9, decay: 1 }], seconds: 8, noiseDb: 0 }); c.samples = s.samples; } return c; });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const bound = familyRatioBound({ equalMasses: true });
  for (const c of cases()) {
    const pred = smithMinimumWindow(c.truth);
    console.log(`\n### ${c.name}\nexpect: ${c.expect}${pred ? `; Smith prediction for the closest pair (${pred.closestPairHz.toFixed(2)} Hz): W ≥ ${pred.twoCyclesSeconds.toFixed(2)} s (two cycles), ${pred.abeSmithSeconds.toFixed(2)} s (1.44 cycles)` : ''}; family ratio bound ${bound.toFixed(4)}`);
    console.log('| window W s | peaks (Hz, dB above median, τ s) | supported | per true mode: matched, cents, decay s (error %) |\n|---|---|---|---|');
    for (const window of ['rect', 'hann']) for (const W of [0.25, 0.5, 1, 2, 4, 8]) { if (W * c.sampleRate > c.samples.length + 1) continue; const r = estimate(c.samples, c.sampleRate, W, { window }), m = compare(r, c.truth);
      console.log(`| ${window} ${r.W.toFixed(2)} | ${r.peaks.map(p => `${p.hz.toFixed(2)} (${p.aboveMedianDb.toFixed(0)})${p.decay ? ' τ' + p.decay.toFixed(2) : ''}`).join(', ') || 'none'} | ${r.supported} | ${m.map(t => t.matched ? `${t.hz.toFixed(1)}: ${t.cents.toFixed(1)} c${t.decayErrorPct !== null ? `, ${t.peak.decay.toFixed(2)} s (${t.decayErrorPct.toFixed(0)} %)` : ', no decay'}` : `${t.hz.toFixed(1)}: unmatched`).join('; ') || 'no truth'} |`); }
  }
  console.log('\nDefinitions:'); for (const [k, v] of Object.entries(STUDY_DEFINITIONS)) console.log(`- ${k}: ${v}`);
}
