import test from 'node:test';
import assert from 'node:assert/strict';
import {createContinuousEnsembleReplayVisual} from '../src/living/continuous-ensemble-replay-visual.js';
import {validateContinuousEnsembleRecord} from '../src/living/continuous-ensemble-record.js';
import {createTineDesign} from '../src/tine/address.js';
function element(){const listeners=new Map();return {checked:true,open:true,addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);},removeEventListener(type,fn){listeners.get(type)?.delete(fn);},fire(type,event={}){for(const fn of listeners.get(type)??[])fn(event);}};}
const flush=async()=>{await Promise.resolve();await Promise.resolve();};
function fixture(options={}){
 const audio={...element(),src:'blob:one',paused:true,ended:false,currentTime:0},canvas=element(),motion=element(),cues={...element(),checked:false},outer=element(),inner=element(),visibility=element(),status={},tasks=new Map(),frames=[],layouts=[];let counter=0,disposed=0,hidden=false;
 let prepared={identity:'blob:one',record:validateContinuousEnsembleRecord({kind:'imagimusic-continuous-ensemble-record',version:1,mixGain:1/3,records:[85,120,60].map((lengthMm,i)=>({kind:'imagimusic-continuous-tine-record',version:1,design:createTineDesign({lengthMm,widthMm:[5,13,20][i]}),sampleRate:48000,events:[{frame:24000,strength:.01,origin:'guest'}],fadeStart:96000}))})};
 const makeScene=(canvas,options)=>{layouts.push(options.ensemble);return {instanceFrame:frame=>frames.push(frame),setLook(){},dispose(){disposed++;}};};
 const view=createContinuousEnsembleReplayVisual({audio,canvas,motion,cues,disclosures:[outer,inner],status,getPrepared:()=>prepared,visibilityTarget:visibility,isVisible:()=>!hidden&&outer.open&&inner.open,loadScene:async()=>makeScene,schedule:fn=>{tasks.set(++counter,fn);return counter;},cancel:id=>tasks.delete(id),...options});
 return {audio,canvas,motion,cues,outer,inner,status,view,frames,tasks,layouts,makeScene,get disposed(){return disposed;},get prepared(){return prepared;},set prepared(value){prepared=value;},set hidden(value){hidden=value;visibility.fire('visibilitychange');},play(){audio.paused=false;audio.ended=false;audio.fire('play');},tick(stamp){const [id,fn]=tasks.entries().next().value;tasks.delete(id);fn(stamp);}};
}
test('explicit saved playback creates actual bodies, follows media time and seeks backwards without replaying audio',async()=>{
 const f=fixture();assert.equal(f.layouts.length,0);assert.equal(f.canvas.hidden,true);f.play();await flush();assert.deepEqual(f.layouts[0].instances.map(x=>[x.bodyMm,x.bodyWidthMm]),[[85,5],[120,13],[60,20]]);
 f.audio.currentTime=.5;f.tick(0);assert.equal(f.frames.at(-1).touches,3);assert.ok(f.frames.at(-1).instances.every(x=>x.touchMarker));
 f.audio.paused=true;f.audio.fire('pause');assert.equal(f.tasks.size,0);f.audio.currentTime=.1;f.audio.fire('seeked');assert.equal(f.frames.at(-1).touches,0);
 f.play();await flush();assert.equal(f.layouts.length,1);f.audio.currentTime=2.025;f.audio.ended=true;f.audio.fire('ended');assert.equal(f.tasks.size,0);assert.ok(f.frames.at(-1).instances.every(x=>x.endingOpacity===0));f.view.dispose();
});
test('held picture, both disclosures and visibility bound animation without changing playback',async()=>{
 const f=fixture();f.play();await flush();f.motion.checked=false;f.motion.fire('change');const held=f.frames.length;assert.equal(f.tasks.size,0);f.audio.currentTime=.5;f.audio.fire('timeupdate');assert.equal(f.frames.length,held);assert.equal(f.audio.paused,false);
 f.motion.checked=true;f.motion.fire('change');assert.equal(f.frames.at(-1).touches,3);assert.equal(f.tasks.size,1);
 for(const d of [f.outer,f.inner]){d.open=false;d.fire('toggle');assert.equal(f.tasks.size,0);d.open=true;d.fire('toggle');assert.equal(f.tasks.size,1);}
 f.hidden=true;assert.equal(f.tasks.size,0);assert.equal(f.audio.paused,false);f.hidden=false;assert.equal(f.tasks.size,1);f.view.dispose();assert.equal(f.tasks.size,0);f.audio.fire('play');await flush();assert.equal(f.layouts.length,1);
});
test('replacement destroys the old scene and mismatched source cannot show a different prepared record',async()=>{
 const f=fixture();f.play();await flush();f.audio.paused=true;f.prepared={...f.prepared,identity:'blob:two'};f.audio.src='';f.audio.fire('emptied');assert.equal(f.disposed,1);assert.equal(f.canvas.hidden,true);assert.equal(f.tasks.size,0);
 f.audio.src='blob:two';f.play();await flush();assert.equal(f.layouts.length,2);
 f.prepared={...f.prepared,identity:'blob:three'};f.play();await flush();assert.equal(f.layouts.length,2);assert.equal(f.tasks.size,0);assert.match(f.status.textContent,/unavailable/);assert.equal(f.audio.paused,false);f.view.dispose();
});
test('stale asynchronous scene loading cannot resurrect a disposed view',async()=>{
 let release;const gate=new Promise(resolve=>release=resolve),f=fixture({loadScene:()=>gate});f.play();f.view.dispose();release(f.makeScene);await flush();assert.equal(f.layouts.length,0);assert.equal(f.tasks.size,0);
});
test('graphics loss and creation failure remain local; restoration uses the current saved media time',async()=>{
 const f=fixture();f.play();await flush();let prevented=false;f.canvas.fire('webglcontextlost',{preventDefault(){prevented=true;}});assert.equal(prevented,true);assert.equal(f.tasks.size,0);assert.equal(f.disposed,1);assert.equal(f.audio.paused,false);
 f.audio.currentTime=.5;f.canvas.fire('webglcontextrestored');await flush();assert.equal(f.layouts.length,2);assert.equal(f.frames.at(-1).touches,3);f.view.dispose();
 const bad=fixture({loadScene:async()=>()=>{throw Error('GPU unavailable');}});bad.play();await flush();assert.match(bad.status.textContent,/Replay and downloads still work/);assert.equal(bad.audio.paused,false);assert.equal(bad.tasks.size,0);bad.view.dispose();
});

