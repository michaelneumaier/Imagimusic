import {createTineImpulse} from './impulse.js';
// An authored pickup conversion, not radiated sound pressure or loudness matching.
export const TINE_PICKUP_GAIN=200; // digital amplitude per meter/second
export const TINE_OUTPUT_BOUND=.8;
export function renderTineImpulse(geometry,{sampleRate=48000,seconds=4,count=4,activation=.85,pickup=.85,impulseNs=1e-6}={}){
 if(!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>96000)throw Error('Sample rate must be an integer within 8000…96000.');
 if(!Number.isFinite(seconds)||seconds<.05||seconds>8)throw Error('Duration must be within 0.05…8 seconds.');
 if(!Number.isFinite(pickup)||pickup<0||pickup>1)throw Error('Pickup must be within 0…1.');
 const model=createTineImpulse(geometry,{count}),strike=model.strike({activation,impulseNs});
 // Keep the requested modal identity: never silently drop or fold modes.
 if(model.modes.some(m=>m.frequencyHz>=.45*sampleRate))throw Error('A retained mode exceeds the 0.45 × sample-rate guard. Choose another geometry, mode count, or sample rate.');
 const outputBound=TINE_PICKUP_GAIN*model.modes.reduce((sum,m,i)=>sum+Math.abs(m.shape(pickup)*strike.initialVelocity[i])*Math.hypot(1,m.gamma/m.omegaD),0);
 if(outputBound>TINE_OUTPUT_BOUND)throw Error('Velocity pickup exceeds the fixed-gain headroom bound. Reduce the impulse; no automatic normalization is applied.');
 const frames=Math.round(seconds*sampleRate),fadeFrames=Math.round(.025*sampleRate),channel=new Float32Array(frames);
 for(let i=0;i<frames;i++){
  const fade=Math.min(1,(frames-1-i)/fadeFrames);
  channel[i]=TINE_PICKUP_GAIN*strike.pointState(i/sampleRate,pickup).velocityMPerS*fade;
 }
 return {geometry:model.geometry,count,activation,pickup,impulseNs,sampleRate,seconds:frames/sampleRate,frames,fadeFrames,pickupGain:TINE_PICKUP_GAIN,pickupQuantity:'transverse velocity (m/s)',outputBound,displacementBoundM:strike.displacementBoundM,frequenciesHz:model.modes.map(m=>m.frequencyHz),modalMassesKg:model.modes.map(m=>m.massKg),channels:[channel]};
}
