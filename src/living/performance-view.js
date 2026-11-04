import {LIVING_PRESENTATIONS} from './presentation.js';
import {createLivingArrangement} from './arrangement.js';
import {createLivingArrangementView} from './arrangement-view.js';
import {createLivingChoreography} from './choreography.js';

/** One event timeline for the live encounter and its fixed-time film. Legacy
 * presentations retain their exact frame shape; version3 adds known-score poses.
 * These strikers stage ideal impulses, not physical hammer collisions.
 */
export function createLivingPerformanceView(source,presentationVersion){
 if(!Number.isInteger(presentationVersion)||!Object.hasOwn(LIVING_PRESENTATIONS,presentationVersion))throw Error('Unsupported Living Instrument presentation.');
 const presentation=LIVING_PRESENTATIONS[presentationVersion];
 const plan=createLivingArrangement(source),view=createLivingArrangementView(plan);
 const choreography=presentation.contacts?createLivingChoreography(plan.source):null;
 return {plan,at(seconds){const frame=view.at(seconds);return choreography?{...frame,performers:choreography.at(seconds)}:frame;}};
}
