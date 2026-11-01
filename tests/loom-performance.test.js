import test from 'node:test';
import {superposeStrikes} from '../src/coupling.js';
import assert from 'node:assert/strict';
import {createLoomPerformance,loomPerformanceFrame,renderLoomPerformance} from '../src/loom/performance.js';

test('scored Loom audio and arbitrary-time displacement share coherent overlapping impulses',()=>{
 const passage=createLoomPerformance({loss:2},[{time:.12345,body:0,velocity:.8},{time:.31,body:1,velocity:.6},{time:.47,body:0,velocity:.9}]);
 const a=renderLoomPerformance(passage,8000),b=renderLoomPerformance(passage,8000);
 assert.deepEqual(a,b);
 for(const sample of [0,987,2481,3761,9000,25000]){
  const frame=loomPerformanceFrame(passage,sample/8000);
  frame.displacement.forEach((x,body)=>{
   assert.ok(Math.abs(a.channels[body][sample]-passage.audioGain*x)<2e-8);
   assert.ok(Math.abs(x)<=frame.envelope[body]+1e-10);
  });
 }
 const end=loomPerformanceFrame(passage,passage.duration);
 assert.deepEqual(end.displacement,[0,0]);assert.deepEqual(end.envelope,[0,0]);
 assert.deepEqual(loomPerformanceFrame(passage,.7),loomPerformanceFrame(passage,.7));
 assert.ok(a.channels.every(c=>c.every(v=>Number.isFinite(v)&&Math.abs(v)<=.45)));
});

test('simultaneous strikes add coherently and uncoupled bodies remain independent',()=>{
 const single=createLoomPerformance({coupling:0},[{time:.35,body:0,velocity:.5}]);
 const doubled=createLoomPerformance({coupling:0},[{time:.35,body:0,velocity:.5},{time:.35,body:0,velocity:.5}]);
 const a=loomPerformanceFrame(single,.8),b=loomPerformanceFrame(doubled,.8);
 assert.equal(a.envelope[1],0);assert.equal(b.displacement[1],0);
 assert.ok(Math.abs(b.envelope[0]-2*a.envelope[0])<1e-12);
 assert.ok(Math.abs(b.displacement[0]-2*a.displacement[0])<1e-12);
 assert.equal(loomPerformanceFrame(single,.2).strikes[0].age,-.14999999999999997);
 assert.throws(()=>createLoomPerformance({},[]));
 assert.throws(()=>createLoomPerformance({},[{time:0,body:2,velocity:1}]));
});

test('both strike directions use one physical pickup scale under detuning',()=>{
 const p=createLoomPerformance({detune:100},[{time:0,body:0,velocity:.7},{time:.2,body:1,velocity:.7}]);
 const t=.8,frame=loomPerformanceFrame(p,t);
 const physical=superposeStrikes(p.studies[0].system,p.events.map(e=>({t:e.time,impulse:e.body===0?[.01*e.velocity,0]:[0,.01*e.velocity]})));
 const expected=physical.x(t).map(x=>x*p.pickupScale);
 frame.displacement.forEach((x,b)=>assert.ok(Math.abs(x-expected[b])<1e-12));
});
