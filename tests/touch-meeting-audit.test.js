import test from 'node:test';
import assert from 'node:assert/strict';
import {auditTouchMeeting} from '../tools/audit-touch-meeting.mjs';
test('meeting audit exposes before-after growth that still reduces the uninterrupted response',()=>{
 const report=auditTouchMeeting();
 assert.equal(report.count,1338);
 const example=report.rows.find(row=>row.id==='close-kin'&&row.body===1&&row.frame===1544);
 assert.equal(example.beforeAfterRelation,'grows');
 assert.equal(example.relativeToUninterrupted,'softens');
 assert.ok(example.withTouchPeak>1.05*example.before);
 assert.ok(example.withTouchPeak<.95*example.withoutTouchPeak);
 assert.ok(report.disagreementCount>0);
 for(const row of report.rows)for(const key of ['before','withTouchPeak','withoutTouchPeak'])assert.ok(Number.isFinite(row[key])&&row[key]>=0);
});
