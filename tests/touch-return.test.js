import test from 'node:test';
import assert from 'node:assert/strict';
import {createTouchSession,renderTouchBank,renderTouchRecording} from '../src/touch/session.js';
import {prepareTouchReturn} from '../src/touch/return-preparation.js';
import {readTouchFile,createTouchReturnSession} from '../src/touch/return-session.js';
const source=()=>{const s=createTouchSession({frequency:196,coupling:.004,detune:40,loss:.45},8000);s.strike({frame:0,body:0,velocity:.5});s.finish(2200);return s;};
test('return preparation retains original PCM and refuses over-budget output without trimming',()=>{
 const live=source(),record=live.snapshot(),r=prepareTouchReturn(JSON.stringify(record));
 assert.deepEqual(r.record,record);assert.deepEqual(r.pcm,renderTouchRecording(record,renderTouchBank(live)));assert.equal(r.duration,r.pcm.channels[0].length/8000);
 const long=createTouchSession({frequency:196,coupling:.004,detune:0,loss:.45},192000);long.strike({frame:120*192000,body:0,velocity:.5});
 assert.throws(()=>prepareTouchReturn(JSON.stringify(long.snapshot())),/8 million/);
});
test('file reads bound bytes before reading, enforce UTF-8 and refuse cancelled or changed reads',async()=>{
 let calls=0;await assert.rejects(readTouchFile({name:'large',size:262145,arrayBuffer(){calls++;}}),/256 KiB/);assert.equal(calls,0);
 await assert.rejects(readTouchFile({name:'invalid',size:1,arrayBuffer:async()=>Uint8Array.of(255).buffer}),/UTF-8/);
 await assert.rejects(readTouchFile({name:'changed',size:2,arrayBuffer:async()=>new ArrayBuffer(1)}),/size changed/);
 let resolve;const controller=new AbortController(),pending=readTouchFile({name:'cancel',size:1,arrayBuffer:()=>new Promise(r=>resolve=r)},{signal:controller.signal});
 controller.abort();resolve(new ArrayBuffer(1));await assert.rejects(pending,{name:'AbortError'});
 const text=JSON.stringify(source().snapshot()),bytes=new TextEncoder().encode(text).buffer;
 assert.deepEqual(await readTouchFile({name:'local.json',size:bytes.byteLength,arrayBuffer:async()=>bytes}),{name:'local.json',text});
});
test('failed, cancelled and stale replacements cannot erase a prepared passage',async()=>{
 let resolveRead,resolveJob;const jobs={cancel(){},async run({text}){if(text==='bad')throw Error('bad source');if(text==='slow')return new Promise(r=>resolveJob=r);return {record:text};}};
 const session=createTouchReturnSession({jobs,read:async file=>file==='reading'?new Promise(r=>resolveRead=r):({name:file,text:file})});
 const first=await session.open('first');await assert.rejects(session.open('bad'),/bad source/);assert.equal(session.result,first);
 const reading=session.open('reading'),readingRefused=assert.rejects(reading,{name:'AbortError'});session.cancel();resolveRead({name:'late',text:'late'});await readingRefused;assert.equal(session.result,first);
 const slow=session.open('slow'),slowRefused=assert.rejects(slow,{name:'AbortError'});await Promise.resolve();const second=await session.open('second');resolveJob({record:'stale'});await slowRefused;assert.equal(session.result,second);
 session.dispose();assert.equal(session.result,null);await assert.rejects(session.open('third'),/closed/);
});
