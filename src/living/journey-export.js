import {createLivingJourneyMovieSource,completeLivingJourneyMoviePlan} from './journey-movie-plan.js';
import {prepareLivingJourneyMovieAudio} from './journey-movie-audio.js';
import {renderLivingJourneyMovie} from './journey-movie-render.js';
import {livingJourneyMovieBackend} from './journey-movie-backend.js';

export async function exportLivingJourneyMovie(request,artifact,{reveal=true,signal,onProgress=()=>{}}={}){
 if(signal?.aborted)throw new DOMException('Journey film cancelled.','AbortError');
 onProgress('Preparing the canonical journey source…');
 const source=createLivingJourneyMovieSource(request,{reveal});
 onProgress('Verifying the kept journey soundtrack…');
 const sound=await prepareLivingJourneyMovieAudio(artifact,source.manifest,{signal});
 const plan=await completeLivingJourneyMoviePlan(source,{signal,onProgress});
 const blob=await renderLivingJourneyMovie(plan,sound.pcm,livingJourneyMovieBackend,{signal,onProgress});
 const stem=plan.manifest.request.kind==='imagimusic-living-personal-journey-request'?'imagimusic-personal-journey':`imagimusic-journey-${plan.manifest.request.seed}-${plan.manifest.request.treatment}`;
 return {blob,wav:sound.wav,report:sound.report,stem,manifest:{...plan.manifest,audio:sound.evidence,codecs:{video:'avc',audio:'aac'},encoding:'AAC encodes decoded kept PCM16 samples and is lossy; padding may be present. Keep the exact WAV separately. Pixel and codec output depend on browser/GPU. Frame-state hashes do not verify pixels, encoded bytes or audible synchronization.'}};
}
