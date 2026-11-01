import {stereoWav} from '../src/loom/model.js';
const $=id=>document.getElementById(id);
let generation=0,context=null,worker=null,node=null,report=null,capturedWav=null,watchdog=null;
const status=text=>{$('status').textContent=text;};
function controls(running){$('start').disabled=running;$('cancel').disabled=!running;$('save').disabled=running||!report;$('wav').disabled=running||!capturedWav;}
function detach(){clearTimeout(watchdog);watchdog=null;worker?.terminate();worker=null;if(node){node.port.onmessage=null;node.disconnect();node.port.close();node=null;}const old=context;context=null;if(old)old.close().catch(()=>{});}
function cancel(){generation++;detach();controls(false);$('result').textContent='No completed result for this run.';status('Cancelled. Start again when ready.');}
function prepare(sampleRate,own){
 return new Promise((resolve,reject)=>{
  worker=new Worker(new URL('./ensemble-diagnostic-prepare-worker.js',import.meta.url),{type:'module'});
  worker.onerror=event=>reject(new Error(event.message||'Preparation worker failed'));
  worker.onmessage=({data})=>{if(own!==generation)return;worker.terminate();worker=null;data.error?reject(new Error(data.error)):resolve(data);};
  worker.postMessage({sampleRate});
 });
}
async function sha(bytes){const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');}
function compare(actual,expected,frames){
 if(!Array.isArray(actual)||actual.length!==2||actual.some(ch=>!(ch instanceof Float32Array)||ch.length!==frames))throw new Error('Captured channel shape does not match the fixture');
 let maxAbsoluteError=0,squaredError=0,differingSamples=0;
 for(let ch=0;ch<2;ch++)for(let frame=0;frame<frames;frame++){
  const value=actual[ch][frame],reference=expected[ch][frame];if(!Number.isFinite(value)||!Number.isFinite(reference))throw new Error('Non-finite samples');
  const error=Math.abs(value-reference);maxAbsoluteError=Math.max(maxAbsoluteError,error);squaredError+=error*error;if(value!==reference)differingSamples++;
 }
 return {maxAbsoluteError,rmsError:Math.sqrt(squaredError/(frames*2)),differingSamples,exact:!differingSamples};
}
async function run(){
 const own=++generation;detach();report=capturedWav=null;controls(true);$('result').textContent='Preparing the physical recipes and reference samples…';status('Preparing. Cancel remains available.');
 try{
  context=new AudioContext({sampleRate:48000});
  const current=context,resumed=current.resume();
  const [,prepared]=await Promise.all([resumed,prepare(current.sampleRate,own)]);
  if(own!==generation)return;
  status('Running the muted live-worklet fixture…');$('result').textContent='Capturing the live processor output. No completed result yet.';
  const result=await processFixture(current,prepared,own);
  if(own!==generation)return;
  const agreement=compare(result.channels,prepared.reference,prepared.frames);
  const wav=stereoWav({sampleRate:current.sampleRate,channels:result.channels}),referenceWav=stereoWav({sampleRate:current.sampleRate,channels:prepared.reference});
  const [capturedWavSha256,referenceWavSha256]=await Promise.all([sha(wav),sha(referenceWav)]);
  if(own!==generation)return;
  capturedWav=wav;
  report={kind:'imagimusic-ensemble-computation-check',version:1,date:new Date().toISOString(),sampleRate:current.sampleRate,frames:prepared.frames,agreement,capturedWavSha256,referenceWavSha256,processor:result.evidence,records:prepared.records,
   limits:'Muted live AudioWorklet computation compared with offline Rest records. Does not measure real-time headroom, audible dropouts or physical output. Canonical part Float32 samples are mixed with fixed 1/3 gain in Float64 and rounded once to Float32.'};
  detach();controls(false);$('result').textContent=JSON.stringify({...report,records:'Included in the downloaded report.'},null,2);status(agreement.exact?'Captured samples match the offline model exactly.':agreement.maxAbsoluteError<=1e-7?'Captured samples agree within 1e-7; inspect the report for rounding differences.':'Sample mismatch. Keep the report for investigation.');
 }catch(error){if(own!==generation)return;detach();controls(false);status('Check failed: '+error.message);$('result').textContent=error.stack??error.message;}
}
function download(bytes,type,name){const url=URL.createObjectURL(new Blob([bytes],{type})),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
$('start').onclick=run;$('cancel').onclick=cancel;
$('save').onclick=()=>{if(report)download(JSON.stringify(report,null,2)+String.fromCharCode(10),'application/json','imagimusic-ensemble-computation.json');};
$('wav').onclick=()=>{if(capturedWav)download(capturedWav,'audio/wav','imagimusic-ensemble-captured.wav');};
window.addEventListener('pagehide',()=>{generation++;detach();controls(false);});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&context)cancel();});


