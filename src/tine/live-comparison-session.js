import {createAudioRenderJob} from '../audio-render-job.js';
import {validateTineLiveRecord} from './live-record.js';
import {createTineLiveComparison} from './live-comparison.js';
export function createTineComparisonSession({createJob=input=>createAudioRenderJob(new URL('./live-comparison-worker.js',import.meta.url),input),onChange=()=>{}}={}){
 let source=null,current=null,job=null,version=0;
 const emit=message=>onChange({source,current,pending:!!job,message});
 function cancel(){version++;job?.cancel();job=null;emit();}
 function setSource(value){const next=validateTineLiveRecord(value);version++;job?.cancel();job=null;source=next;current=null;emit();}
 async function prepare(dimensions){
  if(!source)throw Error('Complete or reopen a pass first.');
  const pair=createTineLiveComparison(source,dimensions);cancel();const own=version;
  try{job=createJob({source:pair.original,dimensions:{lengthMm:pair.candidate.design.lengthMm,widthMm:pair.candidate.design.widthMm}});emit();const result=await job.promise;if(own!==version)return;current=result;job=null;emit();}
  catch(error){if(own!==version)return;job=null;emit(error.message);}
 }
 return {setSource,prepare,cancel,get current(){return current;},get pending(){return !!job;}};
}
