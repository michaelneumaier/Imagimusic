import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {readMidiFile} from '../src/midi/read-file.js';
if(!globalThis.crypto)Object.defineProperty(globalThis,'crypto',{value:webcrypto});
// One quarter-note C4, PPQ96, default tempo; valid format0 and EOT.
const bytes=Uint8Array.from([77,84,104,100,0,0,0,6,0,0,0,1,0,96,77,84,114,107,0,0,0,12,0,144,60,100,96,128,60,0,0,255,47,0]);
const file=(overrides={})=>({name:'one-note.mid',size:bytes.length,arrayBuffer:async()=>bytes.slice().buffer,...overrides});

test('local import records a digest of original bytes alongside validated timing',async()=>{
 const result=await readMidiFile(file());
 assert.deepEqual(result.source,{name:'one-note.mid',bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
 assert.equal(result.notes.notes[0].offSeconds,.5);
 assert.equal(result.notes.name,result.source.name);
 assert.equal((await readMidiFile(file({name:'x'.repeat(150)}))).source.name.length,120);
 const changed=bytes.slice();changed[25]=99;
 const other=await readMidiFile(file({arrayBuffer:async()=>changed.buffer}));
 assert.notEqual(other.source.sha256,result.source.sha256);
});

test('oversized or invalid files fail before reading and size mismatches fail afterward',async()=>{
 let reads=0;
 for(const size of [262145,-1,NaN,Infinity,.5])await assert.rejects(readMidiFile(file({size,arrayBuffer:()=>{reads++;throw new Error('should not read');}})),RangeError);
 assert.equal(reads,0);
 await assert.rejects(readMidiFile(null),TypeError);
 await assert.rejects(readMidiFile(file({size:bytes.length+1})),/size changed/);
 await assert.rejects(readMidiFile(file({arrayBuffer:async()=>new ArrayBuffer(bytes.length)})),/MThd/);
});

test('cancelled selection cannot return stale parsed data after an outstanding file read',async()=>{
 const controller=new AbortController();let complete;
 const pending=readMidiFile(file({arrayBuffer:()=>new Promise(resolve=>{complete=resolve;})}),{signal:controller.signal});
 controller.abort();complete(bytes.slice().buffer);
 await assert.rejects(pending,{name:'AbortError'});
 let read=false;
 await assert.rejects(readMidiFile(file({arrayBuffer:async()=>{read=true;return bytes.buffer;}}),{signal:controller.signal}),{name:'AbortError'});
 assert.equal(read,false);
});
