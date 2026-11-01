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
  const materials=(Array.isArray(o.material)?o.material:[o.material]).filter(Boolean).map(m=>({color:m.color?.toArray(),emissive:m.emissive?.toArray(),intensity:m.emissiveIntensity,opacity:m.opacity}));
  nodes.push({position:o.position.toArray(),quaternion:o.quaternion.toArray(),scale:o.scale.toArray(),visible:o.visible,materials});
 });
 return traceHash({nodes,camera:world.camera.position.toArray(),rotation:world.camera.quaternion.toArray(),target:world.controls.target.toArray(),beam:Array.from(world.tine.beam.geometry.attributes.position.array)});
}
$('run').onclick=async()=>{
 $('run').disabled=true;let context,liveWorld,offlineWorld;
 try{
  context=new AudioContext();await context.resume();
  const passage=createPerformance(DEFAULT_PATCH,context.sampleRate),frames=createStageFrames(passage);
  const camera={mode:'follow',position:[9,6.5,12],target:[0,1,0]},captured=[];
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
  const boundaries=[0,passage.duration,...passage.events.flatMap(e=>[Math.max(0,e.voice.noteOn-.001),e.voice.noteOn,e.voice.noteOn+.001,e.voice.end])].sort((a,b)=>a-b);
  for(const t of boundaries){const frame=frames.sample(t,camera);applyStage(frame,frames.bindings,liveWorld);captured.push({t,state:traceHash(frame),pose:poseHash(liveWorld)});}
  offlineWorld=createWorld($('offline'),{width:480,height:270});
  const replay=createStageFrames(createPerformance(structuredClone(DEFAULT_PATCH),context.sampleRate));
  for(const row of [...captured].reverse()){
   const frame=replay.sample(row.t,camera);applyStage(frame,replay.bindings,offlineWorld);
   if(traceHash(frame)!==row.state||poseHash(offlineWorld)!==row.pose)throw new Error(`Scene mismatch at ${row.t}s`);
  }
  offlineWorld.render();
  $('result').textContent=JSON.stringify({passed:true,sampleRate:context.sampleRate,liveFrames:captured.length-boundaries.length,boundaryFrames:boundaries.length,framesCompared:captured.length,reverseReplay:true,scene:'transforms, visibility, material values, tine deformation, camera',audio:'clock only; no sound generated'},null,2);
 }catch(error){$('result').textContent='FAIL: '+error.message;}
 finally{await context?.close();liveWorld?.dispose();offlineWorld?.dispose();$('run').disabled=false;}
};
