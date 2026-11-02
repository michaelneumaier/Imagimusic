import test from 'node:test';
import assert from 'node:assert/strict';
import {createTouchSession} from '../src/touch/session.js';
import {getLoomJourney} from '../src/listen/journeys.js';
import {prepareTouchHistory} from '../src/touch/history.js';
import {prepareTouchHistoryComparison} from '../src/touch/history-comparison.js';
test('history comparison preserves gestures, independent records and the longer natural tail axis',()=>{
 const s=createTouchSession(getLoomJourney('distant-cousins').settings,8000);s.strike({frame:0,body:0,velocity:.5});s.strike({frame:5704,body:1,velocity:.3});
 const record=s.snapshot(),before=structuredClone(record),pair=prepareTouchHistoryComparison(record,'tight-weave');
 assert.deepEqual(record,before);assert.deepEqual(pair.original,prepareTouchHistory(record));
 assert.deepEqual(pair.original.gestures,pair.comparison.gestures);
 assert.equal(pair.duration,Math.max(pair.original.duration,pair.comparison.duration));assert.notEqual(pair.original.duration,pair.comparison.duration);
 for(const key of Object.keys(record).filter(key=>key!=='settings'))assert.deepEqual(pair.comparison.record[key],record[key]);
 assert.deepEqual(pair.changes.map(c=>c.parameter),['coupling','detune','loss']);
 assert.notEqual(pair.original.pickupScale,pair.comparison.pickupScale);
 pair.comparison.record.events[0].velocity=.1;assert.deepEqual(record,before);assert.deepEqual(pair.original.record,before);
});
test('history comparison refuses a target that cannot admit all gestures and rejects identical/unknown targets',()=>{
 const s=createTouchSession(getLoomJourney('distant-cousins').settings,8000);for(let i=0;i<6;i++)assert.equal(s.strike({frame:0,body:i%2,velocity:1}).accepted,true);
 assert.throws(()=>prepareTouchHistoryComparison(s.snapshot(),'close-kin'),/headroom.*none were omitted/);
 assert.throws(()=>prepareTouchHistoryComparison(s.snapshot(),'distant-cousins'),/already matches/);
 assert.throws(()=>prepareTouchHistoryComparison(s.snapshot(),'unknown'),/Unknown/);
});
