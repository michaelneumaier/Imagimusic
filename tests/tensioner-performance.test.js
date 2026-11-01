import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_TENSIONER,renderTensioner,tensionerState} from '../src/fm.js';
import {createTensionerPerformance,tensionerPerformanceFrame} from '../src/tensioner/performance.js';
import {DEFAULT_PATCH} from '../src/model.js';
import {createPerformance} from '../src/stage/performance.js';
import {DEFAULT_COMPOSITION,attachComposition,attachLoomPerformance,validateComposition} from '../src/stage/composition.js';

test('featured FM shares the PCM endpoint and exact model state on the passage clock',()=>{
 for(const sr of [44100,48000]){
  const p=createTensionerPerformance(DEFAULT_TENSIONER,6,sr),pcm=renderTensioner(p.core,sr);
  assert.equal(p.duration,6+pcm.length/sr);assert.equal(p.endS,(pcm.length-1)/sr);
  assert.equal(tensionerPerformanceFrame(p,5).amplitude,0);
  for(const t of [6,6.125,7,10,p.duration])assert.deepEqual(tensionerPerformanceFrame(p,t),tensionerState(t-6,p.core,p.endS));
  assert.equal(tensionerPerformanceFrame(p,p.duration).amplitude,0);assert.ok(pcm.at(-1)===0);
 }
 assert.throws(()=>createTensionerPerformance(DEFAULT_TENSIONER,-1));
 assert.throws(()=>createTensionerPerformance(DEFAULT_TENSIONER,0,0));
});

test('v2 joins FM and Loom without changing v1 or the base score, and keeps long FM tails',()=>{
 const base=createPerformance(DEFAULT_PATCH);
 assert.equal(attachComposition(base),base);
 const old=structuredClone(DEFAULT_COMPOSITION);old.loom.enabled=true;
 assert.equal(JSON.stringify(attachComposition(base,old)),JSON.stringify(attachLoomPerformance(base,old)));
 const c={...old,version:2,fm:{enabled:true,settings:{...DEFAULT_TENSIONER,ampDecayS:8,phase0:.7}}};
 const joined=attachComposition(base,c);
 assert.equal(joined.events,base.events);assert.equal(joined.snapshots,base.snapshots);
 assert.equal(joined.fm.time,.35+8*60/DEFAULT_PATCH.tempo);
 assert.ok(joined.loom);assert.equal(joined.fm.settings.phase0,.7);
 assert.equal(joined.duration,Math.max(base.duration,joined.loom.duration,joined.fm.duration));
 assert.equal(JSON.stringify(attachComposition(base,joined.composition)),JSON.stringify(joined));
 const short={...base,duration:1};c.loom.enabled=false;
 assert.equal(attachComposition(short,c).duration,joined.fm.duration);
 c.fm.enabled=false;assert.equal(attachComposition(base,c),base);
 assert.throws(()=>validateComposition({...old,version:2}));
 assert.throws(()=>validateComposition({...c,fm:{enabled:'yes',settings:DEFAULT_TENSIONER}}));
});
