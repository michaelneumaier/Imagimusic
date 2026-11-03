import {createTineImpulse} from './impulse.js';
import {TINE_PICKUP_GAIN,TINE_OUTPUT_BOUND} from './render.js';

// An authored invitation, identical for every body; not a recovered performance.
export const TINE_PHRASE=Object.freeze([
 Object.freeze({time:0,strength:.25}),
 Object.freeze({time:.8,strength:.15}),
 Object.freeze({time:2.1,strength:.25})
]);

/** Linear superposition on one unchanged body. Modal energy is computed from
 * the combined displacement/velocity, including interference between strikes.
 * Bounds add absolute contributions and may conservatively refuse cancellation.
 */
export function createTinePhrase(geometry,{count=4,activation=.85,pickup=.85,impulseNs=1e-6,events=TINE_PHRASE}={}){
 if(!Number.isFinite(pickup)||pickup<0||pickup>1)throw Error('Pickup must be within 0…1.');
 if(!Number.isFinite(impulseNs)||Math.abs(impulseNs)>1e-4)throw Error('Impulse must be within ±0.0001 N s.');
 if(!Array.isArray(events)||events.length<1||events.length>8)throw Error('A phrase needs 1…8 strikes.');
 const model=createTineImpulse(geometry,{count});
 let previous=-1;
 const strikes=Object.freeze(events.map(event=>{
  if(!event||!Number.isFinite(event.time)||event.time<0||event.time>4||event.time<previous)throw Error('Strike times must be ordered within 0…4 seconds.');
  if(!Number.isFinite(event.strength)||Math.abs(event.strength)>1)throw Error('Strike strength must be within ±1.');
  previous=event.time;
  return Object.freeze({time:event.time,strength:event.strength,response:model.strike({activation,impulseNs:impulseNs*event.strength})});
 }));
 const displacementBoundM=strikes.reduce((sum,s)=>sum+s.response.displacementBoundM,0);
 if(displacementBoundM>model.geometry.thicknessM*.1)throw Error('Combined phrase exceeds the small-displacement bound.');
 const outputBound=TINE_PICKUP_GAIN*strikes.reduce((sum,s)=>sum+model.modes.reduce((total,m,i)=>total+Math.abs(m.shape(pickup)*s.response.initialVelocity[i])*Math.hypot(1,m.gamma/m.omegaD),0),0);
 if(outputBound>TINE_OUTPUT_BOUND)throw Error('Combined phrase exceeds fixed-gain headroom; no normalization is applied.');
 function modalState(time){
  if(!Number.isFinite(time)||time<0||time>8)throw Error('Phrase time must be within 0…8 seconds.');
  const state=model.modes.map(()=>({displacementM:0,velocityMPerS:0,energyJ:0}));
  for(const s of strikes){if(s.time>time)break;const next=s.response.modalState(time-s.time);for(let i=0;i<state.length;i++){state[i].displacementM+=next[i].displacementM;state[i].velocityMPerS+=next[i].velocityMPerS;}}
  for(let i=0;i<state.length;i++){const s=state[i],m=model.modes[i];s.energyJ=.5*m.massKg*s.velocityMPerS**2+.5*m.stiffnessNPerM*s.displacementM**2;}
  return state;
 }
 function pointState(time){return modalState(time).reduce((sum,s,i)=>{const shape=model.modes[i].shape(pickup);sum.displacementM+=shape*s.displacementM;sum.velocityMPerS+=shape*s.velocityMPerS;return sum;},{displacementM:0,velocityMPerS:0});}
 return Object.freeze({geometry:model.geometry,count,activation,pickup,impulseNs,events:Object.freeze(strikes.map(({time,strength})=>Object.freeze({time,strength}))),modes:model.modes,displacementBoundM,outputBound,modalState,pointState});
}

export function renderTinePhrase(geometry,{sampleRate=48000,seconds=6.1,...options}={}){
 if(!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>96000)throw Error('Sample rate must be an integer within 8000…96000.');
 if(!Number.isFinite(seconds)||seconds<.05||seconds>8)throw Error('Duration must be within 0.05…8 seconds.');
 const phrase=createTinePhrase(geometry,options),frames=Math.round(seconds*sampleRate),fadeFrames=Math.round(.025*sampleRate);
 if(phrase.events.at(-1).time>=(frames-1-fadeFrames)/sampleRate)throw Error('Every strike must precede the ending fade.');
 if(phrase.modes.some(m=>m.frequencyHz>=.45*sampleRate))throw Error('A retained mode exceeds the 0.45 × sample-rate guard.');
 const channel=new Float32Array(frames);
 for(let i=0;i<frames;i++)channel[i]=TINE_PICKUP_GAIN*phrase.pointState(i/sampleRate).velocityMPerS*Math.min(1,(frames-1-i)/fadeFrames);
 return {geometry:phrase.geometry,count:phrase.count,activation:phrase.activation,pickup:phrase.pickup,impulseNs:phrase.impulseNs,events:phrase.events,sampleRate,seconds:frames/sampleRate,frames,fadeFrames,pickupGain:TINE_PICKUP_GAIN,pickupQuantity:'transverse velocity (m/s)',outputBound:phrase.outputBound,displacementBoundM:phrase.displacementBoundM,frequenciesHz:phrase.modes.map(m=>m.frequencyHz),channels:[channel]};
}
