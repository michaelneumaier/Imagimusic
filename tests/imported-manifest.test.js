import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_PATCH} from '../src/model.js';
import {DEFAULT_TENSIONER} from '../src/fm.js';
import {parseSMF} from '../src/midi/smf.js';
import {exampleMidiBytes} from '../src/midi/preview.js';
import {DEFAULT_COMPOSITION} from '../src/stage/composition.js';
import {createImportedPerformance} from '../src/stage/imported-performance.js';
import {createStageFrames} from '../src/stage/frame.js';
import {createTraceManifest} from '../src/stage/manifest.js';
import {verifyStageManifest} from '../tools/verify-stage-manifest.mjs';

function fixture(children=false){
 const imported={version:1,source:{name:'triad.mid',bytes:53,sha256:'0'.repeat(64)},notes:parseSMF(exampleMidiBytes()),plan:{version:1,window:{startSeconds:0,endSeconds:.75},lead:.35,tailSeconds:4,velocityCurve:'linear',assignments:[{track:0,channel:'all',family:'bellows',sustainPedal:false}]}};
 if(children){
  imported.notes.tracks[0].channels=[0,1,2];imported.notes.notes.forEach((n,i)=>n.channel=i);
  imported.plan.assignments=[{track:0,channel:0,family:'bellows',sustainPedal:false},{track:0,channel:1,family:'loom',loomBody:{rule:'parity'}},{track:0,channel:2,family:'fm'}];
 }
 const composition={...structuredClone(DEFAULT_COMPOSITION),version:2,loom:{...structuredClone(DEFAULT_COMPOSITION.loom),enabled:true},fm:{enabled:true,settings:{...DEFAULT_TENSIONER}}};
 const p=createImportedPerformance(DEFAULT_PATCH,imported,composition);
 const frames=createStageFrames(p),camera={mode:'cinematic',position:[9,6.5,12],target:[0,1,0]};
 return {...createTraceManifest({...p,duration:1},{project:f=>frames.project(f,camera)}),instrument:p.patch,
  imported:p.imported,importedComposition:p.importedComposition,composition:p.composition,mappingReport:p.mappingReport,childrenDisabledByImport:p.childrenDisabledByImport,
  camera,width:1280,height:720,videoDuration:1,codecs:{video:'avc',audio:'aac'}};
}

test('imported manifest reconstructs original selection, effective children and mapping report',()=>{
 for(const children of [false,true]){
  const m=fixture(children);
  assert.deepEqual(verifyStageManifest(m),{valid:true,frames:30,firstDifference:-1,mismatches:[]});
  for(const mutate of [
   x=>delete x.importedComposition,
   x=>delete x.mappingReport,
   x=>x.mappingReport.counts.total++,
   x=>x.childrenDisabledByImport.push('invented'),
   x=>x.composition.loom.enabled=!x.composition.loom.enabled,
   x=>x.importedComposition.extra=true,
   x=>x.score={},
   x=>delete x.imported,
  ]){const altered=structuredClone(m);mutate(altered);assert.throws(()=>verifyStageManifest(altered));}
 }
});

test('imported scene proof detects altered musical input but does not authenticate missing original MIDI bytes',()=>{
 const m=fixture();
 const altered=structuredClone(m);altered.imported.notes.notes[0].velocity=50;
 assert.equal(verifyStageManifest(altered).valid,false);
 const stale=structuredClone(m);stale.imported.notes.notes[0].offSeconds=.6;
 assert.throws(()=>verifyStageManifest(stale),/seconds/);
 // A syntactically valid provenance claim cannot be rehashed without the file.
 const claim=structuredClone(m);claim.imported.source.sha256='a'.repeat(64);
 assert.equal(verifyStageManifest(claim).valid,true);
 const malformed=structuredClone(m);malformed.imported.source.sha256='not a digest';
 assert.throws(()=>verifyStageManifest(malformed),/sha256/);
});
