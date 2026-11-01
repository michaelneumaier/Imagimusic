import test from 'node:test';import assert from 'node:assert/strict';
import {createResponseCauses,responseCausesForRecord} from '../src/grove/response-causes.js';
import {responseArcVertices,createResponseCauseArcs} from '../src/grove/response-cause-arcs.js';
const options={sampleRate:1000,driver:{body:0,startFrame:0,forcedFrames:2000}};
const ack=(frame,zone)=>({accepted:true,requestedFrame:0,relativeFrame:frame,event:{kind:'contact',zone}});
test('actual acknowledged intervals, rejected gestures and early Quiet shape the visible causes',()=>{
 const c=createResponseCauses(options);c.consume(ack(200,0));c.consume({...ack(300,1),accepted:false});c.consume(ack(500,1));c.consume({accepted:true,relativeFrame:800,event:{kind:'quiet'}});
 assert.deepEqual(c.at(.1),{source:{start:0,end:.1},contacts:[]});assert.deepEqual(c.at(.6),{source:{start:0,end:.6},contacts:[{zone:0,start:.2,end:.5},{zone:1,start:.5,end:.6}]});assert.deepEqual(c.at(5),{source:{start:0,end:.8},contacts:[{zone:0,start:.2,end:.5},{zone:1,start:.5,end:.8}]});
 assert.throws(()=>c.consume(ack(900,0)),/order/);
});
test('replay contact endpoints match live causes, including a same-frame switch',()=>{
 const live=createResponseCauses(options);live.consume(ack(200,0));live.consume(ack(500,1));live.consume(ack(700,null));live.consume({accepted:true,relativeFrame:1000,event:{kind:'quiet'}});
 const record={...options,driver:{...options.driver,forcedFrames:1000},contacts:[{body:0,zone:0,start:200,end:500,order:0},{body:0,zone:1,start:500,end:700,order:1}],ended:{frame:1000}},replay=responseCausesForRecord(record);
 for(const time of [0,.199,.2,.3,.5,.6,.7,.8,1,3])assert.deepEqual(replay.at(time),live.at(time));
});
test('zero-length holds leave no band and playhead cannot expose future causes',()=>{
 const c=createResponseCauses(options);c.consume(ack(100,0));c.consume(ack(100,null));assert.deepEqual(c.at(1).contacts,[]);assert.throws(()=>c.at(NaN),/playhead/);
 const silent=createResponseCauses({...options,driver:{...options.driver,forcedFrames:0}});assert.equal(silent.at(1).source.end,0);
});
test('interval mesh uses exact endpoints at a fixed width and can clear all previous bands',()=>{
 const radius=4.4,start=.2,end=.8,vertices=responseArcVertices(radius,start,end),angle=-Math.PI/4+2*Math.PI*start/5.025;
 assert.ok(Math.abs(vertices[0]-(radius-.075/2)*Math.cos(angle))<1e-6);const endAngle=-Math.PI/4+2*Math.PI*end/5.025;assert.ok(Math.abs(vertices.at(-3)-(radius-.075/2)*Math.cos(endAngle))<1e-6);
 assert.equal(responseArcVertices(radius,0,0).length,0);assert.throws(()=>responseArcVertices(radius,1,0),/interval/);
 const arcs=createResponseCauseArcs();arcs.set({source:{start:0,end:2},contacts:[{zone:0,start:.2,end:.8}]});assert.ok(arcs.root.children[0].geometry.drawRange.count>0);assert.ok(arcs.root.children[1].geometry.drawRange.count>0);assert.equal(arcs.root.children[2].geometry.drawRange.count,0);arcs.reset();assert.ok(arcs.root.children.every(m=>m.geometry.drawRange.count===0));arcs.dispose();
});
