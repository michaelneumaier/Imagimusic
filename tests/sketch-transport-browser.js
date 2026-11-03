import {prepareSketchPlayback,createSketchTransport,SKETCH_MIX_BOUND} from '../src/sketch/transport.js';
import {createInverseJobs} from '../src/inverse/jobs.js';
const result=document.getElementById('result'),rate=8000;
const parameters={frequencies:[200,201,320],decays:[2,.8,3],coefficients:[1,.2,.1,-.05,.7,.4]};
const jobs=createInverseJobs({makeWorker:()=>new Worker(new URL('../src/sketch/prepare-worker.js',import.meta.url),{type:'module'})});
const assert=(condition,message)=>{if(!condition)throw Error(message);};
function graph(prepared){
 const offline=new OfflineAudioContext(1,prepared.frames,rate);let time=0;
 const context={sampleRate:rate,state:'running',get currentTime(){return time;},destination:offline.destination,
  createBuffer:offline.createBuffer.bind(offline),createGain:offline.createGain.bind(offline),createBufferSource:offline.createBufferSource.bind(offline)};
 return {offline,transport:createSketchTransport(context,prepared),setTime:value=>{time=value;}};
}
try{
 const prepared=await jobs.run({parameters,sampleRate:rate,seconds:.5});
 const reference=prepareSketchPlayback(parameters,rate,{seconds:.5});
 assert(prepared.buffers.length===4,'Worker buffer count');
 for(let c=0;c<4;c++)assert(prepared.buffers[c].every((x,i)=>x===reference.buffers[c][i]),'Worker samples differ');
 const overlap=graph(prepared);
 for(let i=0;i<3;i++)assert(overlap.transport.activate({strength:1}).accepted,'Admitted activation refused');
 assert(overlap.transport.activate({strength:1}).reason==='headroom','Fourth full activation should be refused');
 const mixed=(await overlap.offline.startRendering()).getChannelData(0);
 let peak=0,maxError=0;for(let i=0;i<mixed.length;i++){peak=Math.max(peak,Math.abs(mixed[i]));maxError=Math.max(maxError,Math.abs(mixed[i]-3*prepared.buffers[0][i]));}
 assert(peak<SKETCH_MIX_BOUND&&maxError<2e-7,'Offline overlap mismatch');overlap.transport.dispose();
 const quiet=graph(prepared);quiet.transport.activate({mode:1,strength:.5});quiet.setTime(.1);quiet.transport.quiet();
 const stopped=(await quiet.offline.startRendering()).getChannelData(0);
 assert(stopped.slice(1040).every(x=>x===0),'Quiet tail not silent');
 for(let i=0;i<800;i++)assert(Math.abs(stopped[i]-.5*prepared.buffers[2][i])<1e-8,'Single-mode prefix differs');quiet.transport.dispose();
 const cancelled=jobs.run({parameters,sampleRate:rate,seconds:.5});jobs.cancel();
 try{await cancelled;throw Error('Cancelled worker completed');}catch(error){assert(error.name==='AbortError','Wrong cancellation error');}
 const retried=await jobs.run({parameters,sampleRate:rate,seconds:.5});assert(retried.frames===prepared.frames,'Retry failed');
 result.textContent=`PASS 4/4\nActual worker transfers exact prepared samples.\nActual offline graph mixes three full activations; fourth refused. Peak ${peak}, maximum sample error ${maxError}.\nSingle mode preserves its prefix and Quiet leaves a silent tail.\nWorker cancellation rejects and a new worker retries.\nNo live-context, hardware-output or perceptual claim.`;
}catch(error){result.textContent='FAIL: '+error.message;}finally{jobs.cancel();}
