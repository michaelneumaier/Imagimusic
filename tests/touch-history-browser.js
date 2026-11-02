import {createTouchSession} from '../src/touch/session.js';
import {prepareTouchHistory} from '../src/touch/history.js';
import {prepareTouchHistoryComparison} from '../src/touch/history-comparison.js';
import {createTouchReturnSession} from '../src/touch/return-session.js';
import {createInverseJobs} from '../src/inverse/jobs.js';
const output=document.getElementById('result');
const workerJobs=createInverseJobs({makeWorker:()=>new Worker(new URL('../src/touch/history-worker.js',import.meta.url),{type:'module'})});
const comparisonJobs=createInverseJobs({makeWorker:()=>new Worker(new URL('../src/touch/history-comparison-worker.js',import.meta.url),{type:'module'})});
let dispatched=null;
// Observe actual dispatch, without delaying or replacing the real worker.
const jobs={cancel:()=>workerJobs.cancel(),run(payload){const pending=workerJobs.run(payload);dispatched?.();dispatched=null;return pending;}};
const session=createTouchReturnSession({jobs});
const assert=(value,message)=>{if(!value)throw Error(message);};
const equal=(a,b,message)=>assert(JSON.stringify(a)===JSON.stringify(b),message);
const outcome=promise=>promise.then(value=>({value}),error=>({error}));
const file=(record,name)=>new File([JSON.stringify(record)],name,{type:'application/json'});
const waitForDispatch=()=>new Promise(resolve=>{dispatched=resolve;});
try{
 const live=createTouchSession({frequency:196,coupling:.004,detune:40,loss:.45},8000);
 live.strike({frame:0,body:0,velocity:.6});live.strike({frame:5704,body:1,velocity:.5});live.finish(32000);
 const record=live.snapshot(),source=file(record,'first.json'),first=await session.open(source);
 const {name,...history}=first;
 equal(history,prepareTouchHistory(record),'Worker history differs from direct builder.');assert(name==='first.json','Source name changed.');
 const invalid=await outcome(session.open(new File(['{}'],'invalid.json')));
 assert(invalid.error?.message.includes('missing or unknown'),'Invalid file was not refused.');assert(session.result===first,'Invalid replacement overwrote history.');
 let started=waitForDispatch();const cancelled=outcome(session.open(source));await started;session.cancel();
 assert((await cancelled).error?.name==='AbortError','Dispatched cancellation did not abort.');assert(session.result===first&&session.state==='ready','Cancel lost previous result.');
 started=waitForDispatch();const older=outcome(session.open(source));await started;
 const replacement=structuredClone(record);replacement.events[0].velocity=.3;
 const newer=await session.open(file(replacement,'replacement.json'));
 assert((await older).error?.name==='AbortError','Superseded dispatch did not abort.');
 assert(session.result===newer&&newer.name==='replacement.json','Replacement did not remain current.');
 const {name:replacementName,...replacementHistory}=newer;
 equal(replacementHistory,prepareTouchHistory(replacement),'Replacement history mismatch.');
 const comparison=await comparisonJobs.run({record,targetId:'close-kin'});
 equal(comparison,prepareTouchHistoryComparison(record,'close-kin'),'Comparison worker mismatch.');
 assert(session.result===newer,'Separate comparison altered source result.');
 output.textContent='PASS 5/5\nReal File and history worker match the direct builder exactly.\nInvalid replacement retains prior history.\nCancellation after worker dispatch retains prior history.\nSuperseded dispatched work aborts; the newer file remains current.\nReal comparison worker matches direct builder and leaves source independent.\nNo audio, native cancel-button timing, or device-performance claim.';
}catch(error){output.textContent='FAIL: '+error.message;}finally{session.dispose();comparisonJobs.cancel();}
