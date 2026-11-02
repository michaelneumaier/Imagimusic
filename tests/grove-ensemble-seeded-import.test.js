import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {createGroveRestRecipe,restInvitationRecord} from '../src/score/grove-rest.js';
import {ensembleRecordFromParts,renderEnsembleRecord} from '../src/score/grove-ensemble-record.js';
import {prepareEnsembleImport,parseEnsembleImport} from '../src/grove/ensemble-import.js';
import {ensembleProvenance} from '../src/grove/ensemble-provenance.js';
const recipe=createGroveRestRecipe(composeGrove({seed:3}),{...DEFAULT_VOICE_CONFIG,partials:1},{sampleRate:8000});
function fixture(){
 const ensemble=ensembleRecordFromParts([0,1,2].map(part=>restInvitationRecord(recipe,{commands:[{id:'s',kind:'strike',frame:part*200,body:0,position:0,velocity:.25},{id:'q',kind:'quiet',frame:1000,fadeFrames:8}]})));
 return {kind:'imagimusic-grove-ensemble-seeded',version:1,seededFrom:{kind:'imagimusic-grove-ensemble',version:1,canonicalSha256:'0'.repeat(64),operation:'continue-from-passage'},sourceStartFrame:0,opening:{handoff:'completed',effective:true,boundaryFrame:100,ledger:[{id:'continuation-0',part:0,edge:'strike',requestedFrame:0,appliedFrame:0,accepted:true,reason:null}]},ensemble};
}
test('reader retains a declared continuation history and reconstructs only the actual capture',()=>{
 const seeded=fixture(),result=prepareEnsembleImport(JSON.stringify(seeded));
 assert.deepEqual(result.seeded,seeded);assert.equal(result.derived,null);assert.deepEqual(result.pcm.channels,renderEnsembleRecord(seeded.ensemble).channels);
 assert.equal(result.seeded.seededFrom.canonicalSha256,'0'.repeat(64),'syntactically valid source declaration is not verification');
 const display=ensembleProvenance(result);assert.equal(display.label,'A CONTINUED PASSAGE');assert.match(display.text,/declared by the file/);assert.match(display.text,/original has not been supplied/);assert.equal(display.filename,'imagimusic-ensemble-continuation.wav');
});
test('seeded imports retain byte/rate/ending bounds and reject malformed metadata or explicit source-policy refusal',()=>{
 const seeded=fixture();assert.throws(()=>parseEnsembleImport(JSON.stringify(seeded),{allowSeeded:false}),/original saved ensemble/);
 const mutate=fn=>{const copy=structuredClone(seeded);fn(copy);return JSON.stringify(copy);};
 assert.throws(()=>parseEnsembleImport(mutate(w=>w.padding='x'.repeat(256*1024))),/256 KiB/);
 assert.throws(()=>parseEnsembleImport(mutate(w=>w.ensemble.sampleRate=96000)),/48 kHz/);
 assert.throws(()=>parseEnsembleImport(mutate(w=>w.ensemble.ended.frame=8000*120+1)),/two minutes/);
 assert.throws(()=>parseEnsembleImport(mutate(w=>w.opening.extra=true)),/unexpected key/);
 assert.throws(()=>parseEnsembleImport(mutate(w=>w.opening.ledger[0].accepted=null)),/all null|unprocessed/);
});
test('presentation handles aborted and negative-boundary declarations, then clears for an ordinary passage',()=>{
 const seeded=fixture();seeded.opening.handoff='aborted';delete seeded.opening.boundaryFrame;
 seeded.opening.ledger[0].accepted=null;seeded.opening.ledger[0].appliedFrame=null;seeded.opening.effective=false;
 const aborted=ensembleProvenance({seeded});assert.match(aborted.text,/Stopped before the live response/);assert.match(aborted.text,/0 accepted, 0 refused, 1 not reached/);assert.match(aborted.text,/No remembered strike or touch was accepted/);
 seeded.opening.handoff='completed';seeded.opening.boundaryFrame=-1;seeded.opening.ledger[0]={...seeded.opening.ledger[0],requestedFrame:-100,appliedFrame:-100,accepted:false,reason:'headroom'};
 assert.match(ensembleProvenance({seeded}).text,/before the first kept gesture/);
 const plain=prepareEnsembleImport(JSON.stringify(seeded.ensemble)),display=ensembleProvenance(plain);
 assert.equal(plain.seeded,null);assert.equal(display.label,'A SAVED ENSEMBLE');assert.equal(display.text,'');assert.equal(display.filename,'imagimusic-ensemble.wav');
});
