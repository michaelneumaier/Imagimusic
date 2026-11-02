import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {retuneGroveCluster} from '../src/score/grove-tuning.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {createGroveRestRecipe,restInvitationRecord} from '../src/score/grove-rest.js';
import {ensembleRecordFromParts,renderEnsembleRecord} from '../src/score/grove-ensemble-record.js';
import {renderEnsembleMix} from '../src/grove/ensemble-mix.js';

function fixture(partials,fadeFrames=37){
 const recipes=[48,51,55].map(note=>createGroveRestRecipe(retuneGroveCluster(composeGrove({seed:3}),note),{...DEFAULT_VOICE_CONFIG,partials},{sampleRate:8000}));
 return ensembleRecordFromParts(recipes.map((recipe,index)=>restInvitationRecord(recipe,{commands:[
  {kind:'contact',frame:0,body:0,zone:0,strength:0},
  ...(index===2?[]:[{kind:'strike',frame:index*15,body:0,position:1,velocity:.12},{kind:'strike',frame:64,body:1,position:0,velocity:.12},{kind:'strike',frame:64,body:2,position:2,velocity:.12}]),
  {kind:'contact',frame:64,body:0,zone:2,strength:1},
  {kind:'contact',frame:128,body:0,zone:null},
  {kind:'contact',frame:128,body:1,zone:1,strength:0},
  {kind:'quiet',frame:512,fadeFrames}
 ]})));
}
for(const partials of [1,3])test(`mix-only PCM equals full renderer with ${partials} partials, boundary contacts, simultaneous strikes and silent part`,()=>{
 const record=fixture(partials),before=JSON.stringify(record),expected=renderEnsembleRecord(record),actual=renderEnsembleMix(record);
 assert.deepEqual(actual.channels,expected.channels);assert.equal(actual.sampleRate,8000);assert.equal(actual.parts,undefined);assert.equal(JSON.stringify(record),before);
});
test('one-frame and maximum-length fades preserve exact part rounding and common mix order',()=>{
 for(const fade of [1,8000]){const record=fixture(1,fade);assert.deepEqual(renderEnsembleMix(record).channels,renderEnsembleRecord(record).channels);}
});
test('mix-only path retains full canonical identity and admission validation',()=>{
 const record=fixture(1);record.mixGain=.5;assert.throws(()=>renderEnsembleMix(record),/mix gain/);
 record.mixGain=1/3;record.parts[2].silent=false;assert.throws(()=>renderEnsembleMix(record),/silent/);
});

test('late strikes, adjacent contact intervals and a partial block preserve exact samples across block boundaries',()=>{
 const record=fixture(1);
 record.ended={frame:8193,fadeFrames:7};
 for(const part of record.parts)part.record.ended={...record.ended};
 const first=record.parts[0].record;
 first.events.push(...[4095,4096,4097].map((frame,i)=>({frame,order:100+i,body:0,position:1,velocity:.01})));
 first.contacts.push({body:0,zone:0,strength:0,start:4095,end:4096,order:103},{body:0,zone:2,strength:1,start:4096,end:4097,order:104});
 assert.deepEqual(renderEnsembleMix(record).channels,renderEnsembleRecord(record).channels);
});

test('single-pass admission refuses an over-loud record instead of returning a partial mix',()=>{
 const record=fixture(1),loud=record.parts[0].record;
 loud.events=Array.from({length:40},(_,order)=>({frame:0,order,body:order%3,position:2,velocity:1}));loud.contacts=[];
 assert.throws(()=>renderEnsembleRecord(record),/would have been rejected/);
 assert.throws(()=>renderEnsembleMix(record),/Part 1.*would have been rejected/);
});
