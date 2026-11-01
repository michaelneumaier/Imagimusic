import {composeExpressiveChord,composeExpressiveStudy} from '../src/midi2/expression.js';
import {createExpressionPerformance} from '../src/expressive/performance.js';
import {renderExpressionAudio} from '../src/expressive/audio.js';
const report={version:2,userAgent:navigator.userAgent,generated:new Date().toISOString(),results:[]};
const $=id=>document.getElementById(id);
function compare(a,b,sampleRate){let peak=0,last100msPeak=0,maxDifference=0,energy=0,residual=0;for(let i=0;i<a.length;i++){if(!Number.isFinite(a[i])||!Number.isFinite(b[i]))throw new Error('Non-finite sample');peak=Math.max(peak,Math.abs(a[i]));const d=a[i]-b[i];maxDifference=Math.max(maxDifference,Math.abs(d));energy+=a[i]*a[i];residual+=d*d;if(i>a.length-Math.round(sampleRate*.1))last100msPeak=Math.max(last100msPeak,Math.abs(a[i]));}return {peak,last100msPeak,maxDifference,relativeRmsDb:residual?10*Math.log10(residual/energy):null};}
try{
 const focus=new URLSearchParams(location.search).get('scene');
 const cases=[['study',48000],['detachReset',48000],['detachOnly',48000],['resetOnly',48000],['detachReset',44100]].filter(([scene])=>!focus||scene===focus);
 if(!cases.length)throw new Error('No matching test cases');
 for(const [scene,sampleRate] of cases){
  $('status').textContent=`Rendering ${scene} at ${sampleRate} Hz…`;
  const p=createExpressionPerformance(scene==='study'?composeExpressiveStudy():composeExpressiveChord({scene}),undefined,sampleRate),start=performance.now();
  const a=await renderExpressionAudio(p),b=await renderExpressionAudio(p),stats=compare(a.channels[0],b.channels[0],sampleRate);
  if(stats.maxDifference!==0||stats.peak>=.98||stats.peak<1e-5||stats.last100msPeak>1e-5)throw new Error('Repeatability, peak, or settling criterion failed: '+JSON.stringify(stats));
  const result={scene,sampleRate,seconds:p.duration,samples:a.channels[0].length,renderPairMs:performance.now()-start,...stats};report.results.push(result);$('report').textContent=JSON.stringify(report,null,2);
  if(sampleRate===48000&&['study','detachReset'].includes(scene)){const dense=await renderExpressionAudio(p,{compact:false});result.compactionComparison=compare(a.channels[0],dense.channels[0],sampleRate);if(result.compactionComparison.maxDifference>1e-7)throw new Error('Compaction differs from dense schedule: '+JSON.stringify(result.compactionComparison));}
  if(scene==='detachReset'&&sampleRate===48000){const finer=await renderExpressionAudio(p,{controlRate:2000});result.controlRateComparison={from:1000,to:2000,...compare(a.channels[0],finer.channels[0],sampleRate)};$('report').textContent=JSON.stringify(report,null,2);}
 }
 report.passed=true;$('status').textContent=`${report.results.length}/${cases.length} repeated-render checks passed. Control-rate difference reported without a preselected audio threshold.`;
}catch(error){report.passed=false;report.error=error.message;$('status').textContent='FAILED · '+error.message;}
$('report').textContent=JSON.stringify(report,null,2);$('save').disabled=false;$('save').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='expressive-audio-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};