test('a newer saved source wins over an earlier pending scene creation',async()=>{
 let release;const gate=new Promise(resolve=>release=resolve),f=fixture({loadScene:()=>gate});f.play();
 f.prepared={identity:'blob:two',record:structuredClone(f.prepared.record)};f.prepared.record.records[0].design=createTineDesign({lengthMm:100,widthMm:20});f.audio.src='blob:two';f.play();release(f.makeScene);await flush();
 assert.equal(f.layouts.length,1);assert.equal(f.layouts[0].instances[0].bodyMm,100);assert.equal(f.layouts[0].instances[0].bodyWidthMm,20);assert.equal(f.canvas.hidden,false);f.view.dispose();
});

test('optional cues anticipate a saved touch without changing sound or defeating held motion',async()=>{
 const f=fixture();f.play();await flush();f.audio.currentTime=.4;f.tick(0);
 assert.deepEqual(f.frames.at(-1).savedTouches,[]);assert.equal(f.frames.at(-1).touches,0);
 f.cues.checked=true;f.cues.fire('change');assert.equal(f.frames.at(-1).savedTouches.length,3);assert.equal(f.frames.at(-1).touches,0);assert.equal(f.audio.currentTime,.4);assert.equal(f.audio.paused,false);
 f.motion.checked=false;f.motion.fire('change');assert.equal(f.tasks.size,0);const held=f.frames.length;
 f.audio.currentTime=.5;f.audio.fire('timeupdate');assert.equal(f.frames.length,held);
 f.cues.checked=false;f.cues.fire('change');assert.deepEqual(f.frames.at(-1).savedTouches,[]);assert.equal(f.tasks.size,0);assert.equal(f.audio.paused,false);f.view.dispose();
});

test('journey adapter follows chapter changes and backward seeking in one scene',async()=>{
 const {createEnsembleJourneyView}=await import('../src/living/ensemble-journey-view.js'),{createEnsembleJourneyStudy}=await import('../src/living/ensemble-journey-study.js');
 const f=fixture({createModels:createEnsembleJourneyView});f.prepared={identity:'blob:one',record:createEnsembleJourneyStudy().chapters.map(c=>c.record)};
 f.cues.checked=true;f.play();await flush();assert.equal(f.frames.at(-1).chapter,0);
 f.audio.currentTime=49.9;f.tick(0);assert.equal(f.frames.at(-1).chapter,1);assert.ok(f.frames.at(-1).savedTouches.length>0);
 f.audio.currentTime=96;f.tick(40);assert.equal(f.frames.at(-1).chapter,2);assert.equal(f.frames.at(-1).touches,0);assert.equal(f.layouts.length,1);
 f.audio.paused=true;f.audio.currentTime=2;f.audio.fire('seeked');assert.equal(f.frames.at(-1).chapter,0);assert.equal(f.frames.at(-1).touches,1);assert.equal(f.tasks.size,0);
 f.audio.currentTime=144;f.audio.ended=true;f.audio.fire('ended');assert.deepEqual(f.frames.at(-1).savedTouches,[]);assert.equal(f.layouts.length,1);f.view.dispose();
});
