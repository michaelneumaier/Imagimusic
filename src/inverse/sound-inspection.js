import {readInverseSoundFile} from './sound-file.js';
import {createInverseJobs} from './jobs.js';
const $=id=>document.getElementById(id);
const jobs=createInverseJobs({makeWorker:()=>new Worker(new URL('./sound-worker.js',import.meta.url),{type:'module'})});
let generation=0,controller=null,current=null;
function busy(value){$('cancel').hidden=!value;$('sound-file').disabled=value;$('clear').disabled=!current;}
function cancel(){generation++;controller?.abort();controller=null;jobs.cancel();busy(false);}
function field(label,value){const term=document.createElement('dt'),definition=document.createElement('dd');term.textContent=label;definition.textContent=value;$('details').append(term,definition);}
function draw(canvas,wave,range,color){
 const width=1280,height=240;canvas.width=width;canvas.height=height;
 const ink=canvas.getContext('2d');if(!ink){canvas.replaceWith(document.createTextNode('Waveform drawing unavailable; sample details remain below.'));return;}
 const left=68,right=width-20,top=18,bottom=height-30,middle=(top+bottom)/2;
 ink.clearRect(0,0,width,height);ink.strokeStyle='#91aaa64a';ink.beginPath();ink.moveTo(left,middle);ink.lineTo(right,middle);ink.stroke();
 ink.fillStyle='#b4c4bf';ink.font='18px system-ui';ink.fillText('+'+range.toPrecision(3),4,top+14);ink.fillText('−'+range.toPrecision(3),4,bottom);ink.fillText('0 s',left,height-5);ink.textAlign='right';ink.fillText(current.duration.toFixed(3)+' s',right,height-5);
 ink.strokeStyle=color;ink.lineWidth=Math.max(1,(right-left)/wave.minimum.length*.75);ink.beginPath();
 for(let i=0;i<wave.minimum.length;i++){const x=left+(i+.5)*(right-left)/wave.minimum.length,y1=middle-wave.maximum[i]/range*(bottom-top)/2,y2=middle-wave.minimum[i]/range*(bottom-top)/2;ink.moveTo(x,y1);ink.lineTo(x,Math.max(y1+.7,y2));}ink.stroke();
}
function render(){
 $('sound').hidden=!current;if(!current)return;
 $('sound-title').textContent=current.name;
 $('description').textContent=`${current.duration.toFixed(3)} seconds · ${current.waveforms.length===1?'mono':'stereo'} · ${current.sampleRate.toLocaleString()} Hz · ${current.encoding}`;
 $('waveforms').replaceChildren();const range=Math.max(1,current.peak);
 for(const [index,wave] of current.waveforms.entries()){
  const figure=document.createElement('figure'),caption=document.createElement('figcaption'),canvas=document.createElement('canvas');caption.textContent=`Channel ${index+1} · ${current.frameCount.toLocaleString()} samples`;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',`Channel ${index+1} sample waveform, from 0 to ${current.duration.toFixed(3)} seconds. Vertical range minus ${range} to plus ${range}.`);figure.append(caption,canvas);$('waveforms').append(figure);draw(canvas,wave,range,index===0?'#acd9bf':'#ccb4df');
 }
 $('scale').textContent=`The vertical axes use sample values; the vertical range is ±${range.toPrecision(4)} for every channel. ${current.peak===0?'This file contains only zero-valued samples.':range>1?'The view expands to include samples beyond ±1; sample values are unchanged.':'The vertical scale is fixed at ±1.'}`;
 $('details').replaceChildren();field('File size',`${current.byteLength.toLocaleString()} bytes`);field('Peak absolute sample',current.peak.toPrecision(8));field('Samples at or beyond ±1',current.atOrAboveUnitySamples.toLocaleString());
 current.waveforms.forEach((wave,i)=>{field(`Channel ${i+1} RMS`,wave.rms.toPrecision(8));field(`Channel ${i+1} mean`,wave.mean.toPrecision(8));});field('Exact-file SHA-256',current.sha256);
}
$('sound-file').onchange=async()=>{
 const file=$('sound-file').files?.[0];$('sound-file').value='';if(!file)return;
 cancel();const own=generation;controller=new AbortController();busy(true);$('status').textContent='Reading the local sound…';
 try{const opened=await readInverseSoundFile(file,{signal:controller.signal});if(own!==generation)return;const summary=await jobs.run({bytes:opened.bytes});if(own!==generation)return;current={...summary,name:opened.name};render();$('status').textContent='Sound inspected. Nothing has played; no resonance target has been inferred.';}
 catch(error){if(own===generation)$('status').textContent=error.message+(current?' The previous sound remains visible.':'');}
 finally{if(own===generation){controller=null;busy(false);}}
};
$('cancel').onclick=()=>{cancel();$('status').textContent='Opening cancelled.'+(current?' The previous sound remains visible.':'');};
$('clear').onclick=()=>{cancel();current=null;$('waveforms').replaceChildren();$('details').replaceChildren();$('sound-title').textContent='';$('description').textContent='';$('scale').textContent='';render();busy(false);$('status').textContent='Sound cleared. Choose another whenever you like.';};
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&controller)$('cancel').click();});
window.addEventListener('pagehide',()=>cancel());
