import {planPerformers,actorPose} from '../perform/planner.js';
import {createLivingFragmentAnswer} from './answer-study.js';
import {createLivingArrangement} from './arrangement.js';

/** Known, positive-impulse choreography. Round timing and poses are now part
 * of presentation3; incompatible changes require a new presentation identity.
 * Each blade has stationary actors, so slot-distance is never treated as metres.
 * Planner allocation handles dense/simultaneous notes without dropping contacts.
 * Head placement is artistic; the existing ideal impulse remains the sound source.
 */
export function createLivingChoreography(source,treatment='round'){
 if(!['round','spaced','fragment','released'].includes(treatment))throw Error('Unknown choreography score.');
 const score=treatment==='released'?createLivingArrangement(source,3):treatment==='fragment'?createLivingFragmentAnswer(source):createLivingArrangement(source,treatment==='round'?1:2);
 if(score.source.events.some(e=>e.strength<=0))throw Error('Contact study requires positive impulses.');
 const plans=score.bodies.map((body,bodyIndex)=>{
  const events=score.voices.flatMap((v,voiceIndex)=>v.body===bodyIndex?body.events.map((e,eventIndex)=>({id:`${voiceIndex}:${eventIndex}`,slot:0,noteOn:(v.startFrame+e.frame)/score.sampleRate,velocity:e.strength})):[]);
  return planPerformers(events,{family:`living-${bodyIndex}`,slots:1,restSlot:0,maxActors:8});
 });
 if(plans.some(p=>p.unplanned.length))throw Error('Contact study cannot stage every touch.');
 const actors=plans.flatMap((plan,body)=>plan.actors.map((actor,index)=>({id:actor.id,body,lane:plan.actors.length===1?0:(index/(plan.actors.length-1)-.5)*.7,headRadius:plan.actors.length===1?.1:Math.min(.1,.28/(plan.actors.length-1))})));
 const ease=u=>u*u*(3-2*u);
 return {score,plans,actors,at(seconds){
  if(!Number.isFinite(seconds)||seconds<0||seconds>score.frames/score.sampleRate)throw Error('Contact time is outside the score.');
  return actors.map(actor=>{
   const pose=actorPose(plans[actor.body],actor.id,seconds);
   const down=pose.phase==='approach'?ease(pose.progress01):['contact','recover'].includes(pose.phase)?1-ease(pose.progress01):0;
   return {...actor,phase:pose.phase,eventId:pose.eventId,down};
  });
 }};
}
