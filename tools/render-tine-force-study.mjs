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
const rows=[['instant','Ideal impulse',0],['half-ms','0.5 ms force pulse',24],['one-ms','1 ms force pulse',48],['four-ms','4 ms force pulse',192]].map(([id,label,pulseFrames])=>{
 let signal,finalState=null;
 if(!pulseFrames)signal=renderTineLiveRecord({kind:'imagimusic-tine-live',version:1,design,sampleRate,events:[{frame:onsetFrame,strength:.1}],fadeStart}).channels[0];
 else{
  const study=createTineForceStudy(geometry,{sampleRate,activation:design.activation,pickup:design.pickup}),forces=halfSineForcePulse({impulseNs,frames:pulseFrames,sampleRate});
  signal=new Float32Array(frames);
  for(let frame=0;frame<frames;frame++){
   const raw=Math.fround(100*study.snapshot().pickupVelocityMPerS);
   signal[frame]=frame<fadeStart?raw:raw*Math.max(0,1-(frame-fadeStart)/(fadeFrames-1));
   study.advance(forces[frame-onsetFrame]??0);
  }
  finalState=study.snapshot();
 }
 let peak=0,power=0;for(const value of signal){peak=Math.max(peak,Math.abs(value));power+=value*value;}
 if(peak>=.8||signal.at(-1)!==0)throw Error('Invalid study level or ending.');
 const wav=tineFloatWav({sampleRate,channels:[signal]}),decoded=parseInverseSound(wav);
 if(decoded.frameCount!==frames||decoded.channels[0].some((x,i)=>!Object.is(x,signal[i])))throw Error('WAV sample preservation failed.');
 writeFileSync(resolve(directory,id+'.wav'),new Uint8Array(wav));
 return {id,label,pulseFrames,durationMs:1000*pulseFrames/sampleRate,peak,rms:Math.sqrt(power/frames),wavSha256:createHash('sha256').update(new Uint8Array(wav)).digest('hex'),finalState};
});
const report={kind:'imagimusic-force-listening-study',version:1,design,sampleRate,frames,onsetFrame,fadeStart,fadeFrames,impulseNs,pickupGain:100,rows,method:'One ideal impulse or held sample-interval averages of a half-sine force pulse. Same body, total impulse, onset, velocity pickup gain and25ms audio ending. Mono float32 WAV; no normalization.',limits:'Prescribed force, not hammer collision or acoustic radiation. Equal impulse is not equal input work or loudness. Held averages approximate a continuous pulse; see the convergence probe. No listener verdict. Finite force is offline only; these files do not define live-pass records.'};
writeFileSync(resolve(directory,'report.json'),JSON.stringify(report,null,2)+'\n');
writeFileSync(resolve(directory,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The time within a touch · Imagimusic study</title><style>body{max-width:800px;margin:40px auto;padding:24px;background:#142028;color:#eee8dc;font:18px/1.6 system-ui}h1,h2{font-family:Georgia}h1{font-size:2.7rem;line-height:1.1}a{color:#d7bde0}button{font:inherit;color:inherit;background:#294044;border:1px solid #91aaa0;border-radius:9px;padding:12px 18px;cursor:pointer}article{border-top:1px solid #526369;padding:20px 0}audio,input{width:100%}.note{font-size:.88rem;color:#bac8c9}textarea{box-sizing:border-box;width:100%;min-height:110px;font:inherit;background:#1c2d32;color:inherit;border:1px solid #91aaa0;padding:12px}</style><a href="/project.html">imagimusic ↗</a><h1>The time<br>within a touch.</h1><p>One body. The same total impulse. An instant, or a force that stays briefly. Listen in any order; return to the first whenever you like.</p><p class="note">Four authored examples, each four seconds long. Same source gain, without loudness matching. Force begins after 50 ms of silence in each file. Nothing plays automatically.</p><label for="listening-level">Listening level</label><input id="listening-level" type="range" min="0" max="20" step="1" value="0"><p id="listening-reading" data-unit="excitation">+0 dB · shared by every excitation</p><p class="note">One optional playback gain for all examples. Source WAVs remain unchanged. The downstream sample ceiling may distort large peaks.</p><audio id="player" controls preload="none"></audio><p id="status" role="status">Choose an excitation to listen.</p>${rows.map(row=>`<article><h2>${row.label}</h2><button data-audio="${row.id}" data-file="${row.id}.wav" data-label="${row.label}">Listen: ${row.label.toLowerCase()}</button> <a href="${row.id}.wav" download>Download WAV</a></article>`).join('')}<label for="observations">What changed for you?</label><textarea id="observations" placeholder="Your words, if useful. These notes are not saved."></textarea><p class="note">Notes are not stored or sent. Copy them before leaving if you want to keep them. There is no preferred answer.</p><details><summary>What this does—and does not—model</summary><p>These are prescribed forces on one 80 × 10 × 1 mm four-mode cantilever. All deliver 0.1 micro-newton second at position 0.85. A fixed velocity pickup at 0.85 produces the signal. Equal total impulse does not imply equal energy or loudness.</p><p>The pulse is held constant over each 48 kHz sample using a half-sine’s interval average. The continuous-force comparison found maximum state errors of 0.166%, 0.0473%, and 0.00220% for these three durations, normalized to the equal ideal impulse’s state, not to the quieter pulse response. This is not a perceptual error measure.</p><p>No simulated hammer collision, acoustic radiation or listener verdict. The ending fades audio without physically stopping vibration. This is offline research; live playing still uses ideal impulses.</p><a href="report.json">Settings, measurements and file hashes ↗</a></details><script type="module" src="/src/tine/study-main.js"></script></html>`);
console.log(JSON.stringify({directory,rows:rows.map(({id,peak,rms})=>({id,peak,rms}))},null,2));
