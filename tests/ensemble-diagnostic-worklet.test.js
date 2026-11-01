import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {retuneGroveCluster} from '../src/score/grove-tuning.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {createGroveRestRecipe,renderRestRecord} from '../src/score/grove-rest.js';
import {composeEnsemblePhrase,ensembleRecords} from '../src/score/grove-ensemble.js';
import {createRestCapture} from '../src/grove/contact-capture.js';
let Processor;
globalThis.sampleRate=8000;globalThis.currentFrame=0;
globalThis.AudioWorkletProcessor=class{constructor(){this.messages=[];this.port={postMessage:message=>this.messages.push(message)};}};
globalThis.registerProcessor=(_,value)=>{Processor=value;};
await import('./ensemble-diagnostic-worklet.js');
const sr=8000,c3=composeGrove({seed:3}),recipes=[48,51,55].map(b=>createGroveRestRecipe(retuneGroveCluster(c3,b),DEFAULT_VOICE_CONFIG,{sampleRate:sr}));
function run(processorOptions,{blocks=4000,inject=null}={}){
 const p=new Processor({processorOptions});const audio=[[],[]];let finished=null,error=null;
 for(let b=0;b<blocks;b++){globalThis.currentFrame=b*128;if(inject&&inject.atBlock===b)p.port.onmessage({data:inject.data});const output=[new Float32Array(128),new Float32Array(128)];const active=p.process([],[output]);for(const m of p.messages.splice(0)){if(m.type==='audio')m.channels.forEach((c,ch)=>audio[ch].push(...c));else if(m.type==='finished')finished=m;else if(m.type==='error')error=m;else if(m.type==='processed')(p.acksByPart??=[[],[],[]])[m.part].push(m);}if(!active)break;}
 return {p,audio:audio.map(c=>Float32Array.from(c)),finished,error,acks:p.acksByPart??[[],[],[]]};
}
test('three engines in one processor: per-part acknowledgements rebuild the phrase records, common origin and ending, mix equal to the offline sum',()=>{
 const phrase=composeEnsemblePhrase(recipes),records=ensembleRecords(recipes,phrase);
 const {audio,finished,error,acks}=run({recipes,parts:phrase.parts.map(part=>part.commands),generation:'diag'});
 assert.equal(error,null);assert.ok(finished,'finished');assert.equal(finished.origin,0);assert.deepEqual(finished.ended,{frame:phrase.endFrame,fadeFrames:records[0].ended.fadeFrames});
 assert.deepEqual(finished.parts.map(x=>[x.accepted,x.refused]),[[5,0],[3,0],[3,0]]);assert.equal(finished.frame,phrase.endFrame+records[0].ended.fadeFrames);
 // Each part's acknowledgement stream is a valid Rest capture; its record equals the phrase's part record once shifted to the ensemble origin.
 const captures=recipes.map(r=>createRestCapture(r,{generation:'diag'}));
 acks.forEach((messages,i)=>{for(const m of messages)captures[i].consume({type:'processed',generation:'diag',events:m.events});captures[i].consume({type:'finished',generation:'diag',frame:finished.frame,ended:finished.ended});});
 captures.forEach((capture,i)=>{const rec=capture.snapshot(),shift=capture.originFrame-finished.origin;assert.deepEqual(rec.events.map(e=>({...e,frame:e.frame+shift})),records[i].events.map(e=>({frame:e.frame,order:e.order,body:e.body,position:e.position,velocity:e.velocity})).map((e,k)=>({...e,order:rec.events[k].order})),`part ${i} events`);assert.deepEqual(rec.contacts.map(c=>[c.body,c.zone,c.strength,c.start+shift,c.end+shift]),records[i].contacts.map(c=>[c.body,c.zone,c.strength,c.start,c.end]),`part ${i} contacts`);assert.equal(rec.ended.frame+shift,records[i].ended.frame);});
 // Mix: the declared arithmetic on the offline part PCM.
 const parts=records.map((r,i)=>renderRestRecord(r,recipes[i])),n=parts[0].channels[0].length;assert.equal(audio[0].length,n);
 let mismatches=0;
 for(let ch=0;ch<2;ch++)for(let k=0;k<n;k++){const expected=Math.fround(parts.reduce((s,pcm)=>s+pcm.channels[ch][k]*(1/3),0));if(audio[ch][k]!==expected)mismatches++;}
 assert.equal(mismatches,0,'mix equals the offline sum exactly on every frame, fade included');assert.ok(audio[0].some(v=>v!==0));
});
test('a Quiet originating in ANY part ends every part in the same frame',()=>{
 const phrase=composeEnsemblePhrase(recipes);
 for(const origin of [0,1,2]){
  const parts=phrase.parts.map(part=>part.commands.filter(c=>c.kind!=='quiet'));parts[origin].push({id:'quiet-from-'+origin,kind:'quiet',frame:30000,fadeFrames:200});
  const {finished,error,acks}=run({recipes,parts,generation:'diag'});
  assert.equal(error,null,'part '+origin);assert.deepEqual(finished.ended,{frame:30000,fadeFrames:200});assert.ok(finished.parts.every(x=>x.ended.frame===30000&&x.ended.fadeFrames===200),'all parts ended at 30000 when part '+origin+' began the Quiet');
  const quiets=acks.map(ms=>ms.flatMap(m=>m.events).filter(a=>a.event.kind==='quiet'&&a.accepted).map(a=>[a.id,a.appliedFrame]));assert.deepEqual(quiets.map(q=>q[0][1]),[30000,30000,30000]);assert.equal(quiets[origin][0][0],'quiet-from-'+origin);
  const captures=recipes.map(r=>createRestCapture(r,{generation:'diag'}));acks.forEach((ms,i)=>{for(const m of ms)captures[i].consume({type:'processed',generation:'diag',events:m.events});captures[i].consume({type:'finished',generation:'diag',frame:finished.frame,ended:finished.ended});});
  captures.forEach(c=>assert.equal(c.state,'complete'));
 }
});
test('ensemble rules: a Quiet in one part ends all parts at that frame; a never-struck part is silent with its contacts acknowledged; errors fail all',()=>{
 const phrase=composeEnsemblePhrase(recipes),parts=phrase.parts.map(part=>part.commands.filter(c=>c.kind!=='quiet'));
 parts[2]=[{id:'hand-only',kind:'contact',frame:200,body:0,zone:recipes[2].zones.length-1,strength:recipes[2].strengths.findIndex(s=>s.name==='firm')}];
 parts[0].push({id:'early-quiet',kind:'quiet',frame:20000,fadeFrames:200});
 const {finished,error,acks}=run({recipes,parts,generation:'diag'});
 assert.equal(error,null);assert.deepEqual(finished.ended,{frame:20000,fadeFrames:200});assert.equal(finished.frame,20200);
 assert.ok(finished.parts.every(x=>x.ended.frame===20000),'every part ended at the common frame');
 const quietIds=acks.map(ms=>ms.flatMap(m=>m.events).filter(a=>a.event.kind==='quiet'&&a.accepted).map(a=>a.id));assert.deepEqual(quietIds,[['early-quiet'],['$ensemble-quiet'],['$ensemble-quiet']]);
 const part2=acks[2].flatMap(m=>m.events);assert.equal(part2.filter(a=>a.event.kind==='contact').length,1);assert.equal(part2.filter(a=>a.event.kind==='strike').length,0);
 const capture=createRestCapture(recipes[2],{generation:'diag'});for(const m of acks[2])capture.consume({type:'processed',generation:'diag',events:m.events});capture.consume({type:'finished',generation:'diag',frame:finished.frame,ended:finished.ended});assert.throws(()=>capture.snapshot(),/strike/,'a part with contacts and no strike has no Rest record, as the capture says');
 // Fail-all: an invalid live command for one part stops the whole ensemble with silence.
 const bad=run({recipes,parts:phrase.parts.map(part=>part.commands),generation:'diag'},{inject:{atBlock:3,data:{type:'events',part:1,events:[{id:'bad',kind:'strike',frame:1000,body:9,position:1,velocity:.5}]}}});
 assert.ok(bad.error);assert.match(bad.error.message,/Invalid Rest event body/);assert.equal(bad.finished,null);
 assert.throws(()=>new Processor({processorOptions:{recipes:recipes.slice(0,2),parts:[]}}),/exactly three/);assert.throws(()=>new Processor({processorOptions:{recipes,parts:[],mixGain:.5}}),/fixed at 1\/3/);
});
