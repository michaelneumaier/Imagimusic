import {composeConversation,beatSeconds} from '../src/score/conversation.js';
import {createScorePerformance,readScoreSearch} from '../src/stage/score-performance.js';
import {attachComposition} from '../src/stage/composition.js';
import {readCompositionSearch} from '../src/stage/composition-link.js';
import {DEFAULT_PATCH} from '../src/model.js';
import {createPerformance} from '../src/stage/performance.js';
import {createStageFrames} from '../src/stage/frame.js';
import {applyStage} from '../src/stage/projection.js';
import {createWorld} from '../src/stage/world.js';
import {traceHash} from '../src/state.js';
import {WallClock} from '../src/clock.js';
const $=id=>document.getElementById(id);
function poseHash(world){
 const nodes=[];
 world.scene.traverse(o=>{
  const materials=(Array.isArray(o.material)?o.material:[o.material]).filter(Boolean).map(m=>({color:m.color?.toArray(),emissive:m.emissive?.toArray(),intensity:m.emissiveIntensity,opacity:m.opacity,roughness:m.roughness,metalness:m.metalness,clearcoat:m.clearcoat,clearcoatRoughness:m.clearcoatRoughness}));
  nodes.push({position:o.position.toArray(),quaternion:o.quaternion.toArray(),scale:o.scale.toArray(),visible:o.visible,materials});
 });
 return traceHash({nodes,camera:world.camera.position.toArray(),rotation:world.camera.quaternion.toArray(),target:world.controls.target.toArray(),beam:Array.from(world.tine.beam.geometry.attributes.position.array)});
}
$('run').onclick=async()=>{
 $('run').disabled=true;let context,liveWorld,offlineWorld;
 try{
  context=new AudioContext();await context.resume();
  const composition=readCompositionSearch(location.search);
  const score=readScoreSearch(location.search)??(new URLSearchParams(location.search).get('conversation')==='1'?composeConversation():null);
  const build=()=>score?createScorePerformance(structuredClone(DEFAULT_PATCH),structuredClone(score),structuredClone(composition),context.sampleRate):attachComposition(createPerformance(structuredClone(DEFAULT_PATCH),context.sampleRate),structuredClone(composition));
  const passage=build(),frames=createStageFrames(passage);
  const mode=new URLSearchParams(location.search).get('camera')??'follow';
  if(!['follow','cinematic','establish','detail'].includes(mode))throw new Error('Unknown test camera mode');
  const camera={mode,position:[9,6.5,12],target:[0,1,0]},captured=[];
  liveWorld=createWorld($('live'),{width:480,height:270});
  const origin=context.currentTime,clock=new WallClock(()=>context.currentTime-origin);
  await new Promise((resolve,reject)=>{
   function tick(){try{
    const t=clock.time,frame=frames.sample(t,camera);applyStage(frame,frames.bindings,liveWorld);liveWorld.render();
    captured.push({t,state:traceHash(frame),pose:poseHash(liveWorld)});$('result').textContent=`Capturing live-clock frame ${captured.length} at ${t.toFixed(3)} s`;
    if(t>=2)resolve();else requestAnimationFrame(tick);
   }catch(error){reject(error);}}
   requestAnimationFrame(tick);
  });
  if(captured.length<5)throw new Error('Insufficient live frames; rerun with this tab visible');
  // Probe discrete transitions across the complete passage without waiting for wall time.
  const boundaries=[0,passage.duration,...(score?score.sections.flatMap(section=>section.beats.flatMap(beat=>{const t=beatSeconds(score,beat);return [t-.001,t,t+.001];})):[]),...(passage.fm?[passage.fm.time-.001,passage.fm.time,passage.fm.time+.001,passage.fm.time+.125,passage.fm.time+3,passage.fm.duration-.026,passage.fm.duration-.001,passage.fm.duration,passage.fm.duration+.001]:[]),...passage.events.flatMap(e=>[Math.max(0,e.voice.noteOn-.001),e.voice.noteOn,e.voice.noteOn+.001,e.voice.end]),...(passage.loom?.events??[]).flatMap(e=>[e.time-.18,e.time-.001,e.time,e.time+.001,e.time+.28,e.end])].sort((a,b)=>a-b);
  for(const t of boundaries){const frame=frames.sample(t,camera);applyStage(frame,frames.bindings,liveWorld);captured.push({t,state:traceHash(frame),pose:poseHash(liveWorld)});}
  offlineWorld=createWorld($('offline'),{width:480,height:270});
  const replay=createStageFrames(build());
  for(const row of [...captured].reverse()){
   const frame=replay.sample(row.t,camera);applyStage(frame,replay.bindings,offlineWorld);
   if(traceHash(frame)!==row.state||poseHash(offlineWorld)!==row.pose)throw new Error(`Scene mismatch at ${row.t}s`);
  }
  offlineWorld.render();
  $('result').textContent=JSON.stringify({passed:true,cameraMode:mode,sampleRate:context.sampleRate,liveFrames:captured.length-boundaries.length,boundaryFrames:boundaries.length,framesCompared:captured.length,reverseReplay:true,scene:'transforms, visibility, material values, tine deformation, camera (not rendered pixels)',audio:'clock only; no sound generated',composition,score},null,2);
 }catch(error){$('result').textContent='FAIL: '+error.message;}
 finally{await context?.close();liveWorld?.dispose();offlineWorld?.dispose();$('run').disabled=false;}
};
