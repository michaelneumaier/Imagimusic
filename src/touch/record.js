import {createTouchSession,TOUCH_GAIN,TOUCH_MAX_STRIKES,TOUCH_MAX_SECONDS} from './session.js';

export const TOUCH_RECORD_MAX_BYTES=256*1024;
const fail=message=>{throw new Error(`Touch passage: ${message}`);};
function keys(value,expected,label){
 if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))fail(`${label} must be an object.`);
 const actual=Object.keys(value);
 if(actual.length!==expected.length||expected.some(key=>!Object.hasOwn(value,key)))fail(`${label} has missing or unknown fields.`);
}
const integer=(value,min,max,label)=>{if(!Number.isSafeInteger(value)||value<min||value>max)fail(`${label} is outside its supported range.`);};

/** Rebuild the existing v1 format through the same admission rules as live play.
 * No retiming, dropped gestures, gain normalization or guessed missing settings.
 * An ending may precede a scheduled gesture: Quiet can occur during the live
 * scheduler's lead. The renderer applies the captured endpoint without moving it.
 */
export function rebuildTouchRecord(input){
 keys(input,['version','kind','settings','sampleRate','outputGain','events','ended'],'record');
 if(input.version!==1||input.kind!=='imagimusic-touch')fail('use a Touch version 1 gesture file.');
 if(input.outputGain!==TOUCH_GAIN)fail('the saved output gain is unsupported.');
 integer(input.sampleRate,8000,192000,'sample rate');
 keys(input.settings,['frequency','coupling','detune','loss'],'settings');
 if(!Array.isArray(input.events)||input.events.length<1||input.events.length>TOUCH_MAX_STRIKES)fail(`keep between 1 and ${TOUCH_MAX_STRIKES} gestures.`);
 const session=createTouchSession(input.settings,input.sampleRate);
 for(const event of input.events){
  keys(event,['frame','body','velocity'],'gesture');
  integer(event.frame,0,TOUCH_MAX_SECONDS*input.sampleRate,'gesture frame');
  const result=session.strike(event);
  if(!result.accepted)fail(`a saved gesture exceeds ${result.reason}; none were omitted.`);
 }
 if(input.ended!==null){
  keys(input.ended,['frame','fadeFrames'],'ending');
  integer(input.ended.fadeFrames,1,input.sampleRate,'ending fade');
  integer(input.ended.frame,0,Number.MAX_SAFE_INTEGER-input.ended.fadeFrames,'ending frame');
  session.finish(input.ended.frame,input.ended.fadeFrames);
 }
 return {record:session.snapshot(),session};
}
export function parseTouchRecord(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).byteLength>TOUCH_RECORD_MAX_BYTES)fail('choose gesture JSON no larger than 256 KiB.');
 let input;try{input=JSON.parse(text);}catch{fail('the file is not valid JSON.');}
 return rebuildTouchRecord(input);
}
