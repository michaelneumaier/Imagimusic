import test from 'node:test';
import assert from 'node:assert/strict';
import {readInverseFile,INVERSE_IMPORT_MAX_BYTES} from '../src/inverse/read-file.js';
const file=(bytes,name='instrument.json')=>({name,size:bytes.byteLength,arrayBuffer:async()=>bytes});
test('local instrument reader preserves UTF-8 bytes and bounds names without parsing or trusting a file extension',async()=>{
 const text='{"label":"résonance 🌿"}',bytes=new TextEncoder().encode(text).buffer;
 assert.deepEqual(await readInverseFile(file(bytes,'x'.repeat(230))),{name:'x'.repeat(200),text});
 assert.equal((await readInverseFile(file(new TextEncoder().encode('not JSON').buffer,'instrument.wav'))).text,'not JSON');
});
test('oversized and empty files are refused before reading; changed size and malformed UTF-8 are refused',async()=>{
 let reads=0;for(const size of [0,-1,NaN,1.5,INVERSE_IMPORT_MAX_BYTES+1])await assert.rejects(readInverseFile({name:'x',size,arrayBuffer:async()=>{reads++;return new ArrayBuffer(1);}}),/16 KiB/);
 assert.equal(reads,0);
 await assert.rejects(readInverseFile({...file(new ArrayBuffer(2)),size:1}),/size changed/);
 await assert.rejects(readInverseFile(file(Uint8Array.of(0xc3,0x28).buffer)),/UTF-8/);
 const limit=new Uint8Array(INVERSE_IMPORT_MAX_BYTES).fill(32);assert.equal((await readInverseFile(file(limit.buffer))).text.length,INVERSE_IMPORT_MAX_BYTES);
});
test('cancellation before or during file reading never returns stale bytes',async()=>{
 const before=new AbortController();before.abort();let reads=0;
 await assert.rejects(readInverseFile({name:'x',size:1,arrayBuffer:async()=>{reads++;return new ArrayBuffer(1);}},{signal:before.signal}),{name:'AbortError'});assert.equal(reads,0);
 const during=new AbortController();let finish;
 const pending=readInverseFile({name:'x',size:1,arrayBuffer:()=>new Promise(resolve=>{finish=resolve;})},{signal:during.signal});
 during.abort();finish(new ArrayBuffer(1));await assert.rejects(pending,{name:'AbortError'});
});
