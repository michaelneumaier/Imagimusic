import {createTineImpulse} from '../src/tine/impulse.js';
import {TINE_PICKUP_GAIN,TINE_OUTPUT_BOUND} from '../src/tine/render.js';
// Exhaust the finite page controls, not the broader mechanical API's domain.
export function studyTineRange(){
 let envelope={value:0},output={value:0},highestModeHz=0,configurations=0;
 for(let length=60;length<=120;length+=5)for(let width=5;width<=20;width++){
  const model=createTineImpulse({kind:'beam',support:'clamped-free',lengthM:length/1000,widthM:width/1000,thicknessM:.001,material:{E:200e9,rho:7850,eta:.0002}});
  highestModeHz=Math.max(highestModeHz,model.modes.at(-1).frequencyHz);
  for(let ai=0;ai<=20;ai++){
   const strike=model.strike({activation:ai/20});
   for(let pi=0;pi<=20;pi++){
    configurations++;let displacement=0,velocity=0;
    model.modes.forEach((m,i)=>{const v=Math.abs(strike.initialVelocity[i]*m.shape(pi/20));displacement+=v/m.omegaD;velocity+=v*Math.hypot(1,m.gamma/m.omegaD);});
    if(displacement>envelope.value)envelope={value:displacement,length,width,activation:ai/20,pickup:pi/20};
    if(TINE_PICKUP_GAIN*velocity>output.value)output={value:TINE_PICKUP_GAIN*velocity,length,width,activation:ai/20,pickup:pi/20};
   }
  }
 }
 return {configurations,pickupGain:TINE_PICKUP_GAIN,maxDisplacementEnvelopeM:envelope,maxDigitalVelocityBound:output,highestModeHz,withinHeadroom:output.value<=TINE_OUTPUT_BOUND,withinAliasGuard:highestModeHz<.45*48000};
}
if(process.argv[1]?.endsWith('/study-tine-range.mjs'))console.log(JSON.stringify(studyTineRange(),null,2));
