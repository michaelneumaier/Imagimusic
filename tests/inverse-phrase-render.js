import {createInverseJobs} from '../src/inverse/jobs.js';
import {createInverseTransport} from '../src/inverse/transport.js';
import {createInversePhraseCapture} from '../src/inverse/phrase-capture.js';
import {inversePhraseTransportEvents,inverseAnatomySha256} from '../src/score/grove-inverse-phrase.js';
const rate=8000,tolerance=1e-7,button=document.querySelector('#run'),result=document.querySelector('#result');
const assert=(yes,message)=>{if(!yes)throw new Error(message);};
function graph(prepared){
 const offline=new OfflineAudioContext(2,prepared.frames+2*rate,rate);
 const context={sampleRate:rate,destination:offline.destination,state:'running',get currentTime(){return offline.currentTime;},createGain:()=>offline.createGain(),createBuffer:(...args)=>offline.createBuffer(...args),createBufferSource:()=>offline.createBufferSource()};
 const transport=createInverseTransport(context);transport.mount(prepared);return {offline,transport};
}
async function captureManual(prepared){
 const {offline,transport}=graph(prepared),capture=createInversePhraseCapture(),receipts=[];
 // These are exact 128-frame render boundaries at 8 kHz, not wall-clock waits.
 const times=[.064,.432,.864],bodies=[1,0,2],pauses=times.map(t=>offline.suspend(t));
 capture.begin({anatomySha256:await inverseAnatomySha256(prepared.grove),sampleRate:rate,capturedAt:'2026-11-02T09:00:00.000Z'});
 try{
  const done=offline.startRendering();
  for(let i=0;i<pauses.length;i++){
   await pauses[i];const receipt=transport.strikeWithReceipt(bodies[i]);assert(receipt!==null,'Manual touch refused');
   assert(receipt.time===offline.currentTime,'Receipt differs from audio clock at admission');assert(receipt.time===times[i],'Offline pause is not on its expected frame');
   receipts.push(receipt);capture.admit(receipt);await offline.resume();
  }
  const phrase=capture.finish().phrase;assert(phrase!==null,'Capture did not complete');
  const buffer=await done;return {phrase,receipts,origin:receipts[0].time,channels:[buffer.getChannelData(0).slice(),buffer.getChannelData(1).slice()]};
 }finally{transport.dispose();}
}
async function replay(prepared,phrase){
 const {offline,transport}=graph(prepared);
 try{const origin=transport.playGesture(inversePhraseTransportEvents(phrase)),buffer=await offline.startRendering();return {origin,channels:[buffer.getChannelData(0).slice(),buffer.getChannelData(1).slice()]};}
 finally{transport.dispose();}
}
function againstPrepared(output,prepared,events){
 let maxError=0,nonzero=0,tailNonzero=0;const start=Math.round(output.origin*rate),end=start+Math.round(events.at(-1).at*rate)+prepared.frames;
 for(let c=0;c<2;c++)for(let i=0;i<output.channels[c].length;i++){
  let expected=0;for(const event of events){const k=i-start-Math.round(event.at*rate);if(k>=0&&k<prepared.frames)expected+=prepared.strikes[event.body].channels[c][k];}
  const value=output.channels[c][i];assert(Number.isFinite(value),'Non-finite audio');maxError=Math.max(maxError,Math.abs(value-expected));if(value!==0){nonzero++;if(i>=end)tailNonzero++;}
 }
 assert(nonzero>0,'Unexpected silent phrase');assert(tailNonzero===0,'Phrase has a nonzero ending');return {maxError,nonzero,tailNonzero};
}
button.onclick=async()=>{
 button.disabled=true;result.textContent='Capturing audio-clock touches and rendering their return…';const jobs=createInverseJobs();
 try{
  const response=await fetch('./fixtures/inverse-kept-chain.json');assert(response.ok,'Fixture unavailable');const fixture=await response.json();
  const report=await jobs.run({kind:'search',target:fixture.target,options:{baseMidi:48,seed:19,budget:{restarts:6,iterations:300,maxEvaluations:60000}}});
  assert(report.candidates.length===2&&report.candidates.every(c=>c.status==='accepted'),'Both default anatomies must fit');
  const bank=[];for(const candidate of report.candidates)bank.push(await jobs.run({kind:'candidate',grove:candidate.grove,sampleRate:rate}));
  const captured=await captureManual(bank[0]),events=inversePhraseTransportEvents(captured.phrase);
  assert(JSON.stringify(events)===JSON.stringify([{body:1,at:0},{body:0,at:.368},{body:2,at:.8}]),'Receipt-relative events changed');
  const same=await replay(bank[0],captured.phrase),other=await replay(bank[1],captured.phrase);
  const checks=[{case:'captured manual touches',...againstPrepared(captured,bank[0],events)},{case:'same anatomy replay',...againstPrepared(same,bank[0],events)},{case:'other anatomy replay',...againstPrepared(other,bank[1],events)}];
  let replayError=0;const from=Math.round(captured.origin*rate),to=Math.round(same.origin*rate),length=bank[0].frames+Math.round(events.at(-1).at*rate);
  for(let c=0;c<2;c++)for(let i=0;i<length;i++)replayError=Math.max(replayError,Math.abs(captured.channels[c][from+i]-same.channels[c][to+i]));
  const passed=checks.every(c=>c.maxError<tolerance)&&replayError<tolerance;
  result.replaceChildren();
  for(const value of [`${passed?'PASS':'FAIL'}: three rendered cases; capture/replay shifted PCM error ${replayError}; tolerance ${tolerance}.`,{receipts:captured.receipts,phrase:captured.phrase},...checks,{userAgent:navigator.userAgent,scope:'Real offline clock, nodes, receipts and replay. No native capture UI or device playback evidence.'}]){const row=document.createElement('pre');row.textContent=typeof value==='string'?value:JSON.stringify(value,null,2);result.append(row);}
 }catch(error){result.textContent='FAIL: '+error.message;}finally{jobs.cancel();button.disabled=false;}
};
