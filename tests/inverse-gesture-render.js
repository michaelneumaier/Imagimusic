import {INVERSE_SHARED_GESTURE_EVENTS as sharedGesture} from '../src/score/grove-inverse-gesture.js';
import {createInverseJobs} from '../src/inverse/jobs.js';
import {createInverseTransport} from '../src/inverse/transport.js';
const rate=8000,tolerance=1e-7;
const button=document.querySelector('#run'),result=document.querySelector('#result');
const assert=(yes,message)=>{if(!yes)throw new Error(message);};
async function render(prepared,mode){
 const frames=prepared.frames+rate,offline=new OfflineAudioContext(2,frames,rate);
 const context={sampleRate:rate,destination:offline.destination,state:'running',get currentTime(){return offline.currentTime;},createGain:()=>offline.createGain(),createBuffer:(...args)=>offline.createBuffer(...args),createBufferSource:()=>offline.createBufferSource()};
 const transport=createInverseTransport(context);let stopped=null;
 try{
  transport.mount(prepared);const origin=transport.playGesture(sharedGesture);
  const pending=transport.snapshot();assert(pending.active===0&&pending.pending===3&&pending.strikes.length===0,'Upcoming touches leaked into the picture');
  if(mode==='before'){transport.quiet();stopped=0;}
  const pause=mode==='during'?offline.suspend(.256):null,done=offline.startRendering();
  if(pause){await pause;const state=transport.snapshot();assert(state.active===1&&state.pending===2,'Half-second gap has wrong source counts');stopped=offline.currentTime;transport.quiet();assert(transport.snapshot().active+transport.snapshot().pending===0,'Quiet retained sources');await offline.resume();}
  const buffer=await done,ending=transport.snapshot();assert(ending.active+ending.pending===0,'Sources remain after the natural ending');
  let maxError=0,maxAt=null,firstError=0,nonzero=0,tailNonzero=0;const peak=[0,0],firstEnergy=[0,0],firstFrame=Math.round(origin*rate),answerFrame=Math.round((origin+.5)*rate);
  const tailFrame=stopped===null?Math.ceil((origin+.5)*rate)+prepared.frames:Math.round(stopped*rate);
  for(let c=0;c<2;c++){
   const channel=buffer.getChannelData(c);
   for(let i=0;i<frames;i++){
    let expected=0;
    if(stopped===null||i<Math.round(stopped*rate))for(const event of sharedGesture){const k=i-Math.round((origin+event.at)*rate);if(k>=0&&k<prepared.frames)expected+=prepared.strikes[event.body].channels[c][k];}
    const value=channel[i];assert(Number.isFinite(value),'Non-finite audio');if(Math.abs(value-expected)>maxError){maxError=Math.abs(value-expected);maxAt={c,i,value,expected};}peak[c]=Math.max(peak[c],Math.abs(value));if(value!==0){nonzero++;if(i>=tailFrame)tailNonzero++;}
    if(i>=firstFrame&&i<answerFrame){firstEnergy[c]+=value*value;firstError=Math.max(firstError,Math.abs(value-expected));}
   }
  }
  assert(tailNonzero===0,'Sound appears after the declared ending');assert(mode==='before'?nonzero===0:nonzero>0,'Unexpected silence or sound');
  return {mode,origin,stopped,frames,maxError,maxAt,firstError,nonzero,tailNonzero,peak,peakDbFS:peak.map(v=>v?20*Math.log10(v):null),firstHalfSecondRightMinusLeftDb:firstEnergy.every(v=>v>0)?10*Math.log10(firstEnergy[1]/firstEnergy[0]):null};
 }finally{transport.dispose();}
}
button.onclick=async()=>{
 button.disabled=true;result.textContent='Fitting two anatomies and rendering six silent cases…';const jobs=createInverseJobs();
 try{
  const response=await fetch('./fixtures/inverse-kept-chain.json');assert(response.ok,'Fixture unavailable');const fixture=await response.json();
  const report=await jobs.run({kind:'search',target:fixture.target,options:{baseMidi:48,seed:19,budget:{restarts:6,iterations:300,maxEvaluations:60000}}}),checks=[];
  assert(report.candidates.length===2&&report.candidates.every(c=>c.status==='accepted'),'Default candidates did not fit');
  for(const candidate of report.candidates){const prepared=await jobs.run({kind:'candidate',grove:candidate.grove,sampleRate:rate});for(const mode of ['full','during','before'])checks.push({topology:candidate.topology,...await render(prepared,mode)});}
  result.replaceChildren();
  const summary=document.createElement('p'),passed=checks.every(check=>check.maxError<tolerance);
  summary.textContent=`${passed?'PASS':'FAIL'}: ${checks.length} real offline gesture cases; PCM tolerance ${tolerance}; maximum error ${Math.max(...checks.map(check=>check.maxError))}. Exact-zero endings verified in every case. ${navigator.userAgent}`;result.append(summary);
  for(const check of checks){const row=document.createElement('p');row.textContent=JSON.stringify(check);result.append(row);}

 }catch(error){result.textContent='FAIL: '+error.message;}finally{jobs.cancel();button.disabled=false;}
};
