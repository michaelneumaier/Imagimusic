// Local audition of the constructive witness. Run the probe first. No inverse solver is run here.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {coupledNetwork,networkStrikeResponse} from '../src/coupling.js';
import {stereoWav} from '../src/loom/model.js';
import {openPhrasePlayer} from './open-phrase-player.mjs';

const input=process.argv[2]??'renders/inverse-network-probe/report.json';
const out=process.argv[3]??'renders/inverse-network-study';
const sourceText=await fs.readFile(input,'utf8'),probe=JSON.parse(sourceText);
assert.equal(probe.kind,'imagimusic-constructive-network-ambiguity-v1');
assert.equal(probe.measurement.impulseNs,.01);
assert.equal(probe.measurement.pickupBody,0);
assert.deepEqual(probe.results.filter(r=>r.admitted).map(r=>r.degrees),[-20,30]);
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const sampleRate=48000,bodyFrames=3*sampleRate,fadeFrames=1200,frames=bodyFrames+fadeFrames;
const pickupScale=probe.measurement.pickupScale,outputGain=10;
assert.ok(Number.isFinite(pickupScale)&&pickupScale>0&&pickupScale<1e6);
const candidates=[{id:'source',label:'Source network',parameters:probe.source},...probe.results.filter(r=>r.admitted).map(r=>({id:r.degrees<0?'minus-20':'plus-30',label:`Candidate ${r.degrees}°`,parameters:r.parameters}))];
assert.equal(candidates.length,3);
const report={kind:'imagimusic-network-ambiguity-audition-v1',sourceReport:'source-report.json',sourceReportSha256:sha(sourceText),sampleRate,frames,bodyFrames,fadeFrames,pickupScale,outputGain,impulseNs:.01,pickupBody:0,signal:'Body 1 displacement, same signal in left and right channels; no spatial acoustic simulation.',end:'Three seconds of response followed by a common 25 ms linear fade ending at exact zero.',origin:'Constructed from a known spring-network matrix. Not fitted from audio. Target gesture and withheld gesture use equal impulses and one shared scale, with no per-case normalization.',cases:[]};
await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'source-report.json'),sourceText);
const players=[],targetTraces=[];
for(const strikeBody of [0,1])for(const candidate of candidates){
 const system=coupledNetwork(candidate.parameters),response=networkStrikeResponse(system,system.m.map((_,i)=>i===strikeBody?.01:0));
 const raw=Float64Array.from({length:frames},(_,i)=>response.x(i/sampleRate)[0]*pickupScale*outputGain);
 if(strikeBody===0)targetTraces.push(raw);
 const pcm=Float32Array.from(raw,(v,i)=>v*(i<bodyFrames?1:1-(i-bodyFrames)/(fadeFrames-1)));
 pcm[frames-1]=0; // canonical positive zero at the explicit ending
 let peak=0;for(const value of pcm){assert.ok(Number.isFinite(value));peak=Math.max(peak,Math.abs(value));}
 assert.ok(peak<.1,'shared original model level retains at least 20 dB peak headroom');assert.equal(pcm.at(-1),0);
 const file=`${strikeBody===0?'target':'withheld'}-${candidate.id}.wav`;
 const wav=Buffer.from(stereoWav({channels:[pcm,pcm],sampleRate}));await fs.writeFile(path.join(out,file),wav);
 const label=`${strikeBody===0?'1 · Same observed gesture':'2 · A new gesture'} — ${candidate.label}`;
 report.cases.push({id:candidate.id,strikeBody,label,file,parameters:candidate.parameters,normalFreqsHz:system.normalFreqsHz,peak,wavSha256:sha(wav),frames});
 players.push({name:file.slice(0,-4),label,file,wavSha256:sha(wav),peak,frames});
}
const reference=targetTraces[0],power=reference.reduce((s,x)=>s+x*x,0);
report.targetRelativeRms=targetTraces.slice(1).map(trace=>Math.sqrt(trace.reduce((s,x,i)=>s+(x-reference[i])**2,0)/power));
for(const error of report.targetRelativeRms)assert.ok(error<1e-9);
report.limitations=['Three passive lumped masses with grounded and bridge springs; no surface geometry or acoustic radiation.','Each candidate reproduces one collocated response within numerical tolerance; arbitrary gestures and pickups are not matched.','These are coupledNetwork examples, not canonical Grove records.','Offline model render, not a device capture; numerical differences do not establish perceived difference or preference.'];
await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
await fs.writeFile(path.join(out,'index.html'),openPhrasePlayer({title:'One response, possible bodies',intro:'First compare the same observed gesture on three networks: strike body 1 and listen at body 1. Then strike body 2, keeping the same listening point. The networks were constructed to agree on the first response; the second gesture was not matched.',question:'Does the new gesture change what you notice? What would you try next?',disclosure:'A constructed mathematical example, not a body recovered from a recording. Three lumped mass-spring coordinates, a virtual displacement pickup, equal impulses, shared scale and gain, three seconds plus the same 25 ms ending fade. Identical left and right channels. These are offline model renders, not full acoustic objects or device recordings. No listening outcome is prescribed.',cases:players,playLinkLabel:'Return to the project home ↗',playLinkHref:'../../project.html',listeningDb:18,listeningKey:'imagimusic-inverse-network-listening-db'}));
console.log(JSON.stringify({out,cases:report.cases.map(c=>({file:c.file,peak:c.peak,sha256:c.wavSha256})),targetRelativeRms:report.targetRelativeRms},null,2));
