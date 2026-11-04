import {createContinuousEnsembleReplayView} from './continuous-ensemble-replay-view.js';
import {createSavedTouchMotion} from './saved-touch-motion.js';

/** Presentation only: chapters must already have passed physical admission in
 * the offline renderer. This is not an import/admission boundary. */
export function createEnsembleJourneyView(records){
 if(!Array.isArray(records)||records.length!==3)throw Error('A journey needs three admitted chapters.');
 const views=records.map(createContinuousEnsembleReplayView),motions=views.map(v=>createSavedTouchMotion(v.record));
 if(views.some(v=>v.duration!==48||v.sampleRate!==views[0].sampleRate||JSON.stringify(v.layout)!==JSON.stringify(views[0].layout)))throw Error('Journey chapters need matching bodies, rates and 48-second endings.');
 const duration=144;
 function locate(seconds){if(!Number.isFinite(seconds)||seconds<0||seconds>duration)throw Error('Invalid journey playback time.');const chapter=Math.min(2,Math.floor(seconds/48));return {chapter,local:seconds-chapter*48};}
 const view={duration,layout:views[0].layout,magnification:views[0].magnification,at(seconds){const {chapter,local}=locate(seconds);return {...views[chapter].at(local),chapter,journeySeconds:seconds};}};
 const motion={at(seconds){const {chapter,local}=locate(seconds);return motions[chapter].at(local);}};
 return {view,motion};
}
