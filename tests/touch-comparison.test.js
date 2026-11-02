import test from 'node:test';
import assert from 'node:assert/strict';
import {createTouchSession,renderTouchBank,renderTouchRecording} from '../src/touch/session.js';
import {getLoomJourney} from '../src/listen/journeys.js';
import {prepareTouchComparison} from '../src/touch/comparison.js';
const source=()=>{const session=createTouchSession(getLoomJourney('distant-cousins').settings,8000);session.strike({frame:0,body:0,velocity:.5});session.strike({frame:3217,body:1,velocity:.3});return session.finish(8000);};
test('comparison changes only declared settings, preserving source, gestures, ending and fixed output gain',()=>{
 const record=source(),before=structuredClone(record),r=prepareTouchComparison(record,'tight-weave');
 assert.deepEqual(record,before);assert.deepEqual(r.source,before);
 for(const key of Object.keys(record).filter(k=>k!=='settings'))assert.deepEqual(r.record[key],record[key]);
 assert.deepEqual(r.changes,[{parameter:'coupling',from:.004,to:.012},{parameter:'detune',from:40,to:0},{parameter:'loss',from:.45,to:.7}]);
 const independent=createTouchSession(getLoomJourney('tight-weave').settings,record.sampleRate);for(const event of record.events)assert.equal(independent.strike(event).accepted,true);independent.finish(record.ended.frame,record.ended.fadeFrames);
 assert.deepEqual(r.pcm,renderTouchRecording(independent.snapshot(),renderTouchBank(independent)));
 assert.equal(r.pickupScale,independent.units[0].pickupScale);assert.equal(r.sourcePickupScale,createTouchSession(record.settings,record.sampleRate).units[0].pickupScale);
 r.source.events[0].velocity=1;r.record.events[0].velocity=.1;assert.deepEqual(record,before);
});
test('the whole comparison is refused when the target cannot carry every source gesture',()=>{
 const s=createTouchSession(getLoomJourney('distant-cousins').settings,8000);
 for(let i=0;i<6;i++)assert.equal(s.strike({frame:0,body:i%2,velocity:1}).accepted,true);
 const record=s.snapshot(),before=structuredClone(record);
 assert.throws(()=>prepareTouchComparison(record,'close-kin'),/headroom.*none were omitted/);assert.deepEqual(record,before);
});
test('identical or unknown targets are refused and natural endings remain natural',()=>{
 assert.throws(()=>prepareTouchComparison(source(),'distant-cousins'),/already matches/);
 assert.throws(()=>prepareTouchComparison(source(),'imagined-target'),/Unknown listening study/);
 const record=source();record.ended=null;const r=prepareTouchComparison(record,'tight-weave');assert.equal(r.record.ended,null);assert.equal(r.source.ended,null);
 assert.equal(r.duration,(record.events.at(-1).frame+Math.ceil(Math.min(20,8/.7)*8000))/8000);
});
