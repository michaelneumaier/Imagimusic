import {mixImpulseRecording} from '../src/touch/session.js';
import {createGroveSession} from '../src/grove/session.js';
import {createGroveBankJob} from '../src/grove/render-job.js';
import {composeGrove,composeGroveGreeting,greetingStrikes} from '../src/score/grove.js';
import {scheduleTouchImpulse,scheduleTouchFade} from '../src/touch/transport.js';

const $=id=>document.getElementById(id),report={version:2,criteria:{mixMaxDifference:1e-6,repeatMaxDifference:1e-7,maxPeak:.9},generated:new Date().toISOString(),userAgent:navigator.userAgent,results:[]};
async function graph(recording,bank,length){
 const context=new OfflineAudioContext(2,length,recording.sampleRate),master=context.createGain();master.connect(context.destination);
 const buffers=bank.map(pcm=>{const buffer=context.createBuffer(2,pcm.channels[0].length,pcm.sampleRate);pcm.channels.forEach((samples,c)=>buffer.copyToChannel(samples,c));return buffer;});
 for(const event of recording.events)scheduleTouchImpulse(context,buffers[event.body],master,{when:event.frame/recording.sampleRate,velocity:event.velocity});
 if(recording.ended)scheduleTouchFade(context,master,recording.ended.frame/recording.sampleRate,recording.ended.fadeFrames);
 const result=await context.startRendering();master.disconnect();return [result.getChannelData(0),result.getChannelData(1)];
}
function compare(a,b){let maxDifference=0,peak=0,energy=0,residual=0;for(let c=0;c<2;c++)for(let i=0;i<a[c].length;i++){if(!Number.isFinite(a[c][i])||!Number.isFinite(b[c][i]))throw new Error('Non-finite sample');const d=a[c][i]-b[c][i];maxDifference=Math.max(maxDifference,Math.abs(d));peak=Math.max(peak,Math.abs(a[c][i]));energy+=a[c][i]**2;residual+=d*d;}return {maxDifference,peak,relativeRmsDb:residual?10*Math.log10(residual/energy):null};}
try{
 for(const [setting,sampleRate,quiet] of [[3,48000,false],[3,48000,true],[7,44100,false],[7,44100,true],[11,48000,false],[11,48000,true]]){
  $('status').textContent=`Checking ${setting}, ${sampleRate} Hz, ${quiet?'with Quiet':'full tail'}…`;
  const grove=composeGrove({seed:setting}),session=createGroveSession(grove,sampleRate);
  for(const note of greetingStrikes(composeGroveGreeting(grove))){const admitted=session.strike({frame:Math.round(note.time*sampleRate),body:note.body,velocity:note.velocity});if(!admitted.accepted)throw new Error('Fixture admission failed');}
  if(quiet)session.finish(Math.round(9.13729*sampleRate));
  const record=session.snapshot(),bank=await createGroveBankJob(grove,sampleRate).promise,expected=mixImpulseRecording(record,bank),a=await graph(record,bank,expected.channels[0].length),b=await graph(record,bank,expected.channels[0].length);
  const comparison=compare(a,expected.channels),repeat=compare(a,b);
  if(comparison.maxDifference>report.criteria.mixMaxDifference||repeat.maxDifference>report.criteria.repeatMaxDifference||comparison.peak>.9)throw new Error('Mix, repeatability or peak criterion failed: '+JSON.stringify({comparison,repeat}));
  report.results.push({setting,sampleRate,quiet,frames:a[0].length,comparison,repeat});$('report').textContent=JSON.stringify(report,null,2);
 }
 report.passed=true;$('status').textContent='6/6 live-scheduler versus saved-mix checks passed.';
}catch(error){report.passed=false;report.error=error.message;$('status').textContent='FAILED · '+error.message;}
$('report').textContent=JSON.stringify(report,null,2);$('save').disabled=false;$('save').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='grove-audio-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};
