import {coupledPair,pickupModes,strikeResponse} from '../coupling.js';
export const DEFAULT_LOOM={frequency:196,coupling:.004,detune:0,loss:.35};
export function makeLoom(settings=DEFAULT_LOOM,body=0){
 const p={...DEFAULT_LOOM,...settings};
 for(const [key,min,max] of [['frequency',80,600],['coupling',0,.04],['detune',-120,120],['loss',.2,2]])if(!Number.isFinite(p[key])||p[key]<min||p[key]>max)throw new Error(`Invalid ${key}`);
 if(body!==0&&body!==1)throw new Error('Strike body must be 0 or 1');
 const mass=.02,w=2*Math.PI*p.frequency;
 const system=coupledPair({m1:mass,m2:mass,f1:p.frequency,f2:p.frequency*2**(p.detune/1200),kc:p.coupling*mass*w*w,gamma:p.loss});
 const impulse=body===0?[.01,0]:[0,.01],response=strikeResponse(system,impulse);
 const modes=[0,1].map(i=>pickupModes(system,impulse,i,{level:.19}));
 const duration=Math.min(20,8/p.loss),fade=.025;
 return {settings:p,body,system,modes,response,duration,fade};
}
export function loomLevel(study,t){return t<0||t>=study.duration?0:Math.min(1,(study.duration-t)/study.fade);}
/** Analytic modal amplitude envelope, without sampling the carrier phase into visible sway. */
export function loomEnvelope(study,t){
 const level=loomLevel(study,t),base=study.system.normalFreqsHz[0];
 return study.modes.map(modes=>{let re=0,im=0;for(const m of modes){const angle=2*Math.PI*(m.frequency-base)*t+m.phase;re+=m.amplitude*Math.cos(angle);im+=m.amplitude*Math.sin(angle);}return level*Math.exp(-study.settings.loss*Math.max(0,t))*Math.hypot(re,im);});
}
export function renderLoom(study,sampleRate=48000){
 if(!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>192000)throw new Error('Unsupported sample rate');
 const length=Math.ceil(study.duration*sampleRate),channels=[new Float32Array(length),new Float32Array(length)];
 for(let i=0;i<length;i++){
  const t=i/sampleRate,gain=.45*loomLevel(study,t)*Math.exp(-study.settings.loss*t);
  for(let body=0;body<2;body++)for(const mode of study.modes[body])channels[body][i]+=gain*mode.amplitude*Math.sin(2*Math.PI*mode.frequency*t+mode.phase);
 }
 return {channels,sampleRate};
}
export function stereoWav({channels,sampleRate}){
 const length=channels[0].length,buffer=new ArrayBuffer(44+length*4),v=new DataView(buffer);
 const text=(offset,s)=>{for(let i=0;i<s.length;i++)v.setUint8(offset+i,s.charCodeAt(i));};
 text(0,'RIFF');v.setUint32(4,36+length*4,true);text(8,'WAVE');text(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,2,true);v.setUint32(24,sampleRate,true);v.setUint32(28,sampleRate*4,true);v.setUint16(32,4,true);v.setUint16(34,16,true);text(36,'data');v.setUint32(40,length*4,true);
 for(let i=0;i<length;i++)for(let c=0;c<2;c++)v.setInt16(44+(i*2+c)*2,Math.round(Math.max(-1,Math.min(1,channels[c][i]))*32767),true);
 return buffer;
}
