import {collectState} from '../state.js';
import {createProjection,stageBindings} from './projection.js';
import {createDirector} from './director.js';

/** One timestamp-to-scene path for preview, seeking, offline export and artifact checks. */
export function createStageFrames(performance){
 const base=createProjection(performance.patch,{performance}),direct=createDirector(performance);
 const bindings=stageBindings({camera:true,performers:true,performance});
 const project=(frame,camera)=>{
  const result=base(frame);
  result.stage.camera=direct(frame.t,camera.mode??'manual',camera);
  return result;
 };
 return {bindings,project,sample:(time,camera)=>project(collectState(time,performance.snapshots),camera)};
}
