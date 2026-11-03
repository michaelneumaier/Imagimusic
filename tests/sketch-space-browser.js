import {createInverseJobs} from '../src/inverse/jobs.js';
import {createSpatialSketch} from '../src/sketch/spatial.js';
import {createGroveReplay} from '../src/grove/replay.js';
const parameters={frequencies:[200,201,320],decays:[2,.8,3],coefficients:[1,.2,.1,-.05,.7,.4]},rate=8000;
const jobs=createInverseJobs({makeWorker:()=>new Worker(new URL('../src/sketch/spatial-worker.js',import.meta.url),{type:'module'})});
const assert=(value,message)=>{if(!value)throw Error(message);};
let replay;
try{
 const options={sampleRate:rate,seconds:.25,strength:.35,activation:.25,pickup:.75};
 const prepared=await jobs.run({parameters,options}),model=createSpatialSketch(parameters),reference=model.render(options);
 assert(prepared.render.channels[0].every((x,i)=>x===reference.channels[0][i]),'Worker samples differ');
 const offline=new OfflineAudioContext(1,2400,rate);
 const facade={state:'running',currentTime:0,destination:offline.destination,resume:async()=>{},close:async()=>{},createBuffer:offline.createBuffer.bind(offline),createBufferSource:offline.createBufferSource.bind(offline),createGain:offline.createGain.bind(offline)};
 replay=createGroveReplay({createContext:()=>facade});await replay.play(prepared.render);
 const audio=(await offline.startRendering()).getChannelData(0);let error=0;
 for(let i=0;i<audio.length;i++){const j=i-280,expected=j>=0&&j<reference.frames?reference.channels[0][j]:0;error=Math.max(error,Math.abs(audio[i]-expected));}
 assert(error<1e-7,'Replay graph differs from fixed-gain spatial field');replay.dispose();replay=null;
 const silent=await jobs.run({parameters,options:{...options,activation:0}});
 assert(silent.render.channels[0].every(x=>x===0),'Node not silent');assert(silent.render.pickupGain===prepared.render.pickupGain,'Node gain changed');
 const cancelled=jobs.run({parameters,options});jobs.cancel();try{await cancelled;throw Error('Cancellation ignored');}catch(error){assert(error.name==='AbortError','Wrong cancellation result');}
 document.getElementById('result').textContent=`PASS 4/4\nActual worker samples match the spatial model.\nReal offline replay graph matches with max error ${error}; one source gain.\nEndpoint worker render is zero at unchanged gain.\nCancellation rejects. No hardware-output or live-latency claim.`;
}catch(error){document.getElementById('result').textContent='FAIL: '+error.message;}finally{jobs.cancel();replay?.dispose();}
