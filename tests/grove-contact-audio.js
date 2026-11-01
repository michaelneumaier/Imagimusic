import {composeGrove} from '../src/score/grove.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {renderRestPassage} from '../src/rest/engine.js';
const $=id=>document.getElementById(id),report={version:1,generated:new Date().toISOString(),userAgent:navigator.userAgent,results:[]};
function prepare(grove,sampleRate){return new Promise((resolve,reject)=>{const worker=new Worker('../src/grove/contact-prepare-worker.js',{type:'module'});worker.onmessage=({data})=>{worker.terminate();data.error?reject(new Error(data.error)):resolve(data.recipe);};worker.onerror=e=>{worker.terminate();reject(new Error(e.message));};worker.postMessage({grove,voice:DEFAULT_VOICE_CONFIG,sampleRate});});}
try{
 for(const [seed,sampleRate] of [[3,48000],[7,44100]]){
  $('status').textContent=`Preparing Grove ${seed} at ${sampleRate} Hz…`;const start=performance.now(),recipe=await prepare(composeGrove({seed}),sampleRate),prepareMs=performance.now()-start;
  const frames=Math.round(sampleRate*1.2),strikes=[{frame:0,body:0,position:1,velocity:.5},{frame:Math.round(.25*sampleRate),body:1,position:2,velocity:.4},{frame:Math.round(.7*sampleRate),body:2,position:0,velocity:.5}];
  const contacts=[{body:0,zone:2,strength:1,start:Math.round(.1*sampleRate),end:Math.round(.6*sampleRate)},{body:1,zone:1,strength:0,start:Math.round(.2*sampleRate),end:Math.round(.8*sampleRate)}];
  const events=[...strikes.map((s,i)=>({...s,id:`strike-${i}`,kind:'strike'})),...contacts.flatMap((c,i)=>[{id:`on-${i}`,kind:'contact',frame:c.start,body:c.body,zone:c.zone,strength:c.strength},{id:`off-${i}`,kind:'contact',frame:c.end,body:c.body,zone:null}])];
  const expected=renderRestPassage(recipe,{strikes,contacts,frames}),context=new OfflineAudioContext(2,frames,sampleRate);await context.audioWorklet.addModule('../src/grove/contact-worklet.js');
  const node=new AudioWorkletNode(context,'imagimusic-grove-contact',{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[2],processorOptions:{recipe,events,generation:`${seed}/${sampleRate}`}});let timer;const acks=[];
  const received=new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(new Error('Missing Rest acknowledgements')),10000);node.onprocessorerror=()=>reject(new Error('Rest processor failed'));node.port.onmessage=({data})=>{if(data.type==='error')reject(new Error(data.message));else if(data.type==='applied'){acks.push(...data.events);if(acks.length===events.length)resolve();}};});node.connect(context.destination);
  const renderStart=performance.now(),[buffer]=await Promise.all([context.startRendering(),received]).finally(()=>clearTimeout(timer)),renderMs=performance.now()-renderStart;node.disconnect();node.port.close();
  let maxDifference=0,peak=0;for(let ch=0;ch<2;ch++)for(let i=0;i<frames;i++){const value=buffer.getChannelData(ch)[i];if(!Number.isFinite(value))throw new Error('Non-finite worklet sample');maxDifference=Math.max(maxDifference,Math.abs(value-expected[ch][i]));peak=Math.max(peak,Math.abs(value));}
  if(maxDifference>1e-7||acks.some((ack,i)=>ack.order!==i||ack.appliedFrame!==ack.requestedFrame))throw new Error('Rest output or applied-event timing differs from the shared renderer');
  report.results.push({seed,sampleRate,frames,contactStates:recipe.contactStates.length,prepareMs,renderMs,maxDifference,peak,acknowledgements:acks});$('report').textContent=JSON.stringify(report,null,2);
 }
 // Real MessagePort delivery after rendering has begun. Reconstruct from
 // acknowledged frames, rather than pretending the requested late frames were heard.
 {
  const sampleRate=48000,frames=48000,recipe=await prepare(composeGrove({seed:11}),sampleRate),context=new OfflineAudioContext(2,frames,sampleRate);await context.audioWorklet.addModule('../src/grove/contact-worklet.js');
  const node=new AudioWorkletNode(context,'imagimusic-grove-contact',{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[2],processorOptions:{recipe,events:[{id:'live-strike',kind:'strike',frame:0,body:0,position:1,velocity:.5}],generation:'late-port'}}),acks=[],queued=new Map();let timer;
  const received=new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(new Error('Missing port-delivery acknowledgements')),10000);node.onprocessorerror=()=>reject(new Error('Rest processor failed'));node.port.onmessage=({data})=>{if(data.type==='error')reject(new Error(data.message));else if(data.type==='applied'){acks.push(...data.events);if(acks.length===3)resolve();}else if(data.type==='queued')for(const id of data.ids)queued.get(id)?.();};});node.connect(context.destination);
  const send=(time,event)=>context.suspend(time).then(()=>new Promise(resolve=>{queued.set(event.id,resolve);node.port.postMessage({type:'events',events:[event]});})).then(()=>context.resume());
  const on=send(.2,{id:'late-on',kind:'contact',frame:1,body:0,zone:2,strength:1}),off=send(.6,{id:'late-off',kind:'contact',frame:2,body:0,zone:null});
  const [buffer]=await Promise.all([context.startRendering(),on,off,received]).finally(()=>clearTimeout(timer));node.disconnect();node.port.close();
  const began=acks.find(e=>e.id==='late-on'),ended=acks.find(e=>e.id==='late-off');if(!(began.lateByFrames>0&&ended.appliedFrame>began.appliedFrame))throw new Error('Port-delivered contact interval was not applied');
  const expected=renderRestPassage(recipe,{strikes:acks.filter(a=>a.event.kind==='strike').map(a=>({...a.event,frame:a.appliedFrame})),contacts:[{body:0,zone:2,strength:1,start:began.appliedFrame,end:ended.appliedFrame}],frames});
  let maxDifference=0;for(let ch=0;ch<2;ch++)for(let i=0;i<frames;i++)maxDifference=Math.max(maxDifference,Math.abs(buffer.getChannelData(ch)[i]-expected[ch][i]));if(maxDifference>1e-7)throw new Error('Port-delivered capture differs from heard samples');
  report.results.push({seed:11,sampleRate,frames,case:'actual MessagePort arrivals reconstructed from acknowledgements',maxDifference,acknowledgements:acks});
 }
 report.passed=true;$('status').textContent='3/3 shared-engine AudioWorklet checks passed.';
}catch(error){report.passed=false;report.error=error.message;$('status').textContent='FAILED · '+error.message;}
$('report').textContent=JSON.stringify(report,null,2);$('save').disabled=false;$('save').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='grove-contact-audio-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};
