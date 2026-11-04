import {createMemoryEnsemblePerformance} from '../src/living/memory-ensemble-study.js';
import test from 'node:test';
import {createContinuousEnsembleVisual} from '../src/living/continuous-ensemble-visual.js';
import {createContinuousEnsemblePerformance} from '../src/living/continuous-ensemble-study.js';
import {createMemoryReturnPerformance} from '../src/living/memory-return-study.js';
import assert from 'node:assert/strict';
import {createContinuousReturnVisual} from '../src/living/continuous-return-visual.js';
import {createContinuousReturnStudy} from '../src/living/continuous-return-study.js';
const plan=createContinuousReturnStudy(42),source={events:plan.events.slice(0,2)};
function fixture({createBinding=createContinuousReturnVisual,...options}={}){
 const make=()=>({handlers:{},checked:true,open:true,addEventListener(type,fn){this.handlers[type]=fn;},fire(type,event={}){this.handlers[type]?.(event);}});
 const canvas=make(),motion=make(),details=make(),status=make(),frames=[],tasks=new Map();let time=0,next=0,disposed=0,created=0;
 const scene={instanceFrame:frame=>frames.push(frame),setLook(){},dispose(){disposed++;}};
 const view=createBinding({canvas,motion,details,status,getTime:()=>time,loadScene:async()=>(canvas,options)=>{assert.equal(options.responseMagnification,1000);created++;return scene;},schedule:fn=>{tasks.set(++next,fn);return next;},cancel:id=>tasks.delete(id),isVisible:()=>details.open,...options});
 return {view,canvas,motion,details,status,frames,tasks,get created(){return created;},get disposed(){return disposed;},set time(v){time=v;},tick(stamp){const [id,fn]=tasks.entries().next().value;tasks.delete(id);fn(stamp);}};
}
const flush=async()=>{await Promise.resolve();await Promise.resolve();};
test('natural ending stops drawing even while background keeping is pending',async()=>{
 const f=fixture();f.view.begin(42);await flush();f.view.update({state:'verifying',events:plan.events.map((e,index)=>({...e,index,origin:'score'}))});
 f.time=48;f.tick(0);assert.equal(f.tasks.size,0);assert.equal(f.frames.at(-1).instances[0].endingOpacity,0);assert.equal(f.frames.at(-1).touches,25);
 f.view.dispose();
});
test('lazy scene follows accepted events at the audio clock and applies acknowledged Quiet',async()=>{
 const f=fixture();assert.equal(f.created,0);f.view.begin(42);await flush();assert.equal(f.created,1);
 f.view.update({state:'playing',events:source.events.map((e,index)=>({...e,index,origin:'score'}))});
 f.time=.49;f.tick(0);assert.equal(f.frames.at(-1).touches,0);
 f.time=source.events[1].frame/48000;f.tick(40);assert.equal(f.frames.at(-1).touches,2);
 f.view.update({state:'ending',endingFrame:48000});f.time=1.0125;f.tick(80);assert.ok(f.frames.at(-1).instances[0].endingOpacity<.51);
 f.time=1.025;f.view.update({state:'ended',finished:{record:{fadeStart:48000}}});assert.equal(f.tasks.size,0);assert.equal(f.frames.at(-1).instances[0].endingOpacity,0);
 f.view.dispose();assert.equal(f.disposed,1);
});
test('still picture and closed disclosure stop callbacks, then motion resumes from the current clock',async()=>{
 const f=fixture();f.view.begin(42);await flush();f.view.update({state:'playing'});assert.equal(f.tasks.size,1);
 f.motion.checked=false;f.motion.fire('change');assert.equal(f.tasks.size,0);const count=f.frames.length;
 f.view.update({state:'playing',events:[{...source.events[0],index:0,origin:'score'}]});assert.equal(f.frames.length,count);
 f.motion.checked=true;f.motion.fire('change');assert.equal(f.tasks.size,1);
 f.details.open=false;f.details.fire('toggle');assert.equal(f.tasks.size,0);
 f.time=.6;f.details.open=true;f.details.fire('toggle');assert.equal(f.frames.at(-1).touches,1);assert.equal(f.tasks.size,1);f.view.stop();assert.equal(f.tasks.size,0);f.time=7;f.motion.fire('change');assert.equal(f.frames.at(-1).seconds,.6);
});
test('cancelled scene loading cannot create a stale renderer; graphics errors remain local',async()=>{
 let release,created=0;const gate=new Promise(resolve=>release=resolve);
 const f=fixture({loadScene:()=>gate});f.view.begin(42);f.view.stop();release(()=>{created++;throw Error('stale');});await flush();assert.equal(created,0);
 const bad=fixture({loadScene:async()=>()=>{throw Error('no GPU');}});bad.view.begin(42);await flush();assert.match(bad.status.textContent,/Listening and keeping still work/);assert.equal(bad.tasks.size,0);
});
test('context loss releases the picture and restoration rebuilds the current accepted response',async()=>{
 const f=fixture();f.view.begin(42);await flush();f.view.update({state:'playing',events:[{...source.events[0],index:0,origin:'score'}]});
 let prevented=false;f.canvas.fire('webglcontextlost',{preventDefault:()=>prevented=true});assert.equal(prevented,true);assert.equal(f.disposed,1);assert.equal(f.tasks.size,0);
 f.time=.6;f.canvas.fire('webglcontextrestored');await flush();assert.equal(f.created,2);assert.equal(f.frames.at(-1).touches,1);f.view.dispose();
});

