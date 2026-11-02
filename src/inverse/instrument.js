import {canonicalGrove, groveSystem, groveEnvelope, groveRingSeconds, GROVE_BOUNDS} from '../score/grove.js';
import {networkStrikeResponse} from '../coupling.js';

export const INVERSE_IMPULSE_NS = 0.01;
export const INVERSE_DISPLACEMENT_GAIN = 8;
export const INVERSE_PICKUP_BODIES = Object.freeze([0, 2]);
export const INVERSE_FADE_SECONDS = 0.025;
// Cauchy–Schwarz on orthonormal modes bounds any point impulse/pickup pair:
// |x| ≤ J/(sqrt(m_strike*m_pickup)*omega_min). Positive bridges cannot lower
// the smallest undamped eigenvalue below the minimum grounded frequency.
export const INVERSE_SINGLE_STRIKE_PEAK_BOUND = INVERSE_IMPULSE_NS*INVERSE_DISPLACEMENT_GAIN /
 (GROVE_BOUNDS.mass[0]*Math.sqrt((2*Math.PI*GROVE_BOUNDS.hz[0])**2-GROVE_BOUNDS.loss[1]**2));
const freeze = value => {
 if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}
 return value;
};
const bodyIndex = body => {
 if(!Number.isInteger(body)||body<0||body>2)throw new RangeError('Strike body must be 0, 1 or 2.');
};

/** The searched three-mass model, not the richer Grove voice. The same fixed
 * displacement scale is used for every candidate; channel identity is a virtual
 * pickup choice, not a prediction of acoustic stereo space.
 */
export function createInverseInstrument(grove, options={}){
 if(!options||typeof options!=='object'||Array.isArray(options))throw new TypeError('Instrument options must be an object.');
 for(const key of Object.keys(options))if(key!=='sampleRate')throw new Error(`Unknown instrument option: ${key}`);
 const sampleRate=options.sampleRate??48000;
 if(!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>96000)throw new RangeError('Sample rate must be an integer within 8000..96000.');
 // Canonical validation precedes copying; later caller mutations cannot change a prepared voice.
 const snapshot=freeze(JSON.parse(canonicalGrove(grove))),system=groveSystem(snapshot);
 const ringFrames=Math.ceil(groveRingSeconds(snapshot)*sampleRate),fadeFrames=Math.ceil(INVERSE_FADE_SECONDS*sampleRate);
 const frames=ringFrames+fadeFrames,duration=frames/sampleRate;
 const responses=[0,1,2].map(body=>networkStrikeResponse(system,system.m.map((_,i)=>i===body?INVERSE_IMPULSE_NS:0)));
 const fadeAt=t=>t<ringFrames/sampleRate?1:Math.max(0,1-(t*sampleRate-ringFrames)/(fadeFrames-1));
 const model='Three lumped masses with ground and bridge springs, common mass-proportional damping. Virtual displacement pickups on bodies 1 and 3; fixed gain across candidates. Visible low-band envelopes are an interpretation, not audio-rate deformation. No beam partials or acoustic radiation.';
 return Object.freeze({
  kind:'imagimusic-three-mass-instrument',grove:snapshot,sampleRate,frames,ringFrames,fadeFrames,duration,
  singleStrikePeakBound:INVERSE_SINGLE_STRIKE_PEAK_BOUND,
  normalFrequenciesHz:Object.freeze(system.normalFreqsHz.slice()),decaySeconds:system.decayS,
  impulseNs:INVERSE_IMPULSE_NS,outputGain:INVERSE_DISPLACEMENT_GAIN,pickupBodies:INVERSE_PICKUP_BODIES,model,
  frame(body,t){
   bodyIndex(body);
   if(!Number.isFinite(t)||t<0||t>duration)throw new RangeError('Picture time must be within this strike.');
   const response=responses[body],fade=fadeAt(t);
   return {time:t,fade,displacement:response.x(t).map(x=>x*fade),envelope:groveEnvelope(system,response,t).map(x=>x*fade)};
  },
  renderStrike(body){
   bodyIndex(body);
   const modes=INVERSE_PICKUP_BODIES.map(pickup=>responses[body].bodyModes(pickup));
   const channels=[new Float32Array(frames),new Float32Array(frames)];
   let peak=0;
   for(let i=0;i<frames-1;i++){
    const t=i/sampleRate,level=INVERSE_DISPLACEMENT_GAIN*Math.exp(-system.gamma*t)*fadeAt(t);
    const phases=system.omegaD.map(omega=>Math.sin(omega*t));
    for(let c=0;c<2;c++){
     const value=level*modes[c].reduce((sum,m,j)=>sum+m.amplitude*phases[j],0);
     if(!Number.isFinite(value)||Math.abs(value)>INVERSE_SINGLE_STRIKE_PEAK_BOUND*(1+1e-10))throw new Error('Candidate response exceeds the finite original-output bound.');
     channels[c][i]=value;peak=Math.max(peak,Math.abs(channels[c][i]));
    }
   }
   // Fresh buffers own their data and end at exact positive zero.
   return {sampleRate,channels,frames,peak,body,impulseNs:INVERSE_IMPULSE_NS,outputGain:INVERSE_DISPLACEMENT_GAIN};
  }
 });
}
