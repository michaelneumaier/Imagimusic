import test from 'node:test';import assert from 'node:assert/strict';
import {createResponseTrace,responseTracePoint,advanceResponseTrace} from '../src/grove/response-trace.js';
test('trace uses fixed time and response mapping, keeping body paths separate',()=>{
 const a=responseTracePoint(0,0,0),b=responseTracePoint(0,5.025,0);assert.ok(Math.abs(Math.hypot(a[0],a[2])-2.4)<1e-12);assert.ok(Math.hypot(a[0]-b[0],a[2]-b[2])<1e-12);
 for(let body=0;body<3;body++){const p=responseTracePoint(body,1,100),radius=Math.hypot(p[0],p[2]);assert.ok(radius<=2.9+.7*body+1e-12);assert.ok(radius<2.4+.7*(body+1));}
});
test('duplicate snapshots do not invent history; gaps are not connected',()=>{
 const trace=createResponseTrace();const frame=t=>({time:t,envelope:[.1,.2,.3]});trace.append(frame(0));trace.append(frame(.02));assert.equal(trace.append(frame(.02)),false);trace.append(frame(.4));trace.append(frame(.42));assert.deepEqual(trace.stats,{samples:4,segments:2,lastTime:.42});assert.equal(trace.root.children[0].geometry.drawRange.count,4);assert.throws(()=>trace.append(frame(.1)),/reversing/);trace.dispose();
});
test('history is bounded, visibility does not reset it, and a new passage starts empty',()=>{
 const trace=createResponseTrace({maxSamples:3});for(const time of [0,.01,.02,.03])trace.append({time,envelope:[0,0,0]});assert.equal(trace.stats.samples,3);trace.setVisible(true);trace.setVisible(false);assert.equal(trace.stats.samples,3);trace.reset();assert.equal(trace.stats.segments,0);assert.equal(trace.stats.lastTime,null);assert.ok(trace.root.children.slice(0,3).every(line=>line.geometry.drawRange.count===0));trace.dispose();
});
test('nonfinite or out-of-window samples cannot corrupt the presentation',()=>{
 const trace=createResponseTrace();for(const sample of [{time:NaN,envelope:[0,0,0]},{time:6,envelope:[0,0,0]},{time:0,envelope:[Infinity,0,0]},{time:0,envelope:[0,0]}])assert.throws(()=>trace.append(sample));assert.equal(trace.stats.samples,0);trace.dispose();
});

test('replay retains every stored response sample under sparse or frequent screen refresh',()=>{
 const picture={frames:[{time:0,envelope:[0,0,0]},{time:.02,envelope:[.1,.2,.3]},{time:.04,envelope:[.3,.1,.2]},{time:.06,envelope:[0,0,0]}]},fast=createResponseTrace(),slow=createResponseTrace();let cursor=0;
 for(const time of [0,.01,.02,.03,.04,.05,.06])cursor=advanceResponseTrace(fast,picture,time,cursor);const end=advanceResponseTrace(slow,picture,.06);assert.equal(cursor,4);assert.equal(end,4);assert.equal(slow.stats.segments,3);
 for(let i=0;i<3;i++)assert.deepEqual(fast.root.children[i].geometry.attributes.position.array,slow.root.children[i].geometry.attributes.position.array);fast.dispose();slow.dispose();
});
