import {validateLivingPersonalJourneyRequest} from './personal-journey-artifact.js';
import {createLivingPersonalJourneyStudy} from './personal-journey-study.js';

export const PERSONAL_JOURNEY_REPORT_LIMIT=512*1024;
/** Silent reopening of the original source and supported personal score. Actual
 * kept audio identity is checked after a later explicit generation request. */
export function readLivingPersonalJourneyReport(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>PERSONAL_JOURNEY_REPORT_LIMIT)throw Error('Use a personal journey report no larger than512KiB.');
 let value;try{value=JSON.parse(text);}catch{throw Error('The personal journey report is not valid JSON.');}
 const keys=['kind','version','source','plan','previewGain','sampleRate','frames','seconds','sourcePeak','sha256'];
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==keys.length||!keys.every(k=>Object.hasOwn(value,k))||value.kind!=='imagimusic-living-personal-journey-artifact'||value.version!==1||value.previewGain!==8||typeof value.sha256!=='string'||!/^[a-f0-9]{64}$/.test(value.sha256)||!Number.isFinite(value.sourcePeak)||value.sourcePeak<0||value.sourcePeak>1)throw Error('Unsupported personal journey report.');
 const request=validateLivingPersonalJourneyRequest({kind:'imagimusic-living-personal-journey-request',version:1,source:value.source}),plan=createLivingPersonalJourneyStudy(request.source);
 if(value.sampleRate!==plan.sampleRate||value.frames!==plan.frames||value.seconds!==plan.frames/plan.sampleRate||JSON.stringify(value.plan)!==JSON.stringify(plan))throw Error('This personal score differs from the currently supported composition.');
 return Object.freeze({request,plan,expectedSha256:value.sha256});
}
