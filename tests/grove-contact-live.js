import {createRestHost} from '../src/grove/contact-host.js';
import {composeGrove} from '../src/score/grove.js';
import {groveMovieAudioEvidence} from '../src/grove/movie-audio.js';
const $=id=>document.getElementById(id);let report;
$('run').onclick=async()=>{
 $('run').disabled=true;const decisions=[],states=[];let done,failed,timer,host;const finished=new Promise((resolve,reject)=>{done=resolve;failed=reject;});finished.catch(()=>{});
 try{
  host=createRestHost({onChange:({state,error})=>{states.push(state);$('status').textContent=state;if(state==='error')failed(error);if(state==='ended')done();},onDecision:ack=>decisions.push(ack)});
  await host.enable(composeGrove({seed:3}));if(host.state!=='ready')throw new Error('Live context did not start');
  timer=setTimeout(()=>failed(new Error('Live ending timed out')),10000);
  host.send({kind:'strike',body:0,position:1,velocity:.35});await new Promise(r=>setTimeout(r,180));host.send({kind:'contact',body:0,zone:2,strength:1});
  await new Promise(r=>setTimeout(r,300));const visual=host.visual();if(!visual.envelope?.some(v=>v>0)||!visual.contacts?.[0])throw new Error('No shared-model contact picture arrived');
  host.send({kind:'contact',body:0,zone:null});await new Promise(r=>setTimeout(r,300));host.quiet();await finished;
  const record=host.recording(),pcm=await host.saveAudio(),evidence=await groveMovieAudioEvidence(pcm,'rest-live.wav');
  if(record.events.length!==1||record.contacts.length!==1||decisions.some(a=>!a.accepted)||pcm.channels[0].length!==record.ended.frame+record.ended.fadeFrames)throw new Error('Live passage was incomplete');
  report={passed:true,generated:new Date().toISOString(),userAgent:navigator.userAgent,states,decisions,visual,record,audio:evidence.audio};$('status').textContent='Passed · live audio, contact picture, completion and worker-rendered capture.';
 }catch(error){report={passed:false,error:error.message};$('status').textContent='FAILED · '+error.message;}finally{clearTimeout(timer);host?.dispose();$('run').disabled=false;}
 $('report').textContent=JSON.stringify(report,null,2);$('save').disabled=false;
};
$('save').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='grove-contact-live-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};
