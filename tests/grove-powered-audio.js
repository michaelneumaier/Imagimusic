import {createPoweredCapture} from '../src/grove/powered-capture.js';
import {renderPoweredRecord} from '../src/score/grove-powered.js';
import {composeGrove} from '../src/score/grove.js';
import {restWorkerJob} from '../src/grove/contact-job.js';
const artifacts=[];
const $=id=>document.getElementById(id),report={version:1,generated:new Date().toISOString(),results:[]};
const sha=async ch=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(ch.buffer,ch.byteOffset,ch.byteLength))),b=>b.toString(16).padStart(2,'0')).join('');
try{
 for(const [seed,sampleRate,late] of [[3,48000,false],[7,44100,true]]){
  $('status').textContent=`Checking Grove ${seed} at ${sampleRate} Hz…`;
  const grove=composeGrove({seed}),prepared=await restWorkerJob(new URL('../src/grove/powered-prepare-worker.js',import.meta.url),{grove,sampleRate}),{recipe,driver}=prepared;
  const originFrame=128,quietFrame=5*sampleRate,fadeFrames=Math.round(.025*sampleRate),stop=late?sampleRate:quietFrame,frames=originFrame+stop+fadeFrames+128;
  const events=late?[{id:'quiet',kind:'quiet',frame:originFrame+stop}]:[{id:'upper',kind:'contact',zone:0,frame:originFrame+4001},{id:'tip',kind:'contact',zone:1,frame:originFrame+10003},{id:'lift',kind:'contact',zone:null,frame:originFrame+2*sampleRate+1}];
  const capture=createPoweredCapture(recipe,{generation:'test',driver,fadeFrames});
  const context=new OfflineAudioContext(2,frames,sampleRate);await context.audioWorklet.addModule('../src/grove/powered-worklet.js');
  const node=new AudioWorkletNode(context,'imagimusic-powered-encounter',{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[2],processorOptions:{recipe,driver,originFrame,quietFrame,fadeFrames,events,generation:'test'}}),messages=[],queued=new Map();let timer;
  const completion=new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(new Error('Missing powered completion')),15000);node.onprocessorerror=()=>reject(new Error('Powered processor failed'));node.port.onmessage=({data})=>{try{capture.consume(data);}catch(error){reject(error);return;}messages.push(data);if(data.type==='error')reject(new Error(data.message));if(data.type==='finished')resolve(data);if(data.type==='queued')for(const id of data.ids)queued.get(id)?.();};});node.connect(context.destination);
  const send=(time,event)=>context.suspend(time).then(()=>new Promise(resolve=>{queued.set(event.id,resolve);node.port.postMessage({type:'events',events:[event]});})).then(()=>context.resume());
  const arrivals=late?[send(.15,{id:'late-on',kind:'contact',zone:1,frame:1}),send(.3,{id:'late-off',kind:'contact',zone:null,frame:2})]:[];
  const [buffer,finished]=await Promise.all([context.startRendering(),completion,...arrivals]).finally(()=>clearTimeout(timer));node.disconnect();node.port.close();
  const record=capture.snapshot();
  const acks=messages.filter(m=>m.type==='processed'),contacts=[];let held=null;
  for(const ack of acks){if(!ack.accepted)continue;if(held){held.end=ack.relativeFrame;if(held.end>held.start)contacts.push(held);held=null;}if(ack.event.kind==='contact'&&ack.event.zone!==null)held={body:driver.body,zone:ack.event.zone,strength:0,start:ack.relativeFrame,end:null};}
  const actualDriver=finished.driver,expected=renderPoweredRecord(record,recipe).channels;
  let maxDifference=0;const pcm=[];for(let ch=0;ch<2;ch++){const samples=buffer.getChannelData(ch),part=samples.slice(finished.originFrame,finished.frame);pcm.push(part);for(let i=0;i<expected[ch].length;i++)maxDifference=Math.max(maxDifference,Math.abs(part[i]-expected[ch][i]));if(!samples.slice(0,finished.originFrame).every(v=>v===0)||!samples.slice(finished.frame).every(v=>v===0))throw new Error('Nonzero output outside encounter');}
  if(maxDifference!==0||finished.frame!==originFrame+stop+fadeFrames)throw new Error('Powered output or ending differs from offline model');
  if(late&&!acks.filter(a=>a.id.startsWith('late-')).every(a=>a.lateByFrames>0))throw new Error('Late delivery was not exercised');
  artifacts.push({seed,sampleRate,pcm});
  report.results.push({record,seed,sampleRate,late,originFrame,driver:actualDriver,contacts,ended:finished.ended,maxDifference,frames:pcm[0].length,hashes:await Promise.all(pcm.map(sha)),acknowledgements:acks});$('report').textContent=JSON.stringify(report,null,2);
 }
 report.passed=true;$('status').textContent='2/2 powered AudioWorklet checks passed.';
}catch(error){report.passed=false;report.error=error.message;$('status').textContent='FAILED · '+error.message;}
$('report').textContent=JSON.stringify(report,null,2);$('save').disabled=false;$('save').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='grove-powered-v2-audio-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};

for(const artifact of artifacts){const button=document.createElement('button');button.textContent=`Save Grove ${artifact.seed} raw stereo PCM`;button.onclick=()=>{const url=URL.createObjectURL(new Blob(artifact.pcm)),a=document.createElement('a');a.href=url;a.download=`powered-v2-${artifact.seed}-${artifact.sampleRate}-stereo.f32`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};document.body.insertBefore(button,$('report'));}
