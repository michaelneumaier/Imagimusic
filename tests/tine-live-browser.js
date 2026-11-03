import {createListeningLevel,listeningCeilingCurve} from '../src/grove/listening-level.js';
import {createTineLiveResponse} from '../src/tine/live-response.js';
import {createAudioRenderJob} from '../src/audio-render-job.js';
import {tineLiveRecordFromFinished,renderTineLiveRecord} from '../src/tine/live-record.js';
import {createTineLivePass} from '../src/tine/live-pass.js';
import {createTineDesign,requestForTineDesign} from '../src/tine/address.js';
const {geometry}=requestForTineDesign(createTineDesign());
const assert=(ok,message)=>{if(!ok)throw Error(message);};
async function run(early){
 const db=early?20:0,secondStrength=early?.025:.05;
 const rate=48000,context=new OfflineAudioContext(2,Math.round(8.1*rate),rate);
 await context.audioWorklet.addModule('../src/tine/live-worklet.js');
 const node=new AudioWorkletNode(context,'imagimusic-tine-live',{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[1],processorOptions:{geometry}}),messages=[],waiters=[];
 node.port.onmessage=({data})=>{messages.push(data);for(const waiter of waiters.slice())if(waiter.match(data)){clearTimeout(waiter.timer);waiters.splice(waiters.indexOf(waiter),1);waiter.resolve(data);}};
 function wait(match){const existing=messages.find(match);if(existing)return Promise.resolve(existing);return new Promise((resolve,reject)=>{const waiter={match,resolve,timer:setTimeout(()=>reject(Error('Worklet message timeout')),5000)};waiters.push(waiter);});}
 async function command(id,type,strength){node.port.postMessage({id,type,strength});const ack=await wait(m=>m.id===id);assert(ack.type==='applied',ack.message??'Command refused');return ack;}
 const merger=context.createChannelMerger(2),stage=createListeningLevel(context,{db});
 node.connect(merger,0,0);node.connect(stage.input);stage.output.connect(merger,0,1);merger.connect(context.destination);await wait(m=>m.type==='ready');
 await command(0,'start');await command(1,'strike',.1);
 const pause=context.suspend(.25),rendering=context.startRendering();await pause;
 const second=await command(2,'strike',secondStrength);let quiet=null;if(early)quiet=await command(3,'quiet');
 await context.resume();const rendered=await rendering,audio=rendered.getChannelData(0),listened=rendered.getChannelData(1),finished=await wait(m=>m.type==='finished');
 const pass=createTineLivePass(geometry,{sampleRate:rate}),reference=new Float32Array(audio.length);pass.start();pass.strike(.1);
 pass.process(reference.subarray(0,second.frame));pass.strike(secondStrength);if(quiet){assert(quiet.frame===second.frame,'Unexpected suspended-frame ordering');pass.quiet();}
 pass.process(reference.subarray(second.frame));let maxError=0;for(let i=0;i<audio.length;i++)maxError=Math.max(maxError,Math.abs(audio[i]-reference[i]));
 assert(maxError===0,`Worklet output differs: ${maxError}`);assert(finished.snapshot.frame===pass.frame,'Ended frame mismatch');
 assert(finished.originAudioFrame===0,'Unexpected offline origin');
 assert(finished.snapshot.events[1].frame===second.frame&&finished.snapshot.events[1].strength===secondStrength,'Applied event identity mismatch');assert(audio.subarray(pass.frame).every(x=>x===0),'Post-ending signal');
 const saved=tineLiveRecordFromFinished({design:createTineDesign(),sampleRate:rate,...finished}),rebuilt=renderTineLiveRecord(saved);
 let recordError=0;for(let i=0;i<audio.length;i++)recordError=Math.max(recordError,Math.abs(audio[i]-(rebuilt.channels[0][i]??0)));
 assert(recordError===0,`Saved reconstruction differs: ${recordError}`);
 const workerPCM=await createAudioRenderJob(new URL('../src/tine/live-render-worker.js',import.meta.url),saved).promise;
 assert(workerPCM.frames===rebuilt.frames,'Worker frame count mismatch');
 let workerError=0;for(let i=0;i<rebuilt.frames;i++)workerError=Math.max(workerError,Math.abs(workerPCM.channels[0][i]-rebuilt.channels[0][i]));
 assert(workerError===0,`Worker reconstruction differs: ${workerError}`);
 const comparison=await createAudioRenderJob(new URL('../src/tine/live-comparison-worker.js',import.meta.url),{source:saved,dimensions:{lengthMm:80,widthMm:20}}).promise;
 let comparisonError=0;for(let i=0;i<rebuilt.frames;i++)comparisonError=Math.max(comparisonError,Math.abs(comparison.original.channels[0][i]-rebuilt.channels[0][i]),Math.abs(comparison.candidate.channels[0][i]-rebuilt.channels[0][i]/2));
 assert(comparisonError===0,`Comparison worker differs: ${comparisonError}`);
 const mechanical=createTineLiveResponse(saved).at(finished.snapshot.frame);let displacementError=0,velocityError=0;
 for(let i=0;i<4;i++){displacementError=Math.max(displacementError,Math.abs(mechanical.modes[i].displacementM-finished.snapshot.modes[i].displacementM));velocityError=Math.max(velocityError,Math.abs(mechanical.modes[i].velocityMPerS-finished.snapshot.modes[i].velocityMPerS));}
 assert(displacementError<1e-15&&velocityError<1e-12,'Spatial inspection differs from worklet state');
 const curve=listeningCeilingCurve();let listeningError=0;
 for(let i=0;i<audio.length;i++){
  const input=Math.max(-1,Math.min(1,Math.fround(audio[i]*10**(db/20)))),at=(input+1)*(curve.length-1)/2,lo=Math.floor(at),hi=Math.min(lo+1,curve.length-1),expected=curve[lo]+(curve[hi]-curve[lo])*(at-lo);
  listeningError=Math.max(listeningError,Math.abs(listened[i]-expected));
 }
 assert(listeningError<2e-6,`Live listening graph differs: ${listeningError}`);
 const replayContext=new OfflineAudioContext(1,audio.length,rate),source=replayContext.createBufferSource(),buffer=replayContext.createBuffer(1,rebuilt.frames,rate);
 buffer.copyToChannel(rebuilt.channels[0],0);source.buffer=buffer;
 const replayStage=createListeningLevel(replayContext,{db});source.connect(replayStage.input);replayStage.output.connect(replayContext.destination);source.start();
 const replayed=(await replayContext.startRendering()).getChannelData(0);let replayListeningError=0;
 for(let i=0;i<audio.length;i++)replayListeningError=Math.max(replayListeningError,Math.abs(replayed[i]-listened[i]));
 assert(replayListeningError<2e-6,`Live/replay listening mismatch: ${replayListeningError}`);
 source.disconnect();replayStage.dispose();stage.dispose();merger.disconnect();
 node.disconnect();node.port.close();return {early,db,secondStrength,listeningError,replayListeningError,secondFrame:second.frame,endFrame:pass.frame,maxError,recordError,workerError,comparisonError,displacementError,velocityError};
}
try{const natural=await run(false),early=await run(true);document.getElementById('result').textContent='PASS 2/2\n'+JSON.stringify({natural,early,note:'Actual offline worklet samples and applied frames; no live latency or hardware measurement.'},null,2);}catch(error){document.getElementById('result').textContent='FAIL: '+error.message;}
