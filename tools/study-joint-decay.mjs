// Research only: frequencies are supplied, not discovered or certified.
// Fit a sum of exp(-t/tau) * (a*cos(2*pi*f*t) + b*sin(2*pi*f*t)).
import {pathToFileURL} from 'node:url';
import {synthesize, estimate, compare} from './study-sound-file-target.mjs';
const dot=(a,b)=>a.reduce((sum,x,i)=>sum+x*b[i],0);
const norm=a=>Math.sqrt(dot(a,a));
function basis(samples,sampleRate,frequencies){
 if(!Number.isFinite(sampleRate)||sampleRate<1000||samples.length<64||samples.length>131072)throw new Error('Research input needs 64..131072 samples at a finite rate of at least 1000 Hz.');
 if(!Array.isArray(frequencies)||!frequencies.length||frequencies.length>4||frequencies.some(f=>!Number.isFinite(f)||f<=0||f>=sampleRate/2))throw new Error('Supply one to four frequencies below Nyquist.');
 if(!samples.every(Number.isFinite))throw new Error('Samples must be finite.');
 return frequencies.flatMap(hz=>[Float64Array.from(samples,(_,i)=>Math.cos(2*Math.PI*hz*i/sampleRate)),Float64Array.from(samples,(_,i)=>Math.sin(2*Math.PI*hz*i/sampleRate))]);
}
function fitBasis(samples,sampleRate,trig,decays){
 if(decays.length*2!==trig.length||decays.some(t=>!Number.isFinite(t)||t<=0))throw new Error('One finite positive decay per frequency is required.');
 const columns=trig.map((v,k)=>Float64Array.from(v,(x,i)=>x*Math.exp(-i/sampleRate/decays[k>>1])));
 const q=[],r=Array.from({length:columns.length},()=>new Float64Array(columns.length));
 let minimumIndependenceRatio=1;
 for(let j=0;j<columns.length;j++){
  const v=columns[j].slice(),originalNorm=norm(v);
  // Twice-reorthogonalized modified Gram-Schmidt; avoid normal equations.
  for(let pass=0;pass<2;pass++)for(let i=0;i<j;i++){
   const coefficient=dot(q[i],v);r[i][j]+=coefficient;
   for(let n=0;n<v.length;n++)v[n]-=coefficient*q[i][n];
  }
  const length=norm(v),ratio=length/originalNorm;
  if(!Number.isFinite(ratio)||ratio<1e-10)return null;
  minimumIndependenceRatio=Math.min(minimumIndependenceRatio,ratio);
  r[j][j]=length;q.push(v.map(x=>x/length));
 }
 const coefficients=Float64Array.from(q,column=>dot(column,samples));
 for(let j=columns.length-1;j>=0;j--){for(let k=j+1;k<columns.length;k++)coefficients[j]-=r[j][k]*coefficients[k];coefficients[j]/=r[j][j];}
 let error=0,energy=0;
 for(let n=0;n<samples.length;n++){
  let predicted=0;for(let j=0;j<columns.length;j++)predicted+=columns[j][n]*coefficients[j];
  error+=(samples[n]-predicted)**2;energy+=samples[n]**2;
 }
 return {decays:[...decays],coefficients:[...coefficients],squaredError:error,
  relativeRms:energy?Math.sqrt(error/energy):null,minimumIndependenceRatio};
}
export function fitFixedModes(samples,sampleRate,frequencies,decays){return fitBasis(samples,sampleRate,basis(samples,sampleRate,frequencies),decays);}
export function reconstructModes({frequencies,decays,coefficients},sampleRate,frames){
 return Float64Array.from({length:frames},(_,i)=>{
  const t=i/sampleRate;return frequencies.reduce((sum,f,k)=>sum+Math.exp(-t/decays[k])*(coefficients[2*k]*Math.cos(2*Math.PI*f*t)+coefficients[2*k+1]*Math.sin(2*Math.PI*f*t)),0);
 });
}
export function fitJointDecays(samples,sampleRate,frequencies,{maxEvaluations=900}={}){
 if(!Number.isInteger(maxEvaluations)||maxEvaluations<1||maxEvaluations>5000)throw new Error('Evaluation budget must be 1..5000.');
 const trig=basis(samples,sampleRate,frequencies),bounds=[.1,8];
 let evaluations=0,best=null;
 const evaluate=decays=>{if(evaluations>=maxEvaluations)return null;evaluations++;const fit=fitBasis(samples,sampleRate,trig,decays);if(fit&&(!best||fit.squaredError<best.squaredError))best=fit;return fit;};
 // Explicit bounded local searches, not a global optimum guarantee.
 for(const start of [.5,2,5]){
  let current=evaluate(frequencies.map(()=>start));if(!current)continue;
  for(let step=1;step>=1/256&&evaluations<maxEvaluations;step/=2){
   for(let pass=0;pass<12&&evaluations<maxEvaluations;pass++){
    let changed=false;
    for(let k=0;k<frequencies.length;k++){
     let chosen=current;
     for(const direction of [-1,1]){
      const decays=[...current.decays];decays[k]=Math.max(bounds[0],Math.min(bounds[1],decays[k]*2**(direction*step)));
      const candidate=evaluate(decays);if(candidate&&candidate.squaredError<chosen.squaredError)chosen=candidate;
     }
     if(chosen!==current){current=chosen;changed=true;}
    }
    if(!changed)break;
   }
  }
 }
 return {frequencies:[...frequencies],...best,evaluations,maxEvaluations,budgetExhausted:evaluations>=maxEvaluations,
  bounds,atBound:best?best.decays.some(t=>t===bounds[0]||t===bounds[1]):null,
  status:best?'local-fit':'rank-refused'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const truth=[{hz:200,decay:2,amplitude:1},{hz:201,decay:.8,amplitude:.1},{hz:320,decay:3,amplitude:1}];
 const rows=[];
 const reference=synthesize({modes:truth,seconds:4,sampleRate:2000}).samples;
 for(const seconds of [.5,2])for(const noiseDb of [null,-40]){
  const signal=synthesize({modes:truth,seconds,sampleRate:2000,noiseDb,seed:1});
  const independent=estimate(signal.samples,signal.sampleRate,seconds,{window:'hann'});
  for(const kind of ['known-frequencies','middle-shifted-0.1Hz','middle-omitted']){
   const frequencies=kind==='middle-omitted'?[200,320]:[200,kind==='known-frequencies'?201:201.1,320];
   const fit=fitJointDecays(signal.samples,signal.sampleRate,frequencies);
   const rebuilt=reconstructModes(fit,signal.sampleRate,signal.samples.length);
   const error=Math.sqrt(rebuilt.reduce((sum,x,i)=>sum+(x-signal.samples[i])**2,0)/dot(signal.samples,signal.samples));
   const future=reconstructModes(fit,signal.sampleRate,reference.length);
   let futureError=0,futureEnergy=0;for(let i=signal.samples.length;i<reference.length;i++){futureError+=(future[i]-reference[i])**2;futureEnergy+=reference[i]**2;}
   rows.push({seconds,noiseDb,kind,independent:compare(independent,truth),joint:fit,reconstructedRelativeRms:error,
    future:{fromSeconds:seconds,toSeconds:4,reference:'known noiseless continuation, not used during fitting',relativeRms:Math.sqrt(futureError/futureEnergy)}});
  }
 }
 console.log(JSON.stringify({protocol:{sampleRate:2000,truth,frequencySource:'Supplied truth or declared perturbation/omission. No frequency discovery.',noise:'Gaussian sigma relative to clean peak; one deterministic seed',limits:'Exponential sinusoid mixture only. Local search, explicit bounds, no physical-body inference; low residual is not a certificate.'},rows},null,2));
}
