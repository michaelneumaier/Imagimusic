import test from 'node:test';
import assert from 'node:assert/strict';
import {parseInverseSound,readInverseSoundFile,SOUND_FILE_MAX_BYTES} from '../src/inverse/sound-file.js';
import {stereoWav} from '../src/loom/model.js';
const chunk=(id,bytes)=>({id,bytes});
function wav({code=1,bits=16,channels=1,rate=8000,samples=[0],before=[],after=[]}={}){
 const fmt=new Uint8Array(16),f=new DataView(fmt.buffer),audio=new Uint8Array(samples.length*bits/8),a=new DataView(audio.buffer);
 f.setUint16(0,code,true);f.setUint16(2,channels,true);f.setUint32(4,rate,true);f.setUint32(8,rate*channels*bits/8,true);f.setUint16(12,channels*bits/8,true);f.setUint16(14,bits,true);
 samples.forEach((x,i)=>{const p=i*bits/8;if(code===3)a.setFloat32(p,x,true);else if(bits===16)a.setInt16(p,x,true);else if(bits===32)a.setInt32(p,x,true);else{a.setUint8(p,x&255);a.setUint8(p+1,(x>>8)&255);a.setUint8(p+2,(x>>16)&255);}});
 return riff([...before,chunk('fmt ',fmt),chunk('data',audio),...after]);
}
function riff(chunks){const size=12+chunks.reduce((n,c)=>n+8+c.bytes.length+(c.bytes.length%2),0),bytes=new ArrayBuffer(size),v=new DataView(bytes),out=new Uint8Array(bytes);const text=(p,s)=>[...s].forEach((c,i)=>v.setUint8(p+i,c.charCodeAt(0)));text(0,'RIFF');v.setUint32(4,size-8,true);text(8,'WAVE');let p=12;for(const c of chunks){text(p,c.id);v.setUint32(p+4,c.bytes.length,true);out.set(c.bytes,p+8);p+=8+c.bytes.length+(c.bytes.length%2);}return bytes;}

test('PCM endpoints and channel separation survive parsing at the declared rate',()=>{
 for(const bits of [16,24,32]){
  const scale=2**(bits-1),r=parseInverseSound(wav({bits,channels:2,rate:44100,samples:[-scale,scale-1,0,scale/2]}));
  assert.deepEqual([...r.channels[0]],[-1,0]);assert.deepEqual([...r.channels[1]],[(scale-1)/scale,.5]);
  assert.equal(r.sampleRate,44100);assert.equal(r.frameCount,2);assert.equal(r.duration,2/44100);assert.equal(r.atOrAboveUnitySamples,1);
 }
});
test('float values above unity are preserved while NaN and infinities are refused',()=>{
 const r=parseInverseSound(wav({code:3,bits:32,samples:[-1.5,.25,2]}));assert.deepEqual([...r.channels[0]],[-1.5,.25,2]);assert.equal(r.peak,2);assert.equal(r.atOrAboveUnitySamples,2);
 for(const x of [NaN,Infinity,-Infinity])assert.throws(()=>parseInverseSound(wav({code:3,bits:32,samples:[x]})),/non-finite/);
});
test('unknown odd chunks and fact count are handled without assuming a 44-byte header',()=>{
 const count=new Uint8Array(4);new DataView(count.buffer).setUint32(0,2,true);
 const r=parseInverseSound(wav({samples:[-100,100],before:[chunk('JUNK',Uint8Array.of(9,8,7))],after:[chunk('fact',count)]}));assert.equal(r.frameCount,2);
 count[0]=3;assert.throws(()=>parseInverseSound(wav({samples:[1,2],after:[chunk('fact',count)]})),/sample count/);
});
test('container and frame inconsistencies are rejected before decoding',()=>{
 const good=wav({samples:[1,2]});
 for(const end of [0,11,good.byteLength-1])assert.throws(()=>parseInverseSound(good.slice(0,end)));
 const altered=change=>{const b=good.slice(0);change(new DataView(b));return b;};
 for(const bytes of [altered(v=>v.setUint32(4,999,true)),altered(v=>v.setUint32(40,999,true)),altered(v=>v.setUint16(32,4,true)),altered(v=>v.setUint32(28,1,true)),altered(v=>v.setUint16(20,0xfffe,true)),altered(v=>v.setUint32(24,7999,true))])assert.throws(()=>parseInverseSound(bytes));
 assert.throws(()=>parseInverseSound(riff([chunk('data',new Uint8Array(2))])),/format/);
 const duplicate=new Uint8Array(2);assert.throws(()=>parseInverseSound(wav({after:[chunk('data',duplicate)]})),/one audio/);
 assert.throws(()=>parseInverseSound(wav({channels:2,samples:[1]})),/complete audio frames/);
 assert.throws(()=>parseInverseSound(wav({samples:[]})),/complete audio frames/);
});
test('eight-second bound is exact and the existing sound writer round trips',()=>{
 const samples=new Array(64000).fill(0);assert.equal(parseInverseSound(wav({samples})).duration,8);samples.push(0);assert.throws(()=>parseInverseSound(wav({samples})),/8 seconds/);
 assert.throws(()=>parseInverseSound(new ArrayBuffer(SOUND_FILE_MAX_BYTES+1)),/8 MiB/);
 const source=[Float32Array.of(-.5,0,.5),Float32Array.of(.25,-.25,0)];
 const r=parseInverseSound(stereoWav({channels:source,sampleRate:48000}));
 for(let c=0;c<2;c++)for(let i=0;i<3;i++)assert.ok(Math.abs(r.channels[c][i]-source[c][i])<=1/32768);
});
test('selected-file reads enforce size before reading and cancellation after reading',async()=>{
 let calls=0;await assert.rejects(readInverseSoundFile({name:'too big.wav',size:SOUND_FILE_MAX_BYTES+1,arrayBuffer(){calls++;}}),/8 MiB/);assert.equal(calls,0);
 const bytes=wav(),controller=new AbortController();let resolve;
 const pending=readInverseSoundFile({name:'local.wav',size:bytes.byteLength,arrayBuffer:()=>new Promise(r=>resolve=r)},{signal:controller.signal});controller.abort();resolve(bytes);await assert.rejects(pending,{name:'AbortError'});
 await assert.rejects(readInverseSoundFile({name:'changed.wav',size:bytes.byteLength+1,arrayBuffer:async()=>bytes}),/size changed/);
 const result=await readInverseSoundFile({name:'local.wav',size:bytes.byteLength,arrayBuffer:async()=>bytes});assert.equal(result.name,'local.wav');assert.equal(result.bytes,bytes);
});
