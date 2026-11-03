import {createTineImpulse} from '../src/tine/impulse.js';
const base={kind:'beam',support:'clamped-free',lengthM:.08,thicknessM:.001,widthM:.01,material:{E:200e9,rho:7850,eta:.0002}};
const cases=[['baseline',base,.85,.85],['wider',{...base,widthM:.02},.85,.85],['longer',{...base,lengthM:.12},.85,.85],['pickup moved',base,.85,.3],['clamp activation',base,0,.85]];
const sampleRate=96000,seconds=1,impulseNs=1e-6;
const results=cases.map(([name,geometry,activation,pickup])=>{
 const model=createTineImpulse(geometry),strike=model.strike({activation,impulseNs});
 let peakVelocity=0,peakDisplacement=0,sum=0;
 for(let k=0;k<sampleRate*seconds;k++){
  const s=strike.pointState(k/sampleRate,pickup);
  peakVelocity=Math.max(peakVelocity,Math.abs(s.velocityMPerS));peakDisplacement=Math.max(peakDisplacement,Math.abs(s.displacementM));sum+=s.velocityMPerS**2;
 }
 const I=geometry.widthM*geometry.thicknessM**3/12,exactTipCompliance=geometry.lengthM**3/(3*geometry.material.E*I);
 return {name,activation,pickup,totalMassKg:model.totalMassKg,frequenciesHz:model.modes.map(m=>m.frequencyHz),modalMassesKg:model.modes.map(m=>m.massKg),initialEnergyJ:strike.modalState(0).reduce((s,m)=>s+m.energyJ,0),displacementBoundM:strike.displacementBoundM,peakSampledDisplacementM:peakDisplacement,peakSampledVelocityMPerS:peakVelocity,rmsSampledVelocityMPerS:Math.sqrt(sum/(sampleRate*seconds)),tipComplianceRelativeError:model.staticCompliance(1,1)/exactTipCompliance-1};
});
console.log(JSON.stringify({description:'Four-mode SI mechanical response, sampled for a numerical study; no audio normalization or acoustic radiation.',sampleRate,seconds,impulseNs,results},null,2));
