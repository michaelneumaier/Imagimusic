import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {createGroveRestRecipe,restInvitationRecord} from '../src/score/grove-rest.js';
import {ensembleRecordFromParts,canonicalEnsembleRecord} from '../src/score/grove-ensemble-record.js';
import {continuationPlan} from '../src/score/grove-ensemble-continuation.js';
import {prepareEnsembleSeededKeep} from '../src/grove/ensemble-seeded-keep.js';
import {createHash} from 'node:crypto';
const recipe=createGroveRestRecipe(composeGrove({seed:3}),{...DEFAULT_VOICE_CONFIG,partials:1},{sampleRate:8000});
function fixture(){
 const record=end=>restInvitationRecord(recipe,{commands:[{id:'s',kind:'strike',frame:0,body:0,position:0,velocity:.25},{id:'h',kind:'contact',frame:100,body:0,zone:2,strength:1},{id:'r',kind:'contact',frame:500,body:0,zone:null},{id:'q',kind:'quiet',frame:end,fadeFrames:8}]});
 const source=ensembleRecordFromParts([0,1,2].map(()=>record(500))),ensemble=ensembleRecordFromParts([0,1,2].map(()=>record(800)));
 const plan=continuationPlan(source),baseFrame=1000,steps=plan.steps.map(s=>({id:s.id,part:s.part,frame:s.frame+baseFrame,command:s.command}));
 const continuation={state:'completed',baseFrame,originFrame:baseFrame,handoffFrame:1500,boundaryFrame:1500,steps,ledger:steps.map(s=>({id:s.id,part:s.part,requestedFrame:s.frame,appliedFrame:s.frame,accepted:true}))};
 return {source,continuation,ensemble};
}
test('keeping verifies a single source/capture snapshot before returning canonical text',async()=>{
 const inputs=fixture(),canonical=canonicalEnsembleRecord(inputs.source),pending=prepareEnsembleSeededKeep(inputs);
 inputs.source.parts[0].record.events[0].velocity=.9;inputs.ensemble.parts[0].record.events[0].velocity=.8;inputs.continuation.ledger[0].part=2;
 const result=await pending;
 assert.equal(result.verification.verified,true);assert.equal(result.verification.partial,false);assert.equal(result.verification.timingChanged,false);
 assert.equal(result.seeded.seededFrom.canonicalSha256,createHash('sha256').update(canonical).digest('hex'));
 assert.equal(result.seeded.ensemble.parts[0].record.events[0].velocity,.25);assert.deepEqual(JSON.parse(result.text),result.seeded);assert.equal('pcm' in result,false);
});
test('a valid inner capture with an invented remembered strike is not offered as a verified continuation',async()=>{
 const inputs=fixture();inputs.ensemble.parts[0].record.events.push({frame:0,order:1,body:1,position:0,velocity:.1});inputs.ensemble.parts[0].record.contacts[0].order=2;
 await assert.rejects(prepareEnsembleSeededKeep(inputs),/history could not be verified.*strikes differ/);
});
test('keeping refuses wrapped originals and reader-incompatible captures before producing a file',async()=>{
 const inputs=fixture();await assert.rejects(prepareEnsembleSeededKeep({...inputs,source:{kind:'imagimusic-grove-ensemble-seeded',ensemble:inputs.source}}),/original ensemble/);
 await assert.rejects(prepareEnsembleSeededKeep({...inputs,ensemble:{...inputs.ensemble,padding:'x'.repeat(256*1024)}}),/256 KiB/);
 await assert.rejects(prepareEnsembleSeededKeep({...inputs,ensemble:{...inputs.ensemble,sampleRate:96000}}),/48 kHz/);
});
