import {createListeningContinuation} from './listening-continuation.js';

/** A natural ending may repeat a personal score or generate a fresh seed.
 * The page stops this opt-in before changing source; recheck playback eligibility
 * when the pause expires, including callbacks already queued by the browser.
 */
export function createJourneyContinuation({state,repeat,fresh,...options}){
 let continuation;
 continuation=createListeningContinuation({...options,next:()=>{
  const {hidden,starting,ended,personal}=state();
  if(hidden||starting||!ended){continuation.stop();return;}
  if(personal)repeat();else fresh();
 }});
 return continuation;
}
