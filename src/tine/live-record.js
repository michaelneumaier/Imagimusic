import {validateTineDesign,requestForTineDesign} from './address.js';
import {createTineLivePass} from './live-pass.js';
const exact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(k=>Object.hasOwn(value,k));
function makePass(design,sampleRate){const {geometry,options}=requestForTineDesign(design);return createTineLivePass(geometry,{...options,sampleRate});}
/** A frame-based live performance, distinct from the millisecond three-strike rhythm.
 * Version 1 fixes the four-mode SI body, unit impulse, pickup gain and live fade.
 */
export function validateTineLiveRecord(value){
 if(!exact(value,['kind','version','design','sampleRate','events','fadeStart'])||value.kind!=='imagimusic-tine-live'||value.version!==1)throw Error('Unsupported live tine record.');
 const design=validateTineDesign(value.design),sampleRate=value.sampleRate;
 if(!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>96000)throw Error('Invalid live sample rate.');
 const pass=makePass(design,sampleRate),fadeFrames=Math.round(.025*sampleRate);
 if(!Number.isInteger(value.fadeStart)||value.fadeStart<0||value.fadeStart>8*sampleRate-fadeFrames)throw Error('Invalid live ending frame.');
 if(!Array.isArray(value.events)||value.events.length>8)throw Error('A live pass admits at most eight touches.');
 let previous=0;pass.start();
 const events=value.events.map(event=>{
  if(!exact(event,['frame','strength'])||!Number.isFinite(event.strength)||!Number.isInteger(event.frame)||event.frame<previous||event.frame>4*sampleRate||event.frame>value.fadeStart)throw Error('Invalid or unordered live touch frame.');
  // Admission budgets are cumulative and independent of elapsed decay.
  pass.strike(event.strength);previous=event.frame;
  return Object.freeze({frame:event.frame,strength:event.strength});
 });
 return Object.freeze({kind:'imagimusic-tine-live',version:1,design,sampleRate,events:Object.freeze(events),fadeStart:value.fadeStart});
}
export function tineLiveRecordFromFinished(finished){
 const s=finished?.snapshot,rate=finished?.sampleRate;
 if(!s||s.state!=='ended'||s.started!==true||s.fadeFrames!==Math.round(.025*rate)||s.frame!==s.endFrame||s.endFrame!==s.fadeStart+s.fadeFrames)throw Error('Only a complete live pass can be kept.');
 return validateTineLiveRecord({kind:'imagimusic-tine-live',version:1,design:finished.design,sampleRate:rate,events:s.events,fadeStart:s.fadeStart});
}
export function renderTineLiveRecord(value){
 const record=validateTineLiveRecord(value),pass=makePass(record.design,record.sampleRate);
 const frames=record.fadeStart+Math.round(.025*record.sampleRate),samples=new Float32Array(frames);pass.start();
 for(const event of record.events){pass.process(samples.subarray(pass.frame,event.frame));pass.strike(event.strength);}
 pass.process(samples.subarray(pass.frame,record.fadeStart));pass.quiet();pass.process(samples.subarray(pass.frame));
 return {record,sampleRate:record.sampleRate,frames,seconds:frames/record.sampleRate,channels:[samples],snapshot:pass.snapshot()};
}
