// Audit a complete saved forced-study report and its WAVs; this is separate from the Rest/movie verifier.
import {readFileSync} from 'node:fs';
import {dirname,resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {createGroveRestRecipe} from '../src/score/grove-rest.js';
import {renderForcedStudy,FORCED_STUDY_KIND,FORCED_STUDY_VERSION} from '../src/score/forced-study.js';
import {stereoWav} from '../src/loom/model.js';
const path=process.argv[2];if(!path)throw new Error('Usage: node tools/verify-forced-study.mjs <report.json>');
const report=JSON.parse(readFileSync(path,'utf8')),study=report.study,d=study.driver,sr=study.sampleRate;
assert.equal(study.kind,FORCED_STUDY_KIND);assert.equal(study.version,FORCED_STUDY_VERSION);
const recipe=createGroveRestRecipe(study.grove,study.voice,{sampleRate:sr,zones:study.zones,strengths:Object.fromEntries(study.strengths.map(s=>[s.name,s.c]))});
assert.equal(study.outputGain,recipe.outputGain);assert.deepEqual(study.pickupVectors,recipe.pickupVectors);
const forced=Math.round(d.forceSeconds*sr),total=forced+Math.round(d.ringSeconds*sr),factor=Math.max(...recipe.energyFactors),direction=recipe.strikeVectors[d.position][d.body],norm=Math.hypot(...direction);
assert.equal(d.u,recipe.positions[d.position]);assert.equal(d.forcedFrames,forced);assert.equal(d.ringFrames,total-forced);assert.equal(d.budget.admissionCeiling,recipe.admissionCeiling);
assert.equal(report.frames,total);assert.equal(report.forcedFrames,forced);assert.equal(report.releaseFrame,forced);
assert.deepEqual(report.markers.forceActive,[0,forced/sr]);assert.deepEqual(report.markers.released,[forced/sr,total/sr]);
assert.deepEqual(report.markers.contactSeconds,[0,total/sr]);
assert.deepEqual(study.intervals.driverSeconds,[0,forced/sr]);assert.deepEqual(study.intervals.contactSeconds,[0,total/sr]);
const near=(a,b,name)=>{assert.ok(Number.isFinite(a)&&Number.isFinite(b),`${name}: finite`);assert.ok(Math.abs(a-b)<=1e-10*Math.max(Math.abs(a),Math.abs(b),1e-12),`${name}: ${a} != ${b}`);};
near(factor,d.budget.energyFactorMax,'energy factor');near(norm,d.budget.directionNorm,'force direction norm');
const integral=new Float64Array(total+1),force=i=>i<forced?d.amplitude*Math.sin(2*Math.PI*d.frequencyHz*i/sr):0;
for(let i=0;i<total;i++)integral[i+1]=integral[i]+Math.abs(force(i))/sr;
near(integral[total],d.budget.integralAbsForce,'absolute force integral');
const predicted=study.outputGain*factor*norm*integral[total];near(predicted,d.budget.predictedOutputBound,'predicted bound');
assert.ok(predicted<=d.budget.ceilingFraction*recipe.admissionCeiling*(1+1e-10),'declared ceiling fraction');
const rebuilt=renderForcedStudy(study,{traceHz:report.cases[0]?.trace.hz}),sha=b=>createHash('sha256').update(b).digest('hex'),evidence=[];
assert.equal(report.cases.length,rebuilt.cases.length);
for(let j=0;j<report.cases.length;j++){
 const c=report.cases[j],fresh=rebuilt.cases[j],trace=c.trace;
 assert.equal(c.id,fresh.id);assert.deepEqual(c.contacts,study.cases[j].contacts);
 assert.ok(trace.times.length>=2);assert.equal(trace.times[0],0);assert.equal(trace.times.at(-1),total/sr);assert.ok(trace.times.includes(forced/sr),'exact release trace');
 for(const key of ['energy','sqrt2E','bound','budgetSqrt2E','force'])assert.equal(trace[key].length,trace.times.length);
 let previous=-1,previousEnergy=Infinity;
 for(let i=0;i<trace.times.length;i++){
  const time=trace.times[i],frame=Math.round(time*sr),E=trace.energy[i];assert.ok(time>previous&&time<=total/sr);near(time,frame/sr,'trace sample time');assert.ok(Number.isFinite(E)&&E>=0);
  near(Math.sqrt(2*E),trace.sqrt2E[i],'energy norm');near(study.outputGain*factor*Math.sqrt(2*E),trace.bound[i],'state output bound');near(norm*integral[frame],trace.budgetSqrt2E[i],'running source budget');near(frame?force(frame-1):0,trace.force[i],'preceding-interval force');
  assert.ok(Math.sqrt(2*E)<=norm*integral[frame]+1e-10,'state within input budget');
  if(previous>=forced/sr)assert.ok(E<=previousEnergy*(1+1e-9)+1e-18,'passive energy after driver release');previous=time;previousEnergy=E;
 }
 assert.deepEqual(trace,fresh.trace,'saved trace equals rebuilt state trace');
 for(const key of ['observedPeak','rmsForced','rmsRing','maxEnergy','outputAtRelease'])near(c[key],fresh[key],key);
 assert.ok(c.observedPeak<=predicted+1e-10,'observed peak within predicted bound');
 const wav=readFileSync(join(dirname(resolve(path)),c.file)),rebuiltWav=Buffer.from(stereoWav(fresh.pcm));assert.equal(sha(wav),c.wavSha256);assert.deepEqual(wav,rebuiltWav,'saved WAV equals fresh study render');
 assert.deepEqual(c.pcmSha256,fresh.pcm.channels.map(ch=>sha(new Uint8Array(ch.buffer,ch.byteOffset,ch.byteLength))));
 evidence.push({id:c.id,frames:fresh.pcm.channels[0].length,tracePoints:trace.times.length,wavSha256:sha(wav),observedPeak:c.observedPeak});
}
console.log(JSON.stringify({verified:true,seed:study.grove.seed,releaseSeconds:forced/sr,durationSeconds:total/sr,actualAbsoluteForceIntegral:integral[total],predictedOutputBound:predicted,cases:evidence},null,2));
