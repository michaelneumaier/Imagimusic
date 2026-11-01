import {createVoiceInstrument,voiceOutputBound} from './voice-performance.js';
import {voiceBufferIndex,groveVoiceEnvelope} from '../score/grove-voice.js';
/** A distinct capture kind keeps the v1 plain Grove record unchanged. */
export function createGroveVoiceSession({grove,voice:config},sampleRate=48000){
 const instrument=createVoiceInstrument(grove,config,sampleRate),{voice}=instrument,events=[];let ended=null;
 const snapshot=()=>({version:1,kind:'imagimusic-grove-voice',grove:structuredClone(voice.grove),voice:structuredClone(voice.config),sampleRate,outputGain:voice.outputGain,events:structuredClone(events),ended:structuredClone(ended)});
 function strike({frame,body,velocity,position=Math.min(1,voice.positions.length-1)}){
  if(!Number.isInteger(frame)||frame<0||!Number.isFinite(velocity)||velocity<=0||velocity>1)throw new Error('Invalid voice gesture');const bufferIndex=voiceBufferIndex(voice,position,body);
  if(ended)return {accepted:false,reason:'ended'};if(events.length>=128||frame>120*sampleRate)return {accepted:false,reason:'capacity'};
  if(events.length&&frame<events.at(-1).frame)throw new Error('Voice gestures must be chronological');
  const event={frame,body,position,strikeU:voice.positions[position],bufferIndex,velocity},bound=voiceOutputBound(instrument,[...events,event],frame);
  if(bound>.9)return {accepted:false,reason:'headroom',bound};events.push(event);return {accepted:true,event:{...event},bound};
 }
 function finish(frame,fadeFrames=Math.round(.025*sampleRate)){if(!Number.isInteger(frame)||frame<0||!Number.isInteger(fadeFrames)||fadeFrames<1)throw new Error('Invalid end time');ended??={frame,fadeFrames};return snapshot();}
 function visual(time){
  if(!Number.isFinite(time))throw new Error('Invalid visual time');const envelope=groveVoiceEnvelope(voice,events.map(e=>({...e,time:e.frame/sampleRate})),time);
  const fade=ended?Math.max(0,Math.min(1,1-(time*sampleRate-ended.frame)/ended.fadeFrames)):1;
  return {time,envelope:envelope.map(v=>v*fade),lowBand:true,strikes:fade?events.filter(e=>time>=e.frame/sampleRate&&time<e.frame/sampleRate+.3).map(e=>({...e,age:time-e.frame/sampleRate})):[]};
 }
 return {strike,finish,snapshot,visual,instrument,boundAt:frame=>voiceOutputBound(instrument,events,frame)};
}
