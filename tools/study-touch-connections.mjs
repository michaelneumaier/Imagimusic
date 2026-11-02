import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createTouchSession,renderTouchBank,renderTouchRecording} from '../src/touch/session.js';
import {stereoWav} from '../src/loom/model.js';
import {touchConnectionHref} from '../src/touch/connection-link.js';
const cases=[
 ['separate',0,0],['gentle',.001,0],['matched',.004,0],
 ['stronger',.012,0],['detuned',.004,40],['wide-detune',.004,120],
];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export function studyTouchConnections({audioDirectory=null}={}){
 const sampleRate=8000,rendered=[];
 if(audioDirectory)mkdirSync(audioDirectory,{recursive:true});
 const rows=cases.map(([id,coupling,detune])=>{
  const settings={frequency:196,coupling,detune,loss:.45},session=createTouchSession(settings,sampleRate);
  for(const event of [{frame:0,body:0,velocity:.5},{frame:12000,body:1,velocity:.5}])if(!session.strike(event).accepted)throw Error(`${id}: identical gesture refused`);
  const record=session.finish(64000),pcm=renderTouchRecording(record,renderTouchBank(session)),wav=Buffer.from(stereoWav(pcm));
  const stats=pcm.channels.map(channel=>{let peak=0,sum=0;for(const value of channel){peak=Math.max(peak,Math.abs(value));sum+=value*value;}return {peak,rms:Math.sqrt(sum/channel.length)};});
  // Before the second touch, this is the response to one left gesture only.
  const firstTouch=pcm.channels.map(channel=>{let sum=0;for(let i=0;i<12000;i++)sum+=channel[i]**2;return Math.sqrt(sum/12000);});
  const frequencies=session.units[0].studies[0].system.normalFreqsHz;
  rendered.push(pcm);
  if(audioDirectory)writeFileSync(resolve(audioDirectory,id+'.wav'),wav);
  return {id,settings,record,playHref:'/'+touchConnectionHref(settings),frames:pcm.channels[0].length,duration:pcm.channels[0].length/sampleRate,normalFrequenciesHz:frequencies,modeSeparationHz:frequencies[1]-frequencies[0],averagedVisualEnvelope:session.visual(0).averaged,pickupScale:session.units[0].pickupScale,channels:stats,firstLeftGestureRms:firstTouch,wavSha256:hash(wav)};
 });
 const pairs=[];
 for(let a=0;a<rows.length;a++)for(let b=a+1;b<rows.length;b++){
  let squared=0,max=0;for(let c=0;c<2;c++)for(let i=0;i<rendered[a].channels[c].length;i++){const delta=rendered[a].channels[c][i]-rendered[b].channels[c][i];squared+=delta*delta;max=Math.max(max,Math.abs(delta));}
  pairs.push({a:rows[a].id,b:rows[b].id,rmsSampleDifference:Math.sqrt(squared/(2*rendered[a].channels[0].length)),maxSampleDifference:max});
 }
 const report={method:'Six declared connections, fixed 196 Hz base tuning and loss 0.45/s. Same two gestures: left at 0 s, right at 1.5 s, strength 0.5; saved Quiet at 8 s with 25 ms fade. 8 kHz stereo Float32 model output, fixed gain 0.45, each connection uses its own pickup scale. WAV is 16-bit PCM without normalization. Pair differences use Float32 output, not quantized WAV.',limits:'Signal differences are not perceptual distances or evidence of appeal. Detuning also changes modal frequencies; coupling is not isolated from pickup scaling. First-left-gesture RMS covers frames [0,12000), before the right touch. Model displacement pickups, not acoustic radiation. Zero coupling is a control, not a proposed connected encounter.',rows,pairs};
 if(audioDirectory){
  writeFileSync(resolve(audioDirectory,'report.json'),JSON.stringify(report,null,2)+'\n');
  writeFileSync(resolve(audioDirectory,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Touch connections · listening study</title><style>body{max-width:850px;margin:40px auto;padding:24px;background:#142028;color:#eee8dc;font:17px/1.65 system-ui}h1{font-family:Georgia}button,a{color:inherit}button{font:inherit;background:#293d42;border:1px solid #8ba39a;border-radius:8px;padding:10px 16px;cursor:pointer}article{border-top:1px solid #5c6d72;padding:18px 0}audio{width:100%}a{margin-left:14px}.note{font-size:14px;color:#bac8c9}</style><h1>The same gestures, six connections.</h1><p>Each passage touches the left body, then the right after 1.5 seconds. Choose a version to listen. Nothing starts automatically.</p><p class="note">Fixed tuning, loss and gesture strengths; connection and detuning vary. Each instrument uses its own pickup scaling. These are not equal-loudness comparisons. “Separate” is an uncoupled control. The sound is from a two-mass model, not simulated acoustic radiation.</p><audio id="player" controls preload="none"></audio><p id="status" role="status">Choose a connection.</p>${rows.map(row=>`<article><h2>${row.id}</h2><p class="note">Coupling ${row.settings.coupling} · detune ${row.settings.detune} cents · pickup scale ${row.pickupScale.toPrecision(6)} · ${row.averagedVisualEnvelope?'averaged':'interfering'} visual envelope</p><button data-audio="${row.id}">Listen to ${row.id}</button>${row.id==='separate'?'':`<a href="${row.playHref}">Play this connection ↗</a>`}</article>`).join('')}<p><a href="report.json">Exact settings, gestures and measurements</a></p><script>const player=document.getElementById('player'),status=document.getElementById('status');let generation=0;for(const button of document.querySelectorAll('[data-audio]'))button.onclick=async()=>{const own=++generation;player.pause();player.src=button.dataset.audio+'.wav';status.textContent='Selected: '+button.dataset.audio;try{await player.play();}catch(error){if(own===generation)status.textContent='Selected: '+button.dataset.audio+'. '+error.message;}};document.addEventListener('visibilitychange',()=>{if(document.hidden)player.pause();});</script></html>`);
 }
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const args=process.argv.slice(2);if(args.length&&!(args.length===2&&args[0]==='--audio-dir'))throw Error('Usage: node tools/study-touch-connections.mjs [--audio-dir DIRECTORY]');
 console.log(JSON.stringify(studyTouchConnections({audioDirectory:args[1]?resolve(args[1]):null}),null,2));
}
