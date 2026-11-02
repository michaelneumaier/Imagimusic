import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {composeGrove} from '../src/score/grove.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {createGroveRestRecipe,restInvitationRecord} from '../src/score/grove-rest.js';
import {ensembleRecordFromParts,canonicalEnsembleRecord} from '../src/score/grove-ensemble-record.js';
import {prepareEnsembleContinuation} from '../src/grove/ensemble-continuation-prepare.js';
const recipe=createGroveRestRecipe(composeGrove({seed:3}),{...DEFAULT_VOICE_CONFIG,partials:1},{sampleRate:8000});
const part=restInvitationRecord(recipe,{commands:[{id:'s',kind:'strike',body:0,position:0,velocity:.25,frame:0},{id:'h',kind:'contact',body:0,zone:2,strength:1,frame:100},{id:'q',kind:'quiet',frame:500,fadeFrames:8}]});
const source=()=>ensembleRecordFromParts([part,part,part]);
test('source text, identity and plan refer to one original snapshot even when caller mutates during hashing',async()=>{
 const original=source(),canonical=canonicalEnsembleRecord(original),pending=prepareEnsembleContinuation(original,{sampleRate:8000});
 original.parts[0].record.events[0].velocity=1;
 const result=await pending;
 assert.equal(result.text,canonical+'\n');assert.equal(result.canonicalSha256,createHash('sha256').update(canonical).digest('hex'));
 assert.equal(result.plan.sampleRate,8000);assert.equal(result.plan.handoffFrame,500);assert.equal(result.plan.steps.length,9);
 assert.equal(result.plan.steps[0].command.velocity,.25);assert.equal(result.plan.steps.filter(s=>s.edge==='release').length,3);
 assert.equal('pcm' in result,false,'preparation schedules and renders no audio');
});
test('source preparation refuses wrong rate, wrapped sources and oversized input before any playable result',async()=>{
 await assert.rejects(prepareEnsembleContinuation(source(),{sampleRate:48000}),/same rate/);
 await assert.rejects(prepareEnsembleContinuation({kind:'imagimusic-grove-ensemble-derived',ensemble:source()}));
 await assert.rejects(prepareEnsembleContinuation({kind:'imagimusic-grove-ensemble-seeded',ensemble:source()}),/original ensemble/);
 await assert.rejects(prepareEnsembleContinuation({...source(),padding:'x'.repeat(256*1024)}),/256 KiB/);
 const long=source();long.ended.frame=21*8000;long.parts.forEach(p=>p.record.ended.frame=long.ended.frame);
 await assert.rejects(prepareEnsembleContinuation(long),/longer than 20 s/);
});
