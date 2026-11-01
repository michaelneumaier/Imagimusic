import {sectionAt} from '../score/conversation.js';
import {tensionerPerformanceFrame} from '../tensioner/performance.js';
import {tensionerSceneFrame,TENSIONER_BINDINGS} from '../tensioner/scene.js';
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
 if(performance.fm)bindings.push(...TENSIONER_BINDINGS);
 const project=(frame,camera)=>{
  const result=base(frame);
  if(performance.score)result.global={...result.global,score:sectionAt(performance.score,frame.t)};
  if(performance.loom)result.stage.loom=loomSceneFrame(loomPerformanceFrame(performance.loom,frame.t),performance.loom.settings).stage.loom;
  if(performance.fm)result.stage.tensioner=tensionerSceneFrame(tensionerPerformanceFrame(performance.fm,frame.t)).stage.tensioner;
  result.stage.camera=direct(frame.t,camera.mode??'manual',camera);
  return result;
 };
 return {bindings,project,sample:(time,camera)=>project(collectState(time,performance.snapshots),camera)};
}
