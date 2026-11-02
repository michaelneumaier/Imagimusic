const frame=value=>Number.isSafeInteger(value)&&value>=0;

/** Host-side prototype: account for every remembered command before inviting
 * new input. Frames here are absolute processor frames, NOT saved-file offsets.
 * An observed frame is the processor's next sample, so it must be strictly
 * beyond every applied command and the intended handoff. No audio is scheduled.
 */
export function createEnsembleContinuationBarrier(steps,{handoffFrame}={}){
 if(!frame(handoffFrame)||!Array.isArray(steps)||!steps.length||steps.length>32)throw new Error('Invalid continuation barrier');
 const expected=new Map();
 for(const step of steps){
  if(!step||typeof step.id!=='string'||!step.id.length||step.id.length>128||step.id.startsWith('$')||expected.has(step.id)||!Number.isInteger(step.part)||step.part<0||step.part>2||!frame(step.frame)||step.frame>handoffFrame)throw new Error('Invalid remembered command identity');
  expected.set(step.id,{id:step.id,part:step.part,requestedFrame:step.frame});
 }
 const decisions=new Map();let state='waiting',observedFrame=null,maxAppliedFrame=null,boundaryFrame=null;
 function check(){
  if(state!=='waiting'||decisions.size!==expected.size)return;
  const boundary=Math.max(handoffFrame,maxAppliedFrame);
  if(observedFrame!==null&&observedFrame>boundary){state='completed';boundaryFrame=boundary;}
 }
 function acknowledge(part,ack){
  if(state==='completed')return false;
  const plan=expected.get(ack?.id);
  if(!plan)return false; // Ordinary Quiet and processor-owned events are not opening edges.
  if(decisions.has(ack.id)||part!==plan.part||ack.requestedFrame!==plan.requestedFrame||ack.event?.id!==ack.id||ack.event?.frame!==plan.requestedFrame||!frame(ack.appliedFrame)||ack.appliedFrame<plan.requestedFrame||ack.lateByFrames!==ack.appliedFrame-plan.requestedFrame||typeof ack.accepted!=='boolean'||(!ack.accepted&&(typeof ack.reason!=='string'||!ack.reason.length)))throw new Error('Invalid remembered acknowledgement');
  decisions.set(ack.id,{...plan,appliedFrame:ack.appliedFrame,accepted:ack.accepted,...(!ack.accepted?{reason:ack.reason}:{})});
  maxAppliedFrame=maxAppliedFrame===null?ack.appliedFrame:Math.max(maxAppliedFrame,ack.appliedFrame);
  check();return true;
 }
 function observeFrame(value){
  if(state!=='waiting')return;
  if(!frame(value)||(observedFrame!==null&&value<observedFrame))throw new Error('Invalid continuation clock');
  observedFrame=value;check();
 }
 // Aborting prevents handoff, but already processed messages may still arrive.
 // Keep accounting for those decisions; the host owns generation isolation.
 function cancel(){if(state==='waiting')state='aborted';}
 function snapshot(){
  const ledger=[...expected.keys()].filter(id=>decisions.has(id)).map(id=>({...decisions.get(id)}));
  return {state,scheduled:expected.size,acknowledged:ledger.length,accepted:ledger.filter(a=>a.accepted).length,refused:ledger.filter(a=>!a.accepted).length,handoffFrame,observedFrame,maxAppliedFrame,...(state==='completed'?{boundaryFrame}:{}),ledger};
 }
 return {acknowledge,observeFrame,cancel,snapshot,get state(){return state;},get boundaryFrame(){return boundaryFrame;}};
}
