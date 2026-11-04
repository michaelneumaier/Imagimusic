import {readTineLiveAddress} from '../tine/live-address.js';
import {readLivingAddress,validateLivingRecord} from './record.js';
import {validateLivingPersonalSource,createLivingPersonalJourneyStudy} from './personal-journey-study.js';

export const PERSONAL_PHRASE_INPUT_LIMIT=16*1024;
/** Parse locally only. A pasted address contributes its kept fragment; no URL
 * is fetched or navigated. The encounter's original source is the creative seed.
 */
export function readLivingPersonalPhrase(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>PERSONAL_PHRASE_INPUT_LIMIT)throw Error('Use a kept phrase or address no larger than16KiB.');
 const input=text.trim();let value;
 if(input.startsWith('{')){
  try{value=JSON.parse(input);}catch{throw Error('The phrase file is not valid JSON.');}
  if(value.kind==='imagimusic-living-encounter')value=validateLivingRecord(value).source;
 }else{
  let hash=input;
  if(!input.startsWith('#')){
   let url;try{url=new URL(input);}catch{throw Error('Paste a complete kept tine or Living Instrument address.');}
   if(!['http:','https:','file:'].includes(url.protocol))throw Error('Use a kept page address.');
   hash=url.hash;
  }
  if(hash.startsWith('#tine-live='))value=readTineLiveAddress(hash);
  else if(hash.startsWith('#living='))value=readLivingAddress(hash).source;
  else throw Error('This address does not contain a completed tine phrase or Living encounter.');
 }
 const source=validateLivingPersonalSource(value);
 // Admit all comparison bodies before a caller replaces its current selection.
 createLivingPersonalJourneyStudy(source);
 return source;
}
