import test from 'node:test';
import assert from 'node:assert/strict';
import {parseSMF} from '../src/midi/smf.js';
import {exampleMidiBytes,summarizeMidi,midiPitchLabel} from '../src/midi/preview.js';

test('desk example is a valid triad, with key gates distinguished from file duration',()=>{
  const notes=parseSMF(exampleMidiBytes());
  assert.equal(notes.durationSeconds,.75);
  assert.deepEqual(notes.notes.map(n=>[n.pitch,n.onSeconds,n.offSeconds]),[[60,0,.5],[64,0,.5],[67,0,.5]]);
  const original=JSON.stringify(notes),summary=summarizeMidi(notes);
  assert.deepEqual(summary.groups,[{track:0,channel:0,name:'',count:3,low:60,high:67,first:0,last:.5}]);
  assert.deepEqual(summary.ignored,[{kind:'programChange',count:1}]);
  assert.equal(JSON.stringify(notes),original);
  assert.equal(midiPitchLabel(60),'C4 (60)');assert.equal(midiPitchLabel(0),'C-1 (0)');assert.equal(midiPitchLabel(127),'G9 (127)');
});

test('overview preserves track/channel separation and accounts for every note',()=>{
  const notes=parseSMF(exampleMidiBytes());
  notes.tracks[0].channels=[0,1];notes.notes[1].channel=1;
  notes.ignored.controllers={'1':2,'74':3};
  const {groups,ignored}=summarizeMidi(notes);
  assert.equal(groups.length,2);assert.deepEqual(groups.map(g=>[g.channel,g.count,g.low,g.high]),[[0,2,60,67],[1,1,64,64]]);
  assert.equal(groups.reduce((n,g)=>n+g.count,0),notes.notes.length);
  assert.deepEqual(ignored,[{kind:'controllers 1',count:2},{kind:'controllers 74',count:3},{kind:'programChange',count:1}]);
  notes.notes[0].onSeconds=9;
  assert.throws(()=>summarizeMidi(notes),/seconds/);
});
