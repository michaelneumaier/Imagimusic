import test from 'node:test';
import assert from 'node:assert/strict';
import {createTineDesign,requestForTineDesign,tineAddressFragment,readTineAddress,TINE_ADDRESS_LIMIT} from '../src/tine/address.js';
import {renderTineImpulse} from '../src/tine/render.js';
const render=record=>{const {geometry,options}=requestForTineDesign(record);return renderTineImpulse(geometry,options);};
test('kept tine designs reopen with exact prepared samples and no dependence on draft mutations',()=>{
 const draft={lengthMm:95,widthMm:7,activation:.35,pickup:.8},record=createTineDesign(draft),hash=tineAddressFragment(record),expected=render(record);
 draft.lengthMm=60;draft.activation=0;
 const reopened=readTineAddress(hash);assert.deepEqual(reopened,record);assert.equal(tineAddressFragment(reopened),hash);assert.ok(Object.isFrozen(reopened));
 assert.deepEqual(render(reopened),expected);
 const mutable=requestForTineDesign(record);mutable.geometry.material.E=1;mutable.options.activation=0;
 assert.deepEqual(render(record),expected);
 assert.equal(readTineAddress(''),null);assert.equal(readTineAddress('#'),null);
});
test('unknown, malformed, off-grid and oversized tine designs refuse without silent coercion',()=>{
 const record=createTineDesign(),encode=x=>'#tine='+encodeURIComponent(JSON.stringify(x));
 for(const bad of ['#other=1','#tine=%xx','#tine=null','#tine=[]','#tine='+ 'x'.repeat(TINE_ADDRESS_LIMIT),encode({...record,version:2}),encode({...record,extra:true}),encode({...record,lengthMm:81}),encode({...record,widthMm:4}),encode({...record,activation:.85000000000001}),encode({...record,pickup:'0.85'}),encode({...record,activation:null}),encode({...record,kind:'another'})])assert.throws(()=>readTineAddress(bad));
 for(const options of [{lengthMm:120.00001},{widthMm:5.5},{activation:NaN},{pickup:1.05}])assert.throws(()=>createTineDesign(options));
 for(const lengthMm of [60,120])for(const widthMm of [5,20])for(const activation of [0,1]){
  const value=createTineDesign({lengthMm,widthMm,activation,pickup:1});assert.deepEqual(readTineAddress(tineAddressFragment(value)),value);
 }
});
