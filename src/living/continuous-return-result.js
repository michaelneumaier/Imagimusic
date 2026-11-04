import {createContinuousReturnPerformance} from './continuous-return-study.js';
import {validateContinuousTineRecord} from './continuous-tine-record.js';
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

/** Verify reported performance evidence against the known composition and
 * accepted guest stream. This is reconstruction, not device-output measurement.
 */
export function validateContinuousReturnFinished(seed,sampleRate,data,touches,originAudioFrame,quietFrame=null){
 const performance=createContinuousReturnPerformance(seed,{sampleRate}),{plan}=performance;
 if(!data||data.type!=='finished'||data.seed!==seed||!Number.isSafeInteger(originAudioFrame)||originAudioFrame<0||!Number.isSafeInteger(originAudioFrame+plan.frames)||data.originAudioFrame!==originAudioFrame)throw Error('Invalid continuous completion identity or audio origin.');
 const record=validateContinuousTineRecord(data.record),naturalFade=plan.frames-Math.round(.025*sampleRate);
 if(record.sampleRate!==sampleRate||!equal(record.design,plan.design)||record.fadeStart>naturalFade)throw Error('The continuous capture does not match the prepared study.');
 if(quietFrame!==null&&(!Number.isInteger(quietFrame)||quietFrame<0||quietFrame>naturalFade||record.fadeStart!==quietFrame))throw Error('The ending does not match acknowledged Quiet.');
 if(quietFrame===null&&record.fadeStart!==naturalFade)throw Error('The continuous ending changed without Quiet.');
 if(!Array.isArray(touches)||touches.length>4096)throw Error('Invalid continuous accepted history.');
 let previous=0;
 for(const [index,event] of touches.entries()){
  if(!event||Object.keys(event).length!==5||event.index!==index||!Number.isInteger(event.frame)||event.frame<previous||event.frame>record.fadeStart||!Number.isFinite(event.strength)||event.strength===0||Math.abs(event.strength)>.1||!['score','guest'].includes(event.origin)||event.audioFrame!==originAudioFrame+event.frame)throw Error('Invalid continuous accepted touch.');
  previous=event.frame;
 }
 performance.start();const scratch=new Float32Array(128);
 function advance(frame){
  if(frame<performance.frame)throw Error('The accepted history moved backwards.');
  while(performance.frame<frame)performance.process(scratch.subarray(0,Math.min(scratch.length,frame-performance.frame)));
 }
 for(const event of touches){if(event.origin!=='guest')continue;advance(event.frame);if(!performance.tryGuest(event.strength).admitted)throw Error('An acknowledged guest cannot be reconstructed.');}
 if(quietFrame!==null){advance(quietFrame);performance.quiet();}
 advance(record.fadeStart+Math.round(.025*sampleRate));
 const snapshot=performance.snapshot(),expected=snapshot.events.map(event=>({...event,audioFrame:originAudioFrame+event.frame}));
 if(!equal(performance.record(),record)||!equal(snapshot,data.snapshot)||!equal(expected,touches))throw Error('The continuous score, touches or physical state did not rebuild.');
 return Object.freeze({seed,record,originAudioFrame,snapshot});
}
