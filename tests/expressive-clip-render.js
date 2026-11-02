import {createClipPerformance,renderClipAudio,clipExpressionFrame} from '../src/expressive/clip-performance.js';
import {renderExpressionAudio} from '../src/expressive/audio.js';
const $=id=>document.getElementById(id),hex=s=>Uint8Array.from(s.replaceAll(/\s/g,'').match(/../g),h=>parseInt(h,16));
// Independent literal fixture: TPQ3; channel bend in configuration, musical
// start at1/6s, half-second note, then eight seconds until End of Clip.
const bytes=hex('534d4632434c4950 00400000 00300003 40e00000 ffffffff 00400001 f0200000 00000000 00000000 00000000 40903c00 80000000 00400003 40803c00 00000000 00400030 f0210000 00000000 00000000 00000000');
const check=(ok,message)=>{if(!ok)throw new Error(message);};
const sha=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');
let revision=0;
$('run').onclick=async()=>{
 const own=++revision;$('run').disabled=true;$('report').textContent='';
 try{
  const results=[];
  for(const sampleRate of [8000,48000]){
   $('status').textContent=`Rendering the full source and cropped window at${sampleRate}Hz…`;
   const clip=createClipPerformance(bytes,{sampleRate}),full=await renderExpressionAudio(clip.performance);
   const cropped=await renderClipAudio(clip);if(own!==revision)return;
   const a=full.channels[0].slice(clip.originFrame),b=cropped.channels[0],av=new Uint8Array(a.buffer),bv=new Uint8Array(b.buffer);
   check(a.length===clip.playbackFrames&&b.length===a.length,'Crop frame count mismatch');
   check(av.every((v,i)=>v===bv[i]),'Separate full render and cropped render differ');
   check(full.channels[0].slice(0,clip.originFrame-1).every(v=>v===0),'Setup emitted audio before musical onset');
   let peak=0;for(const v of b){check(Number.isFinite(v),'Nonfinite sample');peak=Math.max(peak,Math.abs(v));}
   check(peak>1e-5&&peak<.98,'Output level outside fixture bounds');
   check(b.slice(-sampleRate).every(v=>v===0),'Ending silence not preserved');
   const picture=clipExpressionFrame(clip,0);
   check(picture.time===clip.playbackOriginSeconds,'Picture origin mismatch');
   results.push({sampleRate,originSeconds:clip.imported.origin.seconds,originFrame:clip.originFrame,originRoundingSeconds:clip.originRoundingSeconds,sourceFrames:clip.sourceFrames,playbackFrames:clip.playbackFrames,peak,repeatFloat32Exact:true,finalSecondSilent:true,pcmSha256:await sha(bv),pictureStartPitchHcu:picture.voices[0].pitchHcu});
  }
  if(own!==revision)return;
  $('report').textContent=JSON.stringify({passed:true,userAgent:navigator.userAgent,results,scope:'Literal local fixture; actual offline browser graph and exact crop identity. No device playback, external-application interoperability, or hearing judgement.'},null,2);
  $('status').textContent='PASS · Both sample rates preserve setup, origin and ending.';
 }catch(error){if(own===revision)$('status').textContent='FAILED · '+error.message;}
 finally{if(own===revision)$('run').disabled=false;}
};
window.addEventListener('pagehide',()=>{revision++;});
