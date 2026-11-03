import test from 'node:test';
import assert from 'node:assert/strict';
import {studyTouchRecurrence} from '../tools/study-touch-recurrence.mjs';
import {rebuildTouchRecord} from '../src/touch/record.js';
test('recurrence study varies only interior onsets while preserving admitted records and fixed output',()=>{
 const {rows}=studyTouchRecurrence(),first=rows[0];
 assert.equal(rows.length,3);assert.equal(new Set(rows.map(row=>row.wavSha256)).size,3);
 for(const row of rows){
  rebuildTouchRecord(row.record);
  const controlled=structuredClone(row.record);controlled.events.forEach(event=>event.frame=0);
  const reference=structuredClone(first.record);reference.events.forEach(event=>event.frame=0);
  assert.deepEqual(controlled,reference);
  assert.deepEqual(row.record.events.map(e=>e.body),[0,1,0,1,0,1]);
  assert.equal(row.record.events[0].frame,0);assert.equal(row.record.events.at(-1).frame,32000);
  assert.equal(row.record.ended.frame,80000);assert.equal(row.frames,80200);
  assert.equal(row.pickupScale,first.pickupScale);
  for(const channel of row.channels){assert.ok(channel.peak>0&&channel.peak<1);assert.ok(channel.rms>0);}
 }
});
