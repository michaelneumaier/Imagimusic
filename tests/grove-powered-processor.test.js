import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {createGroveRestRecipe} from '../src/score/grove-rest.js';
import {createPoweredRecipe,poweredAmplitudeLimit} from '../src/score/grove-powered.js';
import {renderPoweredPassage,forceRotation} from '../src/rest/powered-engine.js';
import {createPoweredProcessor} from '../src/grove/powered-processor.js';
const sr=8000,recipe=createPoweredRecipe(createGroveRestRecipe(composeGrove({seed:3}),undefined,{sampleRate:sr,zones:[.3,1],strengths:{c1:1}}));
const driver={body:0,position:1,startFrame:0,frequencyHz:recipe.grove.bodies[0].hz,forcedFrames:800};driver.rotation=forceRotation(driver.frequencyHz,sr);driver.amplitude=poweredAmplitudeLimit(recipe,driver);
function render({events=[],originFrame=0,quietFrame=1600,fadeFrames=200,blocks=[128],inject=()=>{}}={}){
 const processor=createPoweredProcessor({recipe,driver,originFrame,quietFrame,fadeFrames,events}),channels=[[],[]],messages=[];let frame=0,j=0;
 while(!processor.finished){const n=blocks[j++%blocks.length],chunk=[new Float32Array(n),new Float32Array(n)];inject(processor,frame);processor.process(chunk,frame);chunk.forEach((ch,i)=>channels[i].push(...ch));messages.push(...processor.drain());frame+=n;}
 return {channels:channels.map(c=>Float32Array.from(c)),messages};
}
function expected(contacts,quietFrame=1600,forcedFrames=800){
 const channels=renderPoweredPassage(recipe,{driver:{...driver,forcedFrames},contacts,frames:quietFrame+200});
 for(const ch of channels)for(let i=quietFrame;i<ch.length;i++)ch[i]*=1-(i-quietFrame)/200;
 return channels;
}
test('contact movement and source release match offline stereo samples across block boundaries',()=>{
 const events=[{id:'upper',kind:'contact',zone:0,frame:83},{id:'tip',kind:'contact',zone:1,frame:700},{id:'lift',kind:'contact',zone:null,frame:1107}];
 const want=expected([{body:0,zone:0,strength:0,start:83,end:700},{body:0,zone:1,strength:0,start:700,end:1107}]);
 for(const blocks of [[128],[1,17,63,127]]){const got=render({events,blocks});for(let ch=0;ch<2;ch++){assert.deepEqual(got.channels[ch].slice(0,1800),want[ch]);assert.ok(got.channels[ch].slice(1800).every(v=>v===0));}assert.equal(got.messages.find(m=>m.type==='finished').frame,1800);}
});
test('early Quiet stops the source, releases contact and rejects same-frame/later gestures',()=>{
 const events=[{id:'hold',kind:'contact',zone:1,frame:40},{id:'quiet',kind:'quiet',frame:400},{id:'later',kind:'contact',zone:0,frame:400},{id:'again',kind:'quiet',frame:450}];
 const got=render({events}),want=expected([{body:0,zone:1,strength:0,start:40,end:400}],400,400);
 for(let ch=0;ch<2;ch++)assert.deepEqual(got.channels[ch].slice(0,600),want[ch]);
 const end=got.messages.find(m=>m.type==='finished');assert.equal(end.driver.forcedFrames,400);assert.equal(end.ended.frame,400);assert.equal(end.frame,600);assert.ok(got.messages.filter(m=>['later','again'].includes(m.id)).every(m=>!m.accepted&&m.reason==='ended'));
});
test('late commands acknowledge the actual sample and preserve a delayed encounter origin',()=>{
 let sent=false;const got=render({originFrame:256,inject:(p,frame)=>{if(frame===512&&!sent){sent=true;p.enqueue([{id:'late',kind:'contact',zone:0,frame:1}]);}}});
 const ack=got.messages.find(m=>m.id==='late');assert.equal(ack.appliedFrame,512);assert.equal(ack.relativeFrame,256);assert.equal(ack.lateByFrames,511);
 const want=expected([{body:0,zone:0,strength:0,start:256,end:1600}]);for(let ch=0;ch<2;ch++){assert.ok(got.channels[ch].slice(0,256).every(v=>v===0));assert.deepEqual(got.channels[ch].slice(256,2056),want[ch]);}
});
test('Quiet at the origin produces only silence and reports zero driven frames',()=>{
 const got=render({events:[{id:'quiet',kind:'quiet',frame:0}]});assert.ok(got.channels.every(ch=>ch.every(v=>v===0)));assert.equal(got.messages.find(m=>m.type==='finished').driver.forcedFrames,0);
});
test('new strikes, invalid contacts, duplicate identities and discontinuous clocks are rejected',()=>{
 const p=createPoweredProcessor({recipe,driver,quietFrame:1600,fadeFrames:200});
 assert.throws(()=>p.enqueue([{id:'strike',kind:'strike',frame:0}]),/Only two/);assert.throws(()=>p.enqueue([{id:'bad',kind:'contact',zone:2,frame:0}]),/Only two/);
 p.enqueue([{id:'x',kind:'contact',zone:0,frame:0}]);assert.throws(()=>p.enqueue([{id:'x',kind:'quiet',frame:1}]),/Duplicate/);
 p.process([new Float32Array(128),new Float32Array(128)],0);assert.throws(()=>p.process([new Float32Array(128),new Float32Array(128)],256),/contiguous/);
});

test('contact start limit preserves the current contact while a lift remains available',()=>{
 const events=Array.from({length:257},(_,i)=>({id:`hold-${i}`,kind:'contact',zone:i%2,frame:i+1}));events.push({id:'lift',kind:'contact',zone:null,frame:300});
 const got=render({events}),acks=got.messages.filter(m=>m.type==='processed');
 assert.equal(acks.filter(a=>a.accepted&&a.event.kind==='contact'&&a.event.zone!==null).length,256);
 assert.equal(acks.find(a=>a.id==='hold-256').reason,'contact-limit');assert.equal(acks.find(a=>a.id==='lift').accepted,true);
});
