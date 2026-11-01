import {createGroveVoice,DEFAULT_VOICE_CONFIG} from '../score/grove-voice.js';
export function createVoiceInstrument(grove,config=DEFAULT_VOICE_CONFIG,sampleRate=48000){
 if(!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>192000)throw new Error('Unsupported sample rate');
 return Object.freeze({voice:createGroveVoice(grove,config),sampleRate});
}
export function renderVoiceBank({voice,sampleRate}){
 const length=Math.ceil(voice.ring*sampleRate),profiles=voice.stereoModes.flat(2),modeCount=voice.normalFreqsHz.length;
 const outputs=profiles.map(()=>new Float32Array(length)),basis=new Float64Array(modeCount);
 // Every strike position and pickup shares these normal frequencies and decays.
 // Evaluate their analytic basis once per sample, then apply signed channel weights.
 for(let i=0;i<length;i++){
  const t=i/sampleRate,level=voice.outputGain*Math.min(1,(voice.ring-t)/voice.fade);
  for(let r=0;r<modeCount;r++)basis[r]=Math.exp(-voice.gammas[r]*t)*Math.sin(2*Math.PI*voice.normalFreqsHz[r]*t);
  for(let channel=0;channel<profiles.length;channel++){let value=0;for(let r=0;r<modeCount;r++)value+=profiles[channel][r].amplitude*basis[r];outputs[channel][i]=level*value;}
 }
 return voice.stereoModes.flat(1).map((_,slot)=>({sampleRate,channels:[outputs[slot*2],outputs[slot*2+1]]}));
}
export function voiceOutputBound({voice,sampleRate},events,frame){return voice.outputGain*Math.max(...[0,1].map(channel=>events.reduce((sum,e)=>{
 const age=(frame-e.frame)/sampleRate;if(age<0)return sum;return sum+e.velocity*voice.stereoModes[e.position][e.body][channel].reduce((v,m)=>v+Math.abs(m.amplitude)*Math.exp(-age/m.decay),0);
},0)));}
