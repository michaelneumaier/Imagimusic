// Render a local listening artifact from one validated Rest record, with no model changes.
// Usage: node tools/render-rest-listening-study.mjs <record.json> <output-directory>
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {composeGrove,GROVE_SEEDS} from '../src/score/grove.js';
import {createGroveRestRecipe,recipeForRecord,validateRestAdmission,transposeRestRecord,renderRestRecord} from '../src/score/grove-rest.js';
import {stereoWav} from '../src/loom/model.js';
const [input,destination]=process.argv.slice(2);
if(!input||!destination)throw new Error('Usage: node tools/render-rest-listening-study.mjs <record.json> <output-directory>');
const record=JSON.parse(readFileSync(input,'utf8')),source=recipeForRecord(record);validateRestAdmission(record,source);
if(!GROVE_SEEDS.includes(source.grove.seed))throw new Error('The listening study expects one of the curated source groves.');
if(!record.events.length)throw new Error('The study needs at least one strike.');
const out=resolve(destination);mkdirSync(out,{recursive:true});
const hash=data=>createHash('sha256').update(data).digest('hex');
function measure(pcm){
 let peak=0,energy=0;const channelRms=pcm.channels.map(channel=>{let sum=0;for(const v of channel){if(!Number.isFinite(v))throw new Error('Non-finite audio');peak=Math.max(peak,Math.abs(v));sum+=v*v;}energy+=sum;return Math.sqrt(sum/channel.length);});
 return {peak,rms:Math.sqrt(energy/(pcm.channels.length*pcm.channels[0].length)),channelRms};
}
const versions=GROVE_SEEDS.map(seed=>{
 const recipe=seed===source.grove.seed?source:createGroveRestRecipe(composeGrove({seed}),source.voice,{sampleRate:source.sampleRate,zones:source.zones,strengths:Object.fromEntries(source.strengths.map(({name,c})=>[name,c]))});
 const transfer=seed===source.grove.seed?{record,complete:true,kept:record.events.length,total:record.events.length,dropped:[],note:'Original gesture record.'}:transposeRestRecord(record,source,recipe);
 const pcm=renderRestRecord(transfer.record,recipe);
 return {seed,transfer,pcm,metrics:measure(pcm)};
});
const referenceRms=Math.min(...versions.map(v=>v.metrics.rms));
if(!(referenceRms>0))throw new Error('A silent version cannot be RMS matched. Review omissions before auditioning.');
const entries=versions.map(({seed,transfer,pcm,metrics})=>{
 const gain=referenceRms/metrics.rms,matched={sampleRate:pcm.sampleRate,channels:pcm.channels.map(c=>Float32Array.from(c,v=>v*gain))};
 const naturalWav=Buffer.from(stereoWav(pcm)),matchedWav=Buffer.from(stereoWav(matched));
 const stem=`grove-${seed}`;writeFileSync(join(out,stem+'-natural.wav'),naturalWav);writeFileSync(join(out,stem+'-rms-matched.wav'),matchedWav);writeFileSync(join(out,stem+'.json'),JSON.stringify(transfer.record,null,2));
 return {seed,source:seed===source.grove.seed,complete:transfer.complete,kept:transfer.kept,total:transfer.total,note:transfer.note,dropped:transfer.dropped,duration:pcm.channels[0].length/pcm.sampleRate,sampleFrames:pcm.channels[0].length,sampleRate:pcm.sampleRate,natural:metrics,matchingGain:gain,matched:measure(matched),pcmHashes:pcm.channels.map(c=>hash(new Uint8Array(c.buffer,c.byteOffset,c.byteLength))),naturalWavHash:hash(naturalWav),matchedWavHash:hash(matchedWav),files:{natural:stem+'-natural.wav',matched:stem+'-rms-matched.wav',record:stem+'.json'}};
});
const gestures=[...record.events.map(e=>({time:e.frame/record.sampleRate,action:`Strike body ${e.body+1}`,position:e.position,velocity:e.velocity})),...record.contacts.flatMap(c=>[{time:c.start/record.sampleRate,action:`Rest on body ${c.body+1}`,zone:c.zone,strength:c.strength},{time:c.end/record.sampleRate,action:`Lift from body ${c.body+1}`}])].sort((a,b)=>a.time-b.time);
const report={sourceSeed:source.grove.seed,referenceRms,method:'Natural files retain each Grove’s fixed model gain. RMS-matched copies attenuate to the lowest whole-passage stereo RMS; they are not perceptually loudness-matched. No limiting, normalization boost, timing change, or voice change.',interpretation:'Measurements describe these files. Musical appeal and audible prominence require listening; no listening verdict is inferred here.',entries,gestures};
writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2));
const escaped=JSON.stringify(report).replace(/</g,'\\u003c');
writeFileSync(join(out,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>One gesture, three Groves · Listening study</title><style>body{background:#172027;color:#e8e3d9;font:16px/1.7 system-ui;max-width:850px;margin:40px auto;padding:24px}h1{font:42px/1.1 Georgia,serif}button,select{font:inherit;padding:9px 15px;background:#26313a;color:inherit;border:1px solid #70808b;border-radius:20px}button{cursor:pointer;margin:6px}audio{width:100%;margin:24px 0}a{color:#dac8e6}small{display:block;color:#b4bec3}table{width:100%;border-collapse:collapse;font-size:13px}td,th{text-align:left;padding:9px;border-bottom:1px solid #52606a}#status{min-height:3em;color:#dac8e6}</style><p>IMAGIMUSIC / LOCAL LISTENING STUDY</p><h1>One gesture.<br>Three answers.</h1><p>Listen for what changes when the bodies change. Start with their natural levels, then try the RMS-matched copies to check whether a louder version is drawing your attention.</p><label>Files <select id="mode"><option value="natural">Natural model levels</option><option value="matched">RMS-matched · attenuation only</option></select></label><div id="choices"></div><p id="status" role="status">Choose a Grove. Nothing plays automatically.</p><audio id="player" controls preload="metadata" hidden></audio><button id="quiet">Quiet</button><small>One player; each choice starts the same gesture from the beginning. Escape pauses playback. Headphones reveal the stereo pickups.</small><p>Try describing the attack, what continues ringing, and whether the hand changes the foreground. These are listening questions, not promised outcomes.</p><details><summary>Measurements and limitations</summary><p id="method"></p><p id="interpretation"></p><table><thead><tr><th>Grove</th><th>Natural peak</th><th>Natural RMS</th><th>Matched gain</th></tr></thead><tbody id="metrics"></tbody></table><p><a href="report.json">Full measurement report ↓</a></p></details><details><summary>The shared gesture</summary><pre id="gestures" style="white-space:pre-wrap"></pre></details><script type="application/json" id="data">${escaped}</script><script>
const report=JSON.parse(document.getElementById('data').textContent),player=document.getElementById('player'),mode=document.getElementById('mode'),status=document.getElementById('status');
for(const entry of report.entries){const button=document.createElement('button');button.textContent='Hear Grove '+entry.seed;button.onclick=()=>{player.pause();player.src=entry.files[mode.value];player.hidden=false;status.textContent='Grove '+entry.seed+' · '+(mode.value==='natural'?'natural model level':'RMS-matched, gain '+entry.matchingGain.toFixed(3))+' · '+entry.note;player.play().catch(error=>status.textContent=error.message);};document.getElementById('choices').append(button);const row=document.createElement('tr');for(const value of [entry.seed,entry.natural.peak.toFixed(4),entry.natural.rms.toFixed(5),entry.matchingGain.toFixed(3)]){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}document.getElementById('metrics').append(row);}
mode.onchange=()=>{player.pause();player.hidden=true;player.removeAttribute('src');player.load();status.textContent='Choose a Grove to hear the selected files.';};document.getElementById('quiet').onclick=()=>player.pause();window.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();player.pause();}});document.addEventListener('visibilitychange',()=>{if(document.hidden)player.pause();});document.getElementById('method').textContent=report.method;document.getElementById('interpretation').textContent=report.interpretation;document.getElementById('gestures').textContent=report.gestures.map(g=>g.time.toFixed(2)+'s · '+g.action).join('\\n');
</script></html>`);
console.log(JSON.stringify({out,referenceRms,entries:entries.map(({seed,natural,matchingGain,complete})=>({seed,natural,matchingGain,complete}))},null,2));
