import {createPoweredHost} from '../src/grove/powered-host.js';
import {composeGrove} from '../src/score/grove.js';
const $=id=>document.getElementById(id),results=[];
const host=createPoweredHost({onChange:({state,error})=>{
 $('status').textContent=error?.message??state;$('run').disabled=['preparing','playing','ending','suspended'].includes(state);$('quiet').disabled=!$('run').disabled;
 if(state==='ended'){
  const timing=host.timing,{sampleRate,mountedFrame,requestedOriginFrame,actualOriginFrame,firstProcessFrame}=timing;
  results.push({...timing,requestedLeadFrames:requestedOriginFrame-mountedFrame,leadAtFirstProcessFrames:firstProcessFrame===null?null:actualOriginFrame-firstProcessFrame,originShiftFrames:actualOriginFrame-requestedOriginFrame,requestedLeadMs:1000*(requestedOriginFrame-mountedFrame)/sampleRate,valid:firstProcessFrame!==null&&actualOriginFrame>=firstProcessFrame&&actualOriginFrame>=requestedOriginFrame});
  $('report').textContent=JSON.stringify({kind:'powered-live-startup-timing',scope:'Audio render-clock scheduling only; not physical device latency or audio quality.',results},null,2);$('save').disabled=false;
 }
}});
$('run').onclick=()=>host.begin(composeGrove({seed:3})).catch(error=>$('status').textContent=error.message);$('quiet').onclick=()=>host.quiet();
$('save').onclick=()=>{const blob=new Blob([$('report').textContent],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='powered-live-startup-timing.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);};
window.addEventListener('pagehide',()=>host.dispose());
