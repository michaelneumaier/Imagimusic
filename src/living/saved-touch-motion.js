import {parseContinuousEnsembleRecord} from './continuous-ensemble-record.js';
import {validateTineDesign} from '../tine/address.js';

/** Separate research staging identity. A cue acknowledges a recorded impulse;
 * it does not simulate a collision or indicate the impulse's force direction. */
export const SAVED_TOUCH_MOTION=Object.freeze({kind:'imagimusic-saved-touch-motion',version:1,approachSeconds:.18,releaseSeconds:.22,reach:1.35,pivotY:4.6,restAngle:.25,headRadius:.07});
const smooth=x=>x*x*(3-2*x);
export function savedTouchPose(design,down){
 const body=validateTineDesign(design),g=SAVED_TOUCH_MOTION;
 if(!Number.isFinite(down)||down<0||down>1)throw Error('Invalid saved-touch cue progress.');
 const targetX=body.activation*body.lengthMm/10,drop=g.pivotY-3.55-g.headRadius,armLength=Math.hypot(g.reach,drop),angle=g.restAngle+(Math.atan2(-drop,g.reach)-g.restAngle)*down;
 const pivot=[targetX-g.reach,g.pivotY,0];
 return {armLength,angle,pivot,head:[pivot[0]+armLength*Math.cos(angle),pivot[1]+armLength*Math.sin(angle),0],headRadius:g.headRadius};
}
/** Requires a record already physically admitted by the replay worker.
 * At most one cue per body. Neighboring touch envelopes meet continuously,
 * though their velocity may change at a crossover. No live prediction. */
export function createSavedTouchMotion(verifiedRecord){
 const record=parseContinuousEnsembleRecord(verifiedRecord),{sampleRate,fadeStart}=record.records[0],fadeFrames=Math.round(.025*sampleRate),frames=fadeStart+fadeFrames;
 const approach=Math.round(SAVED_TOUCH_MOTION.approachSeconds*sampleRate),release=Math.round(SAVED_TOUCH_MOTION.releaseSeconds*sampleRate);
 const groups=record.records.map(body=>{
  const items=[];body.events.forEach((event,index)=>{const last=items.at(-1);if(last?.frame===event.frame){last.lastIndex=index;last.count++;}else items.push({frame:event.frame,firstIndex:index,lastIndex:index,count:1});});return items;
 });
 function pulse(frame,eventFrame){const delta=frame-eventFrame;if(delta<0)return delta<=-approach?0:smooth(1+delta/approach);return delta>=release?0:1-smooth(delta/release);}
 function at(seconds){
  if(!Number.isFinite(seconds)||seconds<0||seconds>frames/sampleRate)throw Error('Invalid saved-touch motion time.');
  const raw=seconds*sampleRate,nearest=Math.round(raw),frame=Math.abs(raw-nearest)<1e-7?nearest:raw;
  const opacity=frame<fadeStart?1:Math.max(0,(frames-1-frame)/(fadeFrames-1));if(opacity===0)return [];
  const poses=[];
  groups.forEach((items,body)=>{
   let lo=0,hi=items.length;while(lo<hi){const mid=(lo+hi)>>>1;if(items[mid].frame<=frame)lo=mid+1;else hi=mid;}
   let selected=null,down=0;
   for(const group of [items[lo-1],items[lo]])if(group){const value=pulse(frame,group.frame);if(value>down){down=value;selected=group;}}
   if(selected)poses.push({id:`saved-touch-${body}`,body,down,opacity:opacity*smooth(Math.min(1,down*4)),activation:record.records[body].design.activation,group:{...selected},...savedTouchPose(record.records[body].design,down)});
  });return poses;
 }
 return Object.freeze({kind:SAVED_TOUCH_MOTION.kind,version:1,duration:frames/sampleRate,at});
}
