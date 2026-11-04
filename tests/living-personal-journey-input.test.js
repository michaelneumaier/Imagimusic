import test from 'node:test';
import assert from 'node:assert/strict';
import {readLivingPersonalPhrase} from '../src/living/personal-journey-input.js';
import {createTineDesign} from '../src/tine/address.js';
import {tineLiveFragment} from '../src/tine/live-address.js';
import {createLivingRecord,livingFragment} from '../src/living/record.js';
const source={kind:'imagimusic-tine-live',version:1,design:createTineDesign(),sampleRate:48000,events:[{frame:16800,strength:.025},{frame:29280,strength:.1}],fadeStart:100000};
test('kept live and Living addresses/files quietly recover the exact original source',()=>{
 const record=createLivingRecord(source,{presentationVersion:4,arrangementVersion:3});
 for(const text of [JSON.stringify(source),JSON.stringify(record),tineLiveFragment(source),livingFragment(record),'http://localhost:8081/tine-play.html'+tineLiveFragment(source),'https://example.invalid/living.html'+livingFragment(record)])assert.deepEqual(readLivingPersonalPhrase(text),source);
 assert.throws(()=>readLivingPersonalPhrase('javascript:alert(1)'+tineLiveFragment(source)));
 assert.throws(()=>readLivingPersonalPhrase('https://example.invalid/no-phrase'));
 assert.throws(()=>readLivingPersonalPhrase(' '.repeat(16385)));
 assert.throws(()=>readLivingPersonalPhrase(JSON.stringify({...source,design:createTineDesign({lengthMm:95})})));
 assert.throws(()=>readLivingPersonalPhrase('{bad'));
 assert.throws(()=>readLivingPersonalPhrase(JSON.stringify({...source,extra:1})));
});
