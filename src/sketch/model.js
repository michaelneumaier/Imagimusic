/** A constructed modal instrument, not recovered geometry.
 * Each activation adds prescribed displacement AND velocity initial conditions.
 * Mass is an arbitrary unit choice; the pickup reads summed displacement.
 */
export function createResonanceSketch(input){
 const frequencies=input?.frequencies,decays=input?.decays,coefficients=input?.coefficients;
 if(!Array.isArray(frequencies)||frequencies.length<1||frequencies.length>4||!Array.isArray(decays)||decays.length!==frequencies.length||!Array.isArray(coefficients)||coefficients.length!==2*frequencies.length)throw Error('A sketch needs one to four modes with one decay and two quadratures each.');
 if([...frequencies].some((f,i)=>!Number.isFinite(f)||f<20||f>2000||(i&&f<=frequencies[i-1]))||[...decays].some(t=>!Number.isFinite(t)||t<.1||t>8)||[...coefficients].some(c=>!Number.isFinite(c)||Math.abs(c)>64))throw Error('Sketch parameters exceed the bounded study range.');
 const modes=frequencies.map((frequency,i)=>{
  const decay=decays[i],gamma=1/decay,omega=2*Math.PI*frequency,a=coefficients[2*i],b=coefficients[2*i+1];
  return Object.freeze({frequency,decay,a,b,mass:1,damping:2*gamma,stiffness:omega*omega+gamma*gamma,
   initialDisplacement:a,initialVelocity:omega*b-gamma*a,amplitude:Math.hypot(a,b)});
 });
 const amplitudeBound=modes.reduce((sum,m)=>sum+m.amplitude,0);
 if(!amplitudeBound)throw Error('A zero-amplitude model has no playable excitation.');
 const pickupGain=.25/Math.max(1,amplitudeBound);
 const checkMode=mode=>{if(mode!==null&&(!Number.isInteger(mode)||mode<0||mode>=modes.length))throw Error('Unknown sketch mode.');};
 const checkStrength=strength=>{if(!Number.isFinite(strength)||strength<0||strength>1)throw Error('Activation strength must be within 0..1.');};
 function modeState(index,age,strength=1){
  checkMode(index);if(index===null)throw Error('Name one mode for a state sample.');
  if(!Number.isFinite(age))throw Error('Age must be finite.');checkStrength(strength);
  const m=modes[index];if(age<0||strength===0)return {displacement:0,velocity:0,envelope:0,energy:0};
  const gamma=1/m.decay,omega=2*Math.PI*m.frequency,fade=strength*Math.exp(-gamma*age);
  if(fade===0)return {displacement:0,velocity:0,envelope:0,energy:0};
  const cos=Math.cos(omega*age),sin=Math.sin(omega*age);
  const displacement=fade*(m.a*cos+m.b*sin);
  const velocity=fade*((omega*m.b-gamma*m.a)*cos+(-omega*m.a-gamma*m.b)*sin);
  return {displacement,velocity,envelope:fade*m.amplitude,energy:.5*(velocity*velocity+m.stiffness*displacement*displacement)};
 }
 function sample(age,{mode=null,strength=1}={}){
  checkMode(mode);checkStrength(strength);
  const indexes=mode===null?modes.map((_,i)=>i):[mode];
  return pickupGain*indexes.reduce((sum,i)=>sum+modeState(i,age,strength).displacement,0);
 }
 function render({sampleRate=8000,seconds=4,mode=null,strength=1}={}){
  if(!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>96000||modes.some(m=>m.frequency>=.45*sampleRate))throw Error('Use a supported playback rate with frequencies below 0.45 of the rate.');
  if(!Number.isFinite(seconds)||seconds<.05||seconds>8)throw Error('Render duration must be within 0.05..8 seconds.');
  checkMode(mode);checkStrength(strength);
  const frames=Math.round(seconds*sampleRate),fadeFrames=Math.min(frames,Math.round(.025*sampleRate));
  const channel=Float32Array.from({length:frames},(_,i)=>sample(i/sampleRate,{mode,strength})*(i<frames-fadeFrames?1:(frames-1-i)/(fadeFrames-1)));
  return {sampleRate,channels:[channel],frames,fadeFrames,pickupGain,mode,strength};
 }
 return Object.freeze({modes:Object.freeze(modes),pickupGain,amplitudeBound,
  singleActivationPeakBound:pickupGain*amplitudeBound,modeState,sample,render});
}
