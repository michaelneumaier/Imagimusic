import {createInversePhrase,validateInversePhrase,INVERSE_PHRASE_MAX_TOUCHES,inversePhraseSpanExceeded} from '../score/grove-inverse-phrase.js';

/** Visit-local transactional capture of admitted manual touches. A draft never
 * replaces the completed phrase until Done or a declared limit completes it.
 * Quiet/pagehide are caller-owned cancellation, not recorded ending gestures. */
export function createInversePhraseCapture(){
 let active=false,receipts=[],options=null,draft=null,phrase=null;
 const close=()=>{active=false;receipts=[];options=null;draft=null;};
 const finish=()=>{const changed=active&&draft!==null;if(changed)phrase=draft;close();return {changed,phrase};};
 return {
  get snapshot(){return Object.freeze({active,count:receipts.length,origin:receipts[0]?.time??null,phrase});},
  begin({sampleRate,capturedAt,anatomySha256}={}){
   if(active)throw new Error('A phrase is already being remembered.');
   if(!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>96000)throw new RangeError('Capture sample rate must be within 8000..96000.');
   if(typeof capturedAt!=='string'||Number.isNaN(Date.parse(capturedAt))||new Date(capturedAt).toISOString()!==capturedAt)throw new Error('Capture time must be an exact ISO UTC timestamp.');
   const next={sampleRate,at:capturedAt,anatomySha256};
   createInversePhrase([{body:0,time:0}],next); // Validate metadata before entering a draft.
   options=next;receipts=[];draft=null;active=true;
  },
  admit(receipt){
   if(!active)return {captured:false,finished:false,reason:'inactive'};
   // Validate even a late receipt before allowing it to close a valid draft.
   createInversePhrase([receipt],options);
   if(receipts.length&&receipt.time<receipts.at(-1).time)throw new Error('Touch receipts must be chronological.');
   if(receipts.length&&inversePhraseSpanExceeded(receipts[0].time,receipt.time)){finish();return {captured:false,finished:true,reason:'time-limit'};}
   const next=[...receipts,{body:receipt.body,time:receipt.time}],candidate=createInversePhrase(next,options);
   receipts=next;draft=candidate;
   if(receipts.length===INVERSE_PHRASE_MAX_TOUCHES){finish();return {captured:true,finished:true,reason:'touch-limit'};}
   return {captured:true,finished:false,reason:null};
  },
  expire(time){
   if(!Number.isFinite(time)||time<0)throw new RangeError('Capture clock must be a nonnegative finite time.');
   if(active&&receipts.length&&inversePhraseSpanExceeded(receipts[0].time,time)){finish();return true;}
   return false;
  },
  finish,
  restore(input){
   if(active)throw new Error('Finish or cancel the current phrase before opening another.');
   // Validate before copying: JSON would otherwise hide undefined or nonfinite data.
   validateInversePhrase(input);
   const next=validateInversePhrase(JSON.parse(JSON.stringify(input)));
   next.events.forEach(Object.freeze);Object.freeze(next.events);Object.freeze(next);
   phrase=next;return phrase;
  },
  cancel(){close();},
  clear(){close();phrase=null;}
 };
}
