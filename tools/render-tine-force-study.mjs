import {createTineImpulse} from '../src/tine/impulse.js';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createTineDesign,requestForTineDesign} from '../src/tine/address.js';
import {createTineForceStudy,halfSineForcePulse} from '../src/tine/force-study.js';
import {renderTineLiveRecord} from '../src/tine/live-record.js';
import {tineFloatWav} from '../src/tine/wav.js';
import {parseInverseSound} from '../src/inverse/sound-file.js';
const directory=resolve(process.argv[2]??'renders/tine-force');mkdirSync(directory,{recursive:true});
const design=createTineDesign(),{geometry}=requestForTineDesign(design),sampleRate=48000,onsetFrame=2400,frames=192000,fadeFrames=1200,fadeStart=frames-fadeFrames,impulseNs=1e-7;
const comparisonAgeS=.005,comparisonFrame=onsetFrame+Math.round(comparisonAgeS*sampleRate),model=createTineImpulse(geometry),ideal=model.strike({activation:design.activation,impulseNs});
const singleSignals=new Map();
const rows=[['instant','Ideal impulse',0],['half-ms','0.5 ms force pulse',24],['one-ms','1 ms force pulse',48],['four-ms','4 ms force pulse',192]].map(([id,label,pulseFrames])=>{
 let signal,finalState=null,forceN=null,comparisonModes=null;
 if(!pulseFrames)signal=renderTineLiveRecord({kind:'imagimusic-tine-live',version:1,design,sampleRate,events:[{frame:onsetFrame,strength:.1}],fadeStart}).channels[0];
 else{
  const study=createTineForceStudy(geometry,{sampleRate,activation:design.activation,pickup:design.pickup}),forces=halfSineForcePulse({impulseNs,frames:pulseFrames,sampleRate});
  forceN=Array.from(forces);
  signal=new Float32Array(frames);
  for(let frame=0;frame<frames;frame++){
   const raw=Math.fround(100*study.snapshot().pickupVelocityMPerS);
   signal[frame]=frame<fadeStart?raw:raw*Math.max(0,1-(frame-fadeStart)/(fadeFrames-1));
   study.advance(forces[frame-onsetFrame]??0);
   if(frame+1===comparisonFrame)comparisonModes=study.snapshot().modes;
  }
  finalState=study.snapshot();
 }
 if(!comparisonModes)comparisonModes=ideal.modalState(comparisonAgeS).map((mode,i)=>{const workJ=ideal.modalState(0)[i].energyJ;return {...mode,workJ,dissipatedJ:workJ-mode.energyJ};});
 const expectedSample=Math.fround(100*comparisonModes.reduce((sum,mode,i)=>sum+model.modes[i].shape(design.pickup)*mode.velocityMPerS,0));
 if(Math.abs(expectedSample-signal[comparisonFrame])>1e-9)throw Error('Comparison state does not match the rendered pickup.');
 const energyJ=comparisonModes.reduce((sum,m)=>sum+m.energyJ,0),workJ=comparisonModes.reduce((sum,m)=>sum+m.workJ,0),dissipatedJ=comparisonModes.reduce((sum,m)=>sum+m.dissipatedJ,0);
 if(energyJ<0||dissipatedJ< -1e-20||Math.abs(workJ-energyJ-dissipatedJ)>1e-20)throw Error('Invalid energy accounting.');
 let peak=0,power=0;for(const value of signal){peak=Math.max(peak,Math.abs(value));power+=value*value;}
 if(peak>=.8||signal.at(-1)!==0)throw Error('Invalid study level or ending.');
 const wav=tineFloatWav({sampleRate,channels:[signal]}),decoded=parseInverseSound(wav);
 if(decoded.frameCount!==frames||decoded.channels[0].some((x,i)=>!Object.is(x,signal[i])))throw Error('WAV sample preservation failed.');
 singleSignals.set(id,signal);
 writeFileSync(resolve(directory,id+'.wav'),new Uint8Array(wav));
 return {id,label,forceN,comparisonModes,energyJ,workJ,dissipatedJ,pulseFrames,durationMs:1000*pulseFrames/sampleRate,peak,rms:Math.sqrt(power/frames),wavSha256:createHash('sha256').update(new Uint8Array(wav)).digest('hex'),finalState};
});
const phraseOnsets=[2400,40800,103200],phraseFrames=295200,phraseFadeStart=phraseFrames-fadeFrames;
const phraseRows=rows.map(row=>{
 let signal;
 if(!row.pulseFrames)signal=renderTineLiveRecord({kind:'imagimusic-tine-live',version:1,design,sampleRate,events:phraseOnsets.map(frame=>({frame,strength:.1})),fadeStart:phraseFadeStart}).channels[0];
 else{
  const study=createTineForceStudy(geometry,{sampleRate,activation:design.activation,pickup:design.pickup});signal=new Float32Array(phraseFrames);
  for(let frame=0;frame<phraseFrames;frame++){
   const raw=Math.fround(100*study.snapshot().pickupVelocityMPerS);
   signal[frame]=frame<phraseFadeStart?raw:raw*Math.max(0,1-(frame-phraseFadeStart)/(fadeFrames-1));
   study.advance(phraseOnsets.reduce((sum,onset)=>sum+(row.forceN[frame-onset]??0),0));
  }
  if(Math.abs(study.snapshot().impulseNs-3*impulseNs)>1e-20)throw Error('Phrase impulse mismatch.');
 }
 const first=singleSignals.get(row.id);
 for(let i=0;i<phraseOnsets[1];i++)if(signal[i]!==first[i])throw Error('Phrase changed its opening touch.');
 let peak=0,power=0;for(const x of signal){peak=Math.max(peak,Math.abs(x));power+=x*x;}
 if(peak>=.8||signal.at(-1)!==0)throw Error('Invalid phrase headroom or ending.');
 const wav=tineFloatWav({sampleRate,channels:[signal]}),decoded=parseInverseSound(wav);
 if(decoded.channels[0].some((x,i)=>!Object.is(x,signal[i])))throw Error('Phrase WAV changed samples.');
 const file=row.id+'-phrase.wav';writeFileSync(resolve(directory,file),new Uint8Array(wav));
 return {id:row.id,label:row.label,file,pulseFrames:row.pulseFrames,peak,rms:Math.sqrt(power/phraseFrames),wavSha256:createHash('sha256').update(new Uint8Array(wav)).digest('hex')};
});
const phrase={onsetFrames:phraseOnsets,frames:phraseFrames,fadeStart:phraseFadeStart,impulsePerTouchNs:impulseNs,rows:phraseRows};
const report={kind:'imagimusic-force-listening-study',version:1,design,comparisonAgeS,comparisonFrame,frequenciesHz:model.modes.map(m=>m.frequencyHz),sampleRate,frames,onsetFrame,fadeStart,fadeFrames,impulseNs,pickupGain:100,rows,phrase,method:'One ideal impulse or held sample-interval averages of a half-sine force pulse. Same body, total impulse, onset, velocity pickup gain and25ms audio ending. Mono float32 WAV; no normalization.',limits:'Prescribed force, not hammer collision or acoustic radiation. Equal impulse is not equal input work or loudness. Held averages approximate a continuous pulse; see the convergence probe. No listener verdict. Finite force is offline only; these files do not define live-pass records.'};
writeFileSync(resolve(directory,'report.json'),JSON.stringify(report,null,2)+'\n');
let forcePicture='',energyPicture='';
if(process.env.IMAGIMUSIC_PLOT_PYTHON){
 const plotted=spawnSync(process.env.IMAGIMUSIC_PLOT_PYTHON,[fileURLToPath(new URL('./plot-tine-force.py',import.meta.url)),resolve(directory,'report.json'),resolve(directory,'force.svg')],{encoding:'utf8'});
 if(plotted.error||plotted.status!==0)throw Error(plotted.error?.message??plotted.stderr);
 energyPicture='<img src="energy.png" style="display:block;width:100%;height:auto" alt="Stored modal energies five milliseconds after excitation onset, on a shared absolute energy scale; totals are listed below.">';
 forcePicture='<img src="force.png" style="display:block;width:100%;height:auto" alt="Shared axes: the 0.5, 1 and 4 millisecond held-force pulses have equal area but decreasing peak force. Rounded peak values are listed below.">';
}
const forceReading=`<details><summary>See how force enters</summary>${forcePicture}<p>The three finite pulses share one total impulse: 0.1 micro-newton second. The ideal impulse acts instantaneously and has no finite peak force, so it is not drawn as a force curve.</p><table style="width:100%;text-align:left"><caption>Prescribed held-force inputs</caption><thead><tr><th scope="col">Duration</th><th scope="col">Peak force</th></tr></thead><tbody>${rows.filter(row=>row.forceN).map(row=>`<tr><td>${row.durationMs} ms</td><td>${(1000*Math.max(...row.forceN)).toFixed(4)} mN</td></tr>`).join('')}</tbody></table><p class="note">Time starts at excitation onset, 50 ms into the sound file. Force is held over each sample interval. These are inputs to the model, not measured contact forces or drawings of vibration. Equal area is equal impulse, not equal energy or loudness.</p></details>`;
const energyReading=`<details><summary>See what remains in the body</summary>${energyPicture}<p>Five milliseconds after each excitation begins, all three forces have ended. These are the four modes’ stored mechanical energies at that same instant, before the audio fade. The input work differs even though the total impulse is the same.</p><table style="width:100%;text-align:left;font-size:.88rem"><caption>Mechanical energy at 5 ms · picojoules (pJ)</caption><thead><tr><th scope="col">Input</th><th scope="col">Work in</th><th scope="col">Stored</th><th scope="col">Lost</th></tr></thead><tbody>${rows.map(row=>`<tr><td>${row.pulseFrames?row.durationMs+' ms':'Impulse'}</td><td>${(row.workJ*1e12).toPrecision(4)}</td><td>${(row.energyJ*1e12).toPrecision(4)}</td><td>${(row.dissipatedJ*1e12).toPrecision(4)}</td></tr>`).join('')}</tbody></table><p class="note">Table values are rounded for display. Input work equals stored energy plus damping loss, apart from floating-point rounding. The figure uses absolute values, not equal-height normalized bars. Mechanical energy is not acoustic loudness; no radiation or speaker model is present.</p></details>`;
const phraseListening=`<details><summary>Hear a returning phrase</summary><p>Three equal touches arrive at 0.05, 0.85 and 2.15 seconds. Earlier vibration continues underneath each return. Each version lasts 6.15 seconds, with the same source gain and ending; only the excitation duration changes between versions.</p>${phraseRows.map(row=>`<p class="phrase-choice"><button data-audio="${row.id}-phrase" data-file="${row.file}" data-label="Returning phrase · ${row.label}">Phrase: ${row.label.toLowerCase()}</button> <a href="${row.file}" download>Download phrase WAV</a></p>`).join('')}<p class="note">An authored rhythm, not a captured performance. The force and energy diagrams below describe the separate single-touch examples. Listening level is shared with all examples; no phrase is normalized or loudness-matched.</p></details>`;
writeFileSync(resolve(directory,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The time within a touch · Imagimusic study</title><style>body{max-width:800px;margin:40px auto;padding:24px;background:#142028;color:#eee8dc;font:18px/1.6 system-ui}h1,h2{font-family:Georgia}h1{font-size:2.7rem;line-height:1.1}a{color:#d7bde0}button{font:inherit;color:inherit;background:#294044;border:1px solid #91aaa0;border-radius:9px;padding:12px 18px;cursor:pointer}article{border-top:1px solid #526369;padding:20px 0}audio,input{width:100%}.note{font-size:.88rem;color:#bac8c9}textarea{box-sizing:border-box;width:100%;min-height:110px;font:inherit;background:#1c2d32;color:inherit;border:1px solid #91aaa0;padding:12px}.phrase-choice{display:flex;flex-wrap:wrap;gap:.7rem;align-items:center}.listening-dock{position:sticky;top:0;z-index:2;background:#142028;padding:12px 0;border-bottom:1px solid #526369}.listening-dock p{margin:4px 0;font-size:.88rem}button,summary{scroll-margin-top:160px}a[download]{display:inline-block}button:focus-visible,summary:focus-visible{outline:3px solid #d7bde0;outline-offset:4px}</style><a href="/project.html">imagimusic ↗</a><h1>The time<br>within a touch.</h1><p>One body. The same total impulse. An instant, or a force that stays briefly. Listen in any order; return to the first whenever you like.</p><p class="note">Four single-touch examples, each four seconds long, plus optional returning phrases. Same source gain, without loudness matching. Force begins after 50 ms of silence in each file. Nothing plays automatically.</p><label for="listening-level">Listening level</label><input id="listening-level" type="range" min="0" max="20" step="1" value="0"><p id="listening-reading" data-unit="excitation">+0 dB · shared by every excitation</p><p class="note">One optional playback gain for all examples. Source WAVs remain unchanged. The downstream sample ceiling may distort large peaks.</p><div class="listening-dock" role="region" aria-label="Listening controls"><audio id="player" aria-label="Study audio" controls preload="none"></audio><p id="status" role="status">Choose an excitation to listen.</p></div>${rows.map(row=>`<article><h2>${row.label}</h2><button data-audio="${row.id}" data-file="${row.id}.wav" data-label="${row.label}">Listen: ${row.label.toLowerCase()}</button> <a href="${row.id}.wav" download>Download WAV</a></article>`).join('')}${phraseListening}${forceReading}${energyReading}<label for="observations">What changed for you?</label><textarea id="observations" placeholder="Your words, if useful. These notes are not saved."></textarea><p class="note">Notes are not stored or sent. Copy them before leaving if you want to keep them. There is no preferred answer.</p><details><summary>What this does—and does not—model</summary><p>These are prescribed forces on one 80 × 10 × 1 mm four-mode cantilever. All deliver 0.1 micro-newton second at position 0.85. A fixed velocity pickup at 0.85 produces the signal. Equal total impulse does not imply equal energy or loudness.</p><p>The pulse is held constant over each 48 kHz sample using a half-sine’s interval average. The continuous-force comparison found maximum state errors of 0.166%, 0.0473%, and 0.00220% for these three durations, normalized to the equal ideal impulse’s state, not to the quieter pulse response. This is not a perceptual error measure.</p><p>No simulated hammer collision, acoustic radiation or listener verdict. The ending fades audio without physically stopping vibration. This is offline research; live playing still uses ideal impulses.</p><a href="report.json">Settings, measurements and file hashes ↗</a></details><script type="module" src="/src/tine/study-main.js"></script></html>`);
console.log(JSON.stringify({directory,rows:rows.map(({id,peak,rms})=>({id,peak,rms}))},null,2));
