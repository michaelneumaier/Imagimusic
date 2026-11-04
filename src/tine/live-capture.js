import {createAudioRenderJob} from '../audio-render-job.js';
import {tineLiveRecordFromFinished,validateTineLiveRecord} from './live-record.js';
export function createTineLiveCapture({createJob=record=>createAudioRenderJob(new URL('./live-render-worker.js',import.meta.url),record),onChange=()=>{}}={}){
 let current=null,job=null,version=0;
 const emit=message=>onChange({current,pending:!!job,message});
 function cancel(){version++;job?.cancel();job=null;emit();}
 // Prepare every member of a restored pair before committing either. Commit
 // changes state without callbacks; publish only after all members are installed.
 function stage(pcm){
  const record=validateTineLiveRecord(pcm?.record),frames=record.fadeStart+Math.round(.025*record.sampleRate);
  if(pcm.sampleRate!==record.sampleRate||pcm.frames!==frames||pcm.seconds!==frames/record.sampleRate||!Array.isArray(pcm.channels)||pcm.channels.length!==1||!(pcm.channels[0] instanceof Float32Array)||pcm.channels[0].length!==frames||pcm.channels[0].some(x=>!Number.isFinite(x)))throw Error('Invalid prepared tine audio.');
  const prepared={...pcm,record,channels:[pcm.channels[0].slice()],snapshot:structuredClone(pcm.snapshot)};
  let committed=false;
  return ()=>{if(committed)return;committed=true;version++;job?.cancel();job=null;current=prepared;};
 }
 async function load(value){
  const record=validateTineLiveRecord(value);cancel();const own=version;
  try{job=createJob(record);emit();const pcm=await job.promise;if(own!==version)return;current=pcm;job=null;emit();}
  catch(error){if(own!==version)return;job=null;emit(error.message);}
 }
 return {async accept(finished){return load(tineLiveRecordFromFinished(finished));},load,cancel,stage,publish:()=>emit(),get current(){return current;},get pending(){return !!job;}};
}
