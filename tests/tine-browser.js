import {createInverseJobs} from '../src/inverse/jobs.js';
import {prepareTineRequest} from '../src/tine/preparation.js';
import {renderTinePhrase} from '../src/tine/phrase.js';
import {renderTineImpulse} from '../src/tine/render.js';
import {createGroveReplay} from '../src/grove/replay.js';
const geometry={kind:'beam',support:'clamped-free',lengthM:.08,thicknessM:.001,widthM:.01,material:{E:200e9,rho:7850,eta:.0002}};
const jobs=createInverseJobs({makeWorker:()=>new Worker(new URL('../src/tine/render-worker.js',import.meta.url),{type:'module'})});
const assert=(value,message)=>{if(!value)throw Error(message);};
let replay;
async function checkGraph(pcm,reference){
 const lead=1680,offline=new OfflineAudioContext(1,pcm.frames+lead+2400,48000);
 const facade={state:'running',currentTime:0,destination:offline.destination,resume:async()=>{},close:async()=>{},createBuffer:offline.createBuffer.bind(offline),createBufferSource:offline.createBufferSource.bind(offline),createGain:offline.createGain.bind(offline)};
 replay=createGroveReplay({createContext:()=>facade});await replay.play(pcm);
 const audio=(await offline.startRendering()).getChannelData(0);let maxError=0;
 for(let i=0;i<audio.length;i++){const j=i-lead,expected=j>=0&&j<reference.frames?reference.channels[0][j]:0;maxError=Math.max(maxError,Math.abs(audio[i]-expected));}
 assert(maxError<1e-7,'Offline graph sample mismatch');replay.dispose();replay=null;return maxError;
}
try{
 const options={sampleRate:48000,seconds:.25,activation:.85,pickup:.3};
 const pcm=await jobs.run({geometry,options}),reference=renderTineImpulse(geometry,options);
 assert(pcm.channels[0].every((x,i)=>x===reference.channels[0][i]),'Worker sample mismatch');
 const maxError=await checkGraph(pcm,reference);
 const silent=await jobs.run({geometry,options:{...options,activation:0}});assert(silent.channels[0].every(x=>x===0)&&silent.pickupGain===pcm.pickupGain,'Clamp silence or gain mismatch');
 try{await jobs.run({geometry,options:{...options,sampleRate:8000}});throw Error('Aliasing accepted');}catch(error){assert(error.message.includes('retained mode'),'Wrong alias refusal');}
 const pending=jobs.run({geometry,options});jobs.cancel();try{await pending;throw Error('Cancellation ignored');}catch(error){assert(error.name==='AbortError','Wrong cancellation result');}
 const bundle=await jobs.run({kind:'body',geometry,options});
 const phrase=renderTinePhrase(geometry,{...options,seconds:6.1});
 assert(bundle.single.channels[0].every((x,i)=>x===reference.channels[0][i])&&bundle.phrase.channels[0].every((x,i)=>x===phrase.channels[0][i])&&bundle.phrase.frames===phrase.frames,'Bundle sample mismatch');
 try{await jobs.run({kind:'unknown',geometry,options});throw Error('Unknown kind accepted');}catch(error){assert(error.message.includes('Unsupported tine'),'Wrong kind refusal');}
 const phraseError=await checkGraph(bundle.phrase,phrase);
 const pairRequest={kind:'phrase-pair',timing:{firstGapMs:2000,secondGapMs:200},bodies:[{geometry,options},{geometry:{...geometry,widthM:.02},options}]};
 const pair=await jobs.run(pairRequest),pairReference=prepareTineRequest(pairRequest);
 assert(pair.phrases.every((p,k)=>p.channels[0].every((x,i)=>x===pairReference.phrases[k].channels[0][i])),'Timing pair worker mismatch');
 const timingError=await checkGraph(pair.phrases[0],pairReference.phrases[0]);
 const pendingPair=jobs.run(pairRequest);jobs.cancel();
 try{await pendingPair;throw Error('Pair cancellation ignored');}catch(error){assert(error.name==='AbortError','Wrong pair cancellation result');}
 assert(pair.phrases[0].channels[0].every((x,i)=>x===pairReference.phrases[0].channels[0][i]),'Cancellation changed the prior pair');
 document.getElementById('result').textContent=`PASS 11/11\nActual worker samples match direct rendering.\nReal offline replay graph: maximum sample error ${maxError}.\nClamp is silent at unchanged gain.\nAliasing refuses; cancellation rejects.\nAtomic single/phrase bundle matches direct samples; unknown kinds refuse.\nFull phrase offline replay graph: maximum sample error ${phraseError}.\nChanged timing pair matches both direct renders; offline error ${timingError}.\nCancelled pair rejects and leaves the prior result intact.\nNo hardware output or live latency measured.`;
}catch(error){document.getElementById('result').textContent='FAIL: '+error.message;}finally{jobs.cancel();replay?.dispose();}
