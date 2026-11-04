import {traceHash} from '../state.js';
import {JOURNEY_MOVIE_HASH_DIGITS} from './journey-movie-plan.js';

/** Internal encoder orchestration; inputs come from the verified film preparation.
 * Backend injection tests ownership/timing, not browser codecs or rendered pixels.
 */
export async function renderLivingJourneyMovie(plan,pcm,backend,{signal,onProgress=()=>{},yieldFrame=()=>new Promise(resolve=>setTimeout(resolve,0))}={}){
 const {manifest,times}=plan;let session=null,tasks=[],stopped=false,finalized=false,cancellation=null;
 const check=()=>{if(stopped||signal?.aborted)throw new DOMException('Journey film cancelled.','AbortError');};
 function cancel(){stopped=true;if(session&&!finalized&&!cancellation)cancellation=Promise.resolve().then(()=>session.cancel()).catch(()=>{});}
 check();onProgress('Checking journey movie support…');
 const supported=await backend.supports(manifest);check();
 if(!supported)throw Error('This browser cannot encode H.264 and stereo AAC. The journey remains available.');
 try{
  session=await backend.createSession(manifest,pcm);check();
  signal?.addEventListener('abort',cancel,{once:true});check();
  tasks=[(async()=>{check();await session.addAudio();check();})(),(async()=>{
   for(let i=0;i<times.length;i++){
    check();const frame=plan.sample(times[i]);
    if(traceHash(frame,JOURNEY_MOVIE_HASH_DIGITS)!==manifest.frameHashes[i])throw Error('Journey frame state changed during film preparation.');
    session.draw(frame);await session.addVideo(times[i],1/manifest.fps);check();
    if(i%8===0){onProgress(`Rendering journey frame ${i+1} / ${times.length}`);await yieldFrame();}
   }
   session.closeVideo();
  })()];
  await Promise.all(tasks);check();onProgress('Finishing the journey film…');
  const blob=await session.finish();finalized=true;check();
  if(!(blob instanceof Blob)||blob.size===0||blob.type!=='video/mp4')throw Error('The encoder did not return a complete MP4 artifact.');
  return blob;
 }catch(error){cancel();await cancellation;await Promise.allSettled(tasks);throw error;}
 finally{signal?.removeEventListener('abort',cancel);session?.dispose();}
}
