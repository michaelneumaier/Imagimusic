import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {retuneGroveCluster} from '../src/score/grove-tuning.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {createGroveRestRecipe,renderRestRecord} from '../src/score/grove-rest.js';
import {composeEnsemblePhrase,ensembleRecords} from '../src/score/grove-ensemble.js';
import {createRestCapture} from '../src/grove/contact-capture.js';
const processors={};
globalThis.sampleRate=8000;globalThis.currentFrame=0;
globalThis.AudioWorkletProcessor=class{constructor(){this.messages=[];this.port={postMessage:message=>this.messages.push(message)};}};
globalThis.registerProcessor=(name,value)=>{processors[name]=value;};
await import('../src/grove/ensemble-worklet.js');await import('./ensemble-diagnostic-worklet.js');
const Ensemble=processors['imagimusic-grove-ensemble'],Diagnostic=processors['imagimusic-ensemble-diagnostic'];
const sr=8000,c3=composeGrove({seed:3}),recipes=[48,51,55].map(b=>createGroveRestRecipe(retuneGroveCluster(c3,b),DEFAULT_VOICE_CONFIG,{sampleRate:sr}));
function run(Processor,processorOptions,{blocks=4000,inject=[]}={}){
 const p=new Processor({processorOptions});const out=[[],[]],states=[],audio=[[],[]];let finished=null,error=null;const acks=[[],[],[]];
 for(let b=0;b<blocks;b++){globalThis.currentFrame=b*128;for(const inj of inject)if(inj.atBlock===b)p.port.onmessage({data:inj.data});const output=[new Float32Array(128),new Float32Array(128)];const active=p.process([],[output]);output.forEach((c,ch)=>out[ch].push(...c));
  for(const m of p.messages.splice(0)){if(m.type==='audio')m.channels.forEach((c,ch)=>audio[ch].push(...c));else if(m.type==='finished')finished=m;else if(m.type==='error')error=m;else if(m.type==='processed')acks[m.part].push(m);else if(m.type==='state')states.push(m);}
  if(!active)break;}
 return {p,output:out.map(c=>Float32Array.from(c)),audio:audio.map(c=>Float32Array.from(c)),states,finished,error,acks};
}
test('experimental ensemble processor: identical output and acknowledgements to the diagnostic fixture; records rebuild; mix exact on every frame',()=>{
 const phrase=composeEnsemblePhrase(recipes),records=ensembleRecords(recipes,phrase),parts=phrase.parts.map(part=>part.commands);
 const live=run(Ensemble,{recipes,parts,generation:'g'}),ref=run(Diagnostic,{recipes,parts,generation:'g',postAudio:false});
 assert.equal(live.error,null);assert.ok(live.finished);assert.deepEqual(live.output,ref.output,'output channels identical to the diagnostic');
 assert.deepEqual(live.acks.map(ms=>ms.flatMap(m=>m.events)),ref.acks.map(ms=>ms.flatMap(m=>m.events)),'acknowledgements identical');
 assert.deepEqual({...live.finished,generation:null},{...ref.finished,generation:null});assert.equal(live.audio[0].length,0,'no audio messages when postAudio is false');
 const captures=recipes.map(r=>createRestCapture(r,{generation:'g'}));live.acks.forEach((ms,i)=>{for(const m of ms)captures[i].consume({type:'processed',generation:'g',events:m.events});captures[i].consume({type:'finished',generation:'g',frame:live.finished.frame,ended:live.finished.ended});});
 captures.forEach((c,i)=>{const rec=c.snapshot(),shift=c.originFrame-live.finished.origin;assert.deepEqual(rec.events.map(e=>[e.frame+shift,e.body]),records[i].events.map(e=>[e.frame,e.body]));assert.equal(rec.ended.frame+shift,records[i].ended.frame);});
 const offline=records.map((r,i)=>renderRestRecord(r,recipes[i])),n=offline[0].channels[0].length;let mismatches=0;
 for(let ch=0;ch<2;ch++)for(let k=0;k<n;k++)if(live.output[ch][k]!==Math.fround(offline.reduce((s,pcm)=>s+pcm.channels[ch][k]*(1/3),0)))mismatches++;
 assert.equal(mismatches,0);assert.ok(live.output[0].slice(n).every(v=>v===0),'silence after the finish');
});
test('snapshots at the contact cadence, postAudio on demand, a Quiet sent to part 0 ends all parts, and an error names the part',()=>{
 const phrase=composeEnsemblePhrase(recipes),parts=phrase.parts.map(part=>part.commands.filter(c=>c.kind!=='quiet'));
 const quiet={type:'events',part:0,events:[{id:'host-quiet',kind:'quiet',frame:12000,fadeFrames:200}]};
 const r=run(Ensemble,{recipes,parts,generation:'g',snapshots:true,postAudio:true},{inject:[{atBlock:50,data:quiet}]});
 assert.equal(r.error,null);assert.deepEqual(r.finished.ended,{frame:12000,fadeFrames:200});assert.ok(r.finished.parts.every(x=>x.ended.frame===12000));
 assert.deepEqual(r.acks.map(ms=>ms.flatMap(m=>m.events).filter(a=>a.event.kind==='quiet'&&a.accepted).map(a=>a.id)),[['host-quiet'],['$ensemble-quiet'],['$ensemble-quiet']]);
 assert.ok(r.states.length>0);for(let i=1;i<r.states.length;i++)assert.equal(r.states[i].frame-r.states[i-1].frame,1024);
 assert.deepEqual(r.states[0].parts.map(x=>x.part),[0,1,2]);assert.ok(r.states[0].parts.every(x=>x.state&&typeof x.key==='string'));assert.equal(r.states.at(-1).ended?.frame??12000,12000);
 assert.equal(r.audio[0].length,r.finished.frame,'posted audio covers exactly the finished length');assert.deepEqual(Array.from(r.audio[0]),Array.from(r.output[0].slice(0,r.finished.frame)));
 const bad=run(Ensemble,{recipes,parts,generation:'g'},{inject:[{atBlock:3,data:{type:'events',part:2,events:[{id:'bad',kind:'strike',frame:1000,body:9,position:1,velocity:.5}]}}]});
 assert.ok(bad.error);assert.equal(bad.error.part,2);assert.match(bad.error.message,/Invalid Rest event body/);assert.equal(bad.finished,null);
 assert.throws(()=>new Ensemble({processorOptions:{recipes,generation:'g',snapshots:'yes'}}),/booleans/);
});
