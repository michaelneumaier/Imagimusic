import test from 'node:test';
import assert from 'node:assert/strict';
import {createExpressionAutomation} from '../src/expressive/automation.js';
test('exact repeats retain their last hold time before a changed ramp or step',()=>{
 const calls=[],param={setValueAtTime:(v,t)=>calls.push(['set',v,t]),linearRampToValueAtTime:(v,t)=>calls.push(['ramp',v,t])},write=createExpressionAutomation(param);
 write(1,0,'linearRampToValueAtTime');write(1,1,'linearRampToValueAtTime');write(1,2,'setValueAtTime');write(2,3,'linearRampToValueAtTime');write(2,4,'linearRampToValueAtTime');write(3,4,'setValueAtTime');
 assert.deepEqual(calls,[['set',1,0],['set',1,2],['ramp',2,3],['set',2,4],['set',3,4]]);
});
test('adjacent native-resolution values survive exact-repeat compaction',()=>{
 const values=[],param={setValueAtTime:v=>values.push(v),linearRampToValueAtTime:v=>values.push(v)},write=createExpressionAutomation(param);
 const a=0x40000000/0xffffffff,b=0x40000001/0xffffffff;
 write(a,0,'setValueAtTime');write(b,1,'linearRampToValueAtTime');assert.deepEqual(values,[a,b]);assert.notEqual(a,b);
});
