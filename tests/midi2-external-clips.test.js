import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {parseMIDIClip} from '../src/midi2/clip.js';
import {importClipScore} from '../src/midi2/clip-score.js';
import {createClipPerformance} from '../src/expressive/clip-performance.js';
const base=new URL('./fixtures/jazz-soft-clips/',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,base));
const provenance=JSON.parse(read('provenance.json'));

test('external fixture bytes match the pinned upstream provenance',()=>{
 for(const entry of provenance.files){const bytes=read(entry.file);assert.equal(bytes.length,entry.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256);}
});
test('Jazz-Soft MIDI2 scales preserve the declared quarter-note sequence and distinct Groups',()=>{
 // Expected notes and96tick quarters come from upstream code2 scale source,
 // read separately from the binary decoder.120BPM gives half-second notes.
 const notes=[60,62,64,65,67,69,71,72];
 for(const group of [0,1]){
  const bytes=read(`test-c-major-scale-m2-g${group}.midi2`),parsed=parseMIDIClip(bytes),result=importClipScore(bytes);
  assert.equal(parsed.ticksPerQuarter,96);assert.equal(parsed.origin.seconds,0);assert.equal(parsed.end.seconds,4);
  assert.equal(parsed.report.assumedTempo,false);assert.equal(parsed.report.unsupported.length,0);
  const expected=notes.flatMap((noteNumber,i)=>[
   {order:2*i,time:i*.5,group,channel:0,type:'noteOn',noteNumber,velocity16:65535,attributeType8:0,attributeData16:0},
   {order:2*i+1,time:(i+1)*.5,group,channel:0,type:'noteOff',noteNumber,velocity16:0,attributeType8:0,attributeData16:0}]);
  assert.deepEqual(result.score.events,expected);
  const clip=createClipPerformance(bytes);assert.equal(clip.performance.voices.length,8);assert.equal(clip.originFrame,0);assert.ok(clip.duration>4);
 }
});
test('valid external MIDI1-packet and empty-sequence Clips stay outside this receiver subset',()=>{
 const midi1=read('test-c-major-scale-m1-g0.midi2'),minimal=read('test-minimal.midi2');
 const parsed=parseMIDIClip(midi1);assert.equal(parsed.end.seconds,4);assert.equal(parsed.report.unsupported.length,16);
 assert.ok(parsed.report.unsupported.every(p=>p.message.messageType===2));
 assert.equal(parseMIDIClip(minimal).durationSeconds,0);
 for(const bytes of [midi1,minimal])assert.throws(()=>importClipScore(bytes),/at least one MIDI2 Note On/);
});
