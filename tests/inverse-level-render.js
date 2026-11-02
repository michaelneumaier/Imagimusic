import {composeGrove} from '../src/score/grove.js';
import {createInverseInstrument} from '../src/inverse/instrument.js';
import {createInverseTransport} from '../src/inverse/transport.js';
const rate=8000,frames=4000,tolerance=1e-7;
const button=document.querySelector('#run'),result=document.querySelector('#result');
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
async function render(prepared,level,interrupt=false){
 const offline=new OfflineAudioContext(2,frames,rate);
 // Only lifecycle state is adapted; clock reads and every audio node are real.
 const context={sampleRate:rate,destination:offline.destination,state:'running',get currentTime(){return offline.currentTime;},createGain:()=>offline.createGain(),createBuffer:(...args)=>offline.createBuffer(...args),createBufferSource:()=>offline.createBufferSource()};
 const transport=createInverseTransport(context),changes=[];
 try{
  transport.setListeningLevel(level);transport.mount(prepared);assert(transport.strike(0),'Strike not admitted');
  const paused=interrupt?offline.suspend(.064):null,done=offline.startRendering();
  if(paused){
   await paused;const first=offline.currentTime;transport.setListeningLevel(4);changes.push({time:first,level:4});
   const secondPause=offline.suspend(first+.016);await offline.resume();await secondPause;
   const second=offline.currentTime;assert(second>first&&second<first+.03,'Second update must interrupt the first ramp');
   transport.setListeningLevel(0);changes.push({time:second,level:0});await offline.resume();
  }
  const buffer=await done;return {channels:[buffer.getChannelData(0).slice(),buffer.getChannelData(1).slice()],changes};
 }finally{transport.dispose();}
}
function compare(actual,expected){let peak=0,maxError=0,nonzero=0;for(let c=0;c<2;c++)for(let i=0;i<frames;i++){const value=actual[c][i];assert(Number.isFinite(value),'Non-finite output');peak=Math.max(peak,Math.abs(value));maxError=Math.max(maxError,Math.abs(value-expected(c,i)));if(value!==0)nonzero++;}return {peak,maxError,nonzero};}
button.onclick=async()=>{
 button.disabled=true;result.textContent='Rendering four silent cases…';
 try{
  // A canonical generated fixture tests the gain graph; it is not an inverse fit.
  const instrument=createInverseInstrument(composeGrove({seed:3}),{sampleRate:rate});
  const prepared={...instrument,strikes:[0,1,2].map(body=>instrument.renderStrike(body))};
  const unity=await render(prepared,1),muted=await render(prepared,0),boost=await render(prepared,4),ramped=await render(prepared,1,true);
  const base=compare(unity.channels,(c,i)=>prepared.strikes[0].channels[c][i]);
  const zero=compare(muted.channels,()=>0),four=compare(boost.channels,(c,i)=>4*unity.channels[c][i]);
  const [first,second]=ramped.changes.map(change=>change.time),held=1+3*(second-first)/.03;
  const expectedGain=t=>t<first?1:t<second?1+3*(t-first)/.03:t<second+.03?held*(1-(t-second)/.03):0;
  const ramp=compare(ramped.channels,(c,i)=>unity.channels[c][i]*expectedGain(i/rate));
  assert(base.nonzero>0&&base.maxError<tolerance,'Unity output differs from source PCM');
  assert(zero.nonzero===0,'Muted output contains nonzero samples');
  assert(four.maxError<tolerance,'Fourfold output differs from four times unity');
  assert(ramp.maxError<tolerance,'Interrupted ramp differs from sample-time linear reference');
  const tailStart=Math.ceil((second+.03)*rate);
  assert(ramped.channels.every(channel=>channel.subarray(tailStart).every(value=>value===0)),'Ramped mute tail is not exactly zero');
  result.textContent=`PASS: unity error ${base.maxError}; muted nonzero samples ${zero.nonzero}; 4× error ${four.maxError}; ramp error ${ramp.maxError}; updates ${first}s / ${second}s; held gain ${held}; zero tail from frame ${tailStart}.\n`+JSON.stringify({status:'PASS',fixture:'canonical generated Grove seed 3, not fitted candidate',sampleRate:rate,frames,channels:2,tolerance,userAgent:navigator.userAgent,unity:base,muted:zero,fourfold:four,interruptedRamp:{...ramp,changes:ramped.changes,heldAtSecondUpdate:held,zeroTailFromFrame:tailStart},scope:'Real offline graph output; running state facade only. No native slider, real-time scheduler, or device-loudness claim.'},null,2);
 }catch(error){result.textContent='FAIL: '+error.message;}finally{button.disabled=false;}
};
