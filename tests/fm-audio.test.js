import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareFMAudio} from '../src/stage/fm-audio.js';
import {FM_MIX_GAIN} from '../src/stage/composition.js';
const performance={fm:{settings:{carrierHz:220,ratio:2,index:3},time:6.25}};
const pcm={samples:new Float32Array([.1,.2]),sampleRate:48000};
function fakeContext(){
 const nodes=[];
 return {nodes,sampleRate:48000,currentTime:4,createBuffer:(channels,length,sampleRate)=>({channels,length,sampleRate,copied:[],copyToChannel(data,i){this.copied[i]=data;}}),
 createGain(){const node={gain:{value:0,cancelScheduledValues(){},setValueAtTime(v,t){this.set=[v,t];},linearRampToValueAtTime(v,t){this.ramp=[v,t];}},connect(target){this.target=target;},disconnect(){this.disconnected=true;}};nodes.push(node);return node;},
 createBufferSource(){const node={connect(target){this.target=target;},start(t){this.started=t;},stop(t){this.stopped=t;},disconnect(){this.disconnected=true;}};nodes.push(node);return node;}};
}
test('FM live adapter renders the exact score, starts on shared origin and fades through the shared master',async()=>{
 const context=fakeContext(),master={},requests=[];
 const player=await prepareFMAudio(performance,context,master,{createJob:input=>{requests.push(input);return {promise:Promise.resolve(pcm),cancel(){}};}});
 assert.deepEqual(requests[0],{settings:performance.fm.settings,sampleRate:48000});assert.equal(context.nodes.length,0);
 player.start(8);const [gain,source]=context.nodes;
 assert.equal(source.started,14.25);assert.equal(source.target,gain);assert.equal(gain.target,master);assert.equal(gain.gain.value,FM_MIX_GAIN);
 assert.deepEqual(source.buffer.copied,[pcm.samples]);assert.throws(()=>player.start(9));
 player.stop();assert.deepEqual(gain.gain.ramp,[0,4.025]);assert.equal(source.stopped,4.03);
 source.onended();assert.equal(source.disconnected,true);assert.equal(gain.disconnected,true);
});
test('cancelled or disabled FM preparation never allocates playback nodes',async()=>{
 const context=fakeContext(),controller=new AbortController();let reject;
 const preparing=prepareFMAudio(performance,context,{}, {signal:controller.signal,createJob:()=>({promise:new Promise((_,r)=>reject=r),cancel:()=>reject(new DOMException('cancel','AbortError'))})});
 controller.abort();await assert.rejects(preparing,{name:'AbortError'});assert.equal(context.nodes.length,0);
 assert.equal(await prepareFMAudio({},context,{}),null);
});

test('FM ignores a worker that resolves after cancellation and cannot start after stopping',async()=>{
 const context=fakeContext(),controller=new AbortController();let resolve;
 const pending=prepareFMAudio(performance,context,{}, {signal:controller.signal,createJob:()=>({promise:new Promise(r=>resolve=r),cancel(){}})});
 controller.abort();resolve(pcm);await assert.rejects(pending,{name:'AbortError'});assert.equal(context.nodes.length,0);
 const prepared=await prepareFMAudio(performance,context,{}, {createJob:()=>({promise:Promise.resolve(pcm),cancel(){}})});
 prepared.stop();assert.throws(()=>prepared.start(10));assert.equal(context.nodes.length,0);
});
