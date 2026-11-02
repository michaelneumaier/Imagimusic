import test from 'node:test';
import assert from 'node:assert/strict';
import {parseMIDIClip} from '../src/midi2/clip.js';
const hex=s=>Uint8Array.from(s.replaceAll(/\s/g,'').match(/../g)??[],h=>parseInt(h,16));
const header='53 4d 46 32 43 4c 49 50',zero='00 40 00 00',ppq='00 30 01 e0',start='f0 20 00 00 00 00 00 00 00 00 00 00 00 00 00 00',end='f0 21 00 00 00 00 00 00 00 00 00 00 00 00 00 00';
const tempo120='d0 10 00 00 02 fa f0 80 00 00 00 00 00 00 00 00',tempo60='d1 10 00 00 05 f5 e1 00 00 00 00 00 00 00 00 00';
const on='43 92 3c 00 80 00 00 00',off='43 82 3c 00 00 00 00 00',quarter='00 40 01 e0';
const file=(...parts)=>hex([header,zero,ppq,...parts].join(' '));
test('configuration duration and musical origin remain separate across tempo changes',()=>{
 const parsed=parseMIDIClip(file(tempo120,quarter,'43 22 00 07 04 00 00 00',quarter,start,on,quarter,tempo60,quarter,off,zero,end));
 assert.equal(parsed.ticksPerQuarter,480);assert.equal(parsed.origin.tick,960);assert.equal(parsed.origin.seconds,1);
 assert.equal(parsed.durationSeconds,1.5);assert.equal(parsed.end.seconds,2.5);assert.equal(parsed.report.assumedTempo,false);
 assert.equal(parsed.configuration.at(-1).message.event.type,'registeredController');assert.equal(parsed.configuration.at(-1).seconds,.5);
 assert.equal(parsed.sequence[0].message.kind,'deltaClockstamp');assert.equal(parsed.sequence[1].message.kind,'startOfClip');
 assert.deepEqual(parsed.sequence.filter(p=>p.message.kind==='midi2').map(p=>[p.message.event.type,p.tick,p.seconds]),[['noteOn',960,1],['noteOff',1920,2.5]]);
});
test('simultaneous events keep presentation order and raw unsupported packets retain their time',()=>{
 const parsed=parseMIDIClip(file(zero,start,on,'43 f2 3c 03 00 00 00 00','b0 00 00 00 40 90 7f 00 ff ff ff ff',off,zero,end));
 assert.deepEqual(parsed.sequence.filter(p=>p.message.kind==='midi2').map(p=>p.message.event.type),['noteOn','perNoteManagement','noteOff']);
 assert.ok(parsed.sequence.every(p=>p.tick===0));assert.equal(parsed.report.unsupported.length,1);assert.equal(parsed.report.unsupported[0].words.length,3);
 assert.equal(parsed.report.assumedTempo,true);assert.equal(parsed.report.defaultTempoBpm,120);
});
test('default tempo is reported only when absent or used for elapsed time',()=>{
 assert.equal(parseMIDIClip(file(zero,start,tempo120,quarter,off,zero,end)).report.assumedTempo,false);
 assert.equal(parseMIDIClip(file(quarter,start,tempo120,quarter,off,zero,end)).report.assumedTempo,true);
 assert.equal(parseMIDIClip(file(zero,start,on,quarter,off,zero,end)).durationSeconds,.5);
});
test('conflicting tempo groups are refused while identical values preserve both addresses',()=>{
 assert.throws(()=>parseMIDIClip(file(zero,start,tempo120,tempo60,zero,end)),/Conflicting tempos/);
 const otherGroup=tempo120.replace('d0','d7');
 const p=parseMIDIClip(file(zero,start,tempo120,otherGroup,quarter,off,zero,end));assert.deepEqual(p.tempos.map(t=>t.group),[0,7]);assert.equal(p.durationSeconds,.5);
});
test('header, timing declarations, marker boundaries and packet truncation are refused precisely',()=>{
 for(const bytes of [hex('53 4d 46'),hex(header),hex(header+' '+zero+' 00 30 00 00')])assert.throws(()=>parseMIDIClip(bytes));
 assert.throws(()=>parseMIDIClip(file(zero,start,ppq,zero,end)),/DCTPQ/);
 assert.throws(()=>parseMIDIClip(file(zero,start,zero,start,zero,end)),/more than one Start/);
 assert.throws(()=>parseMIDIClip(file(zero,end)),/precedes/);
 assert.throws(()=>parseMIDIClip(file(zero,start,zero,end,on)),/final packet/);
 assert.throws(()=>parseMIDIClip(file(zero,start,on,end)),/preceding clockstamp/);
 assert.throws(()=>parseMIDIClip(file(zero,start,quarter,zero,end)),/consecutive/);
 assert.throws(()=>parseMIDIClip(file(zero,start,'40 90')),/Truncated/);
 assert.throws(()=>parseMIDIClip(file(tempo120,tempo120,zero,start,zero,end)),/Configuration tempo/);
 assert.throws(()=>parseMIDIClip(file(zero,start,zero,end),{maxBytes:12}),/bytes/);
});

test('the musical origin can replace header tempo at the same tick; same-group changes retain order',()=>{
 const p=parseMIDIClip(file(tempo120,zero,start,tempo60,quarter,off,zero,end));assert.equal(p.durationSeconds,1);
 const sameGroup60=tempo60.replace('d1','d0');
 assert.equal(parseMIDIClip(file(zero,start,tempo120,sameGroup60,quarter,off,zero,end)).durationSeconds,1);
});
test('musical duration does not lose small intervals by subtracting a large setup origin',()=>{
 const p=parseMIDIClip(file('d0 10 00 00 ff ff ff ff 00 00 00 00 00 00 00 00','00 4f ff ff',start,'d0 10 00 00 00 00 00 01 00 00 00 00 00 00 00 00','00 40 00 01',off,zero,end));
 assert.equal(p.durationSeconds,1/480/1e8);assert.equal(p.sequence.at(-1).sequenceSeconds,p.durationSeconds);assert.equal(p.sequence[0].sequenceSeconds,0);
});
