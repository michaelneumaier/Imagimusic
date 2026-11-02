import {validateEnsembleRecord,ENSEMBLE_MIX_GAIN} from '../score/grove-ensemble-record.js';
import {createRestEngine,contactStateKey} from '../rest/engine.js';

/** Worker-oriented canonical mix, retaining no full-length per-part PCM.
 * The full record renderer remains the reference. No resampling or tail cutoff.
 * Validate structure before allocating output; check admission before every strike.
 * No partially rendered result escapes if a strike is refused.
 * callers still enforce their own file/rate bounds.
 */
export function renderEnsembleMix(record){
 const recipes=validateEnsembleRecord(record,{admission:false}),frames=record.ended.frame+record.ended.fadeFrames;
 const count=recipes[0].channels;
 if(recipes.some(recipe=>recipe.channels!==count))throw new Error('Ensemble channel counts differ.');
 const parts=recipes.map((recipe,index)=>{
  const saved=record.parts[index].record,byFrame=new Map(),edges=new Set([0]);
  for(const strike of saved.events){if(!byFrame.has(strike.frame))byFrame.set(strike.frame,[]);byFrame.get(strike.frame).push(strike);}
  for(const contact of saved.contacts){edges.add(contact.start);edges.add(contact.end);}
  const contactKeys=new Map([...edges].map(frame=>[frame,contactStateKey(Array.from({length:recipe.bodies},(_,body)=>saved.contacts.find(c=>c.body===body&&c.start<=frame&&frame<c.end)))]));
  return {index,ceiling:recipe.admissionCeiling,engine:createRestEngine(recipe),sample:new Float64Array(count),byFrame,contactKeys};
 });
 const channels=Array.from({length:count},()=>new Float32Array(frames)),sum=new Float64Array(count);
 for(let frame=0;frame<frames;frame++){
  const fade=Math.max(0,Math.min(1,1-(frame-record.ended.frame)/record.ended.fadeFrames));
  sum.fill(0);
  for(const part of parts){
   const strikes=part.byFrame.get(frame);if(strikes)for(const strike of strikes){
    const bound=part.engine.candidateBound(strike.position,strike.body,strike.velocity);
    if(!(bound<=part.ceiling))throw new Error(`Part ${part.index+1}, strike at frame ${frame} would have been rejected: admission ceiling exceeded.`);
    part.engine.strike(strike.position,strike.body,strike.velocity);
   }
   const key=part.contactKeys.get(frame);if(key!==undefined)part.engine.setContacts(key);
   part.engine.read(part.sample);
   for(let ch=0;ch<count;ch++)sum[ch]+=Math.fround(Math.fround(part.sample[ch])*fade)*ENSEMBLE_MIX_GAIN;
   part.engine.step();
  }
  for(let ch=0;ch<count;ch++)channels[ch][frame]=sum[ch];
 }
 return {sampleRate:record.sampleRate,channels};
}
