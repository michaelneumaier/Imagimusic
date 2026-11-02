import test from 'node:test';
import assert from 'node:assert/strict';
import {inversePicture} from '../src/inverse/picture.js';
import {createInverseInstrument} from '../src/inverse/instrument.js';
import {composeGrove} from '../src/score/grove.js';
test('picture uses actual response envelopes, sums overlap at one fixed scale, and keeps touch identity separate',()=>{
 const instrument=createInverseInstrument(composeGrove({seed:3}),{sampleRate:8000});
 const strikes=[{body:0,age:.15,...instrument.frame(0,.15)},{body:2,age:.4,...instrument.frame(2,.4)}];
 const original=structuredClone(strikes),picture=inversePicture({strikes});
 assert.deepEqual(strikes,original);
 picture.bodies.forEach((body,i)=>{const envelope=strikes[0].envelope[i]+strikes[1].envelope[i];assert.equal(body.envelope,envelope);assert.equal(body.level,Math.min(1,envelope*1800));assert.equal(body.width,1+.14*body.level);});
 assert.deepEqual(picture.strikes,[{body:0,age:.15,strikeU:.5},{body:2,age:.4,strikeU:.5}]);
 const reduced=inversePicture({strikes},{reducedMotion:true});assert.ok(reduced.bodies.every(b=>b.width===1));assert.deepEqual(reduced.bodies.map(b=>b.haloOpacity),picture.bodies.map(b=>b.haloOpacity));
});
test('silence restores every body; display limits do not normalize quieter neighbours or accept invalid values',()=>{
 const silent=inversePicture({strikes:[]});assert.ok(silent.bodies.every(b=>b.level===0&&b.width===1&&b.haloOpacity===.15));
 const saturated=inversePicture({strikes:[{body:1,age:0,envelope:[1,0,.0001]}]});assert.ok(Math.abs(saturated.bodies[0].width-1.14)<1e-14);assert.equal(saturated.bodies[1].width,1);assert.ok(Math.abs(saturated.bodies[2].level-.18)<1e-14);
 for(const strike of [{body:3,age:0,envelope:[0,0,0]},{body:0,age:NaN,envelope:[0,0,0]},{body:0,age:0,envelope:[NaN,0,0]},{body:0,age:0,envelope:[-1,0,0]},{body:0,age:0,envelope:[0,,0]}])assert.throws(()=>inversePicture({strikes:[strike]}));
});
