/** Flatten study-local clocks for a score diagram. Spans describe rendered
 * passes, not audibility or continuous shared-body vibration. */
export function createLivingJourneyScore(plan){
 const voices=plan.voices??plan.sections.flatMap((section,i)=>section.arrangement.voices.map(v=>({...v,section:i,startFrame:v.startFrame+section.startFrame,endFrame:v.endFrame+section.startFrame})));
 const passes=voices.map((voice,i)=>{
  const section=plan.sections[voice.section],source=section.arrangement.bodies[voice.body];
  return Object.freeze({id:i,section:voice.section,bodyMm:source.design.lengthMm,part:voice.part,startFrame:voice.startFrame,endFrame:voice.endFrame,touches:Object.freeze(source.events.map(e=>Object.freeze({frame:voice.startFrame+e.frame,strength:e.strength})))});
 });
 return Object.freeze({frames:plan.frames,sampleRate:plan.sampleRate,passes:Object.freeze(passes)});
}
