import {createExpressionAutomation} from './automation.js';
import {createBellowsGraph} from '../bellows-audio.js';
import {expressionFrame,expressionControlTimeline} from './performance.js';

function denseAutomation(param){let started=false;return(value,time,method)=>{param[started?method:'setValueAtTime'](value,time);started=true;};}

/** Offline graph uses the existing Bellows source/filter/gain. Legacy modulation
 * is replaced by the declared expression mapping, including per-voice filter Q. */
export function buildExpressionGraph(context,performance,{controlRate=1000,compact=true}={}){
 if(context.sampleRate!==performance.sampleRate)throw new Error('Expression performance and audio context sample rates must match.');
 const master=context.createGain();master.gain.value=.24;master.connect(context.destination);
 const graphs=performance.voices.map(v=>{
  const base=440*2**((v.address.noteNumber-69)/12);
  const graph=createBellowsGraph(context,master,{noteHz:base},performance.patch,(performance.patch.seed+v.voiceId*997)>>>0);
  graph.params.q=graph.filter.Q;
  // Keep the graph connected and sources running until after the offline window.
  graph.source.onended=null;graph.source.start(v.noteOn);graph.source.stop(performance.duration+1);
  return {voice:v,graph,automation:Object.fromEntries(Object.entries(graph.params).map(([key,param])=>[key,compact?createExpressionAutomation(param):denseAutomation(param)]))};
 });
 const values=v=>({gain:v.gain,frequencyHz:v.frequencyHz,cutoffHz:v.cutoffHz,q:v.q});
 const apply=(time,frame,method)=>{
  const byId=new Map(frame.voices.map(v=>[v.voiceId,v]));
  for(const entry of graphs){
   const voice=byId.get(entry.voice.voiceId);if(!voice)continue;
   for(const [key,value] of Object.entries(values(voice)))entry.automation[key](value,time,method);
  }
 };
 for(const point of expressionControlTimeline(performance,controlRate)){
  if(point.leftTime!==null)apply(point.time,expressionFrame(performance,point.leftTime),'linearRampToValueAtTime');
  apply(point.time,expressionFrame(performance,point.time),point.step?'setValueAtTime':'linearRampToValueAtTime');
 }
 return {master,graphs,dispose(){for(const {graph} of graphs)graph.dispose();master.disconnect();}};
}
export async function renderExpressionAudio(performance,{OfflineContext=globalThis.OfflineAudioContext,controlRate=1000,compact=true}={}){
 const length=Math.ceil(performance.duration*performance.sampleRate),context=new OfflineContext(1,length,performance.sampleRate);
 const graph=buildExpressionGraph(context,performance,{controlRate,compact});
 try{const buffer=await context.startRendering();return {channels:[buffer.getChannelData(0).slice()],sampleRate:performance.sampleRate};}finally{graph.dispose();}
}
