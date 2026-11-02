// Independent research audit, not a production estimator or acceptance gate.
// Run: node tools/audit-sound-study-duration.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {estimate,synthesize} from './study-sound-file-target.mjs';
const modes=[{hz:140,amplitude:1,decay:.8},{hz:190,amplitude:1,decay:2.4},{hz:260,amplitude:1,decay:5}];
const fixture=synthesize({modes,seconds:8,sampleRate:8000});
const describe=result=>({
 heuristicCount:result.supported,
 peaks:result.peaks.map(p=>({hz:p.hz,decaySeconds:p.decay,fitFrames:p.frames,fitResidualDb:p.decayFitDb??null})),
});
const pairs=[];
for(const seconds of [.25,.375,.5,1,2,4,8]){
 const prefix=fixture.samples.slice(0,Math.round(seconds*fixture.sampleRate));
 const short=estimate(prefix,fixture.sampleRate,seconds,{window:'hann'});
 const full=estimate(fixture.samples,fixture.sampleRate,seconds,{window:'hann'});
 // The spectral input is identical. Any difference in fitted decay/count
 // comes from the samples made available outside that spectral window.
 assert.deepEqual(short.peaks.map(p=>p.hz),full.peaks.map(p=>p.hz));
 assert.equal(short.W,full.W);
 pairs.push({spectralWindowSeconds:short.W,shortAvailableSeconds:prefix.length/fixture.sampleRate,
 fullAvailableSeconds:fixture.samples.length/fixture.sampleRate,
 truncatedFile:describe(short),fullFile:describe(full)});
}
assert.deepEqual(pairs.at(-1).truncatedFile,pairs.at(-1).fullFile);
console.log(JSON.stringify({
 estimatorSha256:createHash('sha256').update(readFileSync(new URL('./study-sound-file-target.mjs',import.meta.url))).digest('hex'),
 fixture:{sampleRate:fixture.sampleRate,seconds:8,modes,formula:'sum amplitude * exp(-t/decay) * cos(2*pi*hz*t)',noise:null},
 scope:'Synthetic separated modes only. Heuristic counts are estimator labels, not certified resonances. Actual prefixes; no zero padding to replace missing recording time. Spectrum itself retains estimator FFT padding.',
 pairs,
},null,2));
