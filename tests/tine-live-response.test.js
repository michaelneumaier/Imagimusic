import test from 'node:test';import assert from 'node:assert/strict';
import {createTineLiveResponse} from '../src/tine/live-response.js';
import {createTineLivePass} from '../src/tine/live-pass.js';
import {createTineDesign,requestForTineDesign} from '../src/tine/address.js';
import {renderTineLiveRecord} from '../src/tine/live-record.js';
const source=(extra={})=>({kind:'imagimusic-tine-live',version:1,design:createTineDesign(),sampleRate:48000,events:[{frame:137,strength:.1},{frame:9013,strength:-.05},{frame:9013,strength:.1}],fadeStart:50003,...extra});
test('frame inspection agrees with streaming modal state and pickup PCM across rates and impulse boundaries',()=>{
 for(const sampleRate of [44100,48000,96000]){
  const record=source({sampleRate}),view=createTineLiveResponse(record),{geometry,options}=requestForTineDesign(record.design),pass=createTineLivePass(geometry,{...options,sampleRate}),pcm=renderTineLiveRecord(record).channels[0];pass.start();let event=0,maxPCM=0;
  for(const frame of [0,136,137,138,9012,9013,9014,30001,50002,50003,view.endFrame]){
   while(event<record.events.length&&record.events[event].frame<=frame){const e=record.events[event++];pass.process(new Float32Array(e.frame-pass.frame));pass.strike(e.strength);}
   if(frame>=record.fadeStart&&pass.frame<record.fadeStart){pass.process(new Float32Array(record.fadeStart-pass.frame));pass.quiet();}
   pass.process(new Float32Array(frame-pass.frame));const actual=pass.snapshot(),snapshot=view.at(frame);
   for(let i=0;i<4;i++){assert.ok(Math.abs(actual.modes[i].displacementM-snapshot.modes[i].displacementM)<1e-15);assert.ok(Math.abs(actual.modes[i].velocityMPerS-snapshot.modes[i].velocityMPerS)<1e-12);}
   assert.equal(snapshot.points[0].displacementM,0);assert.equal(snapshot.points[0].velocityMPerS,0);
   if(frame<pcm.length){const fade=frame<record.fadeStart?1:Math.max(0,1-(frame-record.fadeStart)/(Math.round(.025*sampleRate)-1));const sample=Math.fround(Math.fround(100*snapshot.pickup.velocityMPerS)*fade);maxPCM=Math.max(maxPCM,Math.abs(sample-pcm[frame]));}
  }
  assert.ok(maxPCM<1e-8,`${sampleRate}: ${maxPCM}`);
 }
});
test('signed cancellation has zero combined energy; width scaling, pure seeks and the unfaded mechanical ending remain explicit',()=>{
 const record=source(),view=createTineLiveResponse(record),wide=createTineLiveResponse({...record,design:createTineDesign({widthMm:20})});
 const a=view.at(10001),b=wide.at(10001);for(let i=0;i<81;i++)assert.equal(b.points[i].displacementM,a.points[i].displacementM/2);
 view.at(view.endFrame);assert.deepEqual(view.at(10001),a);assert.ok(view.at(view.endFrame).totalEnergyJ>0);
 const cancelled=createTineLiveResponse(source({events:[{frame:0,strength:.1},{frame:0,strength:-.1}]})).at(10001);assert.equal(cancelled.totalEnergyJ,0);assert.ok(cancelled.points.every(p=>p.displacementM===0&&p.velocityMPerS===0));
 assert.ok(view.at(10002).totalEnergyJ<=a.totalEnergyJ);for(const frame of [-1,.5,NaN,view.endFrame+1])assert.throws(()=>view.at(frame));
 a.points[0].displacementM=100;assert.equal(view.at(10001).points[0].displacementM,0);
});
test('completed-pass windows preserve impulse boundaries, signed interference and unfaded ending',()=>{
 for(const sampleRate of [44100,48000,96000]){
  const record=source({sampleRate}),view=createTineLiveResponse(record);
  for(const [start,count] of [[130,20],[9008,16],[50000,20],[view.endFrame,1]]){
   const window=view.window(start,count),frames=Array.from({length:count},(_,n)=>view.at(start+n));
   for(let i=0;i<81;i++){
    const mean=frames.reduce((sum,f)=>sum+f.points[i].displacementM,0)/count;
    const spread=Math.sqrt(frames.reduce((sum,f)=>sum+(f.points[i].displacementM-mean)**2,0)/count);
    assert.ok(Math.abs(window.points[i].meanM-mean)<1e-18);
    assert.ok(Math.abs(window.points[i].standardDeviationM-spread)<1e-18);
   }
   assert.equal(window.lastSampleFrame,start+count-1);
  }
  assert.ok(view.window(view.endFrame,1).points.some(p=>p.rmsM>0));
  for(const [start,count] of [[-1,1],[0,0],[0,1.5],[0,Math.round(.1*sampleRate)+1],[view.endFrame,2]])assert.throws(()=>view.window(start,count));
 }
 const cancelled=createTineLiveResponse(source({events:[{frame:137,strength:.1},{frame:137,strength:-.1}]}));
 assert.ok(cancelled.window(130,100).points.every(p=>p.rmsM===0));
});
