// Local frequency/decay refinement, research only. The mode count never changes.
import {pathToFileURL} from 'node:url';
import {fitFixedModes,reconstructModes} from './study-joint-decay.mjs';
import {fitEstimatedModes} from './study-estimated-joint-decay.mjs';
import {synthesize} from './study-sound-file-target.mjs';
export function refineModes(samples,sampleRate,initial,{radiusHz=.25,maxEvaluations=900}={}){
 if(!Number.isFinite(radiusHz)||radiusHz<=0||radiusHz>10)throw Error('Refinement radius must be within (0,10] Hz.');
 if(!Number.isInteger(maxEvaluations)||maxEvaluations<1||maxEvaluations>5000)throw Error('Evaluation budget must be 1..5000.');
 const frequencies=[...initial.frequencies],decays=[...initial.decays];
 if(frequencies.some((f,i)=>!Number.isFinite(f)||f<=0||f>=sampleRate/2||(i&&f<=frequencies[i-1]))||decays.length!==frequencies.length||decays.some(t=>!Number.isFinite(t)||t<.1||t>8))throw Error('Initial modes must be ordered, distinct and within the decay bounds.');
 const frequencyBounds=frequencies.map((f,i)=>{
  const radius=Math.min(radiusHz,f/2,(sampleRate/2-f)/2,i?(f-frequencies[i-1])/3:Infinity,i<frequencies.length-1?(frequencies[i+1]-f)/3:Infinity);
  return [f-radius,f+radius];
 });
 let evaluations=0;
 const evaluate=(hz,tau)=>{
  if(evaluations>=maxEvaluations)return null;evaluations++;
  const fit=fitFixedModes(samples,sampleRate,hz,tau);
  return fit?{...fit,frequencies:[...hz]}:null;
 };
 let current=evaluate(frequencies,decays);
 if(!current)return {status:'rank-refused',evaluations,initial:{frequencies,decays}};
 const initialSquaredError=current.squaredError;
 for(let scale=1;scale>=1/1024&&evaluations<maxEvaluations;scale/=2){
  for(let pass=0;pass<12&&evaluations<maxEvaluations;pass++){
   let changed=false;
   for(let k=0;k<frequencies.length;k++)for(const dimension of ['frequency','decay']){
    let chosen=current;
    for(const direction of [-1,1]){
     const hz=[...current.frequencies],tau=[...current.decays];
     if(dimension==='frequency')hz[k]=Math.max(frequencyBounds[k][0],Math.min(frequencyBounds[k][1],hz[k]+direction*radiusHz/4*scale));
     else tau[k]=Math.max(.1,Math.min(8,tau[k]*2**(direction*.25*scale)));
     const fit=evaluate(hz,tau);if(fit&&fit.squaredError<chosen.squaredError)chosen=fit;
    }
    if(chosen!==current){current=chosen;changed=true;}
   }
   if(!changed)break;
  }
 }
 return {...current,status:'local-refinement',initial:{frequencies,decays,squaredError:initialSquaredError},
  frequencyBounds,decayBounds:[.1,8],evaluations,maxEvaluations,budgetExhausted:evaluations>=maxEvaluations,
  atFrequencyBound:current.frequencies.some((f,i)=>frequencyBounds[i].includes(f)),
  atDecayBound:current.decays.some(t=>t===.1||t===8)};
}
const error=(prediction,reference,start,end)=>{
 let residual=0,energy=0;for(let i=start;i<end;i++){residual+=(prediction[i]-reference[i])**2;energy+=reference[i]**2;}
 return Math.sqrt(residual/energy);
};
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const rows=[];
 const separated=[{hz:140,amplitude:1,decay:.8},{hz:190,amplitude:1,decay:2.4},{hz:260,amplitude:1,decay:3}];
 const nearby=[{hz:200,amplitude:1,decay:2},{hz:201,amplitude:.1,decay:.8},{hz:320,amplitude:1,decay:3}];
 for(const [name,modes,window,seconds,noiseDb] of [
  ['separated',separated,'rect',.5,null],['separated',separated,'rect',.5,-40],
  ['weak nearby',nearby,'hann',.5,null],['weak nearby',nearby,'hann',.5,-40],
  ['separated',separated,'hann',2,-40],['weak nearby',nearby,'hann',2,-40],
 ]){
  const sampleRate=2000,source=synthesize({modes,seconds:4,sampleRate,noiseDb,seed:1}).samples;
  const clean=synthesize({modes,seconds:4,sampleRate}).samples,end=seconds*sampleRate;
  const estimated=fitEstimatedModes(source,sampleRate,seconds,{window});
  if(estimated.status!=='local-fit')throw Error('Study case lacks an initial fit');
  const refined=refineModes(source.slice(0,end),sampleRate,estimated.joint);
  const measure=fit=>{const predicted=reconstructModes(fit,sampleRate,source.length);return {observed:error(predicted,source,0,end),withheldNoisy:error(predicted,source,end,source.length),withheldClean:error(predicted,clean,end,source.length)};};
  rows.push({name,window,seconds,noiseDb,truth:modes,estimated,refined,
   totalEvaluations:estimated.joint.evaluations+refined.evaluations,before:measure(estimated.joint),after:measure(refined)});
 }
 console.log(JSON.stringify({protocol:{sampleRate:2000,availableSeconds:4,seed:1,radiusHz:.25,
  limits:'Initial estimated mode count fixed. Frequencies constrained to non-crossing neighborhoods; decays 0.1..8 s. Local descent only, no physical identity or global optimum guarantee. Truth used only to score afterward.'},rows},null,2));
}
