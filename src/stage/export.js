import { createDirector } from './director.js';
import { createTraceManifest } from './manifest.js';
import { Output, Mp4OutputFormat, BufferTarget, CanvasSource, AudioBufferSource, Quality, canEncodeVideo, canEncodeAudio } from '../../vendor/mediabunny/mediabunny.mjs';
import { MATERIALS } from '../model.js';
import { FrameClock } from '../clock.js';
import { collectState, traceHash } from '../state.js';
import { createPerformance } from './performance.js';
import { createProjection, stageBindings, applyStage } from './projection.js';
import { createWorld } from './world.js';
import { renderPerformanceAudio } from './render-audio.js';

/** Fixed-time scene sampling; codec bytes may differ between hardware/browser implementations. */
export async function exportMovie(patch, cameraPose, {signal, onProgress=()=>{}, durationLimit=Infinity}={}) {
  const width=1280,height=720,fps=30,sampleRate=48000;
  if(!await canEncodeVideo('avc',{width,height,frameRate:fps}) || !await canEncodeAudio('aac',{sampleRate,numberOfChannels:1}))
    throw new Error('This browser cannot encode H.264/AAC video. Use a browser with both WebCodecs encoders.');
  const passage=createPerformance(patch,sampleRate),duration=Math.min(passage.duration,durationLimit);
  const clock=new FrameClock({fps}),times=clock.times(duration),baseProject=createProjection(patch,{performance:passage}),direct=createDirector(passage),bindings=stageBindings({camera:true,performers:true,performance:passage});
  const project=frame=>{const result=baseProject(frame);result.stage.camera=direct(frame.t,cameraPose.mode??'manual',cameraPose);return result;};
  let stopped=false;
  function check(){if(stopped||signal?.aborted)throw new DOMException('Movie render cancelled.','AbortError');}
  check();onProgress('Synthesizing the soundtrack…');
  const renderPassage={...passage,duration};
  const manifest=createTraceManifest(renderPassage,{fps,project});
  const pcm=await renderPerformanceAudio(renderPassage,sampleRate);check();
  const length=Math.min(pcm.length,Math.ceil(times.length/fps*sampleRate));
  const buffer=new AudioBuffer({length,numberOfChannels:1,sampleRate});buffer.copyToChannel(pcm.subarray(0,length),0);
  const canvas=document.createElement('canvas'),world=createWorld(canvas,{width,height});
  world.camera.position.fromArray(cameraPose.position);world.controls.target.fromArray(cameraPose.target);world.camera.lookAt(world.controls.target);
  const color=MATERIALS[patch.material].color;
  for(const body of world.garden)for(const shell of body.layers){shell.material.color.setRGB(...color.map(c=>c/255));shell.material.emissive.copy(shell.material.color);}
  const target=new BufferTarget(),output=new Output({format:new Mp4OutputFormat(),target});
  const video=new CanvasSource(canvas,{codec:'avc',quality:new Quality({bitrate:4_000_000})});
  const audio=new AudioBufferSource({codec:'aac',quality:new Quality({bitrate:128_000})});
  output.addVideoTrack(video,{frameRate:fps});output.addAudioTrack(audio);
  let tasks=[];
  try{
    await output.start();
    tasks=[(async()=>{await audio.add(buffer);audio.close();})(),(async()=>{
      for(let i=0;i<times.length;i++){
        check();const frame=project(collectState(times[i],passage.snapshots));if(traceHash(frame)!==manifest.hashes[i])throw new Error('Scene state changed during export at frame '+i);applyStage(frame,bindings,world);world.render();
        await video.add(times[i],1/fps);
        if(i%8===0){onProgress(`Rendering frame ${i+1} / ${times.length}`);await new Promise(resolve=>setTimeout(resolve,0));}
      }
      video.close();
    })()];
    await Promise.all(tasks);check();onProgress('Finishing the MP4…');await output.finalize();check();
    return {blob:new Blob([target.buffer],{type:'video/mp4'}),manifest:{...manifest,instrument:patch,width,height,videoDuration:times.length/fps,camera:cameraPose,codecs:{video:'avc',audio:'aac'},encoding:'Deterministic scene state; repeated float32 audio verified on Safari 26.6.2 at 48 kHz for seed 731, default and air choir; codec bytes implementation-dependent'}};
  }catch(error){stopped=true;await output.cancel().catch(()=>{});await Promise.allSettled(tasks);throw error;}
  finally{world.dispose();}
}
