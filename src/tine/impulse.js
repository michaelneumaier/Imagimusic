import {modesOf} from '../geometry.js';

const range=(value,lo,hi,name)=>{
 if(typeof value!=='number'||!Number.isFinite(value)||value<lo||value>hi)throw Error(`${name} must be within ${lo}…${hi}.`);
 return value;
};
const position=x=>range(x,0,1,'Position');
// Composite Simpson quadrature on the dimensionless span. Kept independent
// of the geometry module's sampled peak normalization.
function squaredIntegral(shape){
 const steps=2048;let sum=shape(0)**2+shape(1)**2;
 for(let k=1;k<steps;k++)sum+=(k%2?4:2)*shape(k/steps)**2;
 return sum/(3*steps);
}

/** Bounded uniform cantilever study, SI units, first 1…4 bending modes.
 * Consumes the existing geometry formulas without changing their adapter.
 * Modal viscous damping approximates the supplied loss factor: gamma=eta*wn/2.
 * No finite hammer/contact, radiation, microphone or manufacturing model.
 */
export function createTineImpulse(geometry,{count=4}={}){
 if(!geometry||geometry.kind!=='beam'||geometry.support!=='clamped-free')throw Error('A clamped-free beam is required.');
 if(!Number.isInteger(count)||count<1||count>4)throw Error('Mode count must be within 1…4.');
 const lengthM=range(geometry.lengthM,.04,.15,'Length'),thicknessM=range(geometry.thicknessM,.0003,.002,'Thickness'),widthM=range(geometry.widthM,.003,.02,'Width');
 if(lengthM/thicknessM<20)throw Error('This slender-beam study requires length/thickness >= 20.');
 const material=Object.freeze({E:range(geometry.material?.E,1e9,300e9,'Young modulus'),rho:range(geometry.material?.rho,300,20000,'Density'),eta:range(geometry.material?.eta,1e-5,.05,'Loss factor')});
 const source=Object.freeze({kind:'beam',support:'clamped-free',lengthM,thicknessM,widthM,material});
 const bank=modesOf(source,{count}),totalMass=material.rho*lengthM*widthM*thicknessM;
 const modes=Object.freeze(bank.freqsHz.map((f,i)=>{
  const omega=2*Math.PI*f,gamma=1/bank.decaysS[i],mass=totalMass*squaredIntegral(bank.shapes[i]);
  return Object.freeze({frequencyHz:f,dampedFrequencyHz:Math.sqrt(omega*omega-gamma*gamma)/(2*Math.PI),omega,gamma,omegaD:Math.sqrt(omega*omega-gamma*gamma),massKg:mass,stiffnessNPerM:mass*omega*omega,shape:bank.shapes[i]});
 }));
 function strike({activation=.85,impulseNs=1e-6}={}){
  position(activation);range(impulseNs,-1e-4,1e-4,'Impulse');
  const initialVelocity=modes.map(m=>impulseNs*m.shape(activation)/m.massKg);
  const displacementBound=initialVelocity.reduce((s,v,i)=>s+Math.abs(v)/modes[i].omegaD,0);
  // Conservative retained-mode displacement bound, not a stress/fabrication test.
  if(displacementBound>thicknessM*.1)throw Error('Impulse exceeds the study’s small-displacement bound (0.1 thickness).');
  function modalState(age){
   range(age,-3600,3600,'Age');
   return modes.map((m,i)=>{
    if(age<0)return {displacementM:0,velocityMPerS:0,energyJ:0};
    const decay=Math.exp(-m.gamma*age),phase=m.omegaD*age,v0=initialVelocity[i];
    const q=decay*v0*Math.sin(phase)/m.omegaD;
    const v=decay*v0*(Math.cos(phase)-m.gamma/m.omegaD*Math.sin(phase));
    return {displacementM:q,velocityMPerS:v,energyJ:.5*m.massKg*v*v+.5*m.stiffnessNPerM*q*q};
   });
  }
  function pointState(age,pickup=.85){
   position(pickup);const state=modalState(age);
   return state.reduce((sum,s,i)=>{const shape=modes[i].shape(pickup);sum.displacementM+=shape*s.displacementM;sum.velocityMPerS+=shape*s.velocityMPerS;return sum;},{displacementM:0,velocityMPerS:0});
  }
  return Object.freeze({activation,impulseNs,displacementBoundM:displacementBound,initialVelocity:Object.freeze(initialVelocity),modalState,pointState});
 }
 function staticCompliance(activation,pickup){
  position(activation);position(pickup);
  return modes.reduce((sum,m)=>sum+m.shape(activation)*m.shape(pickup)/m.stiffnessNPerM,0);
 }
 return Object.freeze({geometry:source,totalMassKg:totalMass,modes,strike,staticCompliance});
}
