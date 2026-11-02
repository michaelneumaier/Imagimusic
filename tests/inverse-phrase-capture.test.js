import test from 'node:test';
import assert from 'node:assert/strict';
import {createInversePhraseCapture} from '../src/inverse/phrase-capture.js';
const options={sampleRate:8000,capturedAt:'2026-11-02T09:00:00.000Z'};

test('a remembered phrase uses admitted receipt offsets; a draft and an empty finish preserve the previous phrase',()=>{
 const capture=createInversePhraseCapture();assert.equal(capture.snapshot.phrase,null);
 assert.deepEqual(capture.admit({body:1,time:10}),{captured:false,finished:false,reason:'inactive'});
 capture.begin(options);assert.equal(capture.expire(1000),false);assert.equal(capture.snapshot.origin,null);
 capture.admit(Object.freeze({body:2,time:1001}));capture.admit({body:0,time:1001.375});
 assert.equal(capture.snapshot.phrase,null);assert.equal(capture.snapshot.count,2);
 const done=capture.finish();assert.equal(done.changed,true);assert.equal(capture.snapshot.active,false);
 assert.deepEqual(done.phrase.events,[{body:2,at:0},{body:0,at:.375}]);assert.ok(Object.isFrozen(done.phrase));
 capture.begin(options);assert.equal(capture.snapshot.phrase,done.phrase);capture.admit({body:1,time:2000});capture.cancel();assert.equal(capture.snapshot.phrase,done.phrase);
 capture.begin(options);assert.equal(capture.finish().changed,false);assert.equal(capture.snapshot.phrase,done.phrase);
 capture.clear();assert.equal(capture.snapshot.phrase,null);
});

test('eight touches finish exactly once; the inclusive eight-second boundary is preserved and later touches are not silently included',()=>{
 const capture=createInversePhraseCapture();capture.begin(options);
 for(let i=0;i<8;i++){const result=capture.admit({body:i%3,time:10+i*.5});assert.equal(result.finished,i===7);}
 const full=capture.snapshot.phrase;assert.equal(full.events.length,8);assert.equal(capture.snapshot.active,false);
 assert.equal(capture.admit({body:0,time:14}).reason,'inactive');assert.equal(capture.snapshot.phrase,full);
 capture.begin(options);capture.admit({body:1,time:20});assert.equal(capture.expire(28),false);
 assert.equal(capture.admit({body:2,time:28}).captured,true);assert.equal(capture.expire(28.001),true);
 assert.deepEqual(capture.snapshot.phrase.events,[{body:1,at:0},{body:2,at:8}]);assert.equal(capture.expire(29),false);
 capture.begin(options);capture.admit({body:0,time:40});
 assert.deepEqual(capture.admit({body:1,time:48.00001}),{captured:false,finished:true,reason:'time-limit'});
 assert.deepEqual(capture.snapshot.phrase.events,[{body:0,at:0}]);
});

test('invalid inputs and reentrant begin do not replace or corrupt a valid draft',()=>{
 const capture=createInversePhraseCapture();
 assert.throws(()=>capture.begin({...options,sampleRate:7999}),/sample rate/);assert.equal(capture.snapshot.active,false);
 assert.throws(()=>capture.begin({...options,capturedAt:'yesterday'}),/ISO/);
 capture.begin(options);capture.admit({body:0,time:4});
 assert.throws(()=>capture.begin(options),/already/);
 assert.throws(()=>capture.admit({body:3,time:4.5}));assert.throws(()=>capture.admit({body:1,time:3}),/chronological/);
 assert.throws(()=>capture.expire(NaN),/clock/);assert.equal(capture.snapshot.count,1);
 capture.admit({body:2,time:4.5});const done=capture.finish();assert.deepEqual(done.phrase.events,[{body:0,at:0},{body:2,at:.5}]);
});

test('sample-clock endpoints stay within eight seconds while one-sample-late touches finish without capture',()=>{
 const capture=createInversePhraseCapture();let checked=0;
 for(const sampleRate of [8000,44100,48000,96000])for(const base of [0,sampleRate*60,sampleRate*3600,sampleRate*86400])for(let offset=0;offset<sampleRate;offset+=128){
  const frame=base+offset,origin=frame/sampleRate,end=(frame+8*sampleRate)/sampleRate,late=(frame+8*sampleRate+1)/sampleRate;
  capture.begin({...options,sampleRate});capture.admit({body:0,time:origin});
  assert.equal(capture.expire(end),false);assert.equal(capture.admit({body:1,time:end}).captured,true);
  assert.equal(capture.finish().phrase.spanSeconds,8);
  capture.begin({...options,sampleRate});capture.admit({body:0,time:origin});
  assert.deepEqual(capture.admit({body:1,time:late}),{captured:false,finished:true,reason:'time-limit'});
  assert.equal(capture.snapshot.phrase.events.length,1);checked++;
 }
 assert.equal(checked,6132);
});


test('restoring a completed phrase copies and freezes it; invalid or active replacement preserves memory',()=>{
 const capture=createInversePhraseCapture();capture.begin(options);capture.admit({body:1,time:10});
 const original=capture.finish().phrase,input=JSON.parse(JSON.stringify(original));
 const restored=capture.restore(input);assert.notEqual(restored,input);assert.deepEqual(restored,original);
 input.events[0].body=2;assert.equal(restored.events[0].body,1);
 assert.ok(Object.isFrozen(restored));assert.ok(Object.isFrozen(restored.events));assert.ok(Object.isFrozen(restored.events[0]));
 assert.throws(()=>capture.restore({...input,extra:undefined}));assert.equal(capture.snapshot.phrase,restored);
 capture.begin(options);capture.admit({body:0,time:20});
 assert.throws(()=>capture.restore(original),/Finish or cancel/);assert.equal(capture.snapshot.count,1);
 assert.equal(capture.snapshot.phrase,restored);capture.cancel();assert.equal(capture.snapshot.phrase,restored);
});
