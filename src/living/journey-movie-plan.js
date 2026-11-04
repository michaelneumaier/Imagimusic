import {validateLivingPersonalJourneyRequest} from './personal-journey-artifact.js';
import {createLivingPersonalJourneyStudy} from './personal-journey-study.js';
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
export function createLivingJourneyMovieSource(value,{reveal=true}={}){
 if(typeof reveal!=='boolean')throw Error('Choose whether the journey film reveals response veils.');
 const personal=value?.kind==='imagimusic-living-personal-journey-request';
 const request=personal?validateLivingPersonalJourneyRequest(value):validateLivingJourneyRequest(value);
 const journey=personal?createLivingPersonalJourneyStudy(request.source):makers[request.treatment](request.seed);
 const view=createLivingJourneyView(journey),layout=freeze(createLivingJourneyLayout(view.allocation,{fitAllInstances:personal}));
 const fps=30,duration=journey.frames/journey.sampleRate,times=Object.freeze(new FrameClock({fps}).times(duration));
 function sample(seconds){
  const frame=view.at(seconds);
  return {...frame,cameraShot:layout.camera,instances:frame.instances.map(instance=>({...instance,points:reveal?instance.points:null}))};
 }
 const manifest=freeze({
  kind:personal?'imagimusic-living-personal-journey-movie-plan':'imagimusic-living-journey-movie-plan',version:1,request,journey,layout,reveal,look:'dusk',
  width:1280,height:720,fps,sampleRate:journey.sampleRate,audioSamples:journey.frames,
  duration,frames:times.length,videoDuration:times.length/fps,
  hashDigits:JOURNEY_MOVIE_HASH_DIGITS,frameHashes:[],
  hashScope:'Non-cryptographic state hashes rounded to12decimal places. Every independent instance, assigned pass, response bound, recorded-ending opacity, score-driven performer, accepted-touch count and held camera at i/30 seconds. Reveal choice is applied. These hashes do not establish rendered pixels, encoded bytes, audible synchronization or collision physics.',
  camera:'Canonical held ensemble camera. Manual browser orbit and live following toggle are excluded; the film follows the complete score.',
  audioPolicy:'Use the exact journey study soundtrack at fixed preview gain8; exclude visit listening gain. Preserve its PCM16 WAV separately from lossy film audio. Final video frame extends less than1/30second beyond exact soundtrack duration.',
 });
 return Object.freeze({manifest,times,sample});
}

function complete(source,frameHashes){
 return Object.freeze({...source,manifest:freeze({...source.manifest,frameHashes})});
}

/** Synchronous source retained for offline checks and deterministic comparisons. */
export function createLivingJourneyMoviePlan(value,options){
 const source=createLivingJourneyMovieSource(value,options);
 return complete(source,source.times.map(t=>traceHash(source.sample(t),JOURNEY_MOVIE_HASH_DIGITS)));
}

/** Internal completion of a source snapshot. Yield in bounded frame batches so
 * a browser can receive cancellation without waiting for thousands of hashes.
 * Initial score/response setup remains synchronous; encoding is a later step.
 */
export async function completeLivingJourneyMoviePlan(source,{signal,onProgress=()=>{},yieldFrame=()=>new Promise(resolve=>setTimeout(resolve,0))}={}){
 const check=()=>{if(signal?.aborted)throw new DOMException('Journey film preparation cancelled.','AbortError');};
 const hashes=[];check();
 for(let i=0;i<source.times.length;i++){
  if(i%32===0){onProgress(`Preparing journey frame ${i} / ${source.times.length}`);await yieldFrame();check();}
  hashes.push(traceHash(source.sample(source.times[i]),JOURNEY_MOVIE_HASH_DIGITS));
 }
 check();return complete(source,hashes);
}
