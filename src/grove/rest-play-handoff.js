import {canonicalGrove} from '../score/grove.js';
import {canonicalVoiceConfig} from '../score/grove-voice.js';
export const REST_HANDOFF_KEY='imagimusic.rest.instrument-pair.v1';
export const REST_HANDOFF_MAX_BYTES=16384;
const validId=id=>typeof id==='string'&&/^[a-f0-9-]{36}$/.test(id);
function checked(value){
 if(!value||value.version!==1||!validId(value.id))throw new Error('This instrument handoff is not supported.');
 const origin=value.origin??'saved-file';if(!['saved-file','prepared-example'].includes(origin))throw new Error('Unknown instrument source.');
 const original=JSON.parse(canonicalGrove(value.original)),changed=JSON.parse(canonicalGrove(value.changed)),voice=JSON.parse(canonicalVoiceConfig(value.voice));
 // Rest's live Light/Firm controls enumerate (1+2*zones)^3 states, capped at512.
 if(voice.positions.length>3)throw new Error('Playing this saved voice needs more hand positions than Rest currently supports. You can still compare and keep its sound.');
 const shape=structuredClone(changed);shape.bridges.forEach((e,i)=>{e.coupling=original.bridges[i]?.coupling;});
 if(canonicalGrove(shape)!==canonicalGrove(original)||canonicalGrove(changed)===canonicalGrove(original))throw new Error('Choose a comparison that changes only the instrument’s connections.');
 return {version:1,id:value.id,origin,original,changed,voice};
}
export function encodeRestPlayHandoff(pair,id){
 if(canonicalVoiceConfig(pair.original.record.voice)!==canonicalVoiceConfig(pair.changed.record.voice))throw new Error('Both instruments must use the same saved voice.');
 const text=JSON.stringify(checked({version:1,id,origin:pair.preparedExample?'prepared-example':'saved-file',original:pair.original.record.grove,changed:pair.changed.record.grove,voice:pair.original.record.voice}));
 if(new TextEncoder().encode(text).byteLength>REST_HANDOFF_MAX_BYTES)throw new Error('This instrument pair is too large to carry into Rest.');
 return text;
}
export function readRestPlayHandoff(storage,id){
 if(!validId(id))throw new Error('This instrument handoff is missing. Return to your comparison and choose Play changed.');
 const text=storage.getItem(REST_HANDOFF_KEY);
 if(typeof text!=='string'||text.length>REST_HANDOFF_MAX_BYTES||new TextEncoder().encode(text).byteLength>REST_HANDOFF_MAX_BYTES)throw new Error('This instrument pair is no longer in this tab. Return to your comparison and choose Play changed.');
 let value;try{value=JSON.parse(text);}catch{throw new Error('This instrument handoff could not be read.');}
 if(value.id!==id)throw new Error('A newer comparison replaced this handoff. Return to your comparison and choose Play changed.');
 return checked(value);
}
export function writeRestPlayHandoff(storage,pair,id){
 const text=encodeRestPlayHandoff(pair,id);storage.setItem(REST_HANDOFF_KEY,text);
 return `rest.html?instrument=${id}`;
}
