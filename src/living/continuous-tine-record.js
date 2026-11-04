import {validateTineDesign,requestForTineDesign} from '../tine/address.js';
import {createContinuousTineKernel} from './continuous-tine-kernel.js';

export const CONTINUOUS_TINE_RECORD_LIMIT=512*1024;
const exact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
function parse(value){
 if(!exact(value,['kind','version','design','sampleRate','events','fadeStart'])||value.kind!=='imagimusic-continuous-tine-record'||value.version!==1)throw Error('Unsupported continuous tine record.');
 const design=validateTineDesign(value.design),sampleRate=value.sampleRate;
 if(!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>96000)throw Error('Invalid continuous record sample rate.');
 const fadeFrames=Math.round(.025*sampleRate);
 if(!Number.isInteger(value.fadeStart)||value.fadeStart<0||value.fadeStart>60*sampleRate-fadeFrames)throw Error('A continuous capture must end within sixty seconds, including its fade.');
 if(!Array.isArray(value.events)||value.events.length>4096)throw Error('A continuous capture holds at most 4096 touches.');
 let previous=0;
 const events=value.events.map(event=>{
  if(!exact(event,['frame','strength','origin'])||!Number.isInteger(event.frame)||event.frame<previous||event.frame>value.fadeStart||!Number.isFinite(event.strength)||event.strength===0||Math.abs(event.strength)>.1||!['score','guest'].includes(event.origin))throw Error('Invalid continuous capture touch.');
  previous=event.frame;return Object.freeze({frame:event.frame,strength:event.strength,origin:event.origin});
 });
 return Object.freeze({kind:value.kind,version:1,design,sampleRate,events:Object.freeze(events),fadeStart:value.fadeStart});
}
// Always reconstruct from rest. Provenance labels describe accepted touches;
// they do not prove which future notes a scheduler had committed at that time.
// The fixed 25ms fade changes output only, leaving physical state uninterrupted.
function walk(record,samples=null){
 const {geometry,options}=requestForTineDesign(record.design),kernel=createContinuousTineKernel(geometry,{...options,sampleRate:record.sampleRate});
 const fadeFrames=Math.round(.025*record.sampleRate),frames=record.fadeStart+fadeFrames,scratch=new Float32Array(16384);
 function advance(end){
  while(kernel.frame<end){
   const start=kernel.frame,count=Math.min(scratch.length,end-start),block=samples?samples.subarray(start,start+count):scratch.subarray(0,count);
   kernel.process(block);
   for(let i=0;i<count;i++)if(start+i>=record.fadeStart)block[i]*=Math.max(0,(frames-1-start-i)/(fadeFrames-1));
  }
 }
 for(const event of record.events){advance(event.frame);kernel.strike(event.strength);}
 advance(frames);return kernel.snapshot();
}
/** Research capture, separate from the eight-second live-pass format. Validation
 * runs the complete admission trajectory with bounded scratch memory, no audio.
 */
export function validateContinuousTineRecord(value){const record=parse(value);walk(record);return record;}
export function readContinuousTineRecord(text){
 if(typeof text!=='string'||text.length>CONTINUOUS_TINE_RECORD_LIMIT||new TextEncoder().encode(text).length>CONTINUOUS_TINE_RECORD_LIMIT)throw Error('Continuous record exceeds the 512 KiB text limit.');
 let value;try{value=JSON.parse(text);}catch{throw Error('The continuous record is not valid JSON.');}
 return validateContinuousTineRecord(value);
}
export function renderContinuousTineRecord(value){
 const record=parse(value),frames=record.fadeStart+Math.round(.025*record.sampleRate),samples=new Float32Array(frames),snapshot=walk(record,samples);
 return {record,sampleRate:record.sampleRate,frames,seconds:frames/record.sampleRate,channels:[samples],snapshot};
}
