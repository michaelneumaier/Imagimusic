import test from 'node:test';
import assert from 'node:assert/strict';
import {createTouchSession,renderTouchBank,renderTouchRecording} from '../src/touch/session.js';
import {rebuildTouchRecord,parseTouchRecord,TOUCH_RECORD_MAX_BYTES} from '../src/touch/record.js';
const settings={frequency:196,coupling:.004,detune:40,loss:.45};
function source(){const s=createTouchSession(settings,8000);s.strike({frame:0,body:0,velocity:.5});s.strike({frame:2037,body:1,velocity:.25});return s;}
test('a reopened Touch passage preserves every field, model frame and rendered sample',()=>{
 const live=source(),record=live.finish(5601),before=structuredClone(record),reopened=parseTouchRecord(JSON.stringify(record));
 assert.deepEqual(reopened.record,record);assert.deepEqual(record,before);
 for(const t of [0,.1,.3,.7,1])assert.deepEqual(reopened.session.visual(t),live.visual(t));
 const expected=renderTouchRecording(record,renderTouchBank(live)),actual=renderTouchRecording(reopened.record,renderTouchBank(reopened.session));
 assert.deepEqual(actual,expected);
 reopened.record.events[0].velocity=1;assert.equal(reopened.session.snapshot().events[0].velocity,.5);
});
test('natural tails and endings before queued gestures retain their original semantics',()=>{
 const live=source();assert.equal(rebuildTouchRecord(live.snapshot()).record.ended,null);
 const record=live.finish(2010,200),rebuilt=rebuildTouchRecord(record);
 assert.equal(rebuilt.record.events[1].frame,2037);assert.equal(rebuilt.record.ended.frame,2010);
 assert.deepEqual(renderTouchRecording(rebuilt.record,renderTouchBank(rebuilt.session)),renderTouchRecording(record,renderTouchBank(live)));
});
test('malformed, excessive and inadmissible saved gestures are refused without repair',()=>{
 const base=source().snapshot();
 const bad=change=>{const r=structuredClone(base);change(r);assert.throws(()=>rebuildTouchRecord(r));};
 for(const key of Object.keys(base))bad(r=>delete r[key]);
 bad(r=>r.unknown=true);bad(r=>r.settings.extra=1);bad(r=>delete r.settings.loss);
 bad(r=>r.version=2);bad(r=>r.kind='imagimusic-grove');bad(r=>r.outputGain=1);
 for(const rate of [0,7999,192001,48000.5])bad(r=>r.sampleRate=rate);
 bad(r=>r.events=[]);bad(r=>r.events=Array(129).fill(r.events[0]));
 bad(r=>r.events[0].bufferIndex=0);bad(r=>r.events[0].velocity=NaN);bad(r=>r.events[0].body=2);
 bad(r=>r.events[1].frame=-1);bad(r=>r.events[0].frame=3000);bad(r=>r.events[1].frame=120*8000+1);
 bad(r=>r.events=Array.from({length:128},(_,frame)=>({frame,body:0,velocity:1})));
 for(const ending of [{frame:0,fadeFrames:0},{frame:0,fadeFrames:8001},{frame:0.5,fadeFrames:1},{frame:Number.MAX_SAFE_INTEGER,fadeFrames:1},{frame:0,fadeFrames:200,extra:1}])bad(r=>r.ended=ending);
 assert.throws(()=>parseTouchRecord('{'),/valid JSON/);
 assert.throws(()=>parseTouchRecord(' '.repeat(TOUCH_RECORD_MAX_BYTES+1)),/256 KiB/);
 assert.throws(()=>parseTouchRecord('é'.repeat(TOUCH_RECORD_MAX_BYTES)),/256 KiB/);
});
