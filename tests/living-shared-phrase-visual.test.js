import test from 'node:test';
import assert from 'node:assert/strict';
import {createSharedPhraseVisual} from '../src/living/shared-phrase-visual.js';
import {createTineDesign} from '../src/tine/address.js';
const source={kind:'imagimusic-tine-live',version:1,design:createTineDesign(),sampleRate:48000,events:[{frame:16800,strength:.025},{frame:28800,strength:.1}],fadeStart:120000};
function fixture(options={}){
 const make=()=>({handlers:{},checked:true,open:true,addEventListener(type,fn){this.handlers[type]=fn;},fire(type,event={}){this.handlers[type]?.(event);}});
 const canvas=make(),motion=make(),details=make(),status=make(),frames=[],tasks=new Map();let time=0,next=0,disposed=0,created=0;
 const scene={instanceFrame:frame=>frames.push(frame),setLook(){},dispose(){disposed++;}};
 const view=createSharedPhraseVisual({canvas,motion,details,status,getTime:()=>time,loadScene:async()=>()=>{created++;return scene;},schedule:fn=>{tasks.set(++next,fn);return next;},cancel:id=>tasks.delete(id),isVisible:()=>details.open,...options});
 return {view,canvas,motion,details,status,frames,tasks,get created(){return created;},get disposed(){return disposed;},set time(v){time=v;},tick(stamp){const [id,fn]=tasks.entries().next().value;tasks.delete(id);fn(stamp);}};
}
const flush=async()=>{await Promise.resolve();await Promise.resolve();};
test('lazy scene follows accepted events at the audio clock and applies acknowledged Quiet',async()=>{
 const f=fixture();assert.equal(f.created,0);f.view.begin(source);await flush();assert.equal(f.created,1);
 f.view.update({state:'playing',events:source.events.map((e,index)=>({...e,index,origin:'score'}))});
 f.time=.3;f.tick(0);assert.equal(f.frames.at(-1).touches,0);
 f.time=.6;f.tick(40);assert.equal(f.frames.at(-1).touches,2);
 f.view.update({state:'ending',endingFrame:48000});f.time=1.0125;f.tick(80);assert.ok(f.frames.at(-1).instances[0].endingOpacity<.51);
 f.time=1.025;f.view.update({state:'ended',finished:{record:{fadeStart:48000}}});assert.equal(f.tasks.size,0);assert.equal(f.frames.at(-1).instances[0].endingOpacity,0);
 f.view.dispose();assert.equal(f.disposed,1);
});
test('still picture and closed disclosure stop callbacks, then motion resumes from the current clock',async()=>{
 const f=fixture();f.view.begin(source);await flush();f.view.update({state:'playing'});assert.equal(f.tasks.size,1);
 f.motion.checked=false;f.motion.fire('change');assert.equal(f.tasks.size,0);const count=f.frames.length;
 f.view.update({state:'playing',events:[{...source.events[0],index:0,origin:'score'}]});assert.equal(f.frames.length,count);
 f.motion.checked=true;f.motion.fire('change');assert.equal(f.tasks.size,1);
 f.details.open=false;f.details.fire('toggle');assert.equal(f.tasks.size,0);
 f.time=.5;f.details.open=true;f.details.fire('toggle');assert.equal(f.frames.at(-1).touches,1);assert.equal(f.tasks.size,1);f.view.stop();assert.equal(f.tasks.size,0);f.time=7;f.motion.fire('change');assert.equal(f.frames.at(-1).seconds,.5);
});
test('cancelled scene loading cannot create a stale renderer; graphics errors remain local',async()=>{
 let release,created=0;const gate=new Promise(resolve=>release=resolve);
 const f=fixture({loadScene:()=>gate});f.view.begin(source);f.view.stop();release(()=>{created++;throw Error('stale');});await flush();assert.equal(created,0);
 const bad=fixture({loadScene:async()=>()=>{throw Error('no GPU');}});bad.view.begin(source);await flush();assert.match(bad.status.textContent,/Listening and keeping still work/);assert.equal(bad.tasks.size,0);
});
test('context loss releases the picture and restoration rebuilds the current accepted response',async()=>{
 const f=fixture();f.view.begin(source);await flush();f.view.update({state:'playing',events:[{...source.events[0],index:0,origin:'score'}]});
 let prevented=false;f.canvas.fire('webglcontextlost',{preventDefault:()=>prevented=true});assert.equal(prevented,true);assert.equal(f.disposed,1);assert.equal(f.tasks.size,0);
 f.time=.5;f.canvas.fire('webglcontextrestored');await flush();assert.equal(f.created,2);assert.equal(f.frames.at(-1).touches,1);f.view.dispose();
});
