import {CONTINUOUS_TINE_RECORD_LIMIT,validateContinuousTineRecord,renderContinuousTineRecord} from './continuous-tine-record.js';
export const CONTINUOUS_ENSEMBLE_RECORD_LIMIT=3*CONTINUOUS_TINE_RECORD_LIMIT+1024;
const exact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
function shape(value){
 if(!exact(value,['kind','version','mixGain','records'])||value.kind!=='imagimusic-continuous-ensemble-record'||value.version!==1||value.mixGain!==1/3||!Array.isArray(value.records)||value.records.length!==3)throw Error('Unsupported continuous ensemble record.');
 const first=value.records[0];
 if(value.records.some(record=>!record||record.sampleRate!==first?.sampleRate||record.fadeStart!==first?.fadeStart))throw Error('Ensemble voices must share a sample rate and ending.');
 return value;
}
function canonical(records){return Object.freeze({kind:'imagimusic-continuous-ensemble-record',version:1,mixGain:1/3,records:Object.freeze(records)});}
/** Three independent bodies starting from rest on a common sample clock. Origin
 * labels are descriptive; this record does not assert seed, authorship or score.
 * The fixed average cannot exceed the largest admitted individual pickup bound. */
export function validateContinuousEnsembleRecord(value){shape(value);return canonical(value.records.map(validateContinuousTineRecord));}
export function readContinuousEnsembleRecord(text){
 if(typeof text!=='string'||text.length>CONTINUOUS_ENSEMBLE_RECORD_LIMIT||new TextEncoder().encode(text).length>CONTINUOUS_ENSEMBLE_RECORD_LIMIT)throw Error('Continuous ensemble record exceeds its text limit.');
 let value;try{value=JSON.parse(text);}catch{throw Error('The ensemble record is not valid JSON.');}
 return validateContinuousEnsembleRecord(value);
}
export function renderContinuousEnsembleRecord(value){
 shape(value);const parts=value.records.map(renderContinuousTineRecord),record=canonical(parts.map(part=>part.record)),{sampleRate,frames,seconds}=parts[0];
 const samples=new Float32Array(frames);
 // Preserve the production processor's addition order and final Float32 cast.
 for(let i=0;i<frames;i++)samples[i]=(parts[0].channels[0][i]+parts[1].channels[0][i]+parts[2].channels[0][i])*record.mixGain;
 return {record,sampleRate,frames,seconds,channels:[samples],snapshot:parts.map(part=>part.snapshot)};
}
