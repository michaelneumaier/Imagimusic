import {createContinuousEnsemblePerformance} from './continuous-ensemble-study.js';
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

/** Reconstruct all three bodies and the accepted score from known inputs.
 * This verifies model consistency, not measured output or human provenance. */
export function validateContinuousEnsembleFinished(seed,sampleRate,data,touches,originAudioFrame,quietFrame=null){
 const performance=createContinuousEnsemblePerformance(seed,{sampleRate}),{plan}=performance,naturalFade=plan.frames-Math.round(.025*sampleRate);
 if(!data||data.type!=='finished'||data.kind!=='imagimusic-continuous-ensemble-completion'||data.version!==1||data.seed!==seed||!Number.isSafeInteger(originAudioFrame)||originAudioFrame<0||!Number.isSafeInteger(originAudioFrame+plan.frames)||data.originAudioFrame!==originAudioFrame)throw Error('Invalid ensemble completion identity or origin.');
 if(quietFrame!==null&&(!Number.isInteger(quietFrame)||quietFrame<0||quietFrame>naturalFade))throw Error('Invalid acknowledged ensemble ending.');
 if(!Array.isArray(data.records)||data.records.length!==3||!Array.isArray(data.snapshot)||data.snapshot.length!==3||!Array.isArray(touches)||touches.length>plan.events.length)throw Error('Invalid ensemble completion history.');
 const end=quietFrame??naturalFade;
 for(const event of touches){
  if(!event||Object.keys(event).length!==6||!['frame','strength','index','origin','body','audioFrame'].every(key=>Object.hasOwn(event,key))||!Number.isInteger(event.frame)||event.frame<0||event.frame>end||event.audioFrame!==originAudioFrame+event.frame)throw Error('Invalid accepted ensemble touch.');
 }
 performance.start();const scratch=new Float32Array(128),expected=[];
 function advance(frame){while(performance.frame<frame)expected.push(...performance.process(scratch.subarray(0,Math.min(scratch.length,frame-performance.frame))));}
 if(quietFrame!==null){advance(quietFrame);expected.push(...performance.quiet());}
 advance(end+Math.round(.025*sampleRate));
 const records=performance.records(),snapshot=performance.snapshot(),accepted=expected.map(event=>({...event,audioFrame:originAudioFrame+event.frame}));
 if(!equal(plan,data.plan)||!equal(records,data.records)||!equal(snapshot,data.snapshot)||!equal(accepted,touches))throw Error('The ensemble score, body histories or physical states did not rebuild.');
 return Object.freeze({kind:'imagimusic-continuous-ensemble-completion',version:1,seed,plan,records,originAudioFrame,snapshot});
}
