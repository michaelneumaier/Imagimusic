// Known-answer research only. Run: node tools/study-sound-candidates.mjs > report.json
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {estimate, compare, synthesize} from './study-sound-file-target.mjs';

export function scoreCandidates(result, truth) {
  // Match only candidates passing the actual study thresholds. Matching all
  // listed peaks first could assign truth to a peak excluded from the count.
  const peaks = result.peaks.filter(p => p.decay !== null && p.aboveMedianDb >= 20);
  const matches = compare({...result, peaks}, truth);
  const assigned = new Set(matches.filter(m => m.matched).map(m => m.peakIndex));
  return {
    candidates: peaks.length,
    matched: assigned.size,
    missed: truth.length - assigned.size,
    unmatchedCandidates: peaks.length - assigned.size,
    accurateFrequency: matches.filter(m => m.matched && Math.abs(m.cents) <= 5).length,
    accurateDecay: matches.filter(m => m.matched && m.decayErrorPct !== null && Math.abs(m.decayErrorPct) <= 20).length,
    matches: matches.map(({peak, ...m}) => ({...m, fitResidualDb:peak?.decayFitDb ?? null})),
    residuals: peaks.map((p, index) => ({hz:p.hz, fitResidualDb:p.decayFitDb ?? null, matched:assigned.has(index)})),
  };
}

export function runStudy() {
  const rows = [];
  for (const spacingHz of [1, 4, 40]) for (const weakDb of [0, -20, -40])
    for (const noiseDb of [null, -40, -20]) for (const seed of [1, 2, 3]) {
      const truth = [{hz:200, decay:2}, {hz:200 + spacingHz, decay:.8}, {hz:320, decay:3}];
      const modes = truth.map((m, i) => ({...m, amplitude:i === 1 ? 10 ** (weakDb / 20) : 1,
        phase:i * (seed - 1) * Math.PI / 3}));
      const signal = synthesize({modes, seconds:4, sampleRate:8000, noiseDb, seed});
      for (const window of ['rect', 'hann']) for (const seconds of [.5, 2, 4]) {
        const result = estimate(signal.samples, signal.sampleRate, seconds, {window});
        rows.push({kind:'three-modes', spacingHz, weakDb, noiseDb, seed, window, seconds,
          ...scoreCandidates(result, truth)});
      }
    }
  // The synthesizer scales noise by signal peak, so its empty-mode case is
  // silence. Generate a noise reference then subtract its known carrier.
  for (const kind of ['silence', 'noise']) for (const seed of [1, 2, 3]) {
    const carrier = {hz:100, amplitude:1, decay:2};
    const clean = synthesize({modes:[carrier], seconds:4, sampleRate:8000});
    const signal = synthesize({modes:[carrier], seconds:4, sampleRate:8000, noiseDb:0, seed});
    const samples = kind === 'noise' ? signal.samples.map((x,i) => x - clean.samples[i]) : new Float64Array(signal.samples.length);
    for (const window of ['rect', 'hann']) for (const seconds of [.5, 2, 4])
      rows.push({kind, seed, window, seconds, ...scoreCandidates(estimate(samples,8000,seconds,{window}), [])});
  }
  return {
    estimatorSha256:createHash('sha256').update(readFileSync(new URL('./study-sound-file-target.mjs',import.meta.url))).digest('hex'),
    protocol:{sampleRate:8000, availableSeconds:4, decayWindow:'same as spectral prefix',
      noise:'Gaussian sigma relative to clean signal peak, not RMS SNR; three deterministic seeds with paired phase variation',
      matching:'injective, chosen window half-width; threshold candidates only',
      accuracy:'5 cents frequency and 20 percent decay are descriptive study tolerances, not validated perceptual or production gates',
      limits:'Synthetic exponential sinusoids only; no attack, microphone, room, nonlinearity or changing pitch. Residual does not gate candidates. No physical-body identification.'},
    rows,
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log(JSON.stringify(runStudy(),null,2));
