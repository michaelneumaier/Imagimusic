import {createLivingJourneyChoreography} from './journey-choreography.js';
import {createLivingResponse} from './response.js';
import {createTineDampedRelease} from '../tine/damped-release.js';

/** Pure workshop frame for independent instrument instances. Points remain
 * model displacement bounds; endingOpacity is a separate presentation fade
 * following the recorded ending, not additional physical damping. */
export function createLivingJourneyView(journey){
 const choreography=createLivingJourneyChoreography(journey),{score,allocation}=choreography;
 const sources=new Map(score.passes.map(pass=>{
  const arrangement=journey.sections[pass.section].arrangement;
  const body=arrangement.bodies.findIndex(b=>b.design.lengthMm===pass.bodyMm),record=arrangement.bodies[body];
  const response=createLivingResponse(record.design,score.sampleRate);record.events.forEach(e=>response.accept(e));
  const release=arrangement.releases?.[body];
  return [pass.id,{record,response,release:release?createTineDampedRelease(record,release):null,releaseStart:release?.startFrame}];
 }));
 return {score,allocation,at(seconds){
  if(!Number.isFinite(seconds)||seconds<0||seconds>score.frames/score.sampleRate)throw Error('Journey view time is outside the score.');
  // Undo only round-trip noise at exact sample boundaries; preserve genuine
  // subframe sampling for camera/film inspection.
  const rawFrame=seconds*score.sampleRate,nearest=Math.round(rawFrame);
  const frame=Math.abs(rawFrame-nearest)<1e-7?nearest:rawFrame;
  const instances=allocation.instances.map(instance=>{
   const pass=instance.passIds.map(id=>score.passes.find(p=>p.id===id)).find(p=>frame>=p.startFrame&&frame<p.endFrame);
   if(!pass)return {...instance,passId:null,points:null,touched:false,endingOpacity:0,localSeconds:null};
   const source=sources.get(pass.id),localFrame=frame-pass.startFrame,localSeconds=localFrame/score.sampleRate;
   const touched=localFrame>=source.record.events[0].frame;
   const model=source.release&&localFrame>=source.releaseStart?source.release:source.response;
   const fadeFrames=pass.endFrame-pass.startFrame-source.record.fadeStart;
   const endingOpacity=Math.min(1,Math.max(0,(pass.endFrame-frame)/fadeFrames));
   return {...instance,passId:pass.id,points:touched?model.at(localSeconds).points:null,touched,endingOpacity,localSeconds};
  });
  return {seconds,instances,performers:choreography.at(seconds),touches:score.passes.reduce((n,p)=>n+p.touches.filter(e=>e.frame<=frame).length,0),totalTouches:score.passes.reduce((n,p)=>n+p.touches.length,0)};
 }};
}
