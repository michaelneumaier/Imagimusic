import {createContinuousTineKernel} from './continuous-tine-kernel.js';

/** Research scheduler: reserve only committed notes, at most64 within8seconds.
 * Process/guest calls return accepted events; the owner records them separately.
 * The composer must replenish look-ahead. Unplanned future music is not reserved.
 */
export function createContinuousTineScheduler(geometry,options){
 const kernel=createContinuousTineKernel(geometry,options);let queue=[];
 function schedule(events){
  if(!Array.isArray(events)||queue.length+events.length>64)throw Error('The committed queue holds at most64touches.');
  // Validate before sorting so malformed caller order is never silently repaired.
  kernel.forecast(events);
  const next=[...queue,...events.map(e=>Object.freeze({frame:e.frame,strength:e.strength}))].sort((a,b)=>a.frame-b.frame);
  const result=kernel.forecast(next);if(!result.admitted)throw Error('The committed score exceeds its reserved headroom.');
  queue=next;return {queued:queue.length};
 }
 function flush(){
  const applied=[];
  while(queue[0]?.frame===kernel.frame){const event=queue[0],accepted=kernel.strike(event.strength);queue.shift();applied.push({...accepted,origin:'score'});}
  return applied;
 }
 function tryGuest(strength=.1){
  if(!Number.isFinite(strength)||strength===0||Math.abs(strength)>.1)throw Error('Guest strength must be nonzero and within ±0.1.');
  const events=flush();
  const forecast=kernel.forecast([{frame:kernel.frame,strength},...queue]);
  if(!forecast.admitted)return {admitted:false,events,reason:'This touch would use room reserved for the committed score.'};
  events.push({...kernel.strike(strength),origin:'guest'});return {admitted:true,events};
 }
 function process(output){
  if(!(output instanceof Float32Array)||output.length>16384||!Number.isSafeInteger(kernel.frame+output.length))throw Error('Use a bounded Float32 output block.');
  const events=flush();let offset=0;
  while(offset<output.length){
   const count=Math.min(output.length-offset,(queue[0]?.frame??kernel.frame+output.length-offset)-kernel.frame);
   kernel.process(output.subarray(offset,offset+count));offset+=count;
   if(offset<output.length)events.push(...flush());
  }
  return events;
 }
 // Transport may withdraw future commitments when ending a performance.
 function cancelPending(){const count=queue.length;queue=[];return count;}
 return Object.freeze({schedule,tryGuest,process,flush,cancelPending,get frame(){return kernel.frame;},get queued(){return queue.length;},snapshot:()=>({...kernel.snapshot(),queue:queue.slice()})});
}
