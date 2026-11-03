import {createGroveReplay} from '../grove/replay.js';
import {readInverseSoundFile} from './sound-file.js';
import {createInverseJobs} from './jobs.js';
const $=id=>document.getElementById(id);
const jobs=createInverseJobs({makeWorker:()=>new Worker(new URL('./sound-worker.js',import.meta.url),{type:'module'})});
let generation=0,controller=null,current=null;
let playbackFrame=0;
$('follow-position').checked=!matchMedia('(prefers-reduced-motion: reduce)').matches;
function playbackStatus(){
 const active=['preparing','playing','suspended'].includes(replay.state);
 $('listen').disabled=!current||!!controller||active;$('quiet').disabled=!active;
 const labels={idle:'Ready when you are.',preparing:'Preparing to listen…',playing:'Listening',suspended:'Audio interrupted. Choose Quiet, then listen again.',ended:'The recording has ended.',error:'Playback unavailable. Try listening again.'};
 const label=labels[replay.state];if($('playback-status').textContent!==label)$('playback-status').textContent=label;
 const time=['idle','preparing'].includes(replay.state)?0:replay.time();
 $('playback-position').textContent=current?`${time.toFixed(1)} / ${current.duration.toFixed(1)} s`:'';
 for(const cursor of $('waveforms').querySelectorAll('.waveform-cursor')){
  cursor.hidden=!current||!$('follow-position').checked||!['playing','suspended','ended'].includes(replay.state);
  cursor.style.left=`${(68+1192*(current?Math.min(1,Math.max(0,time/current.duration)):0))/1280*100}%`;
 }
 cancelAnimationFrame(playbackFrame);playbackFrame=0;
 if(replay.state==='playing')playbackFrame=requestAnimationFrame(playbackStatus);
}
const replay=createGroveReplay({onChange:playbackStatus});
$('listen').onclick=async()=>{if(!current||controller)return;try{$('status').textContent='The selected recording remains local. No resonance target has been inferred.';await replay.play(current.audition);}catch(error){$('playback-status').textContent=error.message;}};
$('quiet').onclick=()=>replay.stop();
$('follow-position').onchange=playbackStatus;
function busy(value){$('cancel').hidden=!value;$('sound-file').disabled=value;$('clear').disabled=!current;playbackStatus();}
function cancel(){replay.stop();generation++;controller?.abort();controller=null;jobs.cancel();busy(false);}
function field(label,value){const term=document.createElement('dt'),definition=document.createElement('dd');term.textContent=label;definition.textContent=value;$('details').append(term,definition);}
function draw(canvas,wave,range,color){
 const width=1280,height=240;canvas.width=width;canvas.height=height;
 const ink=canvas.getContext('2d');if(!ink){canvas.replaceWith(document.createTextNode('Waveform drawing unavailable; sample details remain below.'));return;}
 const left=68,right=width-20,top=18,bottom=height-30,middle=(top+bottom)/2;
 ink.clearRect(0,0,width,height);ink.strokeStyle='#91aaa64a';ink.beginPath();ink.moveTo(left,middle);ink.lineTo(right,middle);ink.stroke();
 ink.strokeStyle=color;ink.lineWidth=Math.max(1,(right-left)/wave.minimum.length*.75);ink.beginPath();
 for(let i=0;i<wave.minimum.length;i++){const x=left+(i+.5)*(right-left)/wave.minimum.length,y1=middle-wave.maximum[i]/range*(bottom-top)/2,y2=middle-wave.minimum[i]/range*(bottom-top)/2;ink.moveTo(x,y1);ink.lineTo(x,Math.max(y1+.7,y2));}ink.stroke();
}
function render(){
 $('sound').hidden=!current;if(!current)return;
 $('sound-title').textContent=current.name;
 $('listening-scale').textContent=`Listening level: ${(20*Math.log10(current.audition.gain)).toFixed(1)} dB relative to file samples, with one shared gain for all channels. Quiet recordings are not boosted. The waveform and file details remain unscaled.`;
 $('description').textContent=`${current.duration.toFixed(3)} seconds · ${current.waveforms.length===1?'mono':'two channels'} · ${current.sampleRate.toLocaleString()} Hz · ${current.encoding}`;
 $('waveforms').replaceChildren();const range=Math.max(1,current.peak);
 for(const [index,wave] of current.waveforms.entries()){
  const figure=document.createElement('figure'),caption=document.createElement('figcaption'),canvas=document.createElement('canvas');caption.textContent=`Channel ${index+1} · ${current.frameCount.toLocaleString()} samples`;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',`Channel ${index+1} sample waveform, from 0 to ${current.duration.toFixed(3)} seconds. Vertical range minus ${range} to plus ${range}.`);const axis=document.createElement('p');axis.className='waveform-axis';axis.textContent=`Sample range: −${range.toPrecision(3)} to +${range.toPrecision(3)}`;
  const times=document.createElement('div');times.className='waveform-times';const start=document.createElement('span'),end=document.createElement('span');start.textContent='0 s';end.textContent=`${current.duration.toFixed(3)} s`;times.append(start,end);
  const plot=document.createElement('div');plot.className='waveform-plot';plot.append(canvas);figure.append(caption,axis,plot,times);$('waveforms').append(figure);draw(canvas,wave,range,index===0?'#acd9bf':'#ccb4df');
  if(canvas.isConnected){const cursor=document.createElement('span');cursor.className='waveform-cursor';cursor.hidden=true;cursor.setAttribute('aria-hidden','true');plot.append(cursor);}
 }
 $('scale').textContent=`The vertical axes use sample values; the vertical range is ±${range.toPrecision(4)} for every channel. ${current.peak===0?'This file contains only zero-valued samples.':range>1?'The view expands to include samples beyond ±1; sample values are unchanged.':'The vertical scale is fixed at ±1.'}`;
 $('details').replaceChildren();field('File size',`${current.byteLength.toLocaleString()} bytes`);field('Peak absolute sample',current.peak.toPrecision(8));field('Samples at or beyond ±1',current.atOrAboveUnitySamples.toLocaleString());
 current.waveforms.forEach((wave,i)=>{field(`Channel ${i+1} RMS`,wave.rms.toPrecision(8));field(`Channel ${i+1} mean`,wave.mean.toPrecision(8));});field('WAV format',current.extensible?'Extensible':'Classic');field('Sample precision',`${current.validBits} valid bits in ${current.containerBits}-bit containers`);if(current.extensible)field('Declared channel mask',current.channelMask===0?'Unspecified':`0x${current.channelMask.toString(16).padStart(8,'0')} · file order preserved`);field('Exact-file SHA-256',current.sha256);
}
$('sound-file').onchange=async()=>{
 const file=$('sound-file').files?.[0];$('sound-file').value='';if(!file)return;
 cancel();const own=generation;controller=new AbortController();busy(true);$('status').textContent='Reading the local sound…';
 try{const opened=await readInverseSoundFile(file,{signal:controller.signal});if(own!==generation)return;const summary=await jobs.run({bytes:opened.bytes});if(own!==generation)return;current={...summary,name:opened.name};render();$('status').textContent='Sound inspected. Nothing has played; no resonance target has been inferred.';}
 catch(error){if(own===generation)$('status').textContent=error.message+(current?' The previous sound remains visible.':'');}
 finally{if(own===generation){controller=null;busy(false);}}
};
$('cancel').onclick=()=>{cancel();$('status').textContent='Opening cancelled.'+(current?' The previous sound remains visible.':'');};
$('clear').onclick=()=>{
 cancel();current=null;
 $('waveforms').replaceChildren();$('details').replaceChildren();
 for(const id of ['sound-title','description','scale','listening-scale','playback-position'])$(id).textContent='';
 render();busy(false);$('status').textContent='Sound cleared. Choose another whenever you like.';
};
document.addEventListener('keydown',event=>{if(event.key==='Escape'){replay.stop();if(controller)$('cancel').click();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)replay.stop();});
window.addEventListener('pagehide',()=>{cancel();replay.park();});
