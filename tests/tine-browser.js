import {createInverseJobs} from '../src/inverse/jobs.js';
import {renderTineImpulse} from '../src/tine/render.js';
import {createGroveReplay} from '../src/grove/replay.js';
const geometry={kind:'beam',support:'clamped-free',lengthM:.08,thicknessM:.001,widthM:.01,material:{E:200e9,rho:7850,eta:.0002}};
const jobs=createInverseJobs({makeWorker:()=>new Worker(new URL('../src/tine/render-worker.js',import.meta.url),{type:'module'})});
const assert=(value,message)=>{if(!value)throw Error(message);};
let replay;
try{
 const options={sampleRate:48000,seconds:.25,activation:.85,pickup:.3};
 const pcm=await jobs.run({geometry,options}),reference=renderTineImpulse(geometry,options);
 assert(pcm.channels[0].every((x,i)=>x===reference.channels[0][i]),'Worker sample mismatch');
 const offline=new OfflineAudioContext(1,14400,48000),facade={state:'running',currentTime:0,destination:offline.destination,resume:async()=>{},close:async()=>{},createBuffer:offline.createBuffer.bind(offline),createBufferSource:offline.createBufferSource.bind(offline),createGain:offline.createGain.bind(offline)};
 replay=createGroveReplay({createContext:()=>facade});await replay.play(pcm);
 const audio=(await offline.startRendering()).getChannelData(0);let maxError=0;
 for(let i=0;i<audio.length;i++){const j=i-1680,expected=j>=0&&j<reference.frames?reference.channels[0][j]:0;maxError=Math.max(maxError,Math.abs(audio[i]-expected));}
 assert(maxError<1e-7,'Offline graph sample mismatch');replay.dispose();replay=null;
 const silent=await jobs.run({geometry,options:{...options,activation:0}});assert(silent.channels[0].every(x=>x===0)&&silent.pickupGain===pcm.pickupGain,'Clamp silence or gain mismatch');
 try{await jobs.run({geometry,options:{...options,sampleRate:8000}});throw Error('Aliasing accepted');}catch(error){assert(error.message.includes('retained mode'),'Wrong alias refusal');}
 const pending=jobs.run({geometry,options});jobs.cancel();try{await pending;throw Error('Cancellation ignored');}catch(error){assert(error.name==='AbortError','Wrong cancellation result');}
 document.getElementById('result').textContent=`PASS 5/5\nActual worker samples match direct rendering.\nReal offline replay graph: maximum sample error ${maxError}.\nClamp is silent at unchanged gain.\nAliasing refuses; cancellation rejects.\nNo hardware output or live latency measured.`;
}catch(error){document.getElementById('result').textContent='FAIL: '+error.message;}finally{jobs.cancel();replay?.dispose();}
