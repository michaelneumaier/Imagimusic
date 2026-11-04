import {createHash} from 'node:crypto';
import test from 'node:test';import assert from 'node:assert/strict';
import {createLivingRecord,livingFragment,readLivingAddress,validateLivingRecord} from '../src/living/record.js';
import {renderLivingArrangement} from '../src/living/arrangement.js';
import {createLivingArrangementView} from '../src/living/arrangement-view.js';
import {createTineDesign} from '../src/tine/address.js';
const source=()=>({kind:'imagimusic-tine-live',version:1,design:createTineDesign(),sampleRate:48000,events:[{frame:137,strength:.1},{frame:30017,strength:.025}],fadeStart:50003});
test('kept encounter rebuilds exact stereo PCM, plan and sampled visual response without editing the source',()=>{
 const original=source(),record=createLivingRecord(original,{cameraMotion:false,reveal:true}),kept=readLivingAddress(livingFragment(record));
 assert.deepEqual(kept,record);assert.equal(kept.cameraMotion,false);
 const a=renderLivingArrangement(original),b=renderLivingArrangement(kept.source);assert.deepEqual(a,b);
 const va=createLivingArrangementView(a.plan),vb=createLivingArrangementView(b.plan);
 for(const t of [0,.2,a.plan.roundStart/a.sampleRate+.8,a.plan.returnStart/a.sampleRate+.1,a.seconds])assert.deepEqual(va.at(t),vb.at(t));
 original.events[0].frame=0;assert.equal(record.source.events[0].frame,137);
 assert.equal(livingFragment(kept),livingFragment(record));
});
test('recipe and bounded address refuse unknown versions, extra settings and malformed sources without coercion',()=>{
 const record=createLivingRecord(source());
 for(const extra of [{version:3},{presentationVersion:5},{presentationVersion:"2"},{arrangementVersion:4},{arrangementVersion:"2"},{cameraMotion:1},{reveal:'true'},{gain:8},{source:{...source(),events:[]}}])assert.throws(()=>validateLivingRecord({...record,...extra}));
 for(const hash of ['#tine-live=abc','#living=%','#living=null','#living='+('x'.repeat(8192))])assert.throws(()=>readLivingAddress(hash));
});

test('arrangement version1 remains pinned to its established score and stereo output',()=>{
 const pcm=renderLivingArrangement(source());
 assert.equal(pcm.frames,280569);assert.equal(pcm.plan.delayFrames,29880);assert.deepEqual(pcm.plan.voices.map(v=>v.startFrame),[0,80003,109883,139763,229366]);
 const hash=createHash('sha256');for(const channel of pcm.channels){const bytes=Buffer.alloc(channel.length*4);channel.forEach((v,i)=>bytes.writeFloatLE(v,i*4));hash.update(bytes);}
 assert.equal(hash.digest('hex'),'e949a5b50f36923afa17dc9022534ba06d6df45b791ef83c893947f6c08daad1');
});

test('legacy recipes round-trip unchanged while new recipes declare appearance explicitly',async()=>{
 const {livingPresentationVersion}=await import('../src/living/presentation.js');
 const legacy={kind:'imagimusic-living-encounter',version:1,arrangementVersion:1,source:source(),cameraMotion:true,reveal:true};
 assert.deepEqual(readLivingAddress(livingFragment(legacy)),legacy);
 assert.equal(livingPresentationVersion(validateLivingRecord(legacy)),1);
 const fresh=createLivingRecord(legacy.source);assert.equal(fresh.version,2);assert.equal(fresh.presentationVersion,2);
 const warm=createLivingRecord(legacy.source,{presentationVersion:1});assert.equal(livingPresentationVersion(warm),1);
 assert.deepEqual(renderLivingArrangement(fresh.source).channels,renderLivingArrangement(legacy.source).channels);
 const missing={...fresh};delete missing.presentationVersion;assert.throws(()=>validateLivingRecord(missing));
 assert.throws(()=>validateLivingRecord({...legacy,presentationVersion:2}));
});
