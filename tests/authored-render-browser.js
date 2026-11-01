import {DEFAULT_PATCH} from '../src/model.js';
import {DEFAULT_TENSIONER} from '../src/fm.js';
import {DEFAULT_COMPOSITION} from '../src/stage/composition.js';
import {createAuthoredPerformance} from '../src/stage/authored-performance.js';
import {renderPerformanceAudio,compareRenders} from '../src/stage/render-audio.js';
const $=id=>document.getElementById(id);
const composition={...structuredClone(DEFAULT_COMPOSITION),version:2,loom:{...DEFAULT_COMPOSITION.loom,enabled:true},fm:{enabled:true,settings:{...DEFAULT_TENSIONER}}};
const recipe={events:[
 {id:'opening',family:'garden',slot:2,time:.35,velocity:.5,position:.1},
 {id:'response',family:'garden',slot:5,time:1.2,velocity:.4,position:.8},
 {id:'tine',family:'tine',time:2,velocity:.3,position:.25},
 ...Array.from({length:8},(_,i)=>({id:`breath-${i}`,family:'bellows',time:3+i*.1,noteHz:130.8128*2**(i/12),noteOff:5,velocity:.3})),
],loomScore:[{time:5,body:0,velocity:.5},{time:6,body:1,velocity:.4}],fmTime:7,holdUntil:40};
let report;
function assert(value,message){if(!value)throw new Error(message);}
$('run').onclick=async()=>{
 $('run').disabled=true;$('save').disabled=true;report={generated:new Date().toISOString(),userAgent:navigator.userAgent,recipe,composition,results:[]};
 try{
  for(const sampleRate of [44100,48000]){
   $('result').textContent=`Rendering authored score twice at ${sampleRate} Hz…`;
   const p=createAuthoredPerformance(DEFAULT_PATCH,recipe,composition,sampleRate);
   assert(p.snapshots.bellows.voices.some(v=>v.stolenAt!==undefined),'Fixture must exercise chamber stealing');
   const a=await renderPerformanceAudio(p,sampleRate),b=await renderPerformanceAudio(p,sampleRate),comparison=compareRenders(a,b,sampleRate);
   assert(comparison.identical,`Repeated authored audio differed at ${sampleRate} Hz: ${comparison.maxDiff}`);
   let peak=0,tailPeak=0,sum=0;for(let i=0;i<a.length;i++){const v=a[i];assert(Number.isFinite(v),'Nonfinite audio');peak=Math.max(peak,Math.abs(v));sum+=v*v;if(i>=a.length-Math.round(sampleRate*.5))tailPeak=Math.max(tailPeak,Math.abs(v));}
   assert(peak>.01&&peak<1,'Audio must be audible and bounded');assert(tailPeak<.001,'Last half-second must settle below -60 dBFS');
   assert(a.length===Math.ceil(p.duration*sampleRate),'Duration must include full hold and tails');
   report.results.push({sampleRate,passed:true,samples:a.length,duration:p.duration,peak,rms:Math.sqrt(sum/a.length),tailHalfSecondPeak:tailPeak,bellowsSteals:p.snapshots.bellows.voices.filter(v=>v.stolenAt!==undefined).length,comparison});
  }
  report.passed=true;
 }catch(error){report.passed=false;report.error=error.message;}
 finally{$('result').textContent=JSON.stringify(report,null,2);$('save').disabled=false;$('run').disabled=false;}
};
$('save').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='authored-render-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);};
