import test from 'node:test';
import assert from 'node:assert/strict';
import {importClipScore} from '../src/midi2/clip-score.js';
import {evaluateExpression} from '../src/midi2/expression.js';
const hex=s=>Uint8Array.from(s.replaceAll(/\s/g,'').match(/../g),h=>parseInt(h,16));
const head='534d4632434c4950 00400000 003001e0',zero='00400000',quarter='004001e0';
const start='f0200000 00000000 00000000 00000000',end='f0210000 00000000 00000000 00000000';
const on='43923c00 80010000',off='43823c00 00000000';
const file=(...parts)=>hex([head,...parts].join(' '));

test('setup bend has elapsed before the first note; native values and end silence survive',()=>{
 const result=importClipScore(file('43e20000 ffffffff',quarter,start,on,quarter,off,quarter,end),{name:'outside.mid2'});
 assert.equal(result.origin.seconds,.5);assert.equal(result.end.seconds,1.5);assert.equal(result.durationSeconds,1);
 assert.equal(result.score.source.kind,'clip');assert.equal(result.score.events[1].velocity16,32769);
 assert.deepEqual(result.score.events.map(e=>e.time),[0,.5,1]);
 const v=evaluateExpression(result.score,.5).voices[0];
 assert.equal(v.pitchHcu,62);assert.deepEqual(v.address,{group:3,channel:2,noteNumber:60});
 assert.equal(result.report.configuration[0].type,'pitchBend');
});
test('unknown configuration and musical packets stay in the report without invented score events',()=>{
 const result=importClipScore(file('43c20000 00000000',zero,start,on,'b0000000 40907f00 ffffffff',quarter,off,zero,end));
 assert.equal(result.score.events.length,2);
 assert.deepEqual(result.report.unsupported.map(p=>p.section),['configuration','sequence']);
 assert.equal(result.report.unsupported[1].words.length,3);
 assert.equal(result.report.assumedTempo,true);
});
test('note-specific setup, open notes, missing voices and full-source overrun are refused',()=>{
 assert.throws(()=>importClipScore(file(on,zero,start,quarter,off,zero,end)),/Note-specific configuration/);
 assert.throws(()=>importClipScore(file(zero,start,on,quarter,end)),/Release every note/);
 assert.throws(()=>importClipScore(file(zero,start,quarter,end)),/at least one/);
 assert.throws(()=>importClipScore(file('00407530',start,on,quarter,off,zero,end)),/entire Clip/);
 assert.throws(()=>importClipScore(file(zero,start,on,quarter,off,'00407530',end)),/entire Clip/);
});
test('same-time native control order is kept and unmapped controllers are disclosed',()=>{
 const result=importClipScore(file('43220007 08000000',zero,start,on,'43023c4a fffffffe','43b20100 ffffffff',quarter,off,zero,end));
 assert.deepEqual(result.score.events.map(e=>e.order),[0,1,2,3,4]);
 assert.equal(result.score.events[2].data32,0xfffffffe);
 assert.equal(evaluateExpression(result.score,0).voices[0].sensitivityHcu,4);
 assert.equal(result.report.evaluator.unsupported[0].type,'controlChange1');
});
