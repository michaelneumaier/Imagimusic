import {validateEnsembleRecord,ENSEMBLE_MIX_GAIN} from '../score/grove-ensemble-record.js';
import {createRestPassageRenderer} from '../rest/engine.js';

/** Worker-oriented canonical mix with fixed scratch instead of full part buffers.
 * Structure is validated first; every strike is admitted in the part render pass.
 * Any part failure discards this result; no partially rendered mix is returned.
 * Callers still enforce their own file/rate bounds. No resampling or tail cutoff.
 */
export function renderEnsembleMix(record){
 const recipes=validateEnsembleRecord(record,{admission:false}),frames=record.ended.frame+record.ended.fadeFrames;
 const count=recipes[0].channels,blockFrames=4096;
 if(recipes.some(recipe=>recipe.channels!==count))throw new Error('Ensemble channel counts differ.');
 const parts=recipes.map((recipe,index)=>createRestPassageRenderer(recipe,{
  strikes:record.parts[index].record.events,contacts:record.parts[index].record.contacts,frames,admissionCeiling:recipe.admissionCeiling
 }));
 const channels=Array.from({length:count},()=>new Float32Array(frames));
 const scratch=Array.from({length:count},()=>new Float32Array(blockFrames));
 const sums=Array.from({length:count},()=>new Float64Array(blockFrames));
 for(let from=0;from<frames;from+=blockFrames){
  const to=Math.min(frames,from+blockFrames),length=to-from;
  for(const sum of sums)sum.fill(0);
  for(let part=0;part<parts.length;part++){
   try{parts[part].render(from,to,scratch);}catch(error){throw new Error(`Part ${part+1}: ${error.message}`);}
   for(let offset=0;offset<length;offset++){
    const fade=Math.max(0,Math.min(1,1-(from+offset-record.ended.frame)/record.ended.fadeFrames));
    // Scratch already contains the first Float32 rounding. Keep the second,
    // after fade, and the original part-index Float64 addition order.
    for(let ch=0;ch<count;ch++)sums[ch][offset]+=Math.fround(scratch[ch][offset]*fade)*ENSEMBLE_MIX_GAIN;
   }
  }
  for(let ch=0;ch<count;ch++)for(let offset=0;offset<length;offset++)channels[ch][from+offset]=sums[ch][offset];
 }
 return {sampleRate:record.sampleRate,channels};
}
