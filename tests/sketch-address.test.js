import test from 'node:test';
import assert from 'node:assert/strict';
import {createSketchAddressRecord,sketchAddressFragment,readSketchAddress,SKETCH_ADDRESS_LIMIT} from '../src/sketch/address.js';
import {varySketchDecay} from '../src/sketch/variation.js';
import {prepareSketchPlayback} from '../src/sketch/transport.js';
const source=()=>({frequencies:[200,201.125,320],decays:[2,.8,3],coefficients:[1,.2,.1,-.05,.7,.4]});
test('sketch address returns exact prepared samples independently of its original source object',()=>{
 const input=source(),record=createSketchAddressRecord('A voice · α & # ? /',input,1.65),hash=sketchAddressFragment(record);
 const expected=prepareSketchPlayback(varySketchDecay(input,1.65).parameters,8000);
 input.frequencies[0]=40;input.decays.fill(1);input.coefficients.fill(0);
 const reopened=readSketchAddress(hash);assert.deepEqual(reopened,record);assert.equal(sketchAddressFragment(reopened),hash);
 assert.deepEqual(prepareSketchPlayback(varySketchDecay(reopened.parameters,reopened.decayScale).parameters,8000),expected);
 assert.ok(Object.isFrozen(reopened.parameters.coefficients));assert.equal(reopened.parameters.decays[0],2);assert.equal(readSketchAddress(''),null);
});
test('sketch addresses refuse malformed, unknown, oversized and unplayable records',()=>{
 const valid=createSketchAddressRecord('Voice',source());
 const encode=x=>'#sketch='+encodeURIComponent(JSON.stringify(x));
 for(const bad of ['#other=1','#sketch=%xx','#sketch=null','#sketch='+ 'x'.repeat(SKETCH_ADDRESS_LIMIT),encode({...valid,version:2}),encode({...valid,extra:1}),encode({...valid,parameters:{...source(),extra:1}}),encode({...valid,decayScale:1.234}),encode({...valid,decayScale:1.65000000000001}),encode({...valid,label:'bad\nlabel'}),encode({...valid,parameters:{...source(),decays:[8,.8,3]},decayScale:2})])assert.throws(()=>readSketchAddress(bad));
 assert.throws(()=>createSketchAddressRecord('x'.repeat(161),source()));assert.throws(()=>createSketchAddressRecord(' ',source()));assert.throws(()=>createSketchAddressRecord('Voice',source(),Infinity));
});
