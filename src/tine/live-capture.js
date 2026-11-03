import {createAudioRenderJob} from '../audio-render-job.js';
import {tineLiveRecordFromFinished} from './live-record.js';
export function createTineLiveCapture({createJob=record=>createAudioRenderJob(new URL('./live-render-worker.js',import.meta.url),record),onChange=()=>{}}={}){
 let current=null,job=null,version=0;
 const emit=message=>onChange({current,pending:!!job,message});
 function cancel(){version++;job?.cancel();job=null;emit();}
 async function accept(finished){
  const record=tineLiveRecordFromFinished(finished);cancel();const own=version;
  try{job=createJob(record);emit();const pcm=await job.promise;if(own!==version)return;current=pcm;job=null;emit();}
  catch(error){if(own!==version)return;job=null;emit(error.message);}
 }
 return {accept,cancel,get current(){return current;},get pending(){return !!job;}};
}
