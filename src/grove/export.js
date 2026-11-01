import {Output,Mp4OutputFormat,BufferTarget,CanvasSource,AudioBufferSource,Quality,canEncodeVideo,canEncodeAudio} from '../../vendor/mediabunny/mediabunny.mjs';
import {createGroveMoviePlan,validateGroveMovieAudio} from './movie-plan.js';
import {createGroveWorld} from './world.js';
import {createGroveScene,applyGroveScene} from './scene.js';
import {traceHash} from '../state.js';
import {groveMovieAudioEvidence} from './movie-audio.js';
/** Offline fixed-time film of the supplied capture and its existing stereo PCM.
 * AAC is lossy; model traces, not codec bytes, are the reproducibility evidence. */
export async function exportGroveMovie(recording,pcm,camera,{signal,onProgress=()=>{}}={}){
 const plan=createGroveMoviePlan(recording,camera),{manifest,times}=plan,{width,height,fps,sampleRate}=manifest;
 validateGroveMovieAudio(pcm,manifest);
 let stopped=false;const check=()=>{if(stopped||signal?.aborted)throw new DOMException('Movie render cancelled.','AbortError');};check();
 onProgress('Checking movie support…');
 if(!await canEncodeVideo('avc',{width,height,frameRate:fps})||!await canEncodeAudio('aac',{sampleRate,numberOfChannels:2}))throw new Error('This browser cannot encode H.264 and stereo AAC. Keep the sound and gestures instead.');check();
 onProgress('Preserving the exact saved soundtrack…');
 const stem=`imagimusic-grove-${manifest.capture.grove.seed}-${manifest.capture.kind==='imagimusic-grove-voice'?'partials':'original'}`;
 const {wav,audio:audioEvidence}=await groveMovieAudioEvidence(pcm,stem+'.wav');check();
 const buffer=new AudioBuffer({length:manifest.audioSamples,numberOfChannels:2,sampleRate});pcm.channels.forEach((c,i)=>buffer.copyToChannel(c,i));
 const canvas=document.createElement('canvas');let world,sculpture,output,tasks=[],finalized=false;
 try{
  world=createGroveWorld(canvas,{width,height});sculpture=createGroveScene(manifest.capture.grove);world.scene.add(sculpture.root);
  world.camera.position.fromArray(manifest.camera.position);world.controls.target.fromArray(manifest.camera.target);world.camera.lookAt(world.controls.target);
  const target=new BufferTarget();output=new Output({format:new Mp4OutputFormat(),target});
  const video=new CanvasSource(canvas,{codec:'avc',quality:new Quality({bitrate:4_000_000})}),audio=new AudioBufferSource({codec:'aac',quality:new Quality({bitrate:192_000})});
  output.addVideoTrack(video,{frameRate:fps});output.addAudioTrack(audio);await output.start();check();
  tasks=[(async()=>{await audio.add(buffer);audio.close();})(),(async()=>{for(let i=0;i<times.length;i++){
   check();const frame=plan.sample(times[i]);if(traceHash(frame)!==manifest.modelFrameHashes[i])throw new Error('Grove model changed during movie rendering');applyGroveScene(sculpture,frame);world.render();await video.add(times[i],1/fps);
   if(i%8===0){onProgress(`Rendering frame ${i+1} / ${times.length}`);await new Promise(resolve=>setTimeout(resolve,0));}
  }video.close();})()];
  await Promise.all(tasks);check();onProgress('Finishing the movie…');await output.finalize();finalized=true;check();
  return {blob:new Blob([target.buffer],{type:'video/mp4'}),wav,stem,manifest:{...manifest,audio:audioEvidence,presentation:{strikeCues:'brief recorded-input rings; derived from model strike events, presentation values excluded from modelFrameHashes',gestureRing:false,voice:manifest.capture.kind==='imagimusic-grove-voice'?'With partials · exploration':'Original'},codecs:{video:'avc',audio:'aac'},encoding:'Source is the saved stereo Float32 mix. AAC is lossy, may include codec padding, and codec bytes depend on the implementation. Source PCM and saved WAV have separate hashes. Video frames sample i/30 before the exact source-audio end; the final frame can extend less than 1/30 second beyond it.'}};
 }catch(error){stopped=true;if(output&&!finalized)await output.cancel().catch(()=>{});await Promise.allSettled(tasks);throw error;}
 finally{sculpture?.dispose();world?.dispose();}
}
