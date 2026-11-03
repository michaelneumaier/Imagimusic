import test from 'node:test';import assert from 'node:assert/strict';
import {createTineDesign} from '../src/tine/address.js';
import {tineLiveFragment,readTineLiveAddress,TINE_LIVE_ADDRESS_LIMIT} from '../src/tine/live-address.js';
import {renderTineLiveRecord} from '../src/tine/live-record.js';
const record={kind:'imagimusic-tine-live',version:1,design:createTineDesign({lengthMm:105,widthMm:7,activation:.3,pickup:.75}),sampleRate:44100,events:[{frame:123,strength:.1},{frame:21733,strength:.1}],fadeStart:90001};
test('kept live address preserves the body, sample frames and early ending with exact reconstructed PCM',()=>{
 const hash=tineLiveFragment(record),back=readTineLiveAddress(hash);assert.deepEqual(back,record);assert.equal(tineLiveFragment(back),hash);assert.deepEqual(renderTineLiveRecord(back).channels,renderTineLiveRecord(record).channels);
 const max={...record,sampleRate:96000,fadeStart:765600,events:Array.from({length:8},(_,i)=>({frame:i*40000,strength:.1}))};assert.ok(tineLiveFragment(max).length<TINE_LIVE_ADDRESS_LIMIT);
});
test('wrong kinds, malformed encoding, oversized input and altered bounds refuse without coercion',()=>{
 for(const hash of ['', '#tine=x','#tine-live=%xx','#tine-live=null','#tine-live='+('x'.repeat(4096)),'#tine-live='+encodeURIComponent(JSON.stringify({...record,sampleRate:'44100'})),'#tine-live='+encodeURIComponent(JSON.stringify({...record,fadeStart:122}))])assert.throws(()=>readTineLiveAddress(hash));
});
