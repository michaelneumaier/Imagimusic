import {DEFAULT_PATCH} from '../src/model.js';
import {DEFAULT_COMPOSITION,attachLoomPerformance} from '../src/stage/composition.js';
import {createPerformance} from '../src/stage/performance.js';
import {renderPerformanceAudio,compareRenders} from '../src/stage/render-audio.js';
const $=id=>document.getElementById(id);
let report;
$('run').onclick=async()=>{
 $('run').disabled=true;$('download').disabled=true;
 report={generated:new Date().toISOString(),userAgent:navigator.userAgent,sampleRate:48000,seed:DEFAULT_PATCH.seed,results:[]};
 try{
  const base=createPerformance(DEFAULT_PATCH,48000);
  $('status').textContent='Rendering base reference…';const reference=await renderPerformanceAudio(base);
  for(const [name,settings] of [['matched',{}],['detuned',{frequency:339,coupling:.02,detune:-33,loss:.8}],['uncoupled long decay',{frequency:80,coupling:0,loss:.2}]]){
   const composition=structuredClone(DEFAULT_COMPOSITION);composition.loom.enabled=true;Object.assign(composition.loom.settings,settings);
   const passage=attachLoomPerformance(base,composition);
   $('status').textContent=`Rendering ${name}, first pass…`;
   const a=await renderPerformanceAudio(passage);
   $('status').textContent=`Rendering ${name}, second pass…`;
   const b=await renderPerformanceAudio(passage),comparison=compareRenders(a,b),contribution=compareRenders(reference,a);
   let peak=0,tail=0,finite=true;
   for(let i=0;i<a.length;i++){finite&&=Number.isFinite(a[i])&&Number.isFinite(b[i]);peak=Math.max(peak,Math.abs(a[i]));if(i>=a.length-2400)tail=Math.max(tail,Math.abs(a[i]));}
   const passed=comparison.identical&&finite&&peak>.01&&peak<1&&tail<1e-3&&a.length===Math.ceil(passage.duration*48000)&&contribution.maxDiff>1e-4;
   report.results.push({name,composition,passed,comparison,contributionMaxDiff:contribution.maxDiff,peak,last50msPeak:tail,finite,samples:a.length,expectedSamples:Math.ceil(passage.duration*48000)});
  }
  report.passed=report.results.every(r=>r.passed);
 }catch(error){report.passed=false;report.error=error.message;}
 finally{$('status').textContent=JSON.stringify(report,null,2);$('run').disabled=false;$('download').disabled=false;}
};
$('download').onclick=()=>{
 const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='loom-render-report-'+report.generated.replace(/[-:]/g,'').slice(0,15)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
};
