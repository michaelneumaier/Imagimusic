const frameValue=value=>{if(!Number.isSafeInteger(value)||value<0)throw new Error('Event frame must be a nonnegative safe integer');return value;};
/** Audio-thread scheduling only. Model payloads stay with the caller.
 * Apply at the current sample, acknowledge that actual frame, and preserve
 * arrival order for simultaneous events. No allocations on an empty sample.
 * Create a new queue for each passage; IDs remain unique for its lifetime. */
export function createContactEventQueue({capacity=1024,maxEvents=4096}={}){
 if(!Number.isInteger(capacity)||capacity<1||capacity>65536||!Number.isInteger(maxEvents)||maxEvents<capacity||maxEvents>65536)throw new Error('Invalid event queue limits');
 const pending=[],seen=new Set();let order=0,appliedOrder=0,lastFrame=-1;
 function enqueue(id,requestedFrame){
  if(typeof id!=='string'||!id.length||id.length>128)throw new Error('Event ID must be a short nonempty string');frameValue(requestedFrame);
  if(seen.has(id))throw new Error('Duplicate event ID');if(pending.length>=capacity||seen.size>=maxEvents)throw new Error('Event queue capacity exceeded');
  const item={id,requestedFrame,order:order++};let lo=0,hi=pending.length;
  while(lo<hi){const mid=(lo+hi)>>>1;if(pending[mid].requestedFrame<=requestedFrame)lo=mid+1;else hi=mid;}
  pending.splice(lo,0,item);seen.add(id);
 }
 function applyThrough(frame,apply){
  frameValue(frame);if(frame<lastFrame)throw new Error('Audio event clock cannot move backwards');if(typeof apply!=='function')throw new Error('An event application callback is required');lastFrame=frame;
  let count=0;
  while(pending.length&&pending[0].requestedFrame<=frame){
   const item=pending.shift();count++;
   // A callback failure is fatal to the passage: do not retry a possibly
   // partially applied model mutation. The worklet must stop and report it.
   apply({id:item.id,requestedFrame:item.requestedFrame,appliedFrame:frame,lateByFrames:frame-item.requestedFrame,order:appliedOrder++,arrivalOrder:item.order});
  }
  return count;
 }
 return {enqueue,applyThrough,get pending(){return pending.length;},get scheduled(){return seen.size;},get nextFrame(){return pending[0]?.requestedFrame??null;},get lastFrame(){return lastFrame;}};
}
