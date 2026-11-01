import test from 'node:test';
import assert from 'node:assert/strict';
import {velocity16ToUnit,controller32ToUnit,pitch725ToHcu,pitch79ToHcu,hcuToHz,perNoteBendToHcu} from '../src/midi2/values.js';

test('native MIDI2 resolution survives values that a 7-bit path would collapse',()=>{
  const a=0x81234567,b=a+1;
  assert.equal(Math.floor(a/2**25),Math.floor(b/2**25));
  assert.ok(controller32ToUnit(a)<controller32ToUnit(b));
  assert.equal(pitch725ToHcu(b)-pitch725ToHcu(a),2**-25);
  assert.ok(velocity16ToUnit(32768)<velocity16ToUnit(32769));
  assert.equal(controller32ToUnit(0xffffffff),1);
  assert.equal(controller32ToUnit(0),0);
  assert.equal(velocity16ToUnit(0xffff),1);
  assert.equal(velocity16ToUnit(0),0);
});

test('absolute fixed-point pitch supports both formats and pitches above signed int range',()=>{
  assert.equal(hcuToHz(pitch725ToHcu(69*2**25)),440);
  assert.equal(hcuToHz(pitch79ToHcu(69*512)),440);
  assert.equal(hcuToHz(pitch725ToHcu(81*2**25)),880);
  assert.equal(pitch725ToHcu(0xffffffff),128-2**-25);
  assert.equal(pitch79ToHcu(0xffff),128-2**-9);
  assert.equal(pitch725ToHcu(60.5*2**25),pitch79ToHcu(60.5*512));
});

test('per-note bend has an exact neutral point and equal endpoint ranges',()=>{
  const sensitivity=12.5*2**25;
  assert.equal(perNoteBendToHcu(0,sensitivity),-12.5);
  assert.equal(perNoteBendToHcu(0x80000000,sensitivity),0);
  assert.equal(perNoteBendToHcu(0xffffffff,sensitivity),12.5);
  assert.ok(perNoteBendToHcu(0x7fffffff,sensitivity)<0);
  assert.ok(perNoteBendToHcu(0x80000001,sensitivity)>0);
  assert.equal(perNoteBendToHcu(0xffffffff,0),0);
});

test('invalid wire values fail rather than wrap, clamp or coerce',()=>{
  for(const fn of [velocity16ToUnit,controller32ToUnit,pitch725ToHcu,pitch79ToHcu]) {
    for(const value of [-1,0.5,NaN,Infinity,'1',null,undefined,2**32])assert.throws(()=>fn(value),RangeError);
  }
  for(const value of [65536,2**24])assert.throws(()=>pitch79ToHcu(value),RangeError);
  for(const value of [-1,128,Infinity,NaN,'69'])assert.throws(()=>hcuToHz(value),RangeError);
  assert.throws(()=>perNoteBendToHcu(-1,0),RangeError);
  assert.throws(()=>perNoteBendToHcu(0,2**32),RangeError);
});
