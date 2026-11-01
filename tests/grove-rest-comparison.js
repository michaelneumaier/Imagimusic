import {composeGrove} from '../src/score/grove.js';
import {createGroveRestRecipe} from '../src/score/grove-rest.js';
import {createRestComparisonSession} from '../src/grove/rest-comparison-session.js';
const $=id=>document.getElementById(id);let report;
const hash=async samples=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',samples)),byte=>byte.toString(16).padStart(2,'0')).join('');
$('run').onclick=async()=>{
 $('run').disabled=true;$('save').disabled=true;$('result').textContent='Preparing and transferring a comparison through a real module worker…';
 const session=createRestComparisonSession();
 try{
  const source=createGroveRestRecipe(composeGrove({seed:11}),undefined,{sampleRate:8000});
  const record={version:2,kind:'imagimusic-grove-rest',grove:source.grove,voice:source.voice,sampleRate:8000,outputGain:source.outputGain,zones:source.zones,strengths:source.strengths,
   events:Array.from({length:11},(_,order)=>({frame:0,order,body:0,position:2,velocity:1})),contacts:[{body:1,zone:1,strength:0,start:80,end:600,order:11}],ended:{frame:800,fadeFrames:200}};
  const before=JSON.stringify(record),result=await session.prepare(record,3);
  const hashes=await Promise.all(result.pcm.channels.map(hash));
  const pending=session.prepare(record,7);session.cancel();let cancellation=false;
  try{await pending;}catch(error){cancellation=error.name==='AbortError';}
  const checks={transferredPCM:result.pcm.channels.every(c=>c instanceof Float32Array&&c.length===1000),expectedOmissions:result.kept===6&&result.dropped.length===5&&!result.complete,sourceUnchanged:JSON.stringify(record)===before,pictureEnding:result.picture.duration===.125,cancelledWorker:cancellation,previousResultRetained:session.result===result};
  report={createdAt:new Date().toISOString(),checks,passed:Object.values(checks).every(Boolean),hashes,source:record,target:result.record,note:result.note,sampleFrames:result.pcm.channels[0].length};
  $('result').textContent=JSON.stringify({...report,source:'included in saved report',target:'included in saved report'},null,2);$('save').disabled=false;
 }catch(error){$('result').textContent=`FAIL: ${error.stack??error.message}`;}finally{session.dispose();$('run').disabled=false;}
};
$('save').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='rest-comparison-worker-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};
