import {validateTineLiveRecord} from './live-record.js';
export const TINE_LIVE_ADDRESS_LIMIT=4096;
export function tineLiveFragment(value){const hash='#tine-live='+encodeURIComponent(JSON.stringify(validateTineLiveRecord(value)));if(hash.length>TINE_LIVE_ADDRESS_LIMIT)throw Error('Live tine address is too large.');return hash;}
export function readTineLiveAddress(hash){
 if(typeof hash!=='string'||hash.length>TINE_LIVE_ADDRESS_LIMIT||!hash.startsWith('#tine-live='))throw Error('Unsupported or oversized live tine address.');
 let record;try{record=JSON.parse(decodeURIComponent(hash.slice(11)));}catch{throw Error('The live tine address could not be read.');}
 return validateTineLiveRecord(record);
}
