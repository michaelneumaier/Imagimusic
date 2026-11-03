import {validateTineDesign,readTineAddress,TINE_ADDRESS_LIMIT} from './address.js';
import {createTineTiming,tineTimingPhrase} from './timing.js';
const prefix='#tine-phrase=';
const fields=['kind','version','design','timing'];
/** Version 1 fixes three strengths (.25/.15/.25), an onset at zero,
 * and four seconds after the last touch, using the v1 body's fixed conversion.
 * It carries no held comparison, draft, playback state or picture preference.
 */
export function createTinePhraseRecord(design,timing){
 if(!timing||typeof timing!=='object')throw Error('A kept rhythm is required.');
 return Object.freeze({kind:'imagimusic-tine-phrase',version:1,design:validateTineDesign(design),timing:tineTimingPhrase(timing).timing});
}
function validate(record){
 if(!record||typeof record!=='object'||Array.isArray(record)||Object.keys(record).length!==fields.length||!fields.every(key=>Object.hasOwn(record,key))||record.kind!=='imagimusic-tine-phrase'||record.version!==1)throw Error('Unsupported tine phrase record.');
 return createTinePhraseRecord(record.design,record.timing);
}
export function tinePhraseFragment(record){return prefix+encodeURIComponent(JSON.stringify(validate(record)));}
export function readTineReturn(hash){
 if(typeof hash==='string'&&hash.startsWith(prefix)){
  if(hash.length>TINE_ADDRESS_LIMIT)throw Error('Oversized tine phrase address.');
  let record;try{record=JSON.parse(decodeURIComponent(hash.slice(prefix.length)));}catch{throw Error('The tine phrase address could not be read.');}
  const value=validate(record);
  return Object.freeze({design:value.design,timing:value.timing,audition:'phrase'});
 }
 const design=readTineAddress(hash);
 return design?Object.freeze({design,timing:createTineTiming(),audition:'single'}):null;
}
