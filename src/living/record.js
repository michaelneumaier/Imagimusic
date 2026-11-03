import {createLivingArrangement} from './arrangement.js';
const keys=['kind','version','arrangementVersion','source','cameraMotion','reveal'];
export const LIVING_ADDRESS_LIMIT=8192;
export function validateLivingRecord(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==keys.length||!keys.every(k=>Object.hasOwn(value,k))||value.kind!=='imagimusic-living-encounter'||value.version!==1||value.arrangementVersion!==1||typeof value.cameraMotion!=='boolean'||typeof value.reveal!=='boolean')throw Error('Unsupported Living Instrument encounter.');
 const plan=createLivingArrangement(value.source);
 return Object.freeze({kind:'imagimusic-living-encounter',version:1,arrangementVersion:1,source:plan.source,cameraMotion:value.cameraMotion,reveal:value.reveal});
}
export function createLivingRecord(source,{cameraMotion=true,reveal=true}={}){
 return validateLivingRecord({kind:'imagimusic-living-encounter',version:1,arrangementVersion:1,source,cameraMotion,reveal});
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
