import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {createGroveRestRecipe} from '../src/score/grove-rest.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {createRestCapture} from '../src/grove/contact-capture.js';
import {ensembleRecordFromParts,renderEnsembleRecord} from '../src/score/grove-ensemble-record.js';
import {prepareEnsembleImport} from '../src/grove/ensemble-import.js';
function fixture(){
 const recipe=createGroveRestRecipe(composeGrove({seed:3}),{...DEFAULT_VOICE_CONFIG,partials:1},{sampleRate:8000});
 const cap=createRestCapture(recipe,{generation:'test'});
 const events=[{id:'s',frame:0,kind:'strike',body:0,position:0,velocity:.5},{id:'q',frame:400,kind:'quiet',fadeFrames:8}];
 cap.consume({type:'processed',generation:'test',events:events.map((event,order)=>({id:event.id,order,requestedFrame:event.frame,appliedFrame:event.frame,lateByFrames:0,event,accepted:true}))});
 cap.consume({type:'finished',generation:'test',frame:408,ended:{frame:400,fadeFrames:8}});
 return ensembleRecordFromParts([cap.snapshot(),cap.snapshot(),cap.snapshot()]);
}
test('ensemble browser import keeps exact PCM and the full saved record',()=>{
 const record=fixture(),source=JSON.stringify(record),result=prepareEnsembleImport(source),expected=renderEnsembleRecord(record);
 assert.deepEqual(result.record,record);assert.deepEqual(result.pcm.channels,expected.channels);assert.equal(result.duration,408/8000);assert.equal(JSON.stringify(record),source);assert.equal(result.pcm.parts,undefined);
});
test('reader bounds expensive reconstruction and rejects wrong formats or tampered identities',()=>{
 assert.throws(()=>prepareEnsembleImport('x'),/JSON/);assert.throws(()=>prepareEnsembleImport(' '.repeat(256*1024+1)),/256/);
 assert.throws(()=>prepareEnsembleImport('{}'),/ensemble file/);
 const record=fixture();
 assert.throws(()=>prepareEnsembleImport(JSON.stringify({...record,sampleRate:96000})),/48 kHz/);
 assert.throws(()=>prepareEnsembleImport(JSON.stringify({...record,ended:{frame:30*8000,fadeFrames:8}})),/30 seconds/);
 assert.throws(()=>prepareEnsembleImport(JSON.stringify({...record,mixGain:1})),/mix gain/);
 record.parts[0].record.grove.bodies[0].mass*=2;
 assert.throws(()=>prepareEnsembleImport(JSON.stringify(record)));
});
