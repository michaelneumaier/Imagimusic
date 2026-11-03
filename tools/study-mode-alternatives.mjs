// Research: explicit finite hypotheses, not a claim that all modes are found.
import {pathToFileURL} from 'node:url';
import {fitEstimatedModes} from './study-estimated-joint-decay.mjs';
import {fitJointDecays,reconstructModes} from './study-joint-decay.mjs';
import {refineModes} from './study-refined-modes.mjs';
import {synthesize} from './study-sound-file-target.mjs';
export function modeAlternatives(frequencies,observedSeconds,sampleRate){
 if(!Number.isFinite(observedSeconds)||observedSeconds<=0||!Number.isFinite(sampleRate)||sampleRate<1000||!Array.isArray(frequencies)||frequencies.length<1||frequencies.length>4||frequencies.some((f,i)=>!Number.isFinite(f)||f<=0||f>=sampleRate/2||(i&&f<=frequencies[i-1])))throw Error('Invalid research hypothesis input');
 const alternatives=[{id:'initial',addedHz:null,frequencies:[...frequencies]}];
 if(frequencies.length===4)return alternatives;
 const seen=new Set();
 for(const anchor of frequencies)for(const factor of [-1,-.5,-.25,.25,.5,1]){
  const addedHz=anchor+factor/observedSeconds;
  if(addedHz<=0||addedHz>=sampleRate/2||frequencies.some(f=>Math.abs(f-addedHz)<.1)||seen.has(addedHz))continue;
  seen.add(addedHz);alternatives.push({id:'extra-'+alternatives.length,addedHz,frequencies:[...frequencies,addedHz].sort((a,b)=>a-b)});
 }
 return alternatives;
}
// Deliberately accepts validation scores only. Final-test data is never passed.
export function chooseByValidation(scores){
 if(!scores.length||scores.some(x=>!Number.isFinite(x.validationError)||x.validationError<0||!Number.isInteger(x.modeCount)||x.modeCount<1))throw Error('Finite validation scores required');
 return [...scores].sort((a,b)=>a.validationError-b.validationError||a.modeCount-b.modeCount||a.id.localeCompare(b.id))[0].id;
}
const relative=(prediction,reference,start,end)=>{
 let error=0,energy=0;for(let i=start;i<end;i++){error+=(prediction[i]-reference[i])**2;energy+=reference[i]**2;}
 return Math.sqrt(error/energy);
};
export function evaluateAlternatives(source,sampleRate){
 const trainEnd=Math.round(.5*sampleRate),validationEnd=2*sampleRate;
 if(source.length<=validationEnd)throw Error('Need samples beyond the validation interval');
 const prefix=source.slice(0,trainEnd),estimated=fitEstimatedModes(prefix,sampleRate,.5);
 if(estimated.status!=='local-fit')return {status:'initial-refused',estimated};
 const hypotheses=modeAlternatives(estimated.frequencies,.5,sampleRate),candidates=[];
 for(const hypothesis of hypotheses){
  const initial=hypothesis.id==='initial'?estimated.joint:fitJointDecays(prefix,sampleRate,hypothesis.frequencies);
  if(initial.status!=='local-fit'){candidates.push({...hypothesis,status:'rank-refused'});continue;}
  const fit=refineModes(prefix,sampleRate,initial,{radiusHz:.5});
  if(fit.status!=='local-refinement'){candidates.push({...hypothesis,status:'rank-refused'});continue;}
  // Only reconstruct through validation while choosing the model.
  const prediction=reconstructModes(fit,sampleRate,validationEnd);
  candidates.push({...hypothesis,status:'fitted',fit,initializationBudget:{evaluations:initial.evaluations,maxEvaluations:initial.maxEvaluations,exhausted:initial.budgetExhausted,atDecayBound:initial.atBound},totalEvaluations:initial.evaluations+fit.evaluations,
   trainingError:relative(prediction,source,0,trainEnd),validationError:relative(prediction,source,trainEnd,validationEnd)});
 }
 const fitted=candidates.filter(c=>c.status==='fitted');
 if(!fitted.length)return {status:'all-refused',estimated,candidates};
 const chosenId=chooseByValidation(fitted.map(c=>({id:c.id,modeCount:c.fit.frequencies.length,validationError:c.validationError})));
 // Freeze the choice before reconstructing or scoring the final interval.
 for(const candidate of fitted){
  const prediction=reconstructModes(candidate.fit,sampleRate,source.length);
  candidate.finalTestError=relative(prediction,source,validationEnd,source.length);
 }
 return {status:'compared',estimated,candidates,chosenId,splitFrames:{trainEnd,validationEnd,end:source.length}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const rows=[];
 for(const [name,middle,seed] of [['weak 1 Hz',201,1],['weak 0.7 Hz',200.7,2],['two modes',null,1],['two modes',null,2]]){
  const modes=[{hz:200,amplitude:1,decay:2},...(middle?[{hz:middle,amplitude:.1,decay:.8}]:[]),{hz:320,amplitude:1,decay:3}];
  const signal=synthesize({modes,seconds:4,sampleRate:2000,noiseDb:-40,seed});
  rows.push({name,truth:modes,seed,...evaluateAlternatives(signal.samples,signal.sampleRate)});
 }
 console.log(JSON.stringify({protocol:{sampleRate:2000,noiseDb:-40,noiseMeaning:'Gaussian sigma relative to clean peak',
  intervals:{training:[0,.5],validation:[.5,2],finalTest:[2,4]},
  hypotheses:'Initial spectral candidates, or one extra frequency at offsets ±0.25/T, ±0.5/T, ±1/T around each initial frequency. Fixed before inspecting validation/test errors. Local refinement ±0.5 Hz, shortened to prevent crossing.',
  selection:'Smallest noisy validation relative-RMS, exact ties prefer fewer modes then lexical id; no calibrated complexity penalty. Final test scored only after choice.',
  limits:'Exploratory within-run split, not an untouched external benchmark: related fixtures informed earlier development. Small synthetic set. Neither this hypothesis grid nor selection rule certifies true mode count, uniqueness or physical anatomy.'},rows},null,2));
}
