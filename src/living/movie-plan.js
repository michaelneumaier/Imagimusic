import {livingPresentationVersion} from './presentation.js';
import {validateLivingRecord} from './record.js';
import {createLivingPerformanceView} from './performance-view.js';
import {FrameClock} from '../clock.js';
import {traceHash} from '../state.js';
export const LIVING_MOVIE_HASH_DIGITS=12;

/** Fixed-time source for a film. This proves response/presentation state,
 * not pixels, codec bytes, output-device timing or an acoustic field. */
export function createLivingMoviePlan(value){
 const record=validateLivingRecord(value),view=createLivingPerformanceView(record.source,livingPresentationVersion(record),record.arrangementVersion),arrangement=view.plan;
 const fps=30,duration=arrangement.frames/arrangement.sampleRate,times=new FrameClock({fps}).times(duration);
 function sample(seconds){
  const frame=view.at(seconds);
  return {...frame,cameraOpen:record.cameraMotion?frame.cameraOpen:1,bodies:frame.bodies.map(body=>({...body,points:record.reveal?body.points:null}))};
 }
 const manifest={kind:'imagimusic-living-movie',version:1,presentationVersion:livingPresentationVersion(record),record,width:1280,height:720,fps,sampleRate:arrangement.sampleRate,audioSamples:arrangement.frames,duration,frames:times.length,videoDuration:times.length/fps,hashDigits:LIVING_MOVIE_HASH_DIGITS,frameHashes:times.map(t=>traceHash(sample(t),LIVING_MOVIE_HASH_DIGITS)),hashScope:(livingPresentationVersion(record)===3?'Known-score performer identity, body, lane, head radius, phase, event and normalized contact pose are included. ':'')+'Three retained-mode displacement envelopes, accepted-touch marks, phase/count and camera opening at each i/30 timestamp. Reveal and camera-follow choices are applied. Non-cryptographic trace hashes round to 12 decimal places (picometres for displacement). Not rendered pixels or encoded bytes.',camera:'Canonical opening-to-ensemble path, or fixed wide view; manual browser orbit is excluded.',audioPolicy:'Original arrangement stereo Float32 source, no visit listening gain. AAC film audio is lossy; keep source WAV separately. Final video frame may extend less than 1/30 second beyond the exact soundtrack.'};
 return {manifest,times,sample};
}

export function validateLivingMovieAudio(pcm,manifest){
 if(pcm?.sampleRate!==manifest.sampleRate||pcm.frames!==manifest.audioSamples||!Array.isArray(pcm.channels)||pcm.channels.length!==2||pcm.channels.some(c=>!(c instanceof Float32Array)||c.length!==manifest.audioSamples))throw Error('The movie soundtrack must match the encounter sample count and rate.');
 for(const channel of pcm.channels)for(const value of channel)if(!Number.isFinite(value)||Math.abs(value)>1)throw Error('The movie soundtrack contains invalid source samples.');
}
