import {createContinuousEnsembleReplayView} from './continuous-ensemble-replay-view.js';

/** Optional picture of the worker-admitted saved capture, driven by media time.
 * Never changes audio, playback state or the live instrument's scene. */
export function createContinuousEnsembleReplayVisual({audio,canvas,motion,disclosures,status,getPrepared,
 loadScene=async()=>(await import('./scene.js')).createLivingScene,
 schedule=requestAnimationFrame,cancel=cancelAnimationFrame,visibilityTarget=document,
 isVisible=()=>!document.hidden&&disclosures.every(details=>details.open),
}){
 let model=null,identity=null,scene=null,raf=null,epoch=0,loading=false,disposed=false,last=-Infinity;
 canvas.hidden=true;const listeners=[];
 const on=(target,type,fn)=>{target.addEventListener(type,fn);listeners.push(()=>target.removeEventListener(type,fn));};
 const source=()=>audio.src||audio.currentSrc;
 function stopFrames(){if(raf!==null)cancel(raf);raf=null;}
 function releaseScene(){stopFrames();try{scene?.dispose();}catch{}scene=null;}
 function clear(){canvas.hidden=true;epoch++;loading=false;releaseScene();model=null;identity=null;last=-Infinity;status.textContent='Choose Listen to show the saved instruments. Preparing stays silent.';}
 function fail(){canvas.hidden=true;epoch++;loading=false;releaseScene();status.textContent='The saved body view is unavailable. Replay and downloads still work.';}
 function draw(){if(scene&&model)scene.instanceFrame(model.at(Math.max(0,Math.min(model.duration,Number.isFinite(audio.currentTime)?audio.currentTime:0))),true);}
 function tick(stamp){
  raf=null;if(disposed||!scene||!isVisible()||!motion.checked||audio.paused||audio.ended)return;
  try{if(stamp-last>=1000/30){draw();last=stamp;}if(audio.currentTime<model.duration)raf=schedule(tick);}catch{fail();}
 }
 function refresh(force=false){
  stopFrames();if(disposed||!scene||!isVisible())return;
  try{if(force||motion.checked)draw();if(motion.checked&&!audio.paused&&!audio.ended&&audio.currentTime<model.duration)raf=schedule(tick);}catch{fail();}
 }
 async function ensureScene(){
  if(disposed||scene||loading||!model||!isVisible())return;
  loading=true;const own=epoch;
  try{
   const createScene=await loadScene();if(disposed||own!==epoch||!isVisible())return;
   canvas.hidden=false;scene=createScene(canvas,{ensemble:model.layout,responseMagnification:model.magnification});scene.setLook('dusk');
   status.textContent='Saved bodies · '+model.layout.instances.map(body=>`${body.bodyMm} × ${body.bodyWidthMm} mm`).join(' / ')+' · response bounds magnified 1,000×.';refresh(true);
  }catch{if(!disposed&&own===epoch)fail();}finally{if(own===epoch)loading=false;}
 }
 function play(){
  if(disposed)return;
  try{
   const prepared=getPrepared();if(!prepared||prepared.identity!==source())throw Error('Saved picture does not match the playing source.');
   if(identity!==prepared.identity){clear();model=createContinuousEnsembleReplayView(prepared.record);identity=prepared.identity;}
   last=-Infinity;ensureScene();refresh();
  }catch{clear();fail();}
 }
 on(audio,'play',play);
 for(const event of ['pause','ended','seeked'])on(audio,event,()=>{last=-Infinity;refresh(true);});
 on(audio,'timeupdate',()=>{if(audio.paused||audio.ended)refresh(true);});
 on(audio,'emptied',()=>{if(identity!==source())clear();else refresh(true);});
 on(audio,'error',clear);
 on(motion,'change',()=>{ensureScene();refresh(true);});
 for(const details of disclosures)on(details,'toggle',()=>{ensureScene();refresh(true);});
 on(visibilityTarget,'visibilitychange',()=>{ensureScene();refresh(true);});
 on(canvas,'webglcontextlost',event=>{event.preventDefault();fail();});
 on(canvas,'webglcontextrestored',()=>ensureScene());
 return {clear,dispose(){disposed=true;clear();listeners.forEach(remove=>remove());}};
}
