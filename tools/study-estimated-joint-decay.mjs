// End-to-end research boundary: no truth labels may enter this fitting function.
import {pathToFileURL} from 'node:url';
import {synthesize,estimate,compare} from './study-sound-file-target.mjs';
import {fitJointDecays,reconstructModes} from './study-joint-decay.mjs';
export function fitEstimatedModes(samples,sampleRate,seconds,{window='hann'}={}){
 const spectrum=estimate(samples,sampleRate,seconds,{window});
 const candidates=spectrum.peaks.filter(p=>p.decay!==null&&p.aboveMedianDb>=20);
 const frequencies=candidates.map(p=>p.hz).sort((a,b)=>a-b);
 const report={window,observedSeconds:spectrum.spectralWindowSeconds,candidateCount:candidates.length,frequencies,
  independentDecays:candidates.map(p=>({hz:p.hz,decay:p.decay,fitResidualDb:p.decayFitDb}))};
 if(!candidates.length||candidates.length>4)return {...report,status:'count-refused',reason:'The joint-fit study accepts 1..4 candidates; none are invented or discarded to fit its scope.'};
 const prefix=samples.slice(0,Math.round(spectrum.spectralWindowSeconds*sampleRate));
 const joint=fitJointDecays(prefix,sampleRate,frequencies);
 return {...report,status:joint.status,joint};
}
const residual=(predicted,reference,start,end)=>{
 let error=0,energy=0;for(let i=start;i<end;i++){error+=(predicted[i]-reference[i])**2;energy+=reference[i]**2;}
 return energy?Math.sqrt(error/energy):null;
};
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const configurations=[
  {name:'separated',modes:[{hz:140,amplitude:1,decay:.8},{hz:190,amplitude:1,decay:2.4},{hz:260,amplitude:1,decay:3}]},
  {name:'nearby equal amplitudes',modes:[{hz:200,amplitude:1,decay:2},{hz:201,amplitude:1,decay:.8},{hz:320,amplitude:1,decay:3}]},
  {name:'nearby weak middle',modes:[{hz:200,amplitude:1,decay:2},{hz:201,amplitude:.1,decay:.8},{hz:320,amplitude:1,decay:3}]},
 ];
 const rows=[];
 for(const config of configurations)for(const noiseDb of [null,-40]){
  const full=synthesize({modes:config.modes,seconds:4,sampleRate:2000,noiseDb,seed:1});
  const clean=synthesize({modes:config.modes,seconds:4,sampleRate:2000}).samples;
  for(const seconds of [.5,2])for(const window of ['rect','hann']){
   const result=fitEstimatedModes(full.samples,full.sampleRate,seconds,{window});
   const row={name:config.name,truth:config.modes,noiseDb,...result};
   if(result.status==='local-fit'){
    const predicted=reconstructModes(result.joint,full.sampleRate,full.samples.length),end=seconds*full.sampleRate;
    row.errors={observed:residual(predicted,full.samples,0,end),withheldNoisy:residual(predicted,full.samples,end,predicted.length),withheldClean:residual(predicted,clean,end,predicted.length)};
    // Truth is used only here, after all candidate selection and fitting.
    row.truthMatches=compare({mainLobeHz:(window==='hann'?2:1)/seconds,peaks:result.frequencies.map((hz,i)=>({hz,decay:result.joint.decays[i]}))},config.modes);
   }
   rows.push(row);
  }
 }
 console.log(JSON.stringify({protocol:{sampleRate:2000,availableSeconds:4,seed:1,
  selection:'All peaks with negative-slope decay fit and at least 20 dB above the global spectral median. No truth-guided selection, no truncation to three.',
  frequency:'Estimated frequencies held fixed during joint decay/coefficient optimization. Frequencies are not refined by this experiment.',
  scope:'Synthetic exponential mixtures; one noise seed; no arbitrary-recording, frequency-identifiability or physical-body guarantee.'},rows},null,2));
}