async function processFixture(current,prepared,own){
 await current.audioWorklet.addModule(new URL('./ensemble-diagnostic-worklet.js',import.meta.url));
 if(own!==generation)throw new DOMException('Cancelled','AbortError');
 const origin=Math.ceil((current.currentTime+.25)*current.sampleRate),end=origin+prepared.frames;
 const parts=prepared.commands.map(commands=>commands.map(command=>({...command,frame:command.frame+origin})));
 const channels=[new Float32Array(prepared.frames),new Float32Array(prepared.frames)],acks=[[],[],[]];
 let firstAudioFrame=null,lastAudioEnd=null,filled=0,receivedBlocks=0;
 return new Promise((resolve,reject)=>{
  watchdog=setTimeout(()=>reject(new Error('Processor did not complete the finite fixture in time')),prepared.frames/current.sampleRate*1000+15000);
  node=new AudioWorkletNode(current,'imagimusic-ensemble-diagnostic',{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[2],processorOptions:{recipes:prepared.recipes,parts,generation:String(own),mixGain:1/3,postAudio:true}});
  node.onprocessorerror=()=>reject(new Error('Ensemble processor failed'));
  node.port.onmessage=({data})=>{
   if(own!==generation||data.generation!==String(own))return;
   try{
    if(data.type==='error')throw new Error(data.message);
    if(data.type==='processed'){
     if(!Number.isInteger(data.part)||!acks[data.part]||!Array.isArray(data.events))throw new Error('Invalid part acknowledgement');
     acks[data.part].push(...data.events);
    }else if(data.type==='audio'){
     if(!Number.isSafeInteger(data.frame)||!Number.isInteger(data.length)||data.length<1||!Array.isArray(data.channels)||data.channels.length!==2||data.channels.some(channel=>!(channel instanceof Float32Array)||channel.length!==data.length))throw new Error('Invalid captured block');
     if(lastAudioEnd!==null&&data.frame!==lastAudioEnd)throw new Error('Gap or overlap in captured audio blocks');
     firstAudioFrame??=data.frame;lastAudioEnd=data.frame+data.length;receivedBlocks++;
     const from=Math.max(origin,data.frame),to=Math.min(end,lastAudioEnd);
     if(to>from){
      if(from-origin!==filled)throw new Error('Captured fixture starts late or has a gap');
      for(let ch=0;ch<2;ch++)channels[ch].set(data.channels[ch].subarray(from-data.frame,to-data.frame),from-origin);
      filled+=to-from;
     }
    }else if(data.type==='finished'){
     if(data.frame!==end||data.origin!==origin||filled!==prepared.frames)throw new Error('Processor origin, ending or captured length differs from the authored fixture');
     for(let part=0;part<3;part++){
      if(acks[part].length!==parts[part].length)throw new Error('Unexpected acknowledgement count');
      for(let i=0;i<parts[part].length;i++){
       const ack=acks[part][i],command=parts[part][i];
       if(!ack.accepted)throw new Error('Part '+(part+1)+' refused '+command.id+': '+(ack.reason??'unspecified reason'));
       if(ack.lateByFrames!==0)throw new Error('Part '+(part+1)+' applied '+command.id+' late by '+ack.lateByFrames+' frames');
       if(ack.id!==command.id||ack.appliedFrame!==command.frame||ack.requestedFrame!==command.frame)throw new Error('Fixed fixture acknowledgement changed');
      }
     }
     clearTimeout(watchdog);watchdog=null;
     resolve({channels,evidence:{originFrame:origin,firstAudioFrame,lastAudioEnd,receivedBlocks,finished:data,acknowledgements:acks}});
    }
   }catch(error){reject(error);}
  };
  const mute=current.createGain();mute.gain.value=0;node.connect(mute);mute.connect(current.destination);
 });
}
