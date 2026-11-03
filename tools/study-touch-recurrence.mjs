import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createTouchSession,renderTouchBank,renderTouchRecording} from '../src/touch/session.js';
import {stereoWav} from '../src/loom/model.js';
import {touchConnectionHref} from '../src/touch/connection-link.js';
const patterns=[
 {id:'even',title:'Even spacing',times:[0,.8,1.6,2.4,3.2,4]},
 {id:'paired',title:'Pairs and space',times:[0,.2,1.9,2.1,3.8,4]},
 {id:'widening',title:'Widening intervals',times:[0,.2,.6,1.3,2.4,4]},
];
export function studyTouchRecurrence({audioDirectory=null}={}){
 const settings={frequency:196,coupling:.004,detune:0,loss:.45},sampleRate=8000;
 const bank=renderTouchBank(createTouchSession(settings,sampleRate));
 if(audioDirectory)mkdirSync(audioDirectory,{recursive:true});
 const rows=patterns.map(pattern=>{
  const session=createTouchSession(settings,sampleRate);
  for(const [index,time] of pattern.times.entries()){
   const event={frame:Math.round(time*sampleRate),body:index%2,velocity:.35};
   if(!session.strike(event).accepted)throw Error(`${pattern.id}: gesture ${index+1} refused`);
  }
  const record=session.finish(80000),pcm=renderTouchRecording(record,bank),wav=Buffer.from(stereoWav(pcm));
  const channels=pcm.channels.map(channel=>{let peak=0,squared=0;for(const value of channel){peak=Math.max(peak,Math.abs(value));squared+=value*value;}return {peak,rms:Math.sqrt(squared/channel.length)};});
  if(audioDirectory){writeFileSync(resolve(audioDirectory,pattern.id+'.wav'),wav);writeFileSync(resolve(audioDirectory,'imagimusic-touch-'+pattern.id+'.json'),JSON.stringify(record,null,2)+'\n');}
  return {...pattern,record,frames:pcm.channels[0].length,pickupScale:session.units[0].pickupScale,channels,wavSha256:createHash('sha256').update(wav).digest('hex')};
 });
 const report={method:'Only the four interior onset times change. Six alternating left/right gestures at strength 0.35, first at 0 s and last at 4 s. Same instrument, pickup scale, 8 kHz sample rate and fixed output gain. Quiet at 10 s plus 25 ms fade. One shared rendered bank. 16-bit stereo WAV without normalization.',limits:'Authored timing comparisons, not generated responses or prescriptions for listening. Changed overlap can change peaks and perceived loudness even with the same gain. No subjective preference or psychological state follows from signal metrics. Two coupled masses with displacement pickups, not acoustic radiation.',rows};
 if(audioDirectory){
  writeFileSync(resolve(audioDirectory,'report.json'),JSON.stringify(report,null,2)+'\n');
  writeFileSync(resolve(audioDirectory,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Room between touches · Imagimusic study</title><style>body{max-width:800px;margin:40px auto;padding:24px;background:#142028;color:#eee8dc;font:17px/1.65 system-ui}h1,h2{font-family:Georgia}button,a{color:inherit}button{font:inherit;background:#293d42;border:1px solid #8ba39a;border-radius:8px;padding:10px 16px;cursor:pointer}article{border-top:1px solid #5c6d72;padding:18px 0}audio{width:100%}.note{font-size:14px;color:#bac8c9}.links{display:flex;flex-wrap:wrap;gap:16px}</style><h1>Room between touches.</h1><p>Six gestures. One connection. Three ways of leaving space.</p><p>Listen to a version, then try another. Does a particular spacing invite you to answer? There is no preferred response.</p><p class="note">Only the interior timing changes. Every passage alternates left and right at the same strength, begins at 0 seconds and makes its last touch at 4 seconds. Quiet begins at 10 seconds. The same gain and pickup scale are used throughout; overlap can still change loudness. A two-mass physical model, with no acoustic radiation simulation.</p><audio id="player" controls preload="none"></audio><p id="status" role="status">Choose a passage. Nothing starts automatically.</p>${rows.map(row=>`<article><h2>${row.title}</h2><p class="note">Touches at ${row.times.join(', ')} seconds · left, right, left, right, left, right</p><div class="links"><button data-audio="${row.id}" data-title="${row.title}">Listen to ${row.title.toLowerCase()}</button><a download href="imagimusic-touch-${row.id}.json">Keep these study gestures ↓</a></div></article>`).join('')}<p><a href="/${touchConnectionHref(settings)}">Play your own response on this connection ↗</a></p><p class="note">Opens an empty instrument quietly. The authored study gestures are not carried over. Downloaded gestures can be opened in <a href="/touch-return.html">Return to a touch</a> for their sound and picture.</p><p><a href="report.json">Exact records and signal measurements</a></p><script>const player=document.getElementById('player'),status=document.getElementById('status');let generation=0;for(const button of document.querySelectorAll('[data-audio]'))button.onclick=async()=>{const own=++generation;player.pause();player.src=button.dataset.audio+'.wav';status.textContent='Selected: '+button.dataset.title;try{await player.play();}catch(error){if(own===generation)status.textContent='Selected: '+button.dataset.title+'. '+error.message;}};document.addEventListener('visibilitychange',()=>{if(document.hidden)player.pause();});</script></html>`);
 }
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const args=process.argv.slice(2);if(args.length&&!(args.length===2&&args[0]==='--audio-dir'))throw Error('Usage: node tools/study-touch-recurrence.mjs [--audio-dir DIRECTORY]');
 console.log(JSON.stringify(studyTouchRecurrence({audioDirectory:args[1]?resolve(args[1]):null}),null,2));
}
