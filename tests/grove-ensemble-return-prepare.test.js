import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {composeGrove} from '../src/score/grove.js';
import {retuneGroveCluster} from '../src/score/grove-tuning.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {createGroveRestRecipe,restInvitationRecord} from '../src/score/grove-rest.js';
import {ensembleRecordFromParts,canonicalEnsembleRecord,renderEnsembleRecord} from '../src/score/grove-ensemble-record.js';
import {prepareEnsembleImport} from '../src/grove/ensemble-import.js';
import {prepareEnsembleReturn} from '../src/grove/ensemble-return-prepare.js';
function fixture(){
 return ensembleRecordFromParts([48,51,55].map((note,index)=>{
  const recipe=createGroveRestRecipe(retuneGroveCluster(composeGrove({seed:3}),note),{...DEFAULT_VOICE_CONFIG,partials:1},{sampleRate:8000});
  return restInvitationRecord(recipe,{commands:[
   {kind:'strike',frame:index*10,body:0,position:1,velocity:.1},
   ...(index===0?[{kind:'contact',frame:70,body:0,zone:2,strength:1},{kind:'contact',frame:120,body:0,zone:null}]:[]),
   {kind:'quiet',frame:200,fadeFrames:10}
  ]});
 }));
}
test('preparation yields a separately labelled wrapper and canonical sound without mutating the source',async()=>{
 const source=fixture(),before=canonicalEnsembleRecord(source),result=await prepareEnsembleReturn(source);
 assert.equal(canonicalEnsembleRecord(source),before);assert.equal(result.derived.kind,'imagimusic-grove-ensemble-derived');
 assert.deepEqual(JSON.parse(result.text),result.derived);assert.equal(result.duration,210/8000);
 assert.equal(result.derived.derivedFrom.canonicalSha256,createHash('sha256').update(before,'utf8').digest('hex'));
 assert.deepEqual(result.derived.ensemble.parts[1].record.events,source.parts[0].record.events);
 assert.deepEqual(result.derived.ensemble.parts[1].record.contacts,source.parts[0].record.contacts);
 assert.deepEqual(result.pcm.channels,renderEnsembleRecord(result.derived.ensemble).channels);
});
test('preparation enforces browser bounds and refuses already-derived or invalid source input',async()=>{
 const record=fixture();
 await assert.rejects(prepareEnsembleReturn({...record,sampleRate:96000}),/48 kHz/);
 await assert.rejects(prepareEnsembleReturn({...record,ended:{frame:120*8000+1,fadeFrames:1}}),/two minutes/);
 await assert.rejects(prepareEnsembleReturn({...record,padding:'x'.repeat(256*1024)}),/256 KiB/);
 await assert.rejects(prepareEnsembleReturn({kind:'imagimusic-grove-ensemble-derived',ensemble:record}),/saved ensemble/);
 await assert.rejects(prepareEnsembleReturn({kind:'imagimusic-grove-ensemble-seeded',ensemble:record}),/saved ensemble/);
 record.parts[0].record.events[0].velocity=2;
 await assert.rejects(prepareEnsembleReturn(record),/velocity/);
});

test('reader preserves derived identity and exact sound without pretending to verify an absent source',async()=>{
 const result=await prepareEnsembleReturn(fixture()),reopened=prepareEnsembleImport(result.text);
 assert.deepEqual(reopened.derived,result.derived);assert.deepEqual(reopened.record,result.derived.ensemble);assert.deepEqual(reopened.pcm.channels,result.pcm.channels);
 const declaration=structuredClone(result.derived);declaration.derivedFrom.canonicalSha256='0'.repeat(64);
 assert.equal(prepareEnsembleImport(JSON.stringify(declaration)).derived.derivedFrom.canonicalSha256,'0'.repeat(64));
 declaration.derivedFrom.canonicalSha256='invalid';assert.throws(()=>prepareEnsembleImport(JSON.stringify(declaration)),/64 lowercase hex/);
 declaration.derivedFrom.canonicalSha256='0'.repeat(64);declaration.unexpected=true;assert.throws(()=>prepareEnsembleImport(JSON.stringify(declaration)),/unknown field/);
 const ordinary=prepareEnsembleImport(JSON.stringify(fixture()));assert.equal(ordinary.derived,null);
});
