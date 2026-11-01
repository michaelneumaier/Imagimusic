// Render the powered-driver study (proposal 020 B) for one curated grove: three WAVs with one identical force history under three
// contact states, plus report.json with the complete declared experiment, per-case measurements and a sparse energy/budget trace.
//   node tools/render-forced-study.mjs <seed> <output-directory> [forceSeconds] [ringSeconds] [ceilingFraction]
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { composeGrove, GROVE_SEEDS } from '../src/score/grove.js';
import { DEFAULT_VOICE_CONFIG } from '../src/score/grove-voice.js';
import { createGroveRestRecipe } from '../src/score/grove-rest.js';
import { composeForcedStudy, renderForcedStudy, attachPickups } from '../src/score/forced-study.js';
import { stereoWav } from '../src/loom/model.js';
const [seedArg, destination, forceArg, ringArg, fractionArg] = process.argv.slice(2);
const seed = Number(seedArg); if (!GROVE_SEEDS.includes(seed) || !destination) { console.error('usage: node tools/render-forced-study.mjs <3|7|11> <output-directory> [forceSeconds] [ringSeconds] [ceilingFraction]'); process.exit(2); }
const recipe = createGroveRestRecipe(composeGrove({ seed }), DEFAULT_VOICE_CONFIG, { sampleRate: 48000 });
const study = attachPickups(composeForcedStudy(recipe, { forceSeconds: forceArg ? Number(forceArg) : 2, ringSeconds: ringArg ? Number(ringArg) : 3, ceilingFraction: fractionArg ? Number(fractionArg) : 0.5 }), recipe);
const out = resolve(destination); mkdirSync(out, { recursive: true });
const rendered = renderForcedStudy(study), sha = b => createHash('sha256').update(Buffer.from(b)).digest('hex');
const cases = rendered.cases.map(c => { const wav = Buffer.from(stereoWav(c.pcm)), file = `grove-${seed}-${c.id}.wav`; writeFileSync(join(out, file), wav); const { pcm, ...rest } = c; return { ...rest, file, wavSha256: sha(wav), pcmSha256: pcm.channels.map(ch => sha(new Uint8Array(ch.buffer, ch.byteOffset, ch.byteLength))) }; });
const { pickupVectors, ...declared } = study;
const report = { generated: new Date().toISOString(), study: declared, frames: rendered.frames, forcedFrames: rendered.forcedFrames, releaseFrame: rendered.releaseFrame, markers: rendered.markers, cases,
  method: 'One identical sample-held sinusoidal force history, rendered under three contact states by the exact affine zero-order-hold step; natural fixed model gain; no boost, limiting or matching; the predicted bound is the conservative energy budget and the observed peak is measured; the trace is mechanical energy in mass-normalized coordinates against its running budget, at the stated rate.',
  interpretation: 'Measurements describe these files. Whether the build-and-release is audible or worth playing is a listening question that these numbers cannot answer. Not a bow, hand, breath or actuator; no claim of appeal.' };
writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ out, seed, amplitudeN: study.driver.amplitude, frequencyHz: study.driver.frequencyHz, predictedOutputBound: study.driver.budget.predictedOutputBound, cases: cases.map(c => ({ id: c.id, file: c.file, observedPeak: c.observedPeak, boundRatioAtRelease: c.boundRatioAtRelease, rmsForced: c.rmsForced, rmsRing: c.rmsRing })) }, null, 2));
