import {validateLivingRecord} from './record.js';
import {validateTineLiveRecord,renderTineLiveRecord} from '../tine/live-record.js';

export const LIVING_EXPLORATION_FILE_LIMIT=16384;
/** Two performances from an exploration, not a claim that the second's gestures
 * were derived from the first. The original is embedded, not looked up from the
 * current page. Its appearance and arrangement identity remain intact.
 */
export function validateLivingExploration(value){
 const keys=['kind','version','original','response'];
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==keys.length||!keys.every(k=>Object.hasOwn(value,k))||value.kind!=='imagimusic-living-exploration'||value.version!==1)throw Error('Unsupported Living Instrument exploration.');
 const original=validateLivingRecord(value.original),response=validateTineLiveRecord(value.response);
 const a=original.source.design,b=response.design;
 if(![65,95].includes(b.lengthMm)||b.widthMm!==a.widthMm||b.activation!==a.activation||b.pickup!==a.pickup||!response.events.length||response.events.some(e=>Math.abs(e.strength)>.1))throw Error('The new phrase must use a chosen 65 or 95 mm body with the original touch and pickup positions.');
 return Object.freeze({kind:'imagimusic-living-exploration',version:1,original,response});
}
export function createLivingExploration(original,response){
 return validateLivingExploration({kind:'imagimusic-living-exploration',version:1,original,response});
}
export function serializeLivingExploration(value){
 const text=JSON.stringify(validateLivingExploration(value),null,2)+'\n';
 if(new TextEncoder().encode(text).length>LIVING_EXPLORATION_FILE_LIMIT)throw Error('The exploration file is too large.');
 return text;
}
export async function readLivingExplorationFile(file){
 if(!file||typeof file.text!=='function'||!Number.isSafeInteger(file.size)||file.size<1||file.size>LIVING_EXPLORATION_FILE_LIMIT)throw Error('Choose a Living Instrument exploration JSON file up to 16 KiB.');
 const text=await file.text();if(typeof text!=='string'||new TextEncoder().encode(text).length>LIVING_EXPLORATION_FILE_LIMIT)throw Error('The exploration file is too large.');
 let value;try{value=JSON.parse(text);}catch{throw Error('The exploration is not readable JSON.');}
 return validateLivingExploration(value);
}
/** Validate both first. A caller receives a complete pair or an error, never a
 * partially restored original. These are dry solo passes; unfolding is separate.
 */
export function renderLivingExploration(value){
 const record=validateLivingExploration(value);
 const original=renderTineLiveRecord(record.original.source),response=renderTineLiveRecord(record.response);
 return {record,original,response};
}
