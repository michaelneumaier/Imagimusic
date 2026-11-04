import {createContinuousReturnVisual} from './continuous-return-visual.js';
import {createContinuousEnsembleView} from './continuous-ensemble-view.js';

/** Optional common-clock picture. Completion must already be verified by its
 * owner; these checks prevent mismatched bodies/endings from driving the view. */
export function createContinuousEnsembleVisual(options){
 return createContinuousReturnVisual({...options,createView:createContinuousEnsembleView,
  description:'Three independent ringing bodies · response bounds magnified 1,000× · gold markers acknowledge accepted touches.',
  finishedFadeStart(finished,plan){
   const records=finished?.records,frame=records?.[0]?.fadeStart;
   if(!Array.isArray(records)||records.length!==3||!Number.isInteger(frame)||records.some((record,i)=>record?.sampleRate!==plan.sampleRate||record?.fadeStart!==frame||JSON.stringify(record?.design)!==JSON.stringify(plan.bodies[i])))throw Error('The ensemble endings do not agree.');
   return frame;
  },
 });
}
