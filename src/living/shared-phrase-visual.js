import {createLivingSharedPhraseView} from './shared-phrase-view.js';

/** Graphics are optional; nothing here starts, stops or changes audio. */
export function createSharedPhraseVisual({canvas,motion,details,status,getTime,
 loadScene=async()=> (await import('./scene.js')).createLivingScene,
 schedule=requestAnimationFrame,cancel=cancelAnimationFrame,isVisible=()=>!document.hidden&&details.open,
}){
 let model=null,scene=null,active=false,raf=null,last=-Infinity,epoch=0,loading=false,heldTime=0;
 function stopFrames(){if(raf!==null)cancel(raf);raf=null;}
 function fail(error){stopFrames();try{scene?.dispose();}catch{}scene=null;status.textContent='The body view is unavailable. Listening and keeping still work.';}
 function draw(){if(scene&&model){heldTime=Math.max(0,Math.min(8,active?getTime():heldTime));scene.instanceFrame(model.at(heldTime),true);}}
 function tick(stamp){raf=null;if(!active||!motion.checked||!isVisible()||!scene)return;try{if(stamp-last>=1000/30){draw();last=stamp;}raf=schedule(tick);}catch(error){fail(error);}}
 function refresh(){stopFrames();if(!scene||!isVisible())return;try{draw();if(active&&motion.checked)raf=schedule(tick);}catch(error){fail(error);}}
 async function ensureScene(){
  if(scene||!model||loading||!isVisible())return;
  loading=true;const own=epoch;
  try{const createScene=await loadScene();if(own!==epoch)return;scene=createScene(canvas,{ensemble:model.layout});scene.setLook('dusk');status.textContent='One shared body · accepted touches · magnified response bound, not slow-motion vibration.';refresh();}
  catch(error){if(own===epoch)fail(error);}finally{if(own===epoch)loading=false;}
 }
 function begin(source){
  epoch++;loading=false;stopFrames();active=false;last=-Infinity;heldTime=0;
  try{model=createLivingSharedPhraseView(source);if(scene)scene.instanceFrame(model.at(0),true);ensureScene();}
  catch(error){model=null;fail(error);}
 }
 function update(event){
  if(!model)return;
  try{
   if(event.events)model.accept(event.events);
   if(event.endingFrame!==undefined)model.end(event.endingFrame);
   active=['playing','ringing','ending'].includes(event.state);
   if(event.finished){model.end(event.finished.record.fadeStart);heldTime=(event.finished.record.fadeStart+Math.round(.025*model.source.sampleRate))/model.source.sampleRate;active=false;refresh();}
   else if(active){if(scene&&motion.checked&&raf===null&&isVisible())raf=schedule(tick);}
   else stopFrames();
  }catch(error){fail(error);}
 }
 function stop(){if(active)heldTime=Math.max(0,Math.min(8,getTime()));epoch++;loading=false;active=false;stopFrames();}
 motion.addEventListener('change',refresh);
 details.addEventListener('toggle',()=>{if(isVisible()){ensureScene();refresh();}else stopFrames();});
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();epoch++;loading=false;fail();});
 canvas.addEventListener('webglcontextrestored',()=>ensureScene());
 return {begin,update,stop,dispose(){stop();scene?.dispose();scene=null;model=null;}};
}
