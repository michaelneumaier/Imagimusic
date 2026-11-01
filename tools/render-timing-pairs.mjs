// Local record-driven A/B audition. Input: {pairs:[{title,variants:[{record,condition},{record,condition}]}]}.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {deepStrictEqual} from 'node:assert';
import {recipeForRecord,validateRestAdmission,renderRestRecord,createGroveRestRecipe,measureSecondStrike,composeSecondStrikeRecord} from '../src/score/grove-rest.js';
import {composeGrove,GROVE_SEEDS} from '../src/score/grove.js';
import {stereoWav} from '../src/loom/model.js';
const [input,destination]=process.argv.slice(2);
if(!input||!destination)throw new Error('Usage: node tools/render-timing-pairs.mjs <pairs.json|--measure> <output-directory>');
function prepareMeasuredPairs(){
 const sweeps=[];
 const pairs=GROVE_SEEDS.map((seed,index)=>{
  const recipe=createGroveRestRecipe(composeGrove({seed})),sweep=measureSecondStrike(recipe);sweeps.push({seed,sweep});
  const selected=index%2?[sweep.best,sweep.worst]:[sweep.worst,sweep.best];
  return {title:`Grove ${seed}`,variants:selected.map(point=>{
   const {record}=composeSecondStrikeRecord(recipe,{frame:point.frame});
   if(record.events[1].frame!==point.frame)throw new Error('Measured and recorded frames differ.');
   return {record,condition:{selection:point===sweep.best?'maximum sampled pickup ratio':'minimum sampled pickup ratio',secondStrikeFrame:point.frame,delaySeconds:point.frame/recipe.sampleRate,measuredDb:point.dB,envelopeBefore:point.envelopeBefore,measure:sweep.measure,note:'Finite-sweep selections; not better/worse music or visible swell/dip. A/B order alternates across Groves.'}};
  })};
 });
 return {pairs,sweeps};
}
const source=input==='--measure'?prepareMeasuredPairs():JSON.parse(readFileSync(input,'utf8'));
if(!Array.isArray(source.pairs)||!source.pairs.length||source.pairs.length>6)throw new Error('Expected 1..6 pairs.');
const out=resolve(destination);mkdirSync(out,{recursive:true});
writeFileSync(join(out,'source.json'),JSON.stringify(source,null,2));
const sha=data=>createHash('sha256').update(data).digest('hex');
const pairs=source.pairs.map((pair,index)=>{
 if(typeof pair.title!=='string'||!Array.isArray(pair.variants)||pair.variants.length!==2)throw new Error('Each pair needs a title and exactly two variants.');
 const signature=({events,ended,...rest})=>({rest,events:events.map(({frame,...event})=>event),ended:{...ended,frame:0}});
 deepStrictEqual(signature(pair.variants[0].record),signature(pair.variants[1].record),'Pair must share model, gestures, strengths and ending fade; only strike/ending times may differ.');
 return {title:pair.title,variants:pair.variants.map((variant,j)=>{
  const {record}=variant,recipe=recipeForRecord(record);validateRestAdmission(record,recipe);
  if(record.events.length!==2||record.events[0].frame!==0||record.contacts.length)throw new Error('Timing pairs require two accepted strikes.');
  const pcm=renderRestRecord(record,recipe),wav=Buffer.from(stereoWav(pcm)),label=j?'B':'A',stem=`pair-${index+1}-${label.toLowerCase()}`;
  let energy=0,peak=0;for(const channel of pcm.channels)for(const x of channel){if(!Number.isFinite(x))throw new Error('Nonfinite sample');energy+=x*x;peak=Math.max(peak,Math.abs(x));}
  if(peak>=1)throw new Error('Refusing clipped export');
  writeFileSync(join(out,stem+'.wav'),wav);writeFileSync(join(out,stem+'.json'),JSON.stringify(record,null,2));
  return {label,condition:variant.condition??null,file:stem+'.wav',recordFile:stem+'.json',sampleRate:pcm.sampleRate,frames:pcm.channels[0].length,peak,rms:Math.sqrt(energy/(pcm.channels.length*pcm.channels[0].length)),wavHash:sha(wav),strikeFrames:record.events.map(e=>e.frame)};
 })};
});
const report={method:'Each file retains its fixed model gain. No pairwise RMS matching, boost or limiting. A/B condition labels are hidden until revealed; this is an informal audition with alternating A/B order, not a randomized test. The generated sweep selects by a one-second low-band pickup window starting one second after the second strike. Whole-file RMS describes a different interval.',question:'Can you hear a difference in what remains after the second strike? Is either timing worth exploring by hand?',pairs};
writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2));
const data=JSON.stringify(report).replace(/</g,'\\u003c');
writeFileSync(join(out,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>When the second gesture arrives · Imagimusic</title><style>body{background:#141a22;color:#e6e1d7;font:16px/1.7 system-ui;max-width:820px;margin:40px auto;padding:24px}h1{font:42px/1.15 Georgia,serif}h2{font:25px Georgia,serif}button{font:inherit;background:#222a35;color:inherit;border:1px solid #89919d;border-radius:24px;padding:10px 20px;margin:4px;cursor:pointer}section{border-top:1px solid #ffffff26;padding:14px 0}audio{width:100%;margin:16px 0}a{color:#d8c8e5}#status{min-height:3em;color:#d8c8e5}small{display:block;color:#aeb5be}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:13px/1.6 monospace}</style><p>IMAGIMUSIC / LOCAL TIMING STUDY</p><h1>When the second<br>gesture arrives.</h1><p>Two touches. A different moment between them. Compare A and B, then try putting the difference into your own words.</p><p id="question"></p><div id="pairs"></div><p id="status" role="status">Choose a version. Nothing plays automatically.</p><audio id="player" controls hidden></audio><button id="quiet">Quiet</button><small>One player. Each choice starts at the beginning. Escape pauses. These files use natural model levels; timing-related level changes are part of the comparison.</small><details><summary>Reveal conditions and measurements</summary><p id="method"></p><pre id="facts"></pre><a href="report.json">Full report</a></details><script type="application/json" id="data">${data}</script><script>
const report=JSON.parse(document.getElementById('data').textContent),player=document.getElementById('player'),status=document.getElementById('status');let token=0;
for(const pair of report.pairs){const section=document.createElement('section'),title=document.createElement('h2');title.textContent=pair.title;section.append(title);for(const variant of pair.variants){const button=document.createElement('button');button.textContent='Hear '+variant.label;button.setAttribute('aria-label',pair.title+', hear '+variant.label);button.onclick=()=>{const own=++token;player.pause();player.src=variant.file;player.hidden=false;status.textContent=pair.title+' · '+variant.label;player.play().catch(error=>{if(own===token)status.textContent=error.message;});};section.append(button);}document.getElementById('pairs').append(section);}
function quiet(){token++;player.pause();}document.getElementById('quiet').onclick=quiet;window.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();quiet();}});document.addEventListener('visibilitychange',()=>{if(document.hidden)quiet();});document.getElementById('question').textContent=report.question;document.getElementById('method').textContent=report.method;document.getElementById('facts').textContent=report.pairs.map(pair=>pair.title+'\\n'+pair.variants.map(v=>v.label+': second touch at '+(v.strikeFrames[1]/v.sampleRate).toFixed(6)+' s · '+(v.condition?.selection??'supplied condition')+'; whole-file RMS '+v.rms.toFixed(6)).join('\\n')).join('\\n\\n');
</script></html>`);
console.log(JSON.stringify({out,pairs:report.pairs.map(p=>({title:p.title,files:p.variants.map(v=>v.file)}))},null,2));
