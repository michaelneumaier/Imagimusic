import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {synthesize} from './study-sound-file-target.mjs';
import {fitJointDecays,reconstructModes} from './study-joint-decay.mjs';
import {stereoWav} from '../src/loom/model.js';
const args=process.argv.slice(2);
if(args.length!==2||args[0]!=='--audio-dir')throw Error('Usage: node tools/render-joint-decay-study.mjs --audio-dir DIRECTORY');
const directory=resolve(args[1]);mkdirSync(directory,{recursive:true});
const sampleRate=8000,seconds=4,gain=.1,fadeFrames=200;
const modes=[{hz:200,decay:2,amplitude:1},{hz:201,decay:.8,amplitude:.1},{hz:320,decay:3,amplitude:1}];
const source=synthesize({modes,seconds,sampleRate,noiseDb:-40,seed:1}).samples;
const clean=synthesize({modes,seconds,sampleRate}).samples;
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const relativeRms=(predicted,reference,start,end)=>{
 let error=0,energy=0;for(let i=start;i<end;i++){error+=(predicted[i]-reference[i])**2;energy+=reference[i]**2;}
 return Math.sqrt(error/energy);
};
const rows=[];
function save(id,title,samples,metadata={}){
 let peak=0;
 const channel=Float32Array.from(samples,(x,i)=>{
  const fade=i<samples.length-fadeFrames?1:(samples.length-1-i)/(fadeFrames-1);
  const value=x*gain*fade;peak=Math.max(peak,Math.abs(value));return value;
 });
 if(peak>1||!Number.isFinite(peak))throw Error('Study output exceeds WAV range');
 const wav=Buffer.from(stereoWav({sampleRate,channels:[channel,channel]}));
 writeFileSync(resolve(directory,id+'.wav'),wav);
 rows.push({id,title,frames:channel.length,peak,wavSha256:digest(wav),...metadata});
}
save('source','Source recording · with noise',source,{role:'Full noisy source; only the stated prefix is used for each fit.'});
save('clean','Known clean signal · reference only',clean,{role:'Synthetic oracle, not available from an arbitrary recording.'});
for(const observedSeconds of [.5,2])for(const kind of ['supplied','shifted','omitted']){
 const frequencies=kind==='omitted'?[200,320]:[200,kind==='shifted'?201.1:201,320];
 const observedFrames=Math.round(observedSeconds*sampleRate);
 const fit=fitJointDecays(source.slice(0,observedFrames),sampleRate,frequencies);
 if(fit.status!=='local-fit')throw Error('Fit refused');
 const predicted=reconstructModes(fit,sampleRate,source.length);
 const name={supplied:'Three supplied true frequencies',shifted:'Middle frequency shifted by 0.1 Hz',omitted:'Middle frequency omitted'}[kind];
 save(`${kind}-${observedSeconds}`,`${name} · ${observedSeconds} s observed`,predicted,{observedSeconds,fit,
  observedRelativeRms:relativeRms(predicted,source,0,observedFrames),
  withheldNoisyRelativeRms:relativeRms(predicted,source,observedFrames,source.length),
  withheldCleanRelativeRms:relativeRms(predicted,clean,observedFrames,source.length)});
}
const report={protocol:{sampleRate,seconds,modes,noiseDb:-40,seed:1,gain,fadeFrames,
 noiseMeaning:'Gaussian sigma relative to clean peak; not RMS SNR. One realization; every fit uses an actual prefix of the same full noisy source.',
 output:'Dual-mono PCM16 WAVs at one fixed gain, no per-track normalization; final 25 ms linear fade for listening only. Metrics use unfaded Float64 signals.',
 withheld:'Actual noisy suffix was not used in fitting. Noiseless suffix is a separate synthetic oracle. These ratios are not perceptual scores.',
 limits:'Supplied frequencies or deliberate perturbation/omission; no frequency discovery, physical body, pickup/room model or common-decay declaration.',
 jointFitSha256:digest(readFileSync(new URL('./study-joint-decay.mjs',import.meta.url)))},rows};
