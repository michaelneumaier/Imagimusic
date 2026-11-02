// Constructive ambiguity witness, not an inverse solver or an audio analysis tool.
// Run: node tools/probe-inverse-network.mjs [report.json]
import {writeFile, mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
import assert from 'node:assert/strict';
import {coupledNetwork, networkStrikeResponse, networkPickupScale} from '../src/coupling.js';

const source={masses:[.02,.02,.02],frequencies:[220,222,225],edges:[{a:0,b:1,kc:500},{a:0,b:2,kc:300},{a:1,b:2,kc:400}],gamma:.7};
const base=coupledNetwork(source);
const multiply=(a,b)=>a.map(row=>b[0].map((_,j)=>row.reduce((s,x,k)=>s+x*b[k][j],0)));
const transpose=a=>a[0].map((_,j)=>a.map(row=>row[j]));
const relativeRms=(a,b)=>Math.sqrt(a.reduce((s,x,i)=>s+(x-b[i])**2,0)/a.reduce((s,x)=>s+x*x,0));

// Q fixes the first coordinate. Thus e1^T f(Q A Q^T) e1 = e1^T f(A) e1.
// Equal masses and common gamma preserve the collocated impulse response as well.
function construct(degrees){
 const theta=degrees*Math.PI/180,c=Math.cos(theta),s=Math.sin(theta);
 const Q=[[1,0,0],[0,c,-s],[0,s,c]],A=multiply(multiply(Q,base.A),transpose(Q));
 const edges=[[0,1],[0,2],[1,2]].map(([a,b])=>({a,b,kc:-source.masses[a]*A[a][b]}));
 const groundedSquared=A.map((row,i)=>row[i]-edges.filter(e=>e.a===i||e.b===i).reduce((sum,e)=>sum+e.kc/source.masses[i],0));
 if(edges.some(e=>e.kc<0)||groundedSquared.some(x=>!Number.isFinite(x)||x<=0))return {degrees,admitted:false,reason:'The transformed matrix requires a negative bridge or a nonpositive grounded spring.'};
 const parameters={masses:source.masses.slice(),frequencies:groundedSquared.map(x=>Math.sqrt(x)/(2*Math.PI)),edges,gamma:source.gamma};
 return {degrees,admitted:true,parameters,system:coupledNetwork(parameters)};
}
const sampleRate=8000,seconds=3,frames=sampleRate*seconds,impulseNs=.01;
// One fixed displacement-to-output scale for source AND candidates, never per-clip normalization.
const pickupScale=networkPickupScale(base);
function trace(system,strikeBody){
 const impulse=system.m.map((_,i)=>i===strikeBody?impulseNs:0);
 const response=networkStrikeResponse(system,impulse);
 return Float64Array.from({length:frames},(_,i)=>response.x(i/sampleRate)[0]*pickupScale);
}
const target=trace(base,0),withheld=trace(base,1);
const results=[-30,-20,30].map(degrees=>{
 const candidate=construct(degrees);
 if(!candidate.admitted)return candidate;
 const {system,...identity}=candidate;
 const candidateTarget=trace(system,0),candidateWithheld=trace(system,1);
 const targetRelativeRms=relativeRms(target,candidateTarget),withheldRelativeRms=relativeRms(withheld,candidateWithheld);
 // Diagnostic only: remove the best scalar gain to distinguish waveform shape from level.
 const bestGain=withheld.reduce((sum,x,i)=>sum+x*candidateWithheld[i],0)/candidateWithheld.reduce((sum,x)=>sum+x*x,0);
 const withheldAfterBestGainRelativeRms=relativeRms(withheld,candidateWithheld.map(x=>x*bestGain));
 const sourceResidues=networkStrikeResponse(base,[impulseNs,0,0]).bodyModes(0);
 const candidateResidues=networkStrikeResponse(system,[impulseNs,0,0]).bodyModes(0);
 const maxPoleRelativeError=Math.max(...system.normalFreqsHz.map((f,i)=>Math.abs(f-base.normalFreqsHz[i])/base.normalFreqsHz[i]));
 const maxResidueAbsoluteError=Math.max(...candidateResidues.map((m,i)=>Math.abs(m.amplitude-sourceResidues[i].amplitude)));
 assert.ok(targetRelativeRms<1e-9,'target waveform must match within numerical tolerance');
 assert.ok(maxPoleRelativeError<1e-12,'modal poles must match');
 assert.ok(maxResidueAbsoluteError<1e-12,'collocated residues must match');
 assert.ok(withheldRelativeRms>.05,'withheld gesture must differ');
 assert.ok(system.eigen.residual<1e-12&&system.eigen.orthogonality<1e-12);
 return {...identity,normalFreqsHz:system.normalFreqsHz,eigen:system.eigen,targetRelativeRms,withheldRelativeRms,bestGain,withheldAfterBestGainRelativeRms,maxPoleRelativeError,maxResidueAbsoluteError};
});
assert.equal(results[0].admitted,false,'negative bridge witness must refuse');
const report={kind:'imagimusic-constructive-network-ambiguity-v1',method:'Orthogonal similarity fixing body 1, with reconstruction as positive grounded and nonnegative bridge springs. Uses the known source matrix; no parameters inferred from audio.',source,normalFreqsHz:base.normalFreqsHz,measurement:{sampleRate,seconds,frames,impulseNs,pickupBody:0,pickupScale,targetStrikeBody:0,withheldStrikeBody:1,signal:'scaled physical displacement at body 1',indexing:'zero-based in data; body 1 in prose is index 0'},results,limitations:['Three lumped mass-spring coordinates; no body geometry, modal body shape, acoustic radiation or microphone model.','Common mass-proportional damping, with amplitude decay exp(-gamma*t).','The source defines a synthetic target. Construction uses its full hidden matrix, not just the target trace.','Agreement is demonstrated analytically by the fixed coordinate and numerically for sampled waveforms, poles and residues; not bit identity.','Withheld differences are numerical response differences, not listening or appeal verdicts.','No optimizer, arbitrary sound reconstruction, live instrument or exported sound artifact is produced by this probe.']};
const output=process.argv[2]??'renders/inverse-network-probe/report.json';
await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output,results:results.map(({degrees,admitted,targetRelativeRms,withheldRelativeRms,withheldAfterBestGainRelativeRms})=>({degrees,admitted,targetRelativeRms,withheldRelativeRms,withheldAfterBestGainRelativeRms}))},null,2));
