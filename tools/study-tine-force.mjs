import {createTineForceStudy,halfSineForcePulse} from '../src/tine/force-study.js';
import {createTineImpulse} from '../src/tine/impulse.js';
import {createTineDesign,requestForTineDesign} from '../src/tine/address.js';
const design=createTineDesign(),{geometry}=requestForTineDesign(design),sampleRate=48000,impulseNs=1e-7;
const model=createTineImpulse(geometry),instant=model.strike({activation:design.activation,impulseNs});
const cases=[6,24,48,192].map(frames=>{
 const study=createTineForceStudy(geometry,{sampleRate,activation:design.activation,pickup:design.pickup});
 const forces=halfSineForcePulse({frames,sampleRate,impulseNs});for(const force of forces)study.advance(force);
 const result=study.snapshot(),reference=instant.modalState(frames/sampleRate);
 return {frames,durationMs:1000*frames/sampleRate,measuredImpulseNs:result.impulseNs,peakForceN:Math.max(...forces),modes:result.modes.map((mode,i)=>({frequencyHz:model.modes[i].frequencyHz,energyJ:mode.energyJ,workJ:mode.workJ,dissipatedJ:mode.dissipatedJ,energyRatioToImpulseAtStart:mode.energyJ/reference[i].energyJ}))};
});
console.log(JSON.stringify({kind:'imagimusic-prescribed-force-study',version:1,design,sampleRate,impulseNs,cases,limits:'Prescribed sample-interval-average half-sine pulses, held constant per sample; not a hammer collision. Compare energies at each pulse ending against an ideal impulse at time zero. No radiation, listening verdict or new live format.'},null,2));
