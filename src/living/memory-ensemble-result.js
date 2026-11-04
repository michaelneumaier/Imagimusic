import {createMemoryEnsemblePerformance} from './memory-ensemble-study.js';
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

/** Reconstruct all three bodies and the accepted score from known inputs.
 * This verifies model consistency, not measured output or human provenance. */
export function validateMemoryEnsembleFinished(seed,sampleRate,data,touches,originAudioFrame,quietFrame=null){
 const performance=createMemoryEnsemblePerformance(seed,{sampleRate}),{plan}=performance,naturalFade=plan.frames-Math.round(.025*sampleRate);
 if(!data||data.type!=='finished'||data.kind!=='imagimusic-memory-ensemble-completion'||data.version!==1||data.seed!==seed||!Number.isSafeInteger(originAudioFrame)||originAudioFrame<0||!Number.isSafeInteger(originAudioFrame+plan.frames)||data.originAudioFrame!==originAudioFrame)throw Error('Invalid ensemble completion identity or origin.');
 if(quietFrame!==null&&(!Number.isInteger(quietFrame)||quietFrame<0||quietFrame>naturalFade))throw Error('Invalid acknowledged ensemble ending.');
 if(!Array.isArray(data.records)||data.records.length!==3||!Array.isArray(data.snapshot)||data.snapshot.length!==3||!Array.isArray(touches)||touches.length>3*4096)throw Error('Invalid ensemble completion history.');
 const end=quietFrame??naturalFade;
 let previous=0;const indices=[0,0,0];
 for(const event of touches){
  if(!event||Object.keys(event).length!==6||!['frame','strength','index','origin','body','audioFrame'].every(key=>Object.hasOwn(event,key))||!Number.isInteger(event.body)||event.body<0||event.body>2||event.index!==indices[event.body]||indices[event.body]>=4096||!['score','guest'].includes(event.origin)||!Number.isFinite(event.strength)||event.strength===0||Math.abs(event.strength)>.1||!Number.isInteger(event.frame)||event.frame<previous||event.frame>end||event.audioFrame!==originAudioFrame+event.frame)throw Error('Invalid accepted ensemble touch.');
  indices[event.body]++;previous=event.frame;
 }
 performance.start();const scratch=new Float32Array(128),expected=[];
 function advance(frame){while(performance.frame<frame)expected.push(...performance.process(scratch.subarray(0,Math.min(scratch.length,frame-performance.frame))));}
 for(const event of touches){
  if(event.origin!=='guest')continue;advance(event.frame);const result=performance.tryGuest(event.body,event.strength);
  if(!result.admitted)throw Error('An acknowledged ensemble guest cannot be reconstructed.');expected.push(...result.events);
 }
 if(quietFrame!==null){advance(quietFrame);expected.push(...performance.quiet());}
 advance(end+Math.round(.025*sampleRate));
 const records=performance.records(),snapshot=performance.snapshot(),accepted=expected.map(event=>({...event,audioFrame:originAudioFrame+event.frame}));
 if(!equal(performance.plan,data.plan)||!equal(records,data.records)||!equal(snapshot,data.snapshot)||!equal(accepted,touches))throw Error('The ensemble score, body histories or physical states did not rebuild.');
 return Object.freeze({kind:'imagimusic-memory-ensemble-completion',version:1,seed,plan:performance.plan,records,originAudioFrame,snapshot});
}
