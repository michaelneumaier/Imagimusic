import {createTineImpulse} from './impulse.js';

/** Population statistics of explicitly sampled four-mode displacement (metres).
 * Samples are consecutive frame boundaries, flattened sample-major. This is
 * neither an instantaneous shape nor an extrema envelope or optical exposure.
 * Retaining covariance is essential: modes need not decorrelate in a window.
 */
export function tineDisplacementWindow(geometry,{samples,sampleRate,startFrame=0}={}){
 if(!(samples instanceof Float64Array)||samples.length<4||samples.length%4||samples.length>4*96000)throw Error('Supply 1…96000 four-mode Float64 samples.');
 if(!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>96000)throw Error('Sample rate must be an integer within 8000…96000.');
 const count=samples.length/4;
 if(!Number.isSafeInteger(startFrame)||startFrame<0||!Number.isSafeInteger(startFrame+count))throw Error('Invalid start frame.');
 const model=createTineImpulse(geometry),mean=new Float64Array(4),m2=new Float64Array(16),delta=new Float64Array(4);
 for(let n=0;n<count;n++){
  let bound=0;
  for(let i=0;i<4;i++){
   const q=samples[n*4+i];
   if(!Number.isFinite(q))throw Error('Displacements must be finite.');
   bound+=Math.abs(q);delta[i]=q-mean[i];mean[i]+=delta[i]/(n+1);
  }
  if(bound>model.geometry.thicknessM*.1)throw Error('Sample exceeds the study small-displacement bound.');
  for(let i=0;i<4;i++)for(let j=0;j<4;j++)m2[i*4+j]+=delta[i]*(samples[n*4+j]-mean[j]);
 }
 const covariance=Array.from(m2,(v,k)=>(v+m2[(k%4)*4+Math.floor(k/4)])/(2*count));
 const points=Array.from({length:81},(_,index)=>{
  const u=index/80,shape=model.modes.map(m=>m.shape(u));
  let meanM=0,variance=0,absoluteTerms=0;
  for(let i=0;i<4;i++){
   meanM+=shape[i]*mean[i];
   for(let j=0;j<4;j++){
    const term=shape[i]*covariance[i*4+j]*shape[j];variance+=term;absoluteTerms+=Math.abs(term);
   }
  }
  // Cancellation can leave a tiny negative floating-point residual. Reject a
  // material negative value instead of silently hiding a broken covariance.
  if(variance < -64*Number.EPSILON*absoluteTerms)throw Error('Invalid projected variance.');
  variance=Math.max(0,variance);
  return {u,xM:u*model.geometry.lengthM,meanM,standardDeviationM:Math.sqrt(variance),rmsM:Math.sqrt(meanM*meanM+variance)};
 });
 return {sampleRate,startFrame,sampleCount:count,lastSampleFrame:startFrame+count-1,endFrameExclusive:startFrame+count,meanModalM:Array.from(mean),covarianceModalM2:covariance,points};
}
