import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createTineDesign,requestForTineDesign} from '../src/tine/address.js';
import {createTineImpulse} from '../src/tine/impulse.js';
import {tineDisplacementWindow} from '../src/tine/displacement-window.js';

const directory=resolve(process.argv[2]??'renders/tine-displacement');
mkdirSync(directory,{recursive:true});
const design=createTineDesign(),{geometry}=requestForTineDesign(design),model=createTineImpulse(geometry);
const impulseNs=1e-7,sampleRate=48000,startFrame=24,strike=model.strike({activation:design.activation,impulseNs});
const rows=[12,96,768].map(count=>{
 const samples=new Float64Array(count*4);
 for(let n=0;n<count;n++)strike.modalState((startFrame+n)/sampleRate).forEach((m,i)=>{samples[n*4+i]=m.displacementM;});
 const window=tineDisplacementWindow(geometry,{samples,sampleRate,startFrame});
 // Independent direct spatial accumulation verifies the exported quantities.
 let maxErrorM=0;
 for(const p of window.points){
  const values=Array.from({length:count},(_,n)=>model.modes.reduce((sum,m,i)=>sum+m.shape(p.u)*samples[n*4+i],0));
  const mean=values.reduce((a,b)=>a+b,0)/count;
  const std=Math.sqrt(values.reduce((s,v)=>s+(v-mean)**2,0)/count);
  maxErrorM=Math.max(maxErrorM,Math.abs(mean-p.meanM),Math.abs(std-p.standardDeviationM));
 }
 if(maxErrorM>1e-18)throw Error('Direct spatial statistics disagree.');
 return {...window,nominalDurationMs:1000*count/sampleRate,maxDirectErrorM:maxErrorM};
});
const report={design,geometry,impulseNs,sampleRate,startFrame,description:'One ideal impulse at frame zero; each interval starts at frame 24. Population statistics of consecutive sample boundaries, not continuous extrema or optical exposure.',rows};
const reportPath=resolve(directory,'report.json');writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
const python=process.env.IMAGIMUSIC_PLOT_PYTHON;
if(python){
 const result=spawnSync(python,[fileURLToPath(new URL('./plot-tine-displacement.py',import.meta.url)),reportPath,resolve(directory,'displacement.png')],{encoding:'utf8'});
 if(result.status!==0)throw Error(result.stderr||'Plot generation failed.');
}
const format=x=>(x*1e6).toPrecision(4);
writeFileSync(resolve(directory,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>A shape across time · Imagimusic</title>
<style>body{margin:0;background:#142028;color:#eee8dc;font:18px/1.6 system-ui}main{max-width:900px;margin:auto;padding:32px 20px 80px}a{color:#8ed1c3}h1{font-size:clamp(2rem,6vw,3.5rem);line-height:1.1}img{width:100%;height:auto}figure{margin:30px 0}figcaption,small{color:#c9c9c0}table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}th,td{text-align:left;padding:10px 6px;border-bottom:1px solid #53666e}summary{cursor:pointer}a:focus-visible,summary:focus-visible{outline:3px solid #e4bc7b;outline-offset:4px}.scroll{overflow-x:auto}@media(max-width:480px){table{font-size:13px}th,td{padding:10px 3px}}</style>
<main><a href="../../project.html">Imagimusic home</a><p>Offline visual study</p><h1>A shape across time</h1><p>A vibrating body moves faster than a screen can follow. Here we hold the body and touch fixed, then change how much time we gather into one view.</p>
<p>Each interval starts <strong>0.5 ms after one touch</strong>. A longer interval gathers more of the body's motion; it does not change the sound or slow the body down.</p>
${python?'<figure><img src="displacement.png" alt="Three panels compare 0.25, 2 and 16 millisecond intervals on identical axes. Gold lines show mean signed displacement; teal bands show one standard deviation either side of that mean. Numerical tip readings follow."><figcaption>Vertical displacement is in micrometres and greatly magnified relative to the horizontal span. The shaded band is mean ± one standard deviation. It is not the body’s outline, full range of motion, or a photograph.</figcaption></figure>':'<p>The optional figure has not been generated. The numerical readings below remain available.</p>'}
<h2>At the free tip</h2><div class="scroll"><table><caption>Same body, same touch, same start; population statistics in µm.</caption><thead><tr><th>Interval</th><th>Samples</th><th>Mean</th><th>Spread (σ)</th><th>RMS</th></tr></thead><tbody>${rows.map(row=>{const p=row.points.at(-1);return `<tr><th>${row.nominalDurationMs} ms</th><td>${row.sampleCount}</td><td>${format(p.meanM)}</td><td>${format(p.standardDeviationM)}</td><td>${format(p.rmsM)}</td></tr>`;}).join('')}</tbody></table></div>
<p>The mean keeps the sign of displacement. Spread describes variation around that mean. RMS includes both the mean and the variation; none of these values gives the largest excursion.</p>
<details><summary>What this view can and cannot tell us</summary><p>This is an 80 × 10 × 1 mm uniform steel cantilever, using four bending modes and an ideal 0.1 µN·s impulse at 85% of its span. Every modal displacement is sampled at 48 kHz. Cross-mode covariance is retained, so reinforcing and cancelling motion contribute together.</p><p>The nominal intervals contain 12, 96 and 768 consecutive samples. Their last observed times are ${(rows.map(r=>(1000*r.lastSampleFrame/sampleRate).toFixed(6))).join(', ')} ms after the touch. Their exclusive ends are 0.75, 2.5 and 16.5 ms. These are discrete sample statistics, not exact continuous-time averages.</p><p>No hammer contact, acoustic radiation, surface rendering, camera exposure or perceptual persistence is simulated. This is a mechanical reading, not a model of what an eye would see. The live instrument is unchanged.</p></details>
<p><a href="report.json">Download all spatial readings and interval metadata</a> · <a href="../../tine-play.html">Play the tine</a> · <a href="../tine-force/index.html">Explore the time within a touch</a></p></main></html>`);
console.log(JSON.stringify({directory,figure:!!python,rows:rows.map(r=>({samples:r.sampleCount,durationMs:r.nominalDurationMs,maxDirectErrorM:r.maxDirectErrorM,tip:r.points.at(-1)}))},null,2));
