import {Output,Mp4OutputFormat,BufferTarget,CanvasSource,AudioBufferSource,Quality,canEncodeVideo,canEncodeAudio} from '../../vendor/mediabunny/mediabunny.mjs';
import {createLivingScene} from './scene.js';

/** Browser-only, silent fixed-canvas encoder. Never observes the live scene. */
export const livingJourneyMovieBackend={
 async supports({width,height,fps,sampleRate}){
  return await canEncodeVideo('avc',{width,height,frameRate:fps})&&await canEncodeAudio('aac',{sampleRate,numberOfChannels:2});
 },
 async createSession(manifest,pcm){
  const {width,height,fps,sampleRate}=manifest;
  const buffer=new AudioBuffer({length:manifest.audioSamples,numberOfChannels:2,sampleRate});
  pcm.channels.forEach((channel,i)=>buffer.copyToChannel(channel,i));
  const canvas=document.createElement('canvas');let scene,output;
  try{
   scene=createLivingScene(canvas,{width,height,ensemble:manifest.layout});scene.setLook(manifest.look);
   const target=new BufferTarget();output=new Output({format:new Mp4OutputFormat(),target});
   const video=new CanvasSource(canvas,{codec:'avc',quality:new Quality({bitrate:4_000_000})});
   const audio=new AudioBufferSource({codec:'aac',quality:new Quality({bitrate:192_000})});
   output.addVideoTrack(video,{frameRate:fps});output.addAudioTrack(audio);await output.start();
   return {
    async addAudio(){await audio.add(buffer);audio.close();},
    draw:frame=>scene.instanceFrame(frame,true),addVideo:(time,duration)=>video.add(time,duration),closeVideo:()=>video.close(),
    async finish(){await output.finalize();return new Blob([target.buffer],{type:'video/mp4'});},
    cancel:()=>output.cancel(),dispose:()=>scene.dispose(),
   };
  }catch(error){if(output)await output.cancel().catch(()=>{});scene?.dispose();throw error;}
 },
};
