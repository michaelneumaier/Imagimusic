import {createLivingSharedPhrasePass} from './shared-phrase-pass.js';
import {validateTineLiveRecord} from '../tine/live-record.js';
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

/** Rebuild the completed performance from accepted guests and the known score.
 * Validates a processor result, not a measurement of device sound or latency.
 */
export function validateSharedPhraseFinished(source,guestLimit,data,touches,originAudioFrame,quietFrame=null){
 const record=validateTineLiveRecord(data?.record),pass=createLivingSharedPhrasePass(source,{guestLimit});
 if(data.type!=='finished'||!Number.isSafeInteger(originAudioFrame)||originAudioFrame<0||data.originAudioFrame!==originAudioFrame||record.sampleRate!==source.sampleRate||!equal(record.design,source.design)||record.fadeStart>source.fadeStart)throw Error('The completed shared phrase does not match its source.');
 if(!Array.isArray(touches)||touches.length>8)throw Error('Invalid shared touch history.');
 pass.start();
 const advance=frame=>{if(!Number.isInteger(frame)||frame<pass.frame||frame>source.fadeStart)throw Error('Invalid accepted guest frame.');pass.process(new Float32Array(frame-pass.frame));};
 for(const event of touches.filter(e=>e.origin==='guest')){advance(event.frame);pass.strike(event.strength);}
 if(quietFrame!==null){if(quietFrame!==record.fadeStart)throw Error('The ending does not match acknowledged Quiet.');advance(quietFrame);pass.quiet();}
 else if(record.fadeStart!==source.fadeStart)throw Error('The original ending changed without Quiet.');
 const end=record.fadeStart+Math.round(.025*record.sampleRate);
 pass.process(new Float32Array(end-pass.frame));
 const snapshot=pass.snapshot(),expected=snapshot.applied.map((e,index)=>({...e,index,audioFrame:originAudioFrame+e.frame}));
 if(!equal(snapshot,data.snapshot)||!equal(snapshot.events,record.events)||!equal(expected,touches))throw Error('The accepted score and guest history did not rebuild.');
 return Object.freeze({source:pass.source,record,originAudioFrame,snapshot,guestLimit});
}
