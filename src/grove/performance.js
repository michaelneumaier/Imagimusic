import {canonicalGrove,groveSystem,groveRingSeconds} from '../score/grove.js';
import {networkPickupScale,networkPickupModes} from '../coupling.js';
const freeze=value=>{if(value&&typeof value==='object'){Object.freeze(value);Object.values(value).forEach(v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v))freeze(v);});}return value;};
export function createGroveInstrument(grove,sampleRate=48000){
 if(!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>192000)throw new Error('Unsupported sample rate');
 const saved=JSON.parse(canonicalGrove(grove)),system=groveSystem(saved),pickupScale=networkPickupScale(system),n=system.n;
 const modes=Array.from({length:n},(_,struck)=>Array.from({length:n},(_,body)=>networkPickupModes(system,Array.from({length:n},(_,i)=>i===struck?1:0),body,{scale:pickupScale})));
 const pans=saved.layout.map(({x})=>[Math.cos((x+1)*Math.PI/4)/Math.sqrt(n),Math.sin((x+1)*Math.PI/4)/Math.sqrt(n)]);
 const stereoModes=modes.map(pickups=>[0,1].map(channel=>system.normalFreqsHz.map((frequency,j)=>({frequency,amplitude:pickups.reduce((sum,body,i)=>sum+body[j].amplitude*pans[i][channel],0),decay:system.decayS}))));
 const unitBound=Math.max(...stereoModes.flat().map(channel=>channel.reduce((sum,m)=>sum+Math.abs(m.amplitude),0))),outputGain=.45/Math.max(1,unitBound);
 return freeze({grove:saved,system,sampleRate,pickupScale,modes,stereoModes,pans,outputGain,ring:groveRingSeconds(saved),fade:.25,interpretation:'Lumped mass/spring sound source. Fixed equal-power stereo pickup follows layout x, with 1/sqrt(N) mix scaling; not acoustic radiation. Shell motion displays displacement envelopes.'});
}
export const groveTailLevel=(instrument,age)=>age<0||age>=instrument.ring?0:Math.min(1,(instrument.ring-age)/instrument.fade);
export function renderGroveBank(instrument){
 const {sampleRate,ring,outputGain}=instrument,length=Math.ceil(ring*sampleRate);
 return instrument.stereoModes.map(channels=>({sampleRate,channels:channels.map(modes=>{
  const output=new Float32Array(length);
  for(let i=0;i<length;i++){const t=i/sampleRate;let value=0;for(const m of modes)value+=m.amplitude*Math.exp(-t/m.decay)*Math.sin(2*Math.PI*m.frequency*t);output[i]=outputGain*groveTailLevel(instrument,t)*value;}
  return output;
 })}));
}
export function grovePerformanceFrame(instrument,events,time){
 if(!Number.isFinite(time))throw new Error('Frame time must be finite');
 const n=instrument.system.n,base=instrument.system.normalFreqsHz[0],quadratures=Array.from({length:n},()=>[0,0]),displacement=new Array(n).fill(0);
 for(const event of events){
  const age=time-event.frame/instrument.sampleRate,level=event.velocity*groveTailLevel(instrument,age);if(!level)continue;
  for(let body=0;body<n;body++)for(const m of instrument.modes[event.body][body]){
   const amplitude=level*m.amplitude*Math.exp(-age/m.decay),phase=2*Math.PI*m.frequency*age,relative=phase-2*Math.PI*base*time;
   quadratures[body][0]+=amplitude*Math.cos(relative);quadratures[body][1]+=amplitude*Math.sin(relative);displacement[body]+=amplitude*Math.sin(phase);
  }
 }
 return {time,envelope:quadratures.map(([re,im])=>Math.hypot(re,im)),displacement,strikes:events.filter(e=>time>=e.frame/instrument.sampleRate&&time<e.frame/instrument.sampleRate+.3).map(e=>({...e,age:time-e.frame/instrument.sampleRate}))};
}
/** Conservative future bound after the last accepted impulse; ignores terminal fade. */
export function groveOutputBound(instrument,events,time){
 return instrument.outputGain*Math.max(...[0,1].map(channel=>events.reduce((sum,e)=>{
  const age=time-e.frame/instrument.sampleRate;if(age<0)return sum;
  return sum+e.velocity*instrument.stereoModes[e.body][channel].reduce((s,m)=>s+Math.abs(m.amplitude)*Math.exp(-age/m.decay),0);
 },0)));
}
