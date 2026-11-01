import {loomPerformanceFrame} from '../loom/performance.js';
import {loomSceneFrame,LOOM_BINDINGS} from '../loom/scene.js';
import {collectState} from '../state.js';
import {createProjection,stageBindings} from './projection.js';
import {createDirector} from './director.js';

/** One timestamp-to-scene path for preview, seeking, offline export and artifact checks. */
export function createStageFrames(performance){
 const base=createProjection(performance.patch,{performance}),direct=createDirector(performance);
 const bindings=stageBindings({camera:true,performers:true,performance});
 if(performance.loom)bindings.push(...LOOM_BINDINGS);
 const project=(frame,camera)=>{
  const result=base(frame);
  if(performance.loom)result.stage.loom=loomSceneFrame(loomPerformanceFrame(performance.loom,frame.t),performance.loom.settings).stage.loom;
  result.stage.camera=direct(frame.t,camera.mode??'manual',camera);
  return result;
 };
 return {bindings,project,sample:(time,camera)=>project(collectState(time,performance.snapshots),camera)};
}
