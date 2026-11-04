import {validateLivingJourneyRequest} from './journey-artifact.js';
import {createLivingJourneyStudy} from './journey-study.js';
import {createLivingConnectedJourneyStudy} from './connected-journey-study.js';
import {createLivingEvolvingJourneyStudy} from './evolving-journey-study.js';

export const LIVING_JOURNEY_REPORT_LIMIT=512*1024;
/** Reopen a generated study report only if its full score is still supported.
 * Audio identity is checked separately after explicit regeneration. */
export function readLivingJourneyReport(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>LIVING_JOURNEY_REPORT_LIMIT)throw Error('Use a generated journey score report no larger than512KiB.');
 let value;try{value=JSON.parse(text);}catch{throw Error('The journey score report is not valid JSON.');}
 const keys=['kind','version','seed','treatment','plan','previewGain','sampleRate','frames','seconds','sourcePeak','sha256'];
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==keys.length||!keys.every(k=>Object.hasOwn(value,k))||value.kind!=='imagimusic-living-journey-artifact'||value.version!==1||value.previewGain!==8||typeof value.sha256!=='string'||!/^[a-f0-9]{64}$/.test(value.sha256)||!Number.isFinite(value.sourcePeak)||value.sourcePeak<=0||value.sourcePeak>1)throw Error('Unsupported generated journey score report.');
 const request=validateLivingJourneyRequest({kind:'imagimusic-living-journey-request',version:1,seed:value.seed,treatment:value.treatment});
 const make={chapters:createLivingJourneyStudy,connected:createLivingConnectedJourneyStudy,evolving:createLivingEvolvingJourneyStudy}[request.treatment],plan=make(request.seed);
 if(value.sampleRate!==plan.sampleRate||value.frames!==plan.frames||value.seconds!==plan.frames/plan.sampleRate||JSON.stringify(value.plan)!==JSON.stringify(plan))throw Error('This journey score differs from the currently supported composition.');
 return Object.freeze({request,plan,expectedSha256:value.sha256});
}
