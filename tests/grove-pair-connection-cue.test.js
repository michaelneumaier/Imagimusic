import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {pairConnectionCue} from '../src/grove/pair-connection-cue.js';
test('one actual changed edge is identified on both versions with relative stiffness, never on a third grove',()=>{
 const original=composeGrove({seed:3}),changed=structuredClone(original);changed.bridges[1].coupling*=1.4;
 const pair={original,changed};const a=pairConnectionCue(pair,original),b=pairConnectionCue(pair,changed);
 assert.deepEqual([a.a,a.b],[1,2]);assert.deepEqual([b.a,b.b],[1,2]);assert.equal(a.ratio,1);assert.equal(b.ratio,1.4);
 assert.deepEqual(b.others.map(e=>e.ratio),[1,1]);assert.deepEqual(a.others,b.others);
 assert.match(b.label,/bodies 2 ↔ 3 · 1.40× Original stiffness/);
 assert.equal(pairConnectionCue(pair,composeGrove({seed:7})),null);
 assert.equal(pairConnectionCue({original,changed:original},original),null);
});
test('a changed body cannot be passed off as a coupling-only stiffness comparison',()=>{
 const original=composeGrove({seed:3}),changed=structuredClone(original);changed.bodies[0].mass*=1.01;
 assert.throws(()=>pairConnectionCue({original,changed},changed),/identical except/);
});
