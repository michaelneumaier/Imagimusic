import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {canonicalEnsembleRecord} from '../src/score/grove-ensemble-record.js';
import {canonicalSeededEnsemble,verifySeededEnsemble} from '../src/score/grove-ensemble-seeded.js';
import {renderEnsembleMix} from '../src/grove/ensemble-mix.js';
import {stereoWav} from '../src/loom/model.js';

// Audit this authored study's claims against its files, not its own verdict.
// This is an offline artifact check, never device-output or listener evidence.
const directory=process.argv[2]??'renders/ensemble-continuation-study';
const read=name=>fs.readFile(path.join(directory,name));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const [originalBytes,continuedBytes,reportBytes,htmlBytes]=await Promise.all(['original.json','continued.json','report.json','index.html'].map(read));
const source=JSON.parse(originalBytes),continued=JSON.parse(continuedBytes),report=JSON.parse(reportBytes),html=htmlBytes.toString();
assert.equal(originalBytes.toString(),canonicalEnsembleRecord(source)+'\n','canonical original file');
assert.equal(continuedBytes.toString(),canonicalSeededEnsemble(continued)+'\n','canonical continued file');
const verification=await verifySeededEnsemble(continued,source);
assert.equal(verification.verified,true,'source relationship');
assert.equal(report.sourceCanonicalSha256,sha(canonicalEnsembleRecord(source)),'source hash');
assert.equal(report.continuedFileSha256,sha(continuedBytes),'continued file hash');
assert.equal(report.sampleRate,continued.ensemble.sampleRate);
assert.equal(report.handoff,continued.opening.handoff);
assert.equal(report.handoff,'completed');
assert.equal(report.boundaryFrame,continued.opening.boundaryFrame);
assert.equal(report.boundarySeconds,report.boundaryFrame/report.sampleRate);
const ledger=continued.opening.ledger;
assert.deepEqual(report.remembered,{scheduled:ledger.length,accepted:ledger.filter(e=>e.accepted===true).length,refused:ledger.filter(e=>e.accepted===false).length,notReached:ledger.filter(e=>e.accepted===null).length,timingChanged:verification.timingChanged});
assert.equal(report.remembered.timingChanged,false,'controlled remembered timing');
assert.equal(report.remembered.accepted,5);
assert.equal(report.remembered.refused+report.remembered.notReached,0);
assert.deepEqual(report.verification,{verified:verification.verified,partial:verification.partial,mismatches:verification.mismatches});

const answer=report.answer.gestures,part=continued.ensemble.parts[2].record,boundary=report.boundaryFrame;
assert.deepEqual(answer.map(e=>e.gesture),['strike','strike','hold','release','strike']);
const firm=part.strengths.findIndex(s=>s.name==='firm');assert.ok(firm>=0);
const expectedCommands=[{kind:'strike',body:0,position:1,velocity:.5},{kind:'strike',body:0,position:1,velocity:.5},{kind:'contact',body:0,zone:part.zones.length-1,strength:firm},{kind:'contact',body:0,zone:null},{kind:'strike',body:0,position:1,velocity:.5}];
assert.deepEqual(answer.map(e=>e.command),expectedCommands,'live control vocabulary');
for(const event of answer){
 assert.equal(event.accepted,true,'answer accepted');
 assert.ok(Number.isSafeInteger(event.requestedFrame)&&Number.isSafeInteger(event.appliedFrame));
 assert.ok(event.appliedFrame>=event.requestedFrame&&event.requestedFrame>boundary);
 assert.equal(event.secondsAfterHandoff,+((event.appliedFrame-boundary)/report.sampleRate).toFixed(4),'actual answer offset');
}
const keptStrikes=part.events.filter(e=>e.frame>boundary).map(({frame,body,position,velocity})=>({frame,body,position,velocity}));
assert.deepEqual(keptStrikes,answer.filter(e=>e.gesture==='strike').map(e=>({frame:e.appliedFrame,body:e.command.body,position:e.command.position,velocity:e.command.velocity})),'reported strikes versus kept strikes');
assert.deepEqual(part.contacts.filter(c=>c.start>boundary).map(({start,end,body,zone,strength})=>({start,end,body,zone,strength})),[{start:answer[2].appliedFrame,end:answer[3].appliedFrame,body:0,zone:part.zones.length-1,strength:firm}],'reported hand versus kept hand');
for(const other of continued.ensemble.parts.slice(0,2)){
 assert.equal(other.record.events.filter(e=>e.frame>boundary).length,0,'only G answers');
 assert.equal(other.record.contacts.filter(c=>c.start>boundary).length,0,'only G holds');
}
assert.deepEqual(report.cases.map(c=>c.name),['original','continued']);
const verifiedFiles=[];
for(const [i,record] of [source,continued.ensemble].entries()){
 const entry=report.cases[i];assert.equal(entry.file,entry.name+'.wav');
 const bytes=await read(entry.file),pcm=renderEnsembleMix(record),rebuilt=Buffer.from(stereoWav(pcm));
 assert.ok(bytes.equals(rebuilt),entry.file+' equals independent mix reconstruction');
 assert.equal(entry.wavSha256,sha(bytes));assert.equal(entry.frames,pcm.channels[0].length);
 assert.ok(entry.label.endsWith((entry.frames/report.sampleRate).toFixed(1)+' s'),'displayed duration');
 let peak=0;for(const channel of pcm.channels)for(const value of channel)peak=Math.max(peak,Math.abs(value));assert.equal(entry.peak,peak);
 assert.ok(html.includes('data-file="'+entry.file+'" data-sha256="'+sha(bytes)+'"'),'player WAV identity');
 verifiedFiles.push({file:entry.file,frames:entry.frames,sha256:sha(bytes)});
}
console.log(JSON.stringify({verified:true,directory,sourceRelationship:true,actualAnswerMatchesCapture:true,liveControlVocabulary:true,files:verifiedFiles,limitation:'Offline artifact audit only; not a device recording, timing clearance or listening verdict.'},null,2));
