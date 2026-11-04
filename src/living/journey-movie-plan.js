import {validateLivingJourneyRequest} from './journey-artifact.js';
import {createLivingJourneyStudy} from './journey-study.js';
import {createLivingConnectedJourneyStudy} from './connected-journey-study.js';
import {createLivingEvolvingJourneyStudy} from './evolving-journey-study.js';
import {createLivingJourneyView} from './journey-view.js';
import {createLivingJourneyLayout} from './journey-layout.js';
import {FrameClock} from '../clock.js';
import {traceHash} from '../state.js';

export const JOURNEY_MOVIE_HASH_DIGITS=12;
const makers={chapters:createLivingJourneyStudy,connected:createLivingConnectedJourneyStudy,evolving:createLivingEvolvingJourneyStudy};
function freeze(value){
 if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}
 return value;
}

/** Canonical workshop film source, not a flagship recipe or encoded movie.
 * Snapshot all identity before exporting; manual orbit/listening gain excluded.
 */
export function createLivingJourneyMoviePlan(value,{reveal=true}={}){
 if(typeof reveal!=='boolean')throw Error('Choose whether the journey film reveals response veils.');
 const request=validateLivingJourneyRequest(value),journey=makers[request.treatment](request.seed);
 const view=createLivingJourneyView(journey),layout=freeze(createLivingJourneyLayout(view.allocation));
 const fps=30,duration=journey.frames/journey.sampleRate,times=Object.freeze(new FrameClock({fps}).times(duration));
 function sample(seconds){
  const frame=view.at(seconds);
  return {...frame,cameraShot:layout.camera,instances:frame.instances.map(instance=>({...instance,points:reveal?instance.points:null}))};
 }
 const manifest=freeze({
  kind:'imagimusic-living-journey-movie-plan',version:1,request,journey,layout,reveal,look:'dusk',
  width:1280,height:720,fps,sampleRate:journey.sampleRate,audioSamples:journey.frames,
  duration,frames:times.length,videoDuration:times.length/fps,
  hashDigits:JOURNEY_MOVIE_HASH_DIGITS,frameHashes:times.map(t=>traceHash(sample(t),JOURNEY_MOVIE_HASH_DIGITS)),
  hashScope:'Non-cryptographic state hashes rounded to12decimal places. Every independent instance, assigned pass, response bound, recorded-ending opacity, score-driven performer, accepted-touch count and held camera at i/30 seconds. Reveal choice is applied. These hashes do not establish rendered pixels, encoded bytes, audible synchronization or collision physics.',
  camera:'Canonical held ensemble camera. Manual browser orbit and live following toggle are excluded; the film follows the complete score.',
  audioPolicy:'Use the exact journey study soundtrack at fixed preview gain8; exclude visit listening gain. Preserve its PCM16 WAV separately from lossy film audio. Final video frame extends less than1/30second beyond exact soundtrack duration.',
 });
 return Object.freeze({manifest,times,sample});
}
