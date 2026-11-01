import { makeScore, modesForVoice, frequency, NOTES, TINE_INDEX } from '../model.js';
import { bellowsScore, planBellowsVoices } from '../bellows-audio.js';
import { APPROACH_SECONDS, DECAY_TAUS } from '../excitation.js';

/** One immutable score-relative timeline feeds live scheduling and arbitrary-time pictures. */
export function createPerformance(patch, sampleRate=48000) {
  const saved=structuredClone(patch), start=.35, beat=60/patch.tempo;
  const garden=makeScore(saved).map((event,i)=>strike(event.index,event.time+start,event.velocity,`g${i}`));
  const tine=[0,4,8,12].map((b,i)=>strike(TINE_INDEX,start+b*beat,.45,`t${i}`));
  function strike(slot,noteOn,velocity,id){
    const modes=modesForVoice(slot,saved,sampleRate,{position:saved.strikePosition,velocity});
    return {id,slot,noteHz:slot===TINE_INDEX?modes[0].frequency:frequency(NOTES[slot]),noteOn,velocity,end:noteOn+modes[0].decay*DECAY_TAUS,position:saved.strikePosition,approach:APPROACH_SECONDS,
      modes:modes.map(({frequency,amplitude,decay})=>({frequency,amplitude,decay}))};
  }
  const bellows=planBellowsVoices(bellowsScore(saved).map(v=>({...v,noteOn:v.noteOn+start,noteOff:v.noteOff+start})),saved.bellows.adsr.r)
    .map(v=>({...v,bellows:structuredClone(saved.bellows),stolenFade:.04}));
  const events=[...garden.map(v=>({family:'garden',voice:v})),...tine.map(v=>({family:'tine',voice:v})),...bellows.map(v=>({family:'bellows',voice:v}))].sort((a,b)=>a.voice.noteOn-b.voice.noteOn);
  const duration=Math.max(...events.map(e=>e.voice.end))+.05;
  return {patch:saved,sampleRate,duration,events,snapshots:{garden:{voices:garden,dampers:[]},tine:{voices:tine,dampers:[]},bellows:{voices:bellows},sampleRate}};
}
