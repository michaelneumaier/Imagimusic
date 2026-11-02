import {composeGrove,groveSystem} from '../src/score/grove.js';
import {createInverseJobs} from '../src/inverse/jobs.js';
import {createInverseTransport} from '../src/inverse/transport.js';
import {createInverseSpatialView} from '../src/inverse/spatial-view.js';
import {createGroveWorld} from '../src/grove/world.js';
const $=id=>document.getElementById(id),jobs=createInverseJobs();
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let context=null,transport=null,world=null,view=null,armed=false,generation=0,raf=0,readTimer=0;
let frames=0,resizes=0,manual=0,lastFrame=null,lastRender=null,maxLevel=0,minActiveLevel=Infinity,maxActiveLevel=0,activeFrames=0,changes=0,previousLevel=null;
function snapshot(){return transport?.snapshot()??{time:0,active:0,strikes:[]};}
function show(){
 const now=snapshot();$('strike').disabled=!armed||context?.state!=='running';
 $('metrics').textContent=JSON.stringify({userAgent:navigator.userAgent,viewport:{width:innerWidth,height:innerHeight,pixelRatio:devicePixelRatio},visibility:document.visibilityState,focused:document.hasFocus(),context:context?.state??'none',audioTime:now.time,active:now.active,animationFrames:frames,resizeRenders:resizes,manualRenders:manual,activeAnimationFrames:activeFrames,activeLevelChanges:changes,minActiveLevel:Number.isFinite(minActiveLevel)?minActiveLevel:null,maxActiveLevel,maxLevel,lastAnimationFrame:lastFrame,lastRender},null,2);
}
function draw(kind){
 if(!view)return;
 const s=snapshot();view.update(s,{reducedMotion:reduced.matches});
 const levels=view.scene.bodies.map(body=>(body.halo.material.opacity-.15)/.65);
 maxLevel=Math.max(maxLevel,...levels);
 lastRender={kind,audioTime:s.time,active:s.active,levels};
 if(kind==='animation'){
  frames++;lastFrame={audioTime:s.time,active:s.active,levels,width:$('canvas').width,height:$('canvas').height};
  if(s.active){activeFrames++;minActiveLevel=Math.min(minActiveLevel,levels[0]);maxActiveLevel=Math.max(maxActiveLevel,levels[0]);if(previousLevel!==null&&Math.abs(previousLevel-levels[0])>1e-9)changes++;previousLevel=levels[0];}
 }
 else if(kind==='resize')resizes++;else manual++;
}
function tick(){try{draw('animation');}catch(error){$('status').textContent='Animation error: '+error.message;}raf=requestAnimationFrame(tick);}
const resize=new ResizeObserver(()=>{try{draw('resize');}catch(error){$('status').textContent='Resize error: '+error.message;}});
$('prepare').onclick=async()=>{
 const token=++generation;$('prepare').disabled=true;$('status').textContent='Searching and preparing silently…';
 try{
  context??=new AudioContext();transport??=createInverseTransport(context);
  const source=composeGrove({seed:3});source.bodies.forEach(b=>b.mass=.02);const system=groveSystem(source);
  const target={version:1,kind:'three-resonance',normalFrequenciesHz:system.normalFreqsHz.map(f=>+f.toFixed(6)),decaySeconds:+system.decayS.toFixed(8),provenance:'Rounded equal-mass seed 3 workshop target'};
  const report=await jobs.run({kind:'search',target,options:{baseMidi:48,seed:19,budget:{restarts:6,iterations:300,maxEvaluations:60000}}});
  if(token!==generation)return;
  const prepared=await jobs.run({kind:'candidate',grove:report.candidates[0].grove,sampleRate:context.sampleRate});
  if(token!==generation)return;
  world??=createGroveWorld($('canvas'));world.controls.enabled=false;view??=createInverseSpatialView({world});
  view.mount(prepared,transport);view.select('body:0');resize.observe($('canvas'));armed=false;
  $('listen').disabled=false;$('render').disabled=false;$('status').textContent='Prepared silently. Choose Start listening, then Strike body 1.';show();
 }catch(error){if(token===generation){$('status').textContent=error.message;$('prepare').disabled=false;}}
};
$('listen').onclick=async()=>{const token=generation;try{await context.resume();if(token!==generation)return;armed=context.state==='running';$('status').textContent=armed?'Listening enabled. Nothing has been struck.':'Context still suspended.';}catch(error){if(token!==generation)return;$('status').textContent=error.message;}show();};
$('strike').onclick=()=>{if(!armed||context?.state!=='running')return;activeFrames=0;changes=0;previousLevel=null;minActiveLevel=Infinity;maxActiveLevel=0;maxLevel=0;const admitted=transport.strike(0);$('status').textContent=admitted?'Body 1 admitted. Read clocks to inspect animation samples.':'Strike refused by overlap limit.';show();};
$('quiet').onclick=()=>{transport?.quiet();draw('manual');$('status').textContent='Quiet.';show();};
$('read').onclick=show;
$('render').onclick=()=>{draw('manual');show();};
addEventListener('pagehide',()=>{generation++;jobs.cancel();transport?.quiet();armed=false;context?.suspend();cancelAnimationFrame(raf);clearInterval(readTimer);});
function start(){cancelAnimationFrame(raf);clearInterval(readTimer);tick();show();readTimer=setInterval(show,500);}
addEventListener('pageshow',start);
start();
