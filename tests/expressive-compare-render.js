import {createExpressionPerformance} from '../src/expressive/performance.js';
import {renderExpressionAudio} from '../src/expressive/audio.js';
import {encodeWav} from '../src/model.js';
const $=id=>document.getElementById(id),base='../renders/expressive-compare/',enc=new TextEncoder();
const sha=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
let revision=0;
async function read(name){const response=await fetch(base+name);if(!response.ok)throw new Error(`Prepare ${name} with tools/compare-expressive-study.mjs first.`);return response.text();}
function download(label,name,data,type){const button=document.createElement('button');button.textContent=label;button.onclick=()=>{const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};$('downloads').append(button);}
function pcmBytes(pcm){const values=pcm.channels[0];return new Uint8Array(values.buffer,values.byteOffset,values.byteLength);}
$('run').onclick=async()=>{
 const own=++revision,current=()=>own===revision;$('run').disabled=true;$('downloads').replaceChildren();$('report').textContent='';
 try{
  $('status').textContent='Verifying saved inputs…';
  const [text,aText,bText]=await Promise.all(['comparison.json','composed.json','note-only.json'].map(read));
  const metadata=JSON.parse(text),texts={composed:aText,'note-only':bText};
  if(!metadata.patchSnapshot||typeof metadata.patchSnapshot!=='object')throw new Error('Comparison must include the exact patchSnapshot.');
  const patchSha256=await sha(enc.encode(JSON.stringify(metadata.patchSnapshot)));
  if(patchSha256!==metadata.patchSha256)throw new Error('Patch snapshot hash mismatch.');
  const report={version:1,userAgent:navigator.userAgent,generated:new Date().toISOString(),comparisonSha256:await sha(enc.encode(text)),patchSha256,results:[],passed:false};
  const outputs=[];
  for(const key of ['composed','note-only']){
   if(!current())return;
   const expected=metadata.scores[key==='composed'?'composed':'noteOnly'],scoreSha256=await sha(enc.encode(texts[key]));
   if(scoreSha256!==expected.sha256)throw new Error(`${key} score hash mismatch.`);
   const p=createExpressionPerformance(JSON.parse(texts[key]),metadata.patchSnapshot,metadata.sampleRate);
   if(p.duration!==metadata.duration)throw new Error(`${key} duration does not match authored comparison.`);
   $('status').textContent=`Rendering ${key} twice at ${p.sampleRate} Hz…`;
   const started=performance.now(),a=await renderExpressionAudio(p);if(!current())return;
   const b=await renderExpressionAudio(p);if(!current())return;
   const av=pcmBytes(a),bv=pcmBytes(b),values=a.channels[0];
   if(av.length!==bv.length||av.some((v,i)=>v!==bv[i]))throw new Error(`${key} repeated Float32 bytes differ.`);
   let peak=0,tailPeak=0,energy=0;
   for(let i=0;i<values.length;i++){const v=values[i];if(!Number.isFinite(v))throw new Error('Nonfinite output.');peak=Math.max(peak,Math.abs(v));energy+=v*v;if(i>=values.length-Math.round(p.sampleRate*.1))tailPeak=Math.max(tailPeak,Math.abs(v));}
   if(peak<1e-5||peak>=.98||tailPeak!==0)throw new Error(`${key} output level or final silence check failed.`);
   const wav=encodeWav(values,p.sampleRate);
   report.results.push({key,scoreSha256,sampleRate:p.sampleRate,frames:values.length,duration:p.duration,peak,rms:Math.sqrt(energy/values.length),final100msPeak:tailPeak,repeatFloat32Exact:true,pcmSha256:await sha(av),wavSha256:await sha(wav),renderPairMs:performance.now()-started});
   outputs.push({key,wav});$('report').textContent=JSON.stringify(report,null,2);
  }
  if(!current())return;
  if(report.results[0].frames!==report.results[1].frames)throw new Error('Examples have different frame counts.');
  report.passed=true;report.limits='Within-browser offline repeatability and file identity; no normalisation, device output, perceptual-quality or cross-engine equality claim.';
  for(const {key,wav}of outputs)download(`Keep ${key} WAV`,`${key}.wav`,wav,'audio/wav');
  download('Keep verification report','browser-verification.json',JSON.stringify(report,null,2)+'\n','application/json');
  $('report').textContent=JSON.stringify(report,null,2);$('status').textContent='2/2 exact repeated renders passed. Keep both WAVs and the report for the listening page.';
 }catch(error){if(current())$('status').textContent='FAILED · '+error.message;}
 finally{if(current())$('run').disabled=false;}
};
window.addEventListener('pagehide',()=>{revision++;$('run').disabled=false;});
