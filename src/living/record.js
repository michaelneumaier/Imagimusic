import {createLivingArrangement} from './arrangement.js';
const legacyKeys=['kind','version','arrangementVersion','source','cameraMotion','reveal'];
export const LIVING_ADDRESS_LIMIT=8192;
export function validateLivingRecord(value){
 const keys=value?.version===2?[...legacyKeys,'presentationVersion']:legacyKeys;
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==keys.length||!keys.every(k=>Object.hasOwn(value,k))||value.kind!=='imagimusic-living-encounter'||![1,2].includes(value.version)||!(value.version===1?[1]:[1,2]).includes(value.arrangementVersion)||typeof value.cameraMotion!=='boolean'||typeof value.reveal!=='boolean')throw Error('Unsupported Living Instrument encounter.');
 if(value.version===2&&![1,2,3,4].includes(value.presentationVersion))throw Error('Unsupported Living Instrument presentation.');
 const plan=createLivingArrangement(value.source,value.arrangementVersion);
 if([3,4].includes(value.presentationVersion)&&plan.source.events.some(e=>e.strength<=0))throw Error('The performer presentation requires positive touches. Earlier presentations retain signed impulses.');
 return Object.freeze({kind:'imagimusic-living-encounter',version:value.version,arrangementVersion:value.arrangementVersion,source:plan.source,cameraMotion:value.cameraMotion,reveal:value.reveal,...(value.version===2?{presentationVersion:value.presentationVersion}:{})});
}
export function createLivingRecord(source,{cameraMotion=true,reveal=true,presentationVersion=2,arrangementVersion=1}={}){
 return validateLivingRecord({kind:'imagimusic-living-encounter',version:2,arrangementVersion,source,cameraMotion,reveal,presentationVersion});
}
export function livingFragment(value){
 const hash='#living='+encodeURIComponent(JSON.stringify(validateLivingRecord(value)));
 if(hash.length>LIVING_ADDRESS_LIMIT)throw Error('The encounter address is too large.');
 return hash;
}
export function readLivingAddress(hash){
 if(typeof hash!=='string'||hash.length>LIVING_ADDRESS_LIMIT||!hash.startsWith('#living='))throw Error('Unsupported or oversized encounter address.');
 let value;try{value=JSON.parse(decodeURIComponent(hash.slice(8)));}catch{throw Error('The encounter address could not be read.');}
 return validateLivingRecord(value);
}
