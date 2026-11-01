import { makeScore, modesForVoice, frequency, NOTES, TINE_INDEX, validatePatch } from '../model.js';
import { bellowsScore, planBellowsVoices } from '../bellows-audio.js';
import { APPROACH_SECONDS, DECAY_TAUS } from '../excitation.js';

/** One immutable score-relative timeline feeds live scheduling and arbitrary-time pictures. */
export function createPerformance(patch, sampleRate=48000) {
  const saved=structuredClone(patch), start=.35, beat=60/patch.tempo;
  const garden=makeScore(saved).map((event,i)=>modalStrike(saved,sampleRate,event.index,event.time+start,event.velocity,`g${i}`));
  const tine=[0,4,8,12].map((b,i)=>modalStrike(saved,sampleRate,TINE_INDEX,start+b*beat,.45,`t${i}`));
  const bellows=planBellowsVoices(bellowsScore(saved).map(v=>({...v,noteOn:v.noteOn+start,noteOff:v.noteOff+start})),saved.bellows.adsr.r)
    .map(v=>({...v,bellows:structuredClone(saved.bellows),stolenFade:.04}));
  const events=[...garden.map(v=>({family:'garden',voice:v})),...tine.map(v=>({family:'tine',voice:v})),...bellows.map(v=>({family:'bellows',voice:v}))].sort((a,b)=>a.voice.noteOn-b.voice.noteOn);
  const duration=Math.max(...events.map(e=>e.voice.end))+.05;
  return {patch:saved,sampleRate,duration,events,snapshots:{garden:{voices:garden,dampers:[]},tine:{voices:tine,dampers:[]},bellows:{voices:bellows},sampleRate}};
}

function modalStrike(saved,sampleRate,slot,noteOn,velocity,id){
 const modes=modesForVoice(slot,saved,sampleRate,{position:saved.strikePosition,velocity});
 return {id,slot,noteHz:slot===TINE_INDEX?modes[0].frequency:frequency(NOTES[slot]),noteOn,velocity,end:noteOn+modes[0].decay*DECAY_TAUS,position:saved.strikePosition,approach:APPROACH_SECONDS,
   modes:modes.map(({frequency,amplitude,decay})=>({frequency,amplitude,decay}))};
}

/** Compile explicit score-relative seconds into the same voices consumed by audio and scene. */
export function createPerformanceFromEvents(patch,score,sampleRate=48000){
 const saved=validatePatch(patch);
 if(!Number.isFinite(sampleRate)||sampleRate<=0)throw new Error('Sample rate must be positive');
 if(!Array.isArray(score)||score.length>256)throw new Error('Explicit score must contain at most 256 events');
 const ids=new Set(),allowed={garden:['slot'],tine:[],bellows:['noteHz','noteOff']};
 const ordered=score.map((event,order)=>{
  if(!event||!Object.hasOwn(allowed,event.family))throw new Error('Unknown score family');
  const keys=['id','family','time','velocity',...allowed[event.family]];
  if(Object.keys(event).some(key=>!keys.includes(key)))throw new Error('Unsupported score event field');
  if(typeof event.id!=='string'||!event.id.length||ids.has(event.id))throw new Error('Score event IDs must be unique nonempty strings');ids.add(event.id);
  if(!Number.isFinite(event.time)||event.time<0||event.time>120)throw new Error('Score time must be between 0 and 120 seconds');
  if(!Number.isFinite(event.velocity)||event.velocity<=0||event.velocity>1)throw new Error('Score velocity must be in (0,1]');
  if(event.family==='garden'&&(!Number.isInteger(event.slot)||event.slot<0||event.slot>7))throw new Error('Garden score selects resonator slot 0 through 7');
  if(event.family==='bellows'){
   if(!Number.isFinite(event.noteHz)||event.noteHz<=0||event.noteHz>=sampleRate/2)throw new Error('Bellows pitch must be positive and below Nyquist');
   if(!Number.isFinite(event.noteOff)||event.noteOff<=event.time||event.noteOff>120)throw new Error('Bellows note-off must follow its onset and be within 120 seconds');
  }
  return {...event,order};
 }).sort((a,b)=>a.time-b.time||a.order-b.order);
 const garden=[],tine=[],choir=[];
 for(const event of ordered){
  if(event.family==='bellows')choir.push({id:choir.length+1,scoreId:event.id,noteHz:event.noteHz,velocity:event.velocity,noteOn:event.time,noteOff:event.noteOff});
  else (event.family==='garden'?garden:tine).push({...modalStrike(saved,sampleRate,event.family==='garden'?event.slot:TINE_INDEX,event.time,event.velocity,event.id),scoreId:event.id});
 }
 const bellows=planBellowsVoices(choir,saved.bellows.adsr.r).map(v=>({...v,bellows:structuredClone(saved.bellows),stolenFade:.04}));
 const lookup=new Map([...garden,...tine,...bellows].map(v=>[v.scoreId,v]));
 const events=ordered.map(e=>({family:e.family,voice:lookup.get(e.id)}));
 const duration=Math.max(0,...events.map(e=>e.voice.end))+.05;
 return {patch:saved,sampleRate,duration,events,snapshots:{garden:{voices:garden,dampers:[]},tine:{voices:tine,dampers:[]},bellows:{voices:bellows},sampleRate}};
}
