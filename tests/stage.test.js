import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PATCH } from '../src/model.js';
import { createPerformance } from '../src/stage/performance.js';
import { createProjection, stageBindings } from '../src/stage/projection.js';
import { collectState, traceHash } from '../src/state.js';
import { applyBindings } from '../src/bindings.js';
import { FrameClock } from '../src/clock.js';
test('stage timeline is plain serializable data and samples identically after arbitrary seeks',()=>{
  const score=createPerformance(DEFAULT_PATCH),restored=JSON.parse(JSON.stringify(score.snapshots)),project=createProjection(score.patch);
  const clock=new FrameClock(),times=clock.times(3),forward=times.map(t=>traceHash(project(collectState(t,score.snapshots))));
  const reverse=times.toReversed().map(t=>traceHash(project(collectState(t,restored)))).reverse();
  assert.deepEqual(reverse,forward);assert.ok(new Set(forward).size>100);
  const bindings=stageBindings();
  for(const t of [0,.17,.35,.5,2,score.duration]){
    const results=applyBindings(project(collectState(t,restored)),bindings,()=>{});
    assert.ok(results.every(r=>!r.missing));
    assert.ok(!JSON.stringify(results).includes('null'));
  }
});
test('stage modal projection sums overlapping strikes and resets when silent',()=>{
  const score=createPerformance(DEFAULT_PATCH),first=score.snapshots.garden.voices[0];
  const single={garden:{voices:[first]}},double={garden:{voices:[first,{...first,id:'overlap'}]}};
  const project=createProjection(score.patch),t=first.noteOn+.03;
  const a=project(collectState(t,single)).stage.garden[0],b=project(collectState(t,double)).stage.garden[0];
  for(let i=0;i<5;i++)assert.ok(Math.abs(b.energies[i]-2*a.energies[i])<1e-12);
  const idle=project(collectState(score.duration,double)).stage.garden[0];assert.ok(idle.energies.every(e=>e===0));assert.equal(idle.visible,false);
});
