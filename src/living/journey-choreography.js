import {planPerformers,actorPose} from '../perform/planner.js';
import {createLivingJourneyScore} from './journey-score.js';

/** Workshop-only choreography for the actual long-form score. Distinct
 * rendered passes may share a visible blade; this does not merge their physics.
 * Geometry follows existing artistic staging, never a simulated collision. */
export function createLivingJourneyChoreography(journey){
 const score=createLivingJourneyScore(journey),lengths=[80,95,65];
 if(score.passes.some(p=>!lengths.includes(p.bodyMm)||p.touches.some(e=>e.strength<=0)))throw Error('Journey staging requires admitted bodies and positive impulses.');
 const plans=lengths.map((length,body)=>planPerformers(score.passes.filter(p=>p.bodyMm===length).flatMap(p=>p.touches.map((e,i)=>({id:`${p.id}:${i}`,slot:0,noteOn:e.frame/score.sampleRate,velocity:e.strength}))),{family:`journey-${body}`,slots:1,restSlot:0,maxActors:8}));
 if(plans.some(p=>p.unplanned.length))throw Error('Journey staging cannot assign every touch.');
 const actors=plans.flatMap((plan,body)=>plan.actors.map((actor,i)=>Object.freeze({id:actor.id,body,bodyMm:lengths[body],lane:plan.actors.length===1?0:(i/(plan.actors.length-1)-.5)*.7,headRadius:plan.actors.length===1?.1:Math.min(.1,.28/(plan.actors.length-1))})));
 const ease=u=>u*u*(3-2*u);
 return {score,plans,actors:Object.freeze(actors),at(seconds){
  if(!Number.isFinite(seconds)||seconds<0||seconds>score.frames/score.sampleRate)throw Error('Journey contact time is outside the score.');
  return actors.map(actor=>{
   const pose=actorPose(plans[actor.body],actor.id,seconds);
   const down=pose.phase==='approach'?ease(pose.progress01):['contact','recover'].includes(pose.phase)?1-ease(pose.progress01):0;
   return {...actor,phase:pose.phase,eventId:pose.eventId,down};
  });
 }};
}
