import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareLoomAudio} from '../src/stage/loom-audio.js';
import {LOOM_MIX_GAIN} from '../src/stage/composition.js';
const performance={loom:{settings:{frequency:196},events:[{time:1.2,body:1,velocity:.5,end:20}]}};
const pcm={channels:[new Float32Array([.1,.2]),new Float32Array([.3,.4])],sampleRate:48000};
function fakeContext(){
 const nodes=[];
 return {nodes,sampleRate:48000,currentTime:4,createBuffer:(channels,length,sampleRate)=>({channels,length,sampleRate,copied:[],copyToChannel(data,i){this.copied[i]=data;}}),
 createGain(){const node={gain:{value:0,cancelScheduledValues(){},setValueAtTime(v,t){this.set=[v,t];},linearRampToValueAtTime(v,t){this.ramp=[v,t];}},connect(target){this.target=target;},disconnect(){this.disconnected=true;}};nodes.push(node);return node;},
 createBufferSource(){const node={connect(target){this.target=target;},start(t){this.started=t;},stop(t){this.stopped=t;},disconnect(){this.disconnected=true;}};nodes.push(node);return node;}};
}
test('Loom live adapter renders the exact score, starts on shared origin and fades through the shared master',async()=>{
 const context=fakeContext(),master={},requests=[];
 const player=await prepareLoomAudio(performance,context,master,{createJob:input=>{requests.push(input);return {promise:Promise.resolve(pcm),cancel(){}};}});
 assert.deepEqual(requests[0].score,[{time:1.2,body:1,velocity:.5}]);assert.equal(context.nodes.length,0);
 player.start(8);const [gain,source]=context.nodes;
 assert.equal(source.started,8);assert.equal(source.target,gain);assert.equal(gain.target,master);assert.equal(gain.gain.value,LOOM_MIX_GAIN);
 assert.deepEqual(source.buffer.copied,pcm.channels);assert.throws(()=>player.start(9));
 player.stop();assert.deepEqual(gain.gain.ramp,[0,4.025]);assert.equal(source.stopped,4.03);
 source.onended();assert.equal(source.disconnected,true);assert.equal(gain.disconnected,true);
});
test('cancelled or disabled Loom preparation never allocates playback nodes',async()=>{
 const context=fakeContext(),controller=new AbortController();let reject;
 const preparing=prepareLoomAudio(performance,context,{}, {signal:controller.signal,createJob:()=>({promise:new Promise((_,r)=>reject=r),cancel:()=>reject(new DOMException('cancel','AbortError'))})});
 controller.abort();await assert.rejects(preparing,{name:'AbortError'});assert.equal(context.nodes.length,0);
 assert.equal(await prepareLoomAudio({},context,{}),null);
});
