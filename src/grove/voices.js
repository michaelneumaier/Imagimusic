const $=id=>document.getElementById(id);let report,players=[];
function quiet(){for(const player of players)player.pause();}
function metric(dl,label,value){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;dl.append(dt,dd);}
function choose(){
 quiet();$('voices').replaceChildren();players=[];const seed=$('seed').value,entry=report.seeds[seed],count=report.conventions.partials;
 $('play-partials').href=`grove.html?voice=partials&seed=${encodeURIComponent(seed)}`;
 for(const [id,label,description] of [[1,'The original voice','A single resonance in each body. Three connected bodies share the ring.'],[count,'A voice with partials',`${count} resonances in each body. Higher partials join the attack, with their own decay rates.`]]){
  const data=entry[`m${id}`],card=document.createElement('article');card.className='voice-card';const tag=document.createElement('span'),heading=document.createElement('h2'),copy=document.createElement('p'),audio=document.createElement('audio'),dl=document.createElement('dl'),save=document.createElement('a');
  tag.className='eyebrow';tag.textContent=id===1?'A / CURRENT':'B / EXPLORATION';heading.textContent=label;copy.textContent=description;
  audio.controls=true;audio.preload='metadata';audio.src=`renders/grove-voice-${seed}-m${id}.wav`;audio.setAttribute('aria-label',`${label}, Grove ${seed}`);
  audio.addEventListener('play',()=>{for(const other of players)if(other!==audio)other.pause();card.dataset.playing='true';$('status').textContent=`Grove ${seed} · ${label.toLowerCase()}`;});
  audio.addEventListener('pause',()=>{card.dataset.playing='false';});audio.addEventListener('ended',()=>{$('status').textContent='Let the last sound settle, then try the other voice.';});audio.addEventListener('error',()=>{$('status').textContent='This local sound file is unavailable. Regenerate the comparison recordings.';});players.push(audio);
  metric(dl,'Modal centroid estimate',`${data.modalCentroidEstimateHz.toFixed(2)} Hz`);metric(dl,'Partials above −40 dB at 50 ms',data.partialsAbove40dBAt50ms);metric(dl,'RMS · first second',data.rmsFirstSecond.toFixed(6));metric(dl,'Peak · complete sound',data.peakFullRender.toFixed(6));metric(dl,'Pickup scale',data.pickupScale.toFixed(5));metric(dl,'Output gain',data.outputGain.toFixed(3));
  for(const swell of data.lowBandSwells)metric(dl,`Body ${String(swell.body+1).padStart(2,'0')} · first low-band swell`,swell.seconds===null?'No distinct peak':`${swell.seconds.toFixed(3)} s`);
  save.href=audio.src;save.download='';save.textContent='Keep this sound ↓';card.append(tag,heading,copy,audio,dl,save);$('voices').append(card);
 }
 $('status').textContent=`Grove ${seed} · ${entry.topology}. Play either voice; only one plays at a time.`;
}
$('quiet').onclick=()=>{quiet();$('status').textContent='Quiet. Each player keeps its place.';};$('seed').onchange=choose;document.addEventListener('visibilitychange',()=>{if(document.hidden)quiet();});window.addEventListener('pagehide',quiet);
try{const response=await fetch('renders/grove-voice-report.json',{cache:'no-store'});if(!response.ok)throw new Error('Comparison report missing');report=await response.json();if(report.version!==1||!Number.isInteger(report.conventions?.partials)||report.conventions.partials<2||!Object.keys(report.seeds??{}).length)throw new Error('Unsupported comparison report');
 for(const seed of Object.keys(report.seeds)){for(const id of [1,report.conventions.partials]){const data=report.seeds[seed][`m${id}`];if(!data||!['modalCentroidEstimateHz','peakFullRender','rmsFirstSecond','pickupScale','outputGain'].every(key=>Number.isFinite(data[key])))throw new Error('Regenerate the comparison with the current measurement format');}if(!/^\d+$/.test(seed))throw new Error('Invalid grove identity');const option=document.createElement('option');option.value=seed;option.textContent=`Grove ${seed}`;$('seed').append(option);}$('seed').disabled=false;
 const c=report.conventions;$('conventions').textContent=`Prepared at ${c.sampleRate.toLocaleString()} Hz. Proposed voice: strike position ${c.strikeU}, attachment ${c.attachU}, pickup ${c.pickupU} along normalized body length.`;choose();
}catch(error){$('status').textContent=`The local comparison is not ready: ${error.message}. Generate it with node tools/grove-voice-compare.mjs.`;$('seed').disabled=true;}
