import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_PATCH} from '../src/model.js';
import {createPerformance} from '../src/stage/performance.js';
import {DEFAULT_COMPOSITION,validateComposition,attachLoomPerformance} from '../src/stage/composition.js';
import {loomPerformanceFrame} from '../src/loom/performance.js';

test('optional Loom preserves the old passage exactly and joins the score tempo when enabled',()=>{
 const base=createPerformance(DEFAULT_PATCH);assert.equal(attachLoomPerformance(base),base);
 const composition=structuredClone(DEFAULT_COMPOSITION);composition.loom.enabled=true;
 const joined=attachLoomPerformance(base,composition);
 assert.equal(joined.events,base.events);assert.equal(joined.snapshots,base.snapshots);
 assert.equal(joined.loom.events.length,8);
 assert.equal(joined.loom.events[0].time,.35+60/DEFAULT_PATCH.tempo);
 assert.equal(joined.loom.events[0].body,DEFAULT_PATCH.seed%2);
 assert.ok(joined.duration>=base.duration&&joined.duration>=joined.loom.duration);
 composition.loom.settings.coupling=0;assert.notEqual(joined.composition.loom.settings.coupling,0);
 const again=attachLoomPerformance(base,joined.composition);
 assert.deepEqual(loomPerformanceFrame(joined.loom,2),loomPerformanceFrame(again.loom,2));
});
test('composition validates the physical settings and extends the tail when needed',()=>{
 assert.throws(()=>validateComposition({version:2}));
 const c=structuredClone(DEFAULT_COMPOSITION);c.loom.enabled=true;c.loom.settings.loss=NaN;assert.throws(()=>validateComposition(c));
 c.loom.settings.loss=.2;const base=createPerformance({...DEFAULT_PATCH,tempo:40,damping:1});
 const joined=attachLoomPerformance(base,c);assert.equal(joined.duration,Math.max(base.duration,joined.loom.duration));
 assert.equal(validateComposition({...DEFAULT_COMPOSITION,extra:1}).extra,undefined);
});

test('Loom joins projected state, scene bindings and camera without changing default frames',async()=>{
 const {createStageFrames}=await import('../src/stage/frame.js');
 const {traceHash}=await import('../src/state.js');
 const {createLoomScene,LOOM_BINDINGS}=await import('../src/loom/scene.js');
 const {applyStage}=await import('../src/stage/projection.js');
 const base=createPerformance(DEFAULT_PATCH),c=structuredClone(DEFAULT_COMPOSITION);c.loom.enabled=true;
 const composed=attachLoomPerformance(base,c),frames=createStageFrames(composed),camera={mode:'follow',position:[9,6.5,12],target:[0,1,0]};
 const frame=frames.sample(2,camera),plain=createStageFrames(base).sample(2,camera);
 assert.equal(plain.stage.loom,undefined);assert.ok(frame.stage.loom.bodies[0].envelope>0);
 assert.notDeepEqual(frame.stage.camera,plain.stage.camera);
 const world={loom:createLoomScene()};world.loom.root.visible=false;
 const applied=applyStage(frame,LOOM_BINDINGS,world);assert.ok(applied.every(b=>!b.missing));assert.equal(world.loom.root.visible,true);
 assert.ok(world.loom.bodies[0].body.scale.x>.8);
 assert.equal(traceHash(createStageFrames(attachLoomPerformance(base)).sample(2,camera)),traceHash(plain));
});
