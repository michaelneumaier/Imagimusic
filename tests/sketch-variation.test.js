import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {varySketchDecay} from '../src/sketch/variation.js';
import {createResonanceSketch} from '../src/sketch/model.js';
const input={frequencies:[200,201,320],decays:[2,.8,3],coefficients:[1,.2,.1,-.05,.7,.4]};
test('decay variation preserves pitch, quadratures and gain while explicitly reconstructing the oscillator',()=>{
 const baseline=createResonanceSketch(input),v=varySketchDecay(input,2),changed=createResonanceSketch(v.parameters);
 assert.deepEqual(v.parameters.decays,[4,1.6,6]);assert.deepEqual(v.parameters.frequencies,input.frequencies);assert.deepEqual(v.parameters.coefficients,input.coefficients);
 assert.equal(changed.pickupGain,baseline.pickupGain);assert.equal(v.changed,true);
 for(let i=0;i<3;i++){
  const a=baseline.modes[i],b=changed.modes[i];assert.equal(b.damping,a.damping/2);assert.notEqual(b.stiffness,a.stiffness);assert.notEqual(b.initialVelocity,a.initialVelocity);assert.equal(b.initialDisplacement,a.initialDisplacement);
  const age=.3;assert.ok(Math.abs(changed.modeState(i,age).envelope/baseline.modeState(i,age).envelope-Math.exp(age/(2*a.decay)))<1e-12);
 }
 assert.deepEqual(input.decays,[2,.8,3]);assert.ok(Object.isFrozen(v.parameters.decays));
 const restored=varySketchDecay(input,1);assert.equal(restored.changed,false);assert.deepEqual(restored.parameters,input);
 assert.deepEqual(createResonanceSketch(restored.parameters).render().channels,baseline.render().channels);
 assert.throws(()=>varySketchDecay(input,NaN),/multiplier/);assert.throws(()=>varySketchDecay(input,.49),/multiplier/);assert.throws(()=>varySketchDecay({...input,decays:[8,.8,3]},2),/bounded/);
});
const reportUrl=new URL('../renders/joint-decay-study/report.json',import.meta.url);
test('all six local study interpretations admit both variation endpoints without changing their source fits',{skip:!existsSync(reportUrl)&&'Generate the local joint-decay study to check its six fitted interpretations.'},()=>{
 const report=JSON.parse(readFileSync(reportUrl,'utf8'));
 const rows=report.rows.filter(r=>r.fit);assert.equal(rows.length,6);
 for(const row of rows){const before=JSON.stringify(row.fit);for(const scale of [.5,1,2]){const variation=varySketchDecay(row.fit,scale),sketch=createResonanceSketch(variation.parameters);assert.equal(sketch.pickupGain,createResonanceSketch(row.fit).pickupGain);assert.ok(sketch.render({sampleRate:8000}).channels[0].every(x=>Number.isFinite(x)&&Math.abs(x)<=.2500001));}assert.equal(JSON.stringify(row.fit),before);}
});
