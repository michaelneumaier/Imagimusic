import {tineLiveRecordFromFinished,renderTineLiveRecord} from '../src/tine/live-record.js';
import {createTineLivePass} from '../src/tine/live-pass.js';
import {createTineDesign,requestForTineDesign} from '../src/tine/address.js';
const {geometry}=requestForTineDesign(createTineDesign());
const assert=(ok,message)=>{if(!ok)throw Error(message);};
async function run(early){
 const rate=48000,context=new OfflineAudioContext(1,Math.round(8.1*rate),rate);
 await context.audioWorklet.addModule('../src/tine/live-worklet.js');
 const node=new AudioWorkletNode(context,'imagimusic-tine-live',{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[1],processorOptions:{geometry}}),messages=[],waiters=[];
 node.port.onmessage=({data})=>{messages.push(data);for(const waiter of waiters.slice())if(waiter.match(data)){clearTimeout(waiter.timer);waiters.splice(waiters.indexOf(waiter),1);waiter.resolve(data);}};
 function wait(match){const existing=messages.find(match);if(existing)return Promise.resolve(existing);return new Promise((resolve,reject)=>{const waiter={match,resolve,timer:setTimeout(()=>reject(Error('Worklet message timeout')),5000)};waiters.push(waiter);});}
 async function command(id,type,strength){node.port.postMessage({id,type,strength});const ack=await wait(m=>m.id===id);assert(ack.type==='applied',ack.message??'Command refused');return ack;}
 node.connect(context.destination);await wait(m=>m.type==='ready');
 await command(0,'start');await command(1,'strike',.1);
 const pause=context.suspend(.25),rendering=context.startRendering();await pause;
 const second=await command(2,'strike',.1);let quiet=null;if(early)quiet=await command(3,'quiet');
 await context.resume();const audio=(await rendering).getChannelData(0),finished=await wait(m=>m.type==='finished');
 const pass=createTineLivePass(geometry,{sampleRate:rate}),reference=new Float32Array(audio.length);pass.start();pass.strike(.1);
 pass.process(reference.subarray(0,second.frame));pass.strike(.1);if(quiet){assert(quiet.frame===second.frame,'Unexpected suspended-frame ordering');pass.quiet();}
 pass.process(reference.subarray(second.frame));let maxError=0;for(let i=0;i<audio.length;i++)maxError=Math.max(maxError,Math.abs(audio[i]-reference[i]));
 assert(maxError===0,`Worklet output differs: ${maxError}`);assert(finished.snapshot.frame===pass.frame,'Ended frame mismatch');
 assert(finished.originAudioFrame===0,'Unexpected offline origin');
 assert(finished.snapshot.events[1].frame===second.frame,'Applied event identity mismatch');assert(audio.subarray(pass.frame).every(x=>x===0),'Post-ending signal');
 const saved=tineLiveRecordFromFinished({design:createTineDesign(),sampleRate:rate,...finished}),rebuilt=renderTineLiveRecord(saved);
 let recordError=0;for(let i=0;i<audio.length;i++)recordError=Math.max(recordError,Math.abs(audio[i]-(rebuilt.channels[0][i]??0)));
 assert(recordError===0,`Saved reconstruction differs: ${recordError}`);
 node.disconnect();node.port.close();return {early,secondFrame:second.frame,endFrame:pass.frame,maxError,recordError};
}
try{const natural=await run(false),early=await run(true);document.getElementById('result').textContent='PASS 2/2\n'+JSON.stringify({natural,early,note:'Actual offline worklet samples and applied frames; no live latency or hardware measurement.'},null,2);}catch(error){document.getElementById('result').textContent='FAIL: '+error.message;}
