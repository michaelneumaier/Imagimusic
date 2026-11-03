import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createTineDesign,requestForTineDesign} from '../src/tine/address.js';
import {createTineImpulse} from '../src/tine/impulse.js';
import {stereoWav} from '../src/loom/model.js';

// Authored sonic storyboard, not the live-pass format or an implemented scene.
const directory=resolve(process.argv[2]??'renders/flagship-sketch');mkdirSync(directory,{recursive:true});
const sampleRate=48000,seconds=72,frames=seconds*sampleRate,pickupGain=100,outputGain=8;
const scenes=[
 ['0–12','An object waits','One body in close view. A first touch at two seconds, then a small three-touch phrase. The camera holds.'],
 ['12–24','A phrase remembers','The opening phrase returns unchanged. One softer answer follows; no new anatomy is needed yet.'],
 ['24–36','The instrument opens','Longer and shorter blades enter around the original. Each arrives with an audible role; independent bodies share a composition.'],
 ['36–48','Inside the ring','The score thins. A proposed close view follows the body into a labeled modal reading, then leaves time for decay.'],
 ['48–60','A small world answers','The phrase is distributed across three voices. A second exchange reverses their order while preserving its rhythmic identity.'],
 ['60–72','The first body returns','The original phrase returns alone, then once more softly. The camera returns to the opening view; the final fade belongs to the recording.']
];
const voices=[['opening',80,0],['lower',95,-.65],['upper',65,.65]].map(([id,lengthMm,pan])=>({id,design:createTineDesign({lengthMm}),pan,events:[]}));
const touch=(voice,t,strength)=>voices[voice].events.push({frame:Math.round(t*sampleRate),strength});
const motif=(voice,t,scale=1)=>[[0,.1],[.65,.025],[1.7,.05]].forEach(([dt,s])=>touch(voice,t+dt,s*scale));
touch(0,2,.1);motif(0,6);motif(0,13);motif(0,20,.5);
motif(1,24,.65);motif(0,27,.8);motif(2,30,.6);touch(1,34,.05);
touch(2,36,.025);touch(0,39,.025);touch(1,42,.025);
touch(0,48,.1);touch(1,48.65,.025);touch(2,49.7,.05);
touch(2,54,.075);touch(0,54.65,.025);touch(1,55.7,.05);
motif(0,60);motif(0,66,.5);
const channels=[new Float64Array(frames),new Float64Array(frames)];let maxStateErrorM=0;
for(const voice of voices){
 const model=createTineImpulse(requestForTineDesign(voice.design).geometry),unit=model.strike({impulseNs:1e-6,activation:voice.design.activation});
 const budget=voice.events.reduce((s,e)=>s+Math.abs(e.strength),0);
 model.strike({impulseNs:budget*1e-6,activation:voice.design.activation});
 voice.frequenciesHz=model.modes.map(m=>m.frequencyHz);voice.absoluteImpulseNs=budget*1e-6;
 const q=new Float64Array(4),v=new Float64Array(4),weights=model.modes.map(m=>m.shape(voice.design.pickup));
 const transitions=model.modes.map(m=>{const e=Math.exp(-m.gamma/sampleRate),c=Math.cos(m.omegaD/sampleRate),s=Math.sin(m.omegaD/sampleRate)/m.omegaD;return [e*(c+m.gamma*s),e*s,-e*m.omega*m.omega*s,e*(c-m.gamma*s)];});
 const pan=[Math.cos((voice.pan+1)*Math.PI/4),Math.sin((voice.pan+1)*Math.PI/4)];
 let event=0;
 for(let frame=0;frame<frames;frame++){
  while(event<voice.events.length&&voice.events[event].frame===frame){for(let i=0;i<4;i++)v[i]+=unit.initialVelocity[i]*voice.events[event].strength;event++;}
  if(frame%10007===0){
   for(let i=0;i<4;i++){
    const m=model.modes[i];let exact=0;
    for(const e of voice.events){if(e.frame>frame)break;const age=(frame-e.frame)/sampleRate;exact+=e.strength*unit.initialVelocity[i]*Math.exp(-m.gamma*age)*Math.sin(m.omegaD*age)/m.omegaD;}
    maxStateErrorM=Math.max(maxStateErrorM,Math.abs(q[i]-exact));
   }
  }
  let value=0;
  for(let i=0;i<4;i++){value+=weights[i]*v[i];const [a,b,c,d]=transitions[i],before=q[i];q[i]=a*before+b*v[i];v[i]=c*before+d*v[i];}
  value*=pickupGain*outputGain;
  channels[0][frame]+=value*pan[0];channels[1][frame]+=value*pan[1];
 }
 if(event!==voice.events.length)throw Error('Unrendered event.');
}
if(maxStateErrorM>1e-15)throw Error('Analytic displacement parity failed.');
const fadeFrames=4800;let peak=0,power=0;
const pcm=channels.map(channel=>Float32Array.from(channel,(value,frame)=>{
 const gain=frame<frames-fadeFrames?1:(frames-1-frame)/(fadeFrames-1),sample=Math.fround(value*gain);
 if(!Number.isFinite(sample)||Math.abs(sample)>=.8)throw Error('Invalid or excessive sketch output.');
 peak=Math.max(peak,Math.abs(sample));power+=sample*sample;return sample;
}));
const wav=Buffer.from(stereoWav({channels:pcm,sampleRate}));writeFileSync(resolve(directory,'first-encounter.wav'),wav);
const report={kind:'imagimusic-authored-flagship-sketch',version:1,sampleRate,seconds,frames,pickupGain,outputGain,fadeFrames,voices,scenes,peak,rms:Math.sqrt(power/(2*frames)),maxStateErrorM,wavSha256:createHash('sha256').update(wav).digest('hex'),limits:'Authored score and artistic equal-power panning, not captured visitor input. Independent uniform four-mode steel tines; no bridge coupling, hammer contact, radiation, reverb or pitch correction. Continuous modal state across all touches; final100ms output fade does not damp the mechanics. Fixed output gain8 after velocity-pickup gain100, no normalization. Stereo16-bit PCM. Scene descriptions are storyboard intentions, not implemented animation. No human listening verdict.'};
writeFileSync(resolve(directory,'report.json'),JSON.stringify(report,null,2)+'\n');
writeFileSync(resolve(directory,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The first encounter · Imagimusic</title><style>body{margin:0;background:#0b141b;color:#eee6d8;font:18px/1.6 system-ui}main{max-width:1000px;margin:auto;padding:28px 22px 80px}h1{font:clamp(2.4rem,7vw,4.5rem)/1.05 Georgia}h2{font:1.8rem Georgia}a{color:#b5d6cc}figure{margin:28px 0}img{width:100%;border-radius:8px}figcaption,.small{font-size:.87rem;color:#b9c6c8}.dock{position:sticky;top:0;background:#0b141b;padding:12px 0;z-index:2}audio{width:100%}article{padding:20px 0;border-bottom:1px solid #39484b}.time{color:#d6ae78}summary{cursor:pointer}</style><main><a href="../../project.html">Imagimusic home</a><p>THE LIVING INSTRUMENT · ARTISTIC PROOF 01</p><h1>A small gesture.<br>A world to unfold.</h1><p>A 72-second authored sound sketch and six proposed scenes. Listen for the three-touch phrase as it moves between bodies and comes home.</p><figure><img src="../../assets/flagship/opening-body-v1.png" alt="Concept artwork: a straight silver cantilever blade held at one end by a bronze clamp on an open dark ceramic support."><figcaption>Opening-body concept artwork generated with image_gen. A reference for form, material and light; the interactive scene has not been built.</figcaption></figure><div class="dock"><audio controls preload="metadata" src="first-encounter.wav" aria-label="First encounter authored sound sketch"></audio><div class="small">Manual playback · 72 seconds · fixed artistic output gain · no automatic animation</div></div><figure><a href="../../assets/flagship/storyboard-v1.png"><img src="../../assets/flagship/storyboard-v1.png" alt="Six concept scenes: opening blade, anticipated touch, three-body reveal, conceptual motion spread, wider ensemble room, and return to the first blade."></a><figcaption>Six scene boards, read left to right and top to bottom. Open the image for detail. The inner-view band is a concept illustration; runtime geometry will use model-derived samples.</figcaption></figure>${scenes.map(([time,title,body])=>`<article><span class="time">${time} seconds</span><h2>${title}</h2><p>${body}</p></article>`).join('')}<p>What feels worth following? Does the return preserve something recognizable? These are open artistic questions.</p><details><summary>Sound and model choices</summary><p>${report.limits}</p><p>The three bodies are 80, 95 and 65 mm long, all 10 mm wide and 1 mm thick. Their tuning comes from those dimensions; it is not corrected to equal temperament. Generated sound is a first sketch to evaluate, not a finished sonic identity.</p><a href="report.json">Exact score, settings and checks</a></details><p><a href="first-encounter.wav" download>Keep the sound sketch</a> · <a href="../../docs/proposals/024-living-instrument.md">Read the flagship plan</a></p></main></html>`);
console.log(JSON.stringify({directory,seconds,peak,rms:report.rms,maxStateErrorM,events:voices.map(v=>v.events.length),wavBytes:wav.length},null,2));