test('explicit remembered mode displays both answers through completion',async()=>{
 const f=fixture(),p=createMemoryReturnPerformance();f.view.begin(42,{mode:'memory'});await flush();p.start();
 f.view.update({state:'playing',events:p.tryGuest(.05).events});
 while(p.state!=='ended')f.view.update({state:'playing',events:p.process(new Float32Array(4096))});
 f.view.update({state:'ended',finished:{record:p.record()}});
 assert.equal(f.disposed,0);assert.equal(f.frames.at(-1).touches,p.snapshot().events.length);assert.equal(f.frames.at(-1).instances[0].endingOpacity,0);assert.equal(f.tasks.size,0);f.view.dispose();
});

test('ensemble binding follows three bodies, holds still and completes their common ending',async()=>{
 const f=fixture({createBinding:createContinuousEnsembleVisual}),p=createContinuousEnsemblePerformance();f.view.begin(42);await flush();p.start();
 while(p.frame<7*48000)f.view.update({state:'playing',events:p.process(new Float32Array(Math.min(4096,7*48000-p.frame)))});
 f.time=7;f.tick(0);assert.equal(f.frames.at(-1).instances.length,3);assert.ok(f.frames.at(-1).instances[0].points);assert.ok(f.frames.at(-1).instances[1].points);assert.equal(f.frames.at(-1).instances[2].points,null);
 f.motion.checked=false;f.motion.fire('change');assert.equal(f.tasks.size,0);const held=f.frames.length;
 while(p.state!=='ended')f.view.update({state:'playing',events:p.process(new Float32Array(4096))});assert.equal(f.frames.length,held);
 f.view.update({state:'ended',finished:{records:p.records()}});assert.equal(f.disposed,0);assert.equal(f.frames.at(-1).touches,25);assert.ok(f.frames.at(-1).instances.every(body=>body.endingOpacity===0));assert.equal(f.tasks.size,0);f.view.dispose();
});
test('mismatched ensemble completion removes only its picture',async()=>{
 const f=fixture({createBinding:createContinuousEnsembleVisual}),p=createContinuousEnsemblePerformance();f.view.begin(42);await flush();p.start();p.quiet();p.process(new Float32Array(1200));
 const records=structuredClone(p.records());records[1].fadeStart=1;f.view.update({state:'ended',finished:{records}});
 assert.equal(f.disposed,1);assert.equal(f.tasks.size,0);assert.match(f.status.textContent,/Listening and keeping still work/);
});


test('ensemble binding displays remembered answers on their actual bodies through completion',async()=>{
 const f=fixture({createBinding:createContinuousEnsembleVisual}),p=createMemoryEnsemblePerformance();f.view.begin(42,{mode:'memory'});await flush();p.start();
 f.view.update({state:'playing',events:p.tryGuest(2,.05).events});
 while(p.frame<888128)f.view.update({state:'playing',events:p.process(new Float32Array(Math.min(4096,888128-p.frame)))});
 f.time=18.5;f.tick(0);assert.equal(f.frames.at(-1).instances[0].touchMarker.frame,888000);assert.equal(f.frames.at(-1).instances[2].touchMarker,null);
 while(p.state!=='ended')f.view.update({state:'playing',events:p.process(new Float32Array(4096))});
 f.view.update({state:'ended',finished:{records:p.records()}});assert.equal(f.disposed,0);assert.equal(f.frames.at(-1).touches,p.records().reduce((n,r)=>n+r.events.length,0));assert.ok(f.frames.at(-1).instances.every(body=>body.endingOpacity===0));assert.equal(f.tasks.size,0);f.view.dispose();
});
