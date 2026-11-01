import test from 'node:test';
import assert from 'node:assert/strict';
import {composeExpressiveChord} from '../src/midi2/expression.js';
import {DEFAULT_PATCH} from '../src/model.js';
import {createExpressionPerformance,expressionFrame,expressionControlTimeline} from '../src/expressive/performance.js';
const at=(p,t,id)=>expressionFrame(p,t).voices.find(v=>v.voiceId===id);
test('expressive mapping preserves independent controls, detached tails and native precision',()=>{
 const score=composeExpressiveChord(),p=createExpressionPerformance(score),a=at(p,1.505,0),b=at(p,1.505,1),c=at(p,1.505,2);
 assert.ok(a.frequencyHz>261.63);assert.equal(b.frequencyHz,440*2**((64-69)/12));assert.equal(c.frequencyHz,440*2**((67-69)/12));
 assert.ok(b.gain>b.env.level*b.velocity01*.5);assert.ok(c.cutoffHz>a.cutoffHz);assert.ok(c.q>=.5&&c.q<=18);
 const overlap=expressionFrame(p,3.1).voices;assert.equal(overlap.length,4);assert.equal(overlap[1].detached,true);assert.equal(overlap[3].detached,false);assert.ok(overlap[1].pressure01>overlap[3].pressure01);
 assert.notEqual(at(p,2.9,0).raw.brightness32,at(p,2.9,2).raw.brightness32);assert.notEqual(at(p,2.9,0).cutoffHz,at(p,2.9,2).cutoffHz);
 assert.ok(expressionFrame(p,p.duration).voices.every(v=>v.retired&&v.gain===0));
 const times=[0,.5,.51,2.6,3,3.1,4,4.4,4.9,p.duration],frames=times.map(t=>expressionFrame(p,t));
 for(let i=times.length-1;i>=0;i--)assert.deepEqual(expressionFrame(p,times[i]),frames[i]);
 score.events[0].data32=0;assert.notEqual(p.score.events[0].data32,0);
});
test('finite studies reject open gates and excessive cost; pitch and sample-rate limits are explicit',()=>{
 const score=composeExpressiveChord();score.events=score.events.filter(e=>e.type!=='noteOff').map((e,order)=>({...e,order}));assert.throws(()=>createExpressionPerformance(score),/Release every note/);
 assert.throws(()=>createExpressionPerformance(composeExpressiveChord(),DEFAULT_PATCH,0),/sample rate/);
 const high=composeExpressiveChord();for(const e of high.events)if(e.noteNumber===60)e.noteNumber=127;
 const p=createExpressionPerformance(high,DEFAULT_PATCH,8000);assert.equal(at(p,1,0).frequencyHz,3600);assert.equal(at(p,1,0).pitchClamped,true);assert.ok(at(p,1,2).cutoffHz<=3600);
 assert.throws(()=>expressionControlTimeline(p,10000),/Control rate/);
});
test('control timeline contains exact message and release corners, with pre-event limits for steps',()=>{
 const p=createExpressionPerformance(composeExpressiveChord()),timeline=expressionControlTimeline(p);
 for(const e of p.score.events){const point=timeline.find(x=>x.time===e.time);assert.ok(point?.step);if(e.time>0)assert.ok(point.leftTime<e.time);}
 for(const v of p.voices)assert.ok(timeline.some(x=>x.time===v.end));
 assert.equal(timeline.at(-1).time,p.duration);
});

test('visible bodies return to the same pose after reverse seeking and retire independently',async()=>{
 const {expressionSceneFrame}=await import('../src/expressive/scene.js');
 const p=createExpressionPerformance(composeExpressiveChord());
 const pose=expressionSceneFrame(p,3.1);expressionSceneFrame(p,p.duration);assert.deepEqual(expressionSceneFrame(p,3.1),pose);
 assert.equal(pose.bodies[1].detached,true);assert.equal(pose.bodies[3].detached,false);
 const tail=expressionSceneFrame(p,4.5);assert.equal(tail.bodies[0].active,false);assert.equal(tail.bodies[3].active,true);
 assert.ok(expressionSceneFrame(p,p.duration).bodies.every(b=>!b.active&&b.level===0&&b.aperture===0));
});

test('compiled instrument evaluation matches plain score replay at boundaries and prevents score mutation',()=>{
 const performance=createExpressionPerformance(composeExpressiveChord()),plain=JSON.parse(JSON.stringify(performance));
 for(const event of performance.score.events)for(const delta of [-1e-9,0,1e-9,.01]){const t=Math.max(0,event.time+delta);assert.deepEqual(expressionFrame(performance,t),expressionFrame(plain,t));}
 assert.throws(()=>{performance.score.mapping.smoothingSeconds=.1;},TypeError);
 assert.throws(()=>{performance.score={};},TypeError);
});