writeFileSync(resolve(directory,'report.json'),JSON.stringify(report,null,2)+'\n');
const pct=x=>(100*x).toFixed(3)+'%';
writeFileSync(resolve(directory,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>What continues beyond the glimpse? · Imagimusic</title><style>body{margin:40px auto;padding:24px;max-width:820px;background:#142028;color:#eee8dc;font:17px/1.65 system-ui}h1,h2{font-family:Georgia}h1{font-size:clamp(36px,6vw,60px);line-height:1.1}button,a{color:inherit}button{font:inherit;background:#293d42;border:1px solid #8ba39a;border-radius:8px;padding:10px 16px;cursor:pointer}article{border-top:1px solid #5c6d72;padding:18px 0}audio{width:100%}.note{font-size:14px;color:#bac8c9}#transport{position:sticky;top:0;background:#142028;padding:14px 0;z-index:2}.links{display:flex;flex-wrap:wrap;gap:14px}table{border-collapse:collapse;font-size:13px}td,th{text-align:left;padding:8px;border-bottom:1px solid #5c6d72}.table{overflow-x:auto}</style><a href="/project.html">Imagimusic · project home</a><h1>What continues beyond the glimpse?</h1><p>A short observation can suggest a longer ring. Listen to the source, then to models fitted to its first half-second or first two seconds. What changes as the sound continues, if anything?</p><p class="note">These are synthetic research examples. The frequencies are supplied, shifted deliberately, or partly omitted. This is not an automatic recording-to-instrument feature.</p><div id="transport"><audio id="player" controls preload="none"></audio><p id="status" role="status">Choose a version. Nothing starts automatically.</p></div>${rows.map(row=>`<article><h2>${row.title}</h2><div class="links"><button data-file="${row.id}.wav" data-title="${row.title}" aria-label="Listen: ${row.title}">Listen</button><a href="${row.id}.wav" download>Keep this study WAV ↓</a></div><p class="note">${row.observedSeconds?`Only the first ${row.observedSeconds} seconds were fitted. The remaining ${seconds-row.observedSeconds} seconds are a prediction.`:row.role}</p></article>`).join('')}<details><summary>What is held the same?</summary><p>Every version lasts four seconds, uses the same gain, and has the same final 25 ms fade. The sound is mono duplicated into two channels. No version is normalized to match loudness. Measurements below use the unfaded signals. The source contains three exponential sinusoids with unequal decays and added noise; the clean reference is known only because this example was synthesized.</p><p>A close waveform fit does not identify a physical instrument. A small error over a short observation can hide a different continuation. Listening can reveal differences the numbers alone do not describe; no particular response is expected.</p></details><details><summary>Observation and prediction errors</summary><p class="note">RMS residual divided by source RMS. The noisy continuation was withheld from fitting; the clean continuation is a separate synthetic reference. Different observation lengths have different withheld intervals, so these percentages are not directly interchangeable.</p><div class="table"><table><tr><th>Model</th><th>Observed</th><th>Withheld noisy</th><th>Withheld clean</th></tr>${rows.filter(r=>r.fit).map(r=>`<tr><td>${r.title}</td><td>${pct(r.observedRelativeRms)}</td><td>${pct(r.withheldNoisyRelativeRms)}</td><td>${pct(r.withheldCleanRelativeRms)}</td></tr>`).join('')}</table></div></details><p><a href="report.json">Full parameters, metrics and WAV hashes</a></p><p><a href="/inverse-sound.html">Inspect a study WAV or your own short recording ↗</a></p><p class="note">Opening there is silent. That page shows source samples and offers explicit listening; it does not infer resonances or an instrument.</p><script>const player=document.getElementById('player'),status=document.getElementById('status');let generation=0;for(const button of document.querySelectorAll('[data-file]'))button.onclick=async()=>{const own=++generation;player.pause();player.src=button.dataset.file;status.textContent='Selected: '+button.dataset.title;try{await player.play();}catch(error){if(own===generation)status.textContent=error.message;}};document.addEventListener('visibilitychange',()=>{if(document.hidden)player.pause();});window.addEventListener('pagehide',()=>player.pause());</script></html>`);
console.log(JSON.stringify({directory,tracks:rows.length,rows:rows.filter(r=>r.fit).map(({id,observedRelativeRms,withheldNoisyRelativeRms,withheldCleanRelativeRms})=>({id,observedRelativeRms,withheldNoisyRelativeRms,withheldCleanRelativeRms}))},null,2));
