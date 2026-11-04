import {Output,Mp4OutputFormat,BufferTarget,CanvasSource,AudioBufferSource,Quality,canEncodeVideo,canEncodeAudio} from '../../vendor/mediabunny/mediabunny.mjs';
import {createLivingMoviePlan,validateLivingMovieAudio,LIVING_MOVIE_HASH_DIGITS} from './movie-plan.js';
import {LIVING_PRESENTATIONS} from './presentation.js';
import {createLivingScene} from './scene.js';
import {traceHash} from '../state.js';
import {groveMovieAudioEvidence} from '../grove/movie-audio.js';

/** Fixed-time canonical film; never reads the live scene, orbit or listening gain. */
export async function exportLivingMovie(record,source,{signal,onProgress=()=>{}}={}){
 const plan=createLivingMoviePlan(record),{manifest,times}=plan,{width,height,fps,sampleRate}=manifest;
 validateLivingMovieAudio(source,manifest);
 // Snapshot before the first await: later playing or caller edits cannot change this film.
 const pcm={sampleRate,frames:source.frames,channels:source.channels.map(c=>c.slice())};
 let stopped=false;const check=()=>{if(stopped||signal?.aborted)throw new DOMException('Movie render cancelled.','AbortError');};check();
 onProgress('Checking movie support…');
 if(!await canEncodeVideo('avc',{width,height,frameRate:fps})||!await canEncodeAudio('aac',{sampleRate,numberOfChannels:2}))throw Error('This browser cannot encode H.264 and stereo AAC. The original encounter remains available.');check();
 const stem='imagimusic-living-encounter';
 onProgress('Preserving the original soundtrack…');
 const {wav,audio:audioEvidence}=await groveMovieAudioEvidence(pcm,stem+'.wav');check();
 const buffer=new AudioBuffer({length:manifest.audioSamples,numberOfChannels:2,sampleRate});pcm.channels.forEach((c,i)=>buffer.copyToChannel(c,i));
 const canvas=document.createElement('canvas');let scene,output,tasks=[],finalized=false;
 try{
  scene=createLivingScene(canvas,{width,height});scene.setLook(LIVING_PRESENTATIONS[manifest.presentationVersion].look);
  const target=new BufferTarget();output=new Output({format:new Mp4OutputFormat(),target});
  const video=new CanvasSource(canvas,{codec:'avc',quality:new Quality({bitrate:4_000_000})}),audio=new AudioBufferSource({codec:'aac',quality:new Quality({bitrate:192_000})});
  output.addVideoTrack(video,{frameRate:fps});output.addAudioTrack(audio);await output.start();check();
  tasks=[(async()=>{await audio.add(buffer);audio.close();})(),(async()=>{
   for(let i=0;i<times.length;i++){
    check();const frame=plan.sample(times[i]);if(traceHash(frame,LIVING_MOVIE_HASH_DIGITS)!==manifest.frameHashes[i])throw Error('Encounter state changed during rendering.');
    scene.arrangementFrame(frame,true,true);await video.add(times[i],1/fps);
    if(i%8===0){onProgress(`Rendering frame ${i+1} / ${times.length}`);await new Promise(resolve=>setTimeout(resolve,0));}
   }video.close();
  })()];
  await Promise.all(tasks);check();onProgress('Finishing the movie…');await output.finalize();finalized=true;check();
  return {blob:new Blob([target.buffer],{type:'video/mp4'}),wav,stem,manifest:{...manifest,audio:audioEvidence,codecs:{video:'avc',audio:'aac'},encoding:'Source Float32 fingerprints identify this render; tiny numerical differences can occur between JavaScript engines. AAC is lossy and may include padding. Codec bytes and rendered pixels depend on the browser/GPU; frame-state hashes do not verify either. Source WAV is PCM16; source Float32 fingerprints are separate.'}};
 }catch(error){stopped=true;if(output&&!finalized)await output.cancel().catch(()=>{});await Promise.allSettled(tasks);throw error;}
 finally{scene?.dispose();}
}
