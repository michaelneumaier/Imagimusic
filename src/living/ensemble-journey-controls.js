import {createEnsembleJourneyRecipe,readEnsembleJourneyRecipe,ENSEMBLE_JOURNEY_RECIPE_LIMIT} from './ensemble-journey-recipe.js';
import {parseContinuousEnsembleRecord} from './continuous-ensemble-record.js';
import {createAudioRenderJob} from '../audio-render-job.js';
import {createEnsembleJourneyStudy} from './ensemble-journey-study.js';

export function setupEnsembleJourneyControls({elements,audio,beforePrepare=()=>{},now=()=>performance.now(),
 createJob=input=>createAudioRenderJob(new URL('./ensemble-journey-audio-worker.js',import.meta.url),input),
 digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join(''),
 makeURL=blob=>URL.createObjectURL(blob),revokeURL=url=>URL.revokeObjectURL(url),
}){
 const {pads,reset,prepare,cancel,listen,status,wav,chapters,file,recipe}=elements,sampleRate=48000;
 let gesture=[],origin=null,job=null,version=0,busy=false,current=null,disposed=false;
 const listeners=[];const on=(target,event,fn)=>{target.addEventListener(event,fn);listeners.push(()=>target.removeEventListener(event,fn));};
 function update(){pads.forEach(p=>p.disabled=busy||gesture.length===3);reset.disabled=busy||!gesture.length;prepare.disabled=busy||gesture.length!==3;cancel.disabled=!busy;listen.disabled=busy||!current;}
 function stop(){version++;job?.cancel();job=null;const wasBusy=busy;busy=false;update();if(wasBusy)status.textContent='Preparation cancelled. Any previous personal journey is still available.';}
 function tap(strength){
  if(disposed||busy||gesture.length===3)return;
  const stamp=now();if(!Number.isFinite(stamp))return;
  const frame=origin===null?0:Math.round((stamp-origin)*sampleRate/1000);
  if(frame<0||frame>3*sampleRate){gesture=[];origin=null;status.textContent='That phrase ran past three seconds. Try three taps closer together.';update();return;}
  if(gesture.length&&frame<=gesture.at(-1).frame)return;
  if(origin===null)origin=stamp;gesture.push({frame,strength});
  status.textContent=gesture.length===3?'Three touches kept. Prepare your journey when ready.':`${gesture.length} of 3 touches · finish within three seconds of the first.`;update();
 }
 async function open(read){
  if(disposed)return;
  stop();audio.pause();beforePrepare();const own=version;busy=true;update();status.textContent='Preparing your journey quietly…';
  try{
   const {input,expectedHash=null}=await read();if(disposed||own!==version)return;
   job=createJob(input);const result=await job.promise;if(disposed||own!==version)return;job=null;
   const expected=createEnsembleJourneyStudy(42,input),frames=144*sampleRate;
   if(result?.kind!=='imagimusic-ensemble-journey-audio'||result.version!==1||result.sampleRate!==sampleRate||result.frames!==frames||result.motifSource!=='personal'||result.previewGain!==24||!(result.wav instanceof ArrayBuffer)||result.wav.byteLength!==44+frames*4||JSON.stringify(result.records.map(parseContinuousEnsembleRecord))!==JSON.stringify(expected.chapters.map(c=>parseContinuousEnsembleRecord(c.record))))throw Error('Prepared journey does not match these touches.');
   const hash=await digest(result.wav);if(disposed||own!==version)return;if(!/^[a-f0-9]{64}$/.test(hash))throw Error('Could not identify the prepared sound.');
   if(expectedHash!==null&&hash!==expectedHash)throw Error('The reconstructed sound does not match this kept recipe.');
   const keptRecipe=createEnsembleJourneyRecipe(input.gesture,hash);
   const urls=[];try{urls.push(makeURL(new Blob([result.wav],{type:'audio/wav'})));for(const record of result.records)urls.push(makeURL(new Blob([JSON.stringify(record,null,2)+'\n'],{type:'application/json'})));urls.push(makeURL(new Blob([JSON.stringify(keptRecipe,null,2)+'\n'],{type:'application/json'})));}catch(error){urls.forEach(revokeURL);throw error;}
   gesture=input.gesture.map(e=>({...e}));origin=null;
   const previous=current;current={identity:urls[0],record:structuredClone(result.records),urls};
   listen.dataset.file=urls[0];listen.dataset.sha256=hash;listen.textContent='Listen to your three-touch journey · 2:24';listen.setAttribute('aria-pressed','false');
   wav.href=urls[0];wav.hidden=false;chapters.forEach((link,i)=>{link.href=urls[i+1];link.hidden=false;});
   if(recipe){recipe.href=urls[4];recipe.hidden=false;}
   previous?.urls.forEach(revokeURL);status.textContent='Ready, silently. Choose your three-touch journey above to listen. You can keep its recipe, sound and chapters below.';
  }catch(error){if(!disposed&&own===version&&error.name!=='AbortError')status.textContent='Could not prepare this journey: '+error.message;}
  finally{if(!disposed&&own===version){busy=false;job=null;update();}}
 }
 pads.forEach((pad,i)=>on(pad,'click',()=>tap([.025,.05,.1][i])));
 on(reset,'click',()=>{if(busy)return;gesture=[];origin=null;status.textContent='Tap three times to plant a new rhythm. Taps are silent.';update();});
 on(prepare,'click',()=>{if(disposed||busy||gesture.length!==3)return;const input={sampleRate,gesture:gesture.map(e=>({...e}))};return open(()=>({input}));});
 if(file)on(file,'change',()=>{const selected=file.files?.[0];file.value='';if(!selected)return;return open(async()=>{if(!Number.isSafeInteger(selected.size)||selected.size<1||selected.size>ENSEMBLE_JOURNEY_RECIPE_LIMIT)throw Error('Choose a journey recipe no larger than 4 KiB.');const saved=readEnsembleJourneyRecipe(await selected.text());return {input:{sampleRate:saved.sampleRate,gesture:saved.gesture},expectedHash:saved.wavSha256};});});
 on(cancel,'click',stop);on(audio,'play',()=>{if(busy)stop();});update();
 return {stop,get prepared(){return current?{identity:current.identity,record:structuredClone(current.record)}:null;},dispose(){disposed=true;stop();listeners.forEach(remove=>remove());current?.urls.forEach(revokeURL);current=null;}};
}
